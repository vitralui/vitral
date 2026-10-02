import {
    defaultMaskDefinitions,
    isMaskComplete,
    isMaskEmpty,
    isPrintableKey,
    maskCaret,
    maskCase,
    maskDelete,
    maskInsert,
    maskPatternEdit,
    parseMask,
    parseMaskPattern,
    parseMaskText,
    renderMask,
    resolveMask,
    unmaskValue,
    type MaskEdit,
    type MaskOptions,
    type MaskProp,
    type MaskSlots,
    type MaskToken
} from '@vitral/core';
import { computed, nextTick, ref, shallowRef, watch, type HTMLAttributes, type Ref } from 'vue';

/**
 * The typing half of a masked text box, for any component that owns an
 * `<input>`: keystrokes, deletions and pastes are taken over and handed to
 * core's mask arithmetic, which says what the slots hold and where the caret
 * goes; anything that still reaches the box another way (autofill, an input
 * method) is read back through the same arithmetic. Every field that takes a
 * `mask` goes through here, so one mask behaves the same in each.
 *
 * A list of patterns, or a function, makes the pattern follow the value: the
 * edits then go through core's pattern edit, which works on the typed
 * characters and lays them into whichever pattern they pick.
 */
export interface UseMaskOptions {
    input: Ref<HTMLInputElement | null>;
    /** The mask prop; nothing turns the masking off. */
    mask: () => MaskProp | null | undefined;
    /** The field's own settings, which win over the mask's. */
    settings: () => Omit<MaskOptions, 'pattern'>;
    /** The value from outside, read into the slots whenever it is not our own echo. */
    value: () => string | null | undefined;
    /** Called with each new value: the masked text, or only the typed characters with `unmask`. */
    onValue: (value: string, event: Event) => void;
    /** Every required slot has just been filled. */
    onComplete?: (value: string, event: Event) => void;
    editable: () => boolean;
}

