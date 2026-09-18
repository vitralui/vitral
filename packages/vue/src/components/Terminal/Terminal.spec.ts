import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Terminal from './Terminal.vue';
import type { TerminalCommandEvent } from './types';

function mountTerminal() {
    const wrapper = mountVt(Terminal, {
        props: {
            welcomeMessage: 'Welcome',
            onCommand: ({ command, respond }: TerminalCommandEvent) => {
                if (command === 'date') respond('Today');
                else respond(`Unknown: ${command}`);
            }
        },
        attrs: { 'aria-label': 'Console output' }
    });
    const input = () => document.querySelector<HTMLInputElement>('input')!;
    const type = async (text: string) => {
        input().value = text;
        input().dispatchEvent(new Event('input'));
        await press(input(), 'Enter');
        await nextTick();
    };
    const log = () => document.querySelector<HTMLElement>('[role="log"]')!;
    return { wrapper, input, type, log };
}

describe('Terminal', () => {
    it('has a labelled command line and a named log', () => {
        const { input, log } = mountTerminal();
        expect(input().labels?.[0]?.textContent).toContain('Command');
        expect(log().getAttribute('aria-live')).toBe('polite');
        expect(log().getAttribute('aria-label')).toBe('Console output');
        expect(document.body.textContent).toContain('Welcome');
    });

    it('logs commands with their answers', async () => {
        const { type, log, input } = mountTerminal();
        await type('date');
        await type('ls');
        expect(log().textContent).toContain('$date');
        expect(Array.from(log().querySelectorAll('.vt-terminal-response')).map((r) => r.textContent)).toEqual(['Today', 'Unknown: ls']);
        expect(input().value).toBe('');
    });

    it('walks the history with the arrows', async () => {
        const { type, input } = mountTerminal();
        await type('one');
        await type('two');
        await press(input(), 'ArrowUp');
        await nextTick();
        expect(input().value).toBe('two');
        await press(input(), 'ArrowUp');
        await nextTick();
        expect(input().value).toBe('one');
        await press(input(), 'ArrowDown');
        await press(input(), 'ArrowDown');
        await nextTick();
        expect(input().value).toBe('');
    });

    it('prints and clears from code', async () => {
        const { wrapper, log } = mountTerminal();
        const api = wrapper.vm as unknown as { print: (t: string) => void; clear: () => void };
        api.print('Connected');
        await nextTick();
        expect(log().textContent).toContain('Connected');
        api.clear();
        await nextTick();
        expect(log().textContent).toBe('');
    });

    it('has no accessibility violations', async () => {
        const { type } = mountTerminal();
        await type('date');
        await expectNoA11yViolations();
    });
});
