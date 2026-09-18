import { isClient } from '../utils/dom';

export interface LayerOptions {
    /** The elements that count as "inside" this layer — typically the popup and the control that opened it. */
    elements: () => (Element | null | undefined)[];
    onEscape?: (event: KeyboardEvent) => void;
    onPointerDownOutside?: (event: PointerEvent) => void;
}

const stack: LayerOptions[] = [];

function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    const top = stack[stack.length - 1];
    if (top?.onEscape) {
        event.preventDefault();
        top.onEscape(event);
    }
}

function onPointerDown(event: PointerEvent) {
    const top = stack[stack.length - 1];
    if (!top?.onPointerDownOutside) return;
    const target = event.target as Node | null;
    if (target && top.elements().some((el) => el?.contains(target))) return;
    top.onPointerDownOutside(event);
}

/**
 * Registers a dismissable layer: a popup, menu or dialog that closes on Escape or
 * on a press outside it. Only the topmost layer hears either, so Escape inside a
 * select inside a dialog closes the select and leaves the dialog open — the
 * behaviour every stacked overlay needs and each would otherwise get wrong on
 * its own.
 *
 * Returns the function that removes the layer.
 */
export function pushLayer(options: LayerOptions): () => void {
    if (!isClient) return () => {};
    if (stack.length === 0) {
        document.addEventListener('keydown', onKeydown);
        document.addEventListener('pointerdown', onPointerDown, true);
    }
    stack.push(options);
    let removed = false;
    return () => {
        if (removed) return;
        removed = true;
        const index = stack.indexOf(options);
        if (index >= 0) stack.splice(index, 1);
        if (stack.length === 0) {
            document.removeEventListener('keydown', onKeydown);
            document.removeEventListener('pointerdown', onPointerDown, true);
        }
    };
}

export function isTopLayer(options: LayerOptions): boolean {
    return stack[stack.length - 1] === options;
}
