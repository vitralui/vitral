import { isClient } from '../utils/dom';

let holders = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

/**
 * Stops the page scrolling behind a modal, and pads the body by the scrollbar's
 * width so the content does not jump sideways when the bar disappears. Counted,
 * so two stacked modals release it only when the second closes.
 *
 * Returns the release function; calling it twice is harmless.
 */
export function lockScroll(): () => void {
    if (!isClient) return () => {};
    if (holders++ === 0) {
        const body = document.body;
        const scrollbar = window.innerWidth - document.documentElement.clientWidth;
        saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
        body.style.overflow = 'hidden';
        if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    }
    let released = false;
    return () => {
        if (released) return;
        released = true;
        if (--holders === 0 && saved) {
            document.body.style.overflow = saved.overflow;
            document.body.style.paddingRight = saved.paddingRight;
            saved = null;
        }
    };
}
