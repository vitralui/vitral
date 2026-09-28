import { afterEach, describe, expect, it } from 'vitest';
import { createTextEditor } from './editor';
import type { TextEditorHandle } from './types';

let handle: TextEditorHandle | null = null;
afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

const rect = (top: number, height: number, width = 400) => () => ({ top, left: 0, right: width, bottom: top + height, width, height, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;

describe('the block handle', () => {
    it("sits level with the middle of its block's first line, whichever line the caret is in", () => {
        const element = document.createElement('div');
        document.body.appendChild(element);
        handle = createTextEditor(element, { content: '<p>One</p><p>A long paragraph</p>', ariaLabel: 'Notes' });
        const content = element.querySelector<HTMLElement>('[role="textbox"]')!;
        const [, second] = Array.from(content.children) as HTMLElement[];
        // A layout jsdom does not have: the editor at 100, the second block at 160,
        // three lines of 20px with 4px of padding above them.
        element.getBoundingClientRect = rect(100, 400);
        content.getBoundingClientRect = rect(100, 400);
        second!.getBoundingClientRect = rect(160, 68);
        second!.style.lineHeight = '20px';
        second!.style.paddingTop = '4px';
        const button = element.querySelector<HTMLElement>('.vt-editor-block-handle')!;
        Object.defineProperty(button, 'offsetHeight', { value: 24 });

        // The caret on the third line of the paragraph: the handle still takes the first.
        handle.run('setSelection', { anchor: { path: [1], offset: 12 }, head: { path: [1], offset: 12 } });
        // Middle of the first line: 160 + 4 + 10 = 174; less the host's 100 and half the handle's 24.
        expect(button.style.top).toBe('62px');
    });
});
