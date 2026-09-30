import { drawMath, editorMathAt, en, isMathLoaded, loadMath, overlayContainerOf, paintMath, type EditorInstance, type EditorPosition, type EditorView, type Locale } from '@vitral/core';
import { createOverlay, type OverlayTarget } from '@vitral/controls';
import { h, mergeAttrs, type Props, type VElement } from '@vitral/dom';
import type { MathTemplate } from './types';

/**
 * Formulas, as a piece that attaches to any editor, the way the slash menu
 * does. A formula is held as LaTeX and drawn from it, and there are two ways
 * to change one:
 *
 * - the panel, which the toolbar's button and the slash menu open: the source
 *   in a box, the formula drawn above it as it is typed, and the usual
 *   formulas ready-made on buttons;
 * - pressing it in the text. A number, a letter or a sign is edited where it
 *   stands, in a box over it, and the formula is drawn again around it with
 *   every key; Tab goes on to the next value. A press anywhere else on the
 *   formula opens the panel with that piece of the source selected.
 *
 * Either way the document only ever holds the source, and the drawing is made
 * from it again, so there is no drawing to get out of step. What is typed is
 * never trusted to be a formula: a piece that cannot be read is drawn as
 * written, where it stands, and the rest of the formula around it.
 */

export interface MathToolsOptions {
    editor: EditorInstance;
    view: () => EditorView | null;
    /** The `contenteditable` element, where a press on a formula is heard. */
    content: () => HTMLElement | null;
    /** What the panel hangs from when it is opened by no button and on no formula: an element over the caret. */
    anchor: () => HTMLElement | null;
    /** Puts that element where the caret is, before the panel opens. */
    place?: () => void;
    /** The ready-made formulas on offer; read every time the panel opens. */
    templates: () => MathTemplate[];
    /** Whether a value is edited where it stands. */
    inlineEdit?: () => boolean;
    part: (name: string, state?: unknown) => Props;
    locale?: () => Locale;
    /** Off while the editor is read-only, or has formulas turned off. */
    enabled?: () => boolean;
    /** Puts the keyboard back in the text. */
    focus?: () => void;
    id?: string;
    overlayTarget?: OverlayTarget;
    zIndex?: number;
}

export interface MathTools {
    readonly isOpen: boolean;
    /**
     * Opens the panel: on the formula the selection is on, to change it, or
     * for a new one where the caret is. `anchor` is what it hangs from, a
     * toolbar button say; the formula itself, or the caret, otherwise.
     */
    open(anchor?: HTMLElement | null): void;
    /** Looks again for the element the text is in: called when the host has drawn. */
    sync(): void;
    close(): void;
    destroy(): void;
}

