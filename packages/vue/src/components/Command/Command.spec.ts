import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Command from './Command.vue';
import CommandDialog from './CommandDialog.vue';
import CommandEmpty from './CommandEmpty.vue';
import CommandGroup from './CommandGroup.vue';
import CommandInput from './CommandInput.vue';
import CommandItem from './CommandItem.vue';
import CommandList from './CommandList.vue';
import CommandSeparator from './CommandSeparator.vue';

const settle = async () => {
    await nextTick();
    await nextTick();
};

function body(onPick = vi.fn()) {
    return () => [
        h(CommandInput, { placeholder: 'Search…' }),
        h(CommandList, () => [
            h(CommandEmpty, () => 'Nothing found.'),
            h(CommandGroup, { heading: 'Suggestions' }, () => [
                h(CommandItem, { onSelect: onPick }, () => 'Calendar'),
                h(CommandItem, { onSelect: onPick, keywords: ['emoji', 'smile'] }, () => 'Search emoji'),
                h(CommandItem, { onSelect: onPick, disabled: true }, () => 'Calculator')
            ]),
            h(CommandSeparator),
            h(CommandGroup, { heading: 'Settings' }, () => [
                h(CommandItem, { onSelect: onPick, value: 'profile', shortcut: '⌘P' }, () => 'Perfil'),
                h(CommandItem, { onSelect: onPick }, () => 'Configurações')
            ])
        ])
    ];
}

function mountCommand(props: Record<string, unknown> = {}) {
    const onPick = vi.fn();
    const onSelect = vi.fn();
    mountVt(defineComponent(() => () => h(Command, { ...props, onSelect }, body(onPick))));
    const input = () => document.querySelector<HTMLInputElement>('[role="combobox"]')!;
    const options = () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).filter((o) => o.style.display !== 'none');
    const active = () => document.getElementById(input().getAttribute('aria-activedescendant') ?? '')?.textContent?.trim();
    const type = async (text: string) => {
        input().value = text;
        input().dispatchEvent(new Event('input'));
        await settle();
    };
    return { input, options, active, type, onPick, onSelect };
}

describe('Command', () => {
    it('is an expanded combobox controlling a named listbox, with the first item active', async () => {
        const { input, active, options } = mountCommand();
        await settle();
        expect(input().getAttribute('aria-expanded')).toBe('true');
        expect(input().getAttribute('aria-label')).toBe('Type a command or search');
        const list = document.getElementById(input().getAttribute('aria-controls')!)!;
        expect(list.getAttribute('role')).toBe('listbox');
        expect(list.getAttribute('aria-label')).toBe('Command palette');
        expect(options()).toHaveLength(5);
        expect(active()).toBe('Calendar');
        const group = document.querySelector('[role="group"]')!;
        expect(document.getElementById(group.getAttribute('aria-labelledby')!)?.textContent).toBe('Suggestions');
    });

    it('moves with the arrows, skipping disabled items, and runs the active item with Enter', async () => {
        const { input, active, onPick, onSelect } = mountCommand();
        await settle();
        await press(input(), 'ArrowDown');
        await press(input(), 'ArrowDown');
        expect(active()).toBe('Perfil⌘P');
        await press(input(), 'ArrowDown');
        await press(input(), 'ArrowDown');
        expect(active()).toBe('Configurações');
        await press(input(), 'Home', { ctrlKey: true });
        expect(active()).toBe('Calendar');
        await press(input(), 'ArrowDown');
        await press(input(), 'Enter');
        expect(onPick).toHaveBeenCalledWith('Search emoji');
        expect(onSelect).toHaveBeenCalledWith('Search emoji');
    });

    it('wraps when looping', async () => {
        const { input, active } = mountCommand({ loop: true });
        await settle();
        await press(input(), 'ArrowUp');
        expect(active()).toBe('Configurações');
    });

    it('filters by value and keywords, ignoring accents, hides empty groups and says how many match', async () => {
        const { type, options, active } = mountCommand();
        await settle();
        await type('smile');
        expect(options().map((o) => o.textContent?.trim())).toEqual(['Search emoji']);
        expect(active()).toBe('Search emoji');
        expect((document.querySelectorAll('[role="presentation"]')[1] as HTMLElement).style.display).toBe('none');
        expect((document.querySelector('.vt-command-separator') as HTMLElement).style.display).toBe('none');
        expect(document.querySelector('[role="status"]')!.textContent).toBe('1 results are available');
        await type('configuracoes');
        expect(options().map((o) => o.textContent?.trim())).toEqual(['Configurações']);
        await type('zzz');
        expect(options()).toHaveLength(0);
        expect(document.body.textContent).toContain('Nothing found.');
    });

    it('puts the best matches first, and follows that order with the arrows', async () => {
        const { type, active, input } = mountCommand();
        await settle();
        // "Search emoji" starts a keyword with the search; "Calendar" only contains it.
        await type('e');
        await settle();
        expect(active()).toBe('Search emoji');
        const order = (label: string) => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find((o) => o.textContent?.includes(label))!.style.order;
        expect(Number(order('Search emoji'))).toBeLessThan(Number(order('Calendar')));
        await press(input(), 'ArrowDown');
        expect(active()).toBe('Calendar');
        await type('');
        await settle();
        expect(order('Calendar')).toBe('');
    });

    it('opens as a palette from its hotkey and closes on a choice', async () => {
        const visible = ref(false);
        const picked = vi.fn();
        mountVt(
            defineComponent(() => () =>
                h(CommandDialog, { visible: visible.value, 'onUpdate:visible': (v: boolean) => (visible.value = v), hotkey: 'k', onSelect: picked }, body())
            )
        );
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
        await settle();
        await settle();
        const dialog = document.querySelector('[role="dialog"]')!;
        expect(dialog.getAttribute('aria-label')).toBe('Command palette');
        expect(document.activeElement?.getAttribute('role')).toBe('combobox');
        await press(document.activeElement!, 'Enter');
        await settle();
        expect(picked).toHaveBeenCalledWith('Calendar');
        expect(visible.value).toBe(false);
    });

    it('has no accessibility violations, searching or not', async () => {
        const { type } = mountCommand();
        await settle();
        await expectNoA11yViolations();
        await type('cal');
        await expectNoA11yViolations();
    });
});