export function useMask(options: UseMaskOptions) {
    const active = computed(() => {
        const mask = options.mask();
        return mask !== null && mask !== undefined && mask !== '';
    });
    const resolved = computed(() => resolveMask(options.mask() ?? '', options.settings()));
    const dynamic = computed(() => typeof resolved.value.pattern !== 'string');
    /** The pattern a list or a function picked for the value; unused for a fixed one. */
    const pattern = shallowRef('');
    const tokens = computed(() => {
        const current = resolved.value.pattern;
        return parseMask(typeof current === 'string' ? current : pattern.value, resolved.value.definitions);
    });
    const slots = shallowRef<MaskSlots>([]);
    const focused = ref(false);
    let emitted: string | undefined;

    const empty = computed(() => isMaskEmpty(tokens.value, slots.value));
    /** What the box shows: the pattern while focused or filled, nothing while empty and left. */
    const text = computed(() => (focused.value || !empty.value ? renderMask(tokens.value, slots.value, resolved.value.slotChar) : ''));
    const isNumeric = (list: readonly MaskToken[]) => list.every((token) => !token.test || token.test === defaultMaskDefinitions['9']);
    // A list is numeric only if all of it is, so the keyboard does not change under the thumb as the pattern does.
    const numeric = computed(() => {
        const current = resolved.value.pattern;
        return Array.isArray(current) ? current.every((item: string) => isNumeric(parseMask(item, resolved.value.definitions))) : isNumeric(tokens.value);
    });

    function valueOf(next: MaskSlots): string {
        if (isMaskEmpty(tokens.value, next)) return '';
        return resolved.value.unmask ? unmaskValue(tokens.value, next) : renderMask(tokens.value, next, resolved.value.slotChar);
    }

    /** The text read afresh, in the pattern it belongs in. */
    function read(raw: string | null | undefined): MaskEdit & { pattern?: string } {
        const { pattern: current, definitions, slotChar } = resolved.value;
        const cased = maskCase(raw ?? '', resolved.value.case);
        if (dynamic.value) return parseMaskPattern(current, cased, definitions, slotChar);
        const next = parseMaskText(tokens.value, cased, slotChar);
        return { slots: next, caret: maskCaret(tokens.value, next) };
    }

    /** Reads a value into the slots without reporting it back. */
    function sync(raw: string | null | undefined) {
        const next = read(raw);
        if (next.pattern !== undefined) pattern.value = next.pattern;
        slots.value = next.slots;
    }

    // A value set from outside is read into the slots; our own echo is left alone.
    watch(
        [options.value, resolved],
        ([value], previous) => {
            if (!active.value) return;
            if (value === emitted && previous?.[1] === resolved.value) return;
            sync(value);
        },
        { immediate: true }
    );

    function placeCaret(position: number) {
        nextTick(() => {
            const el = options.input.value;
            if (el && document.activeElement === el) el.setSelectionRange(position, position);
        });
    }

    function apply(edit: MaskEdit & { pattern?: string }, event: Event) {
        const wasComplete = isMaskComplete(tokens.value, slots.value);
        if (edit.pattern !== undefined) pattern.value = edit.pattern;
        slots.value = edit.slots;
        const el = options.input.value;
        if (el) el.value = text.value;
        placeCaret(edit.caret);
        const value = valueOf(edit.slots);
        if (value !== (options.value() ?? '')) {
            emitted = value;
            options.onValue(value, event);
        }
        if (!wasComplete && isMaskComplete(tokens.value, edit.slots)) options.onComplete?.(value, event);
    }

    /**
     * The selection to edit. When the box shows text that is not the mask's —
     * a component put a chosen option's label there — that text is read in
     * first and the typing goes on at its end, since a caret in the label
     * points nowhere in the pattern.
     */
    function selection(): [number, number] {
        const el = options.input.value;
        if (el && el.value !== text.value) {
            sync(el.value);
            el.value = text.value;
            const end = maskCaret(tokens.value, slots.value);
            return [end, end];
        }
        return [el?.selectionStart ?? 0, el?.selectionEnd ?? 0];
    }

    function insert(start: number, end: number, raw: string, event: Event) {
        const typed = maskCase(raw, resolved.value.case);
        const { pattern: current, definitions } = resolved.value;
        apply(dynamic.value ? maskPatternEdit(current, tokens.value, slots.value, start, end, { text: typed }, definitions) : maskInsert(tokens.value, slots.value, start, end, typed), event);
    }

    /** Takes the key when it edits the text, and says so; other keys are left to the component. */
    function onKeydown(event: KeyboardEvent): boolean {
        if (!active.value || !options.editable()) return false;
        const [start, end] = selection();
        if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault();
            const direction = event.key === 'Backspace' ? 'backward' : 'forward';
            const { pattern: current, definitions } = resolved.value;
            apply(dynamic.value ? maskPatternEdit(current, tokens.value, slots.value, start, end, { remove: direction }, definitions) : maskDelete(tokens.value, slots.value, start, end, direction), event);
            return true;
        }
        if (isPrintableKey(event)) {
            event.preventDefault();
            insert(start, end, event.key, event);
            return true;
        }
        return false;
    }

    function onPaste(event: ClipboardEvent) {
        if (!active.value || !options.editable()) return;
        event.preventDefault();
        const [start, end] = selection();
        insert(start, end, event.clipboardData?.getData('text') ?? '', event);
    }

    // Whatever got past keydown: autofill, an input method, a drop.
    function onInput(event: Event) {
        apply(read((event.target as HTMLInputElement).value), event);
    }

    function onFocus() {
        if (!active.value) return;
        focused.value = true;
        if (options.editable()) placeCaret(maskCaret(tokens.value, slots.value));
    }

    function onBlur(event: FocusEvent) {
        if (!active.value) return;
        focused.value = false;
        if (resolved.value.autoClear && !empty.value && !isMaskComplete(tokens.value, slots.value)) apply({ ...read(''), caret: 0 }, event);
    }

    /** The keyboard a phone shows: the digits for a numeric mask, otherwise whatever the component was given. */
    function inputmode(given: unknown): HTMLAttributes['inputmode'] {
        return active.value && numeric.value ? 'numeric' : (given as HTMLAttributes['inputmode']);
    }

    return { active, text, numeric, inputmode, sync, onKeydown, onPaste, onInput, onFocus, onBlur };
}