/** The formulas the panel offers when an application names none. */
export function defaultMathTemplates(locale: Locale): MathTemplate[] {
    const names = locale.editor.mathTemplateNames;
    const entry = (id: string, latex: string): MathTemplate => ({ id, label: names[id] ?? id, latex });
    return [
        entry('fraction', '\\frac{a}{b}'),
        entry('squareRoot', '\\sqrt{x}'),
        entry('root', '\\sqrt[n]{x}'),
        entry('power', 'x^{2}'),
        entry('subscript', 'x_{i}'),
        entry('sum', '\\sum_{i=1}^{n} i'),
        entry('product', '\\prod_{k=1}^{n} k'),
        entry('integral', '\\int_{a}^{b} x \\, dx'),
        entry('limit', '\\lim_{x \\to 0} f(x)'),
        entry('parentheses', '\\left( \\frac{a}{b} \\right)'),
        entry('matrix', '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'),
        entry('cases', '\\begin{cases} a & x > 0 \\\\ b & x \\leq 0 \\end{cases}'),
        entry('quadratic', 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'),
        entry('times', '\\times'),
        entry('divide', '\\div'),
        entry('plusMinus', '\\pm'),
        entry('lessEqual', '\\leq'),
        entry('greaterEqual', '\\geq'),
        entry('notEqual', '\\neq'),
        entry('approximately', '\\approx'),
        entry('pi', '\\pi'),
        entry('infinity', '\\infty')
    ];
}

interface PanelState {
    /** The formula being changed; none when a new one is being written. */
    at: EditorPosition | null;
    latex: string;
    display: boolean;
}

interface InlineState {
    at: EditorPosition;
    /** The formula's element in the text. */
    host: HTMLElement;
    /** The formula as it was when the box opened. */
    source: string;
    display: boolean;
    /** The piece of the source the box stands for. */
    start: number;
    end: number;
    input: HTMLInputElement;
}

const SOURCE = 'data-vt-math-source';

export function createMathTools(options: MathToolsOptions): MathTools {
    let panel: PanelState | null = null;
    let anchorEl: HTMLElement | null = null;
    /** A piece of the source to select when the panel's box is first drawn. */
    let select: [number, number] | null = null;
    let inline: InlineState | null = null;
    let element: HTMLElement | null = null;

    const locale = () => options.locale?.() ?? en;
    const enabled = () => options.enabled?.() ?? true;
    const id = options.id ?? 'vt-math';
    const run = (name: string, ...args: unknown[]) => (options.editor.run as (n: string, ...a: unknown[]) => boolean)(name, ...args);

    // ---- where a formula is ------------------------------------------------------------------

    /** The formula's position from its element: the view reads a point inside one as just after it. */
    function positionOf(host: HTMLElement): EditorPosition | null {
        const after = options.view()?.posFromDOM(host, 0);
        return after && after.offset > 0 ? { path: after.path, offset: after.offset - 1 } : null;
    }

    function elementAt(at: EditorPosition): HTMLElement | null {
        const formulas = options.content()?.querySelectorAll<HTMLElement>('[data-math]') ?? [];
        for (const host of Array.from(formulas)) {
            const position = positionOf(host);
            if (position && position.offset === at.offset && position.path.join('.') === at.path.join('.')) return host;
        }
        return null;
    }

    // ---- the panel -----------------------------------------------------------------------------

    const overlay = createOverlay({
        anchor: () => anchorEl,
        render: () => (panel ? panelView(panel) : null),
        placement: 'bottom-start',
        target: () => options.overlayTarget,
        zIndex: options.zIndex,
        restoreFocus: false,
        onOpen: (drawn) => {
            const box = drawn.querySelector<HTMLInputElement>(`[${SOURCE}]`);
            if (!box) return;
            box.focus({ preventScroll: true });
            if (select) box.setSelectionRange(select[0], select[1]);
            else box.select();
            select = null;
        },
        onClose: (reason) => {
            panel = null;
            if (reason === 'escape') options.focus?.();
        }
    });

    /**
     * What the panel draws a formula with: the drawing, or the source while
     * there is nothing to draw with. The panel centres it, so where it would
     * hang from a baseline does not come into it.
     */
    const drawn = (tag: string, props: Props, latex: string, display: boolean): VElement => {
        const drawing = drawMath(latex, { display });
        return (drawing ? h(tag, mergeAttrs(props, { innerHTML: drawing.svg })) : h(tag, props, latex)) as VElement;
    };

    function panelView(state: PanelState): VElement {
        const words = locale().editor;
        const { part } = options;
        const button = (key: string, label: string, onClick: () => void, quiet = true) =>
            h('button', mergeAttrs({ key, type: 'button', class: quiet ? 'vt-button vt-button-text vt-button-secondary vt-button-sm' : 'vt-button vt-button-sm' }, { onClick }), label);
        const source = state.latex.trim();
        return h(
            'div',
            mergeAttrs({ role: 'dialog', id }, part('panel'), part('mathPanel'), { 'aria-label': words.math }),
            source
                ? drawn('div', mergeAttrs({ key: 'preview' }, part('mathPreview')), source, state.display)
                : h('div', mergeAttrs({ key: 'empty' }, part('mathPreview', { empty: true })), words.mathEmpty),
            h(
                'label',
                mergeAttrs({ key: 'source' }, part('field')),
                h('span', part('fieldLabel'), words.mathSource),
                h(
                    'span',
                    { class: 'vt-field vt-field-sm vt-field-fluid' },
                    h('input', {
                        type: 'text',
                        class: 'vt-field-input',
                        spellcheck: 'false',
                        autocomplete: 'off',
                        autocapitalize: 'off',
                        [SOURCE]: '',
                        value: state.latex,
                        onInput: (event: Event) => {
                            if (!panel) return;
                            panel = { ...panel, latex: (event.target as HTMLInputElement).value };
                            overlay.update();
                        },
                        onKeydown: (event: KeyboardEvent) => {
                            if (event.key !== 'Enter') return;
                            event.preventDefault();
                            apply();
                        }
                    })
                )
            ),
            h(
                'label',
                mergeAttrs({ key: 'display' }, part('check')),
                h('input', {
                    type: 'checkbox',
                    checked: state.display,
                    onChange: (event: Event) => {
                        if (!panel) return;
                        panel = { ...panel, display: (event.target as HTMLInputElement).checked };
                        overlay.update();
                    }
                }),
                h('span', null, words.mathDisplay)
            ),
            templates().length
                ? h(
                      'div',
                      mergeAttrs({ key: 'templates', role: 'group' }, part('mathTemplates'), { 'aria-label': words.mathTemplates }),
                      templates().map((template) =>
                          drawn(
                              'button',
                              mergeAttrs({ key: template.id, type: 'button' }, part('mathTemplate'), { 'aria-label': template.label, title: template.label, onClick: () => write(template.latex) }),
                              template.latex,
                              false
                          )
                      )
                  )
                : null,
            h(
                'div',
                mergeAttrs({ key: 'actions' }, part('actions')),
                state.at ? button('remove', words.removeMath, remove) : null,
                button('cancel', locale().cancel, cancel),
                button('apply', state.at ? words.apply : words.insert, apply, false)
            )
        ) as VElement;
    }

    let offered: MathTemplate[] = [];
    const templates = () => offered;

    /** Writes a ready-made formula into the box, over what is selected there, and leaves the caret after it. */
    function write(latex: string) {
        if (!panel) return;
        const box = overlay.element()?.querySelector<HTMLInputElement>(`[${SOURCE}]`);
        const start = box?.selectionStart ?? panel.latex.length;
        const end = box?.selectionEnd ?? start;
        // A space keeps a command from running into the letters after it: `\pi x`, not `\pix`.
        const before = panel.latex.slice(0, start);
        const glue = /\\[a-zA-Z]+$/.test(before) && /^[a-zA-Z]/.test(latex) ? ' ' : '';
        const after = panel.latex.slice(end);
        const tail = /\\[a-zA-Z]+$/.test(latex) && /^[a-zA-Z]/.test(after) ? ' ' : '';
        panel = { ...panel, latex: before + glue + latex + tail + after };
        overlay.update();
        const caret = before.length + glue.length + latex.length + tail.length;
        box?.focus({ preventScroll: true });
        box?.setSelectionRange(caret, caret);
    }

    function apply() {
        if (!panel) return;
        const { at, display } = panel;
        const latex = panel.latex.trim();
        overlay.close();
        if (at) run('setMath', at, { latex, display });
        else if (latex) run('insertMath', { latex, display });
        options.focus?.();
    }

    function remove() {
        if (!panel?.at) return;
        const { at } = panel;
        overlay.close();
        run('setMath', at, { latex: '' });
        options.focus?.();
    }

    function cancel() {
        overlay.close();
        options.focus?.();
    }

    function openPanel(state: PanelState, anchor: HTMLElement | null | undefined, range?: [number, number]) {
        endInline(true);
        offered = options.templates();
        panel = state;
        select = range ?? null;
        anchorEl = anchor ?? (state.at ? elementAt(state.at) : null);
        if (!anchorEl) {
            options.place?.();
            anchorEl = options.anchor();
        }
        if (overlay.isOpen) overlay.close();
        overlay.open();
        overlay.update();
        // Nothing to draw with yet, in a document that had no formula in it: the panel draws again when there is.
        if (!isMathLoaded()) loadMath().then(() => overlay.update());
    }

    function open(anchor?: HTMLElement | null) {
        if (!enabled()) return;
        const on = editorMathAt(options.editor.state);
        openPanel(on ? { at: { path: on.path, offset: on.offset }, latex: on.latex, display: on.display } : { at: null, latex: '', display: false }, anchor);
    }

    // ---- a value, edited where it stands ---------------------------------------------------------

    /** The box is put over the piece it stands for, and is at least wide enough for what is in it. */
    function placeInline() {
        if (!inline) return;
        const { host, input, start } = inline;
        const end = start + input.value.length;
        const piece = host.querySelector(`[data-at="${start},${end}"]`) ?? host;
        const rect = piece.getBoundingClientRect();
        const size = Number.parseFloat(getComputedStyle(host).fontSize) || 16;
        // Wide enough for what is typed in its own face, and never narrower than the piece it covers.
        const width = Math.max(rect.width + size * 0.35, (input.value.length + 0.8) * size * 0.62);
        const height = Math.max(rect.height, size * 1.3);
        input.style.fontSize = `${size}px`;
        input.style.width = `${width}px`;
        input.style.height = `${height}px`;
        input.style.left = `${rect.left + rect.width / 2 - width / 2}px`;
        input.style.top = `${rect.top + rect.height / 2 - height / 2}px`;
    }

    const inlineSource = (state: InlineState) => state.source.slice(0, state.start) + state.input.value + state.source.slice(state.end);

    function startInline(host: HTMLElement, at: EditorPosition, start: number, end: number) {
        endInline(true);
        if (overlay.isOpen) overlay.close();
        const source = host.getAttribute('data-math') ?? '';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = source.slice(start, end);
        input.spellcheck = false;
        input.autocomplete = 'off';
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('aria-label', locale().editor.mathValue);
        for (const [key, value] of Object.entries(options.part('mathInput'))) if (typeof value === 'string') input.setAttribute(key, value);
        input.style.position = 'fixed';
        input.style.zIndex = String(options.zIndex ?? 1000);
        inline = { at, host, source, display: host.getAttribute('data-display') === 'true', start, end, input };
        input.addEventListener('input', onInlineInput);
        input.addEventListener('keydown', onInlineKeydown);
        input.addEventListener('blur', onInlineBlur);
        // Beside the other popups, so it wears the theme they wear.
        (overlayContainerOf(host) ?? host.ownerDocument.body).appendChild(input);
        host.setAttribute('data-editing', '');
        placeInline();
        input.focus({ preventScroll: true });
        input.select();
        window.addEventListener('scroll', onInlineScroll, true);
        window.addEventListener('resize', onInlineScroll);
    }

    /** The formula follows the typing: drawn again from what the source would be, before any of it is kept. */
    function onInlineInput() {
        if (!inline) return;
        paintMath(inline.host, inlineSource(inline), { display: inline.display, interactive: true });
        placeInline();
    }

    function onInlineKeydown(event: KeyboardEvent) {
        if (!inline) return;
        if (event.key === 'Enter') {
            event.preventDefault();
            endInline(true);
            options.focus?.();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            endInline(false);
            options.focus?.();
        } else if (event.key === 'Tab') {
            // On to the next value, or back to the one before; off the end, the keyboard goes back to the text.
            event.preventDefault();
            const { at, start } = inline;
            const length = inline.input.value.length;
            const forward = !event.shiftKey;
            endInline(true);
            const host = elementAt(at);
            const leaves = host ? Array.from(host.querySelectorAll<SVGElement>('[data-leaf]')).map((leaf) => leaf.getAttribute('data-at')!.split(',').map(Number) as [number, number]) : [];
            leaves.sort((a, b) => a[0] - b[0]);
            const next = forward ? leaves.find(([from]) => from >= start + length) : leaves.reverse().find(([, to]) => to <= start);
            if (host && next) startInline(host, at, next[0], next[1]);
            else options.focus?.();
        }
    }

    const onInlineBlur = () => endInline(true);
    // The box is placed by the page's coordinates, so it is placed again when the page moves under it.
    // (Not closed: a field scrolls its own text as it is typed into, and that is a scroll too.)
    const onInlineScroll = (event: Event) => {
        if (event.target !== inline?.input) placeInline();
    };

    /** Closes the box. `keep` writes what was typed into the document, as one change; otherwise the formula is drawn as it was. */
    function endInline(keep: boolean) {
        const state = inline;
        if (!state) return;
        inline = null;
        const { input, host, at } = state;
        input.removeEventListener('blur', onInlineBlur);
        input.removeEventListener('input', onInlineInput);
        input.removeEventListener('keydown', onInlineKeydown);
        window.removeEventListener('scroll', onInlineScroll, true);
        window.removeEventListener('resize', onInlineScroll);
        input.remove();
        host.removeAttribute('data-editing');
        const next = inlineSource(state);
        if (keep && next !== state.source) {
            // The element is put back as the document has it first, so that the change is the view's to draw.
            paintMath(host, state.source, { display: state.display, interactive: true });
            run('setMath', at, { latex: next });
        } else if (host.isConnected) paintMath(host, state.source, { display: state.display, interactive: true });
    }

    // ---- a press on a formula in the text --------------------------------------------------------

    function onClick(event: MouseEvent) {
        const target = event.target as Element | null;
        const host = target?.closest?.('[data-math]') as HTMLElement | null;
        if (!host || !element?.contains(host) || !enabled() || inline?.host === host) return;
        const at = positionOf(host);
        if (!at) return;
        event.preventDefault();
        const piece = target!.closest('[data-at]');
        const range = piece && host.contains(piece) ? (piece.getAttribute('data-at')!.split(',').map(Number) as [number, number]) : null;
        if (range && piece!.hasAttribute('data-leaf') && (options.inlineEdit?.() ?? true) && isMathLoaded()) {
            startInline(host, at, range[0], range[1]);
            return;
        }
        openPanel({ at, latex: host.getAttribute('data-math') ?? '', display: host.getAttribute('data-display') === 'true' }, host, range ?? undefined);
    }

    function listen() {
        const next = options.content();
        if (next === element) return;
        element?.removeEventListener('click', onClick);
        element = next;
        element?.addEventListener('click', onClick);
    }

    const stop = options.editor.subscribe(() => {
        listen();
        if (!enabled()) {
            endInline(false);
            if (overlay.isOpen) overlay.close();
            return;
        }
        // The document changed under an open box or panel (an undo, the application): what it was
        // editing may be gone. Looked at once the view has drawn the change, which it does after this.
        if (inline || panel?.at) queueMicrotask(settle);
    });

    function settle() {
        if (inline && !inline.host.isConnected) endInline(false);
        if (panel?.at && !elementAt(panel.at)) overlay.close();
    }
    listen();

    return {
        get isOpen() {
            return overlay.isOpen;
        },
        open,
        sync: listen,
        close() {
            endInline(true);
            if (overlay.isOpen) overlay.close();
        },
        destroy() {
            stop();
            endInline(false);
            element?.removeEventListener('click', onClick);
            element = null;
            overlay.destroy();
        }
    };
}
