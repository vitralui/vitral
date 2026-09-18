import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import InputTag from './InputTag.vue';

function mountTag(props: Record<string, unknown> = {}) {
    const value = ref<string[] | null | undefined>((props.modelValue as string[] | undefined) ?? []);
    const events: { name: string; value: string; reason?: string }[] = [];
    mountVt(
        defineComponent(() => () => [
            h('label', { for: 'topics' }, 'Topics'),
            h(InputTag, {
                id: 'topics',
                ...props,
                modelValue: value.value,
                'onUpdate:modelValue': (v: string[] | null | undefined) => (value.value = v),
                onAdd: (e: { value: string }) => events.push({ name: 'add', value: e.value }),
                onRemove: (e: { value: string }) => events.push({ name: 'remove', value: e.value }),
                onReject: (e: { value: string; reason: string }) => events.push({ name: 'reject', value: e.value, reason: e.reason })
            })
        ])
    );
    const input = () => document.querySelector<HTMLInputElement>('input#topics')!;
    const tags = () => Array.from(document.querySelectorAll<HTMLElement>('.vt-inputtag-tag')).map((el) => el.textContent?.trim() ?? '');
    const removeButtons = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.vt-inputtag-remove'));
    return { value, input, tags, removeButtons, events };
}

/** Types into the box the way a person does: the value, then the event. */
async function type(el: HTMLInputElement, text: string) {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
}

describe('InputTag', () => {
    it('is one text box, named by the label, with the tags described beside it', async () => {
        const { input, tags } = mountTag({ modelValue: ['vue', 'css'] });
        await nextTick();
        expect(tags()).toEqual(['vue', 'css']);
        // One tab stop: the box. The tags are not in the tab order.
        expect(document.querySelectorAll('.vt-inputtag [tabindex="0"]')).toHaveLength(0);
        expect(input().getAttribute('aria-describedby')).toBe(document.querySelector('.vt-inputtag-list')!.id);
        await expectNoA11yViolations();
    });

    it('adds on Enter and on the separator, and splits a paste', async () => {
        const { input, value, events } = mountTag();
        await nextTick();
        await type(input(), 'vue');
        await press(input(), 'Enter');
        expect(value.value).toEqual(['vue']);
        // A separator commits without Enter, and what follows stays in the box.
        await type(input(), 'css, ty');
        expect(value.value).toEqual(['vue', 'css']);
        expect(input().value).toBe('ty');
        const paste = new Event('paste', { bubbles: true }) as ClipboardEvent;
        Object.defineProperty(paste, 'clipboardData', { value: { getData: () => 'pescript, html' } });
        input().dispatchEvent(paste);
        await nextTick();
        expect(value.value).toEqual(['vue', 'css', 'typescript', 'html']);
        expect(events.filter((e) => e.name === 'add').map((e) => e.value)).toEqual(['vue', 'css', 'typescript', 'html']);
    });

    it('takes a tag out by its button, and by Backspace in an empty box', async () => {
        const { input, value, removeButtons, events } = mountTag({ modelValue: ['a', 'b', 'c'] });
        await nextTick();
        removeButtons()[1]!.click();
        await nextTick();
        expect(value.value).toEqual(['a', 'c']);
        input().focus();
        await press(input(), 'Backspace');
        expect(value.value).toEqual(['a']);
        expect(events.filter((e) => e.name === 'remove').map((e) => e.value)).toEqual(['b', 'c']);
        // Backspace while there is text edits the text instead.
        await type(input(), 'x');
        await press(input(), 'Backspace');
        expect(value.value).toEqual(['a']);
    });

    it('walks the tags with the arrows and removes the one it is on', async () => {
        const { input, value } = mountTag({ modelValue: ['a', 'b', 'c'] });
        await nextTick();
        input().focus();
        await press(input(), 'ArrowLeft');
        expect(document.querySelectorAll('.vt-inputtag-tag-focused')).toHaveLength(1);
        expect(document.querySelector('.vt-inputtag-tag-focused')!.textContent).toContain('c');
        await press(input(), 'ArrowLeft');
        expect(document.querySelector('.vt-inputtag-tag-focused')!.textContent).toContain('b');
        await press(input(), 'Delete');
        expect(value.value).toEqual(['a', 'c']);
        // Escape hands the keyboard back to the box.
        await press(input(), 'ArrowLeft');
        await press(input(), 'Escape');
        expect(document.querySelectorAll('.vt-inputtag-tag-focused')).toHaveLength(0);
    });

    it('refuses a duplicate, a tag past the maximum and one the check turns down', async () => {
        const { input, value, events } = mountTag({ modelValue: ['a'], max: 2, validate: (tag: string) => tag !== 'no' });
        await nextTick();
        await type(input(), 'a');
        await press(input(), 'Enter');
        expect(value.value).toEqual(['a']);
        await type(input(), 'no');
        await press(input(), 'Enter');
        expect(value.value).toEqual(['a']);
        await type(input(), 'b');
        await press(input(), 'Enter');
        await type(input(), 'c');
        await press(input(), 'Enter');
        expect(value.value).toEqual(['a', 'b']);
        expect(events.filter((e) => e.name === 'reject').map((e) => [e.value, e.reason])).toEqual([
            ['a', 'duplicate'],
            ['no', 'invalid'],
            ['c', 'max']
        ]);
    });

    it('adds what is left in the box when focus leaves, unless told not to', async () => {
        const { input, value } = mountTag();
        await nextTick();
        await type(input(), 'loose');
        input().dispatchEvent(new FocusEvent('blur', { bubbles: false }));
        await nextTick();
        expect(value.value).toEqual(['loose']);

        const second = mountTag({ addOnBlur: false });
        await nextTick();
        await type(second.input(), 'loose');
        second.input().dispatchEvent(new FocusEvent('blur', { bubbles: false }));
        await nextTick();
        expect(second.value.value).toEqual([]);
    });

    it('takes nothing while read-only or disabled', async () => {
        const { input, value } = mountTag({ modelValue: ['a'], readonly: true });
        await nextTick();
        expect(document.querySelectorAll('.vt-inputtag-remove')).toHaveLength(0);
        await type(input(), 'b');
        await press(input(), 'Enter');
        expect(value.value).toEqual(['a']);
    });

    it('submits its tags one by one under the name it is given', async () => {
        mountTag({ modelValue: ['a', 'b'], name: 'topic' });
        await nextTick();
        const hidden = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="hidden"]'));
        expect(hidden.map((el) => [el.name, el.value])).toEqual([
            ['topic', 'a'],
            ['topic', 'b']
        ]);
    });
});
