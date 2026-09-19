/**
 * A press that must not move focus.
 *
 * Preventing the press is how a mouse keeps focus where it is while something
 * else is pressed: a field stays focused while its panel is used, a toolbar
 * button does not take the caret out of the text it is about to format. It has
 * one cost, and it is the whole of a phone: a touch screen builds its tap out
 * of that same press, and WebKit cancels everything that was going to follow a
 * prevented one — the click included. On an iPhone the option was never
 * chosen, the day was never picked, the toolbar button never fired.
 *
 * So a press from a finger is left alone, and whatever focus it was going to
 * move is set deliberately instead.
 */
export function keepFocus(event: PointerEvent, exempt?: (target: Element) => boolean): boolean {
    if (event.pointerType === 'touch') return false;
    const target = event.target as Element | null;
    if (target && exempt?.(target)) return false;
    event.preventDefault();
    return true;
}

/** Whether a press came from a finger, for the few places that need to know. */
export const isTouchPress = (event: PointerEvent): boolean => event.pointerType === 'touch';
