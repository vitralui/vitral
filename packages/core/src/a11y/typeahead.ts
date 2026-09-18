export interface Typeahead {
    /** Adds a printable key and returns the query typed so far. */
    push(key: string): string;
    reset(): void;
}

/** Collects keystrokes typed in quick succession into a search string, as native selects and listboxes do. */
export function createTypeahead(timeout = 500): Typeahead {
    let buffer = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    return {
        push(key) {
            clearTimeout(timer);
            buffer += key.toLocaleLowerCase();
            timer = setTimeout(() => (buffer = ''), timeout);
            return buffer;
        },
        reset() {
            clearTimeout(timer);
            buffer = '';
        }
    };
}

/** Whether a keydown is a printable character a typeahead should consume. */
export function isPrintableKey(event: KeyboardEvent): boolean {
    return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}
