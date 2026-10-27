<script setup lang="ts">
import { getFocusableElements, hexToRgb, rgbToHex } from '@vitral/core';
import { colorinputStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useId, watch } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { keepFocus } from '../../base/press';
import { useOverlay } from '../../composables/useOverlay';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import ColorPicker from '../ColorPicker/ColorPicker.vue';
import Icon from '../Icon/Icon.vue';
import type { ColorInputEmits, ColorInputProps } from './types';

// A text box for a colour, the way a form holds one: `'#rrggbb'`, or null for
// none. The swatch at its start shows the colour and is the button that opens
// the picker's panel (a non-modal dialog, as the ColorPicker's own); the hex is
// typed in the box. Six digits take as they are typed, a short `#rgb` when the
// box is left or Enter is pressed, and anything unreadable is put back on blur,
// so a half-typed value never wipes the one there was.

defineOptions({ name: 'VtColorInput', inheritAttrs: false });

const props = withDefaults(defineProps<ColorInputProps>(), {
    unstyled: undefined,
    variant: undefined,
    defaultColor: '#ff0000',
    placement: 'bottom-start',
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const model = defineModel<string | null>();
const emit = defineEmits<ColorInputEmits>();

const { part, config, locale } = useComponent(colorinputStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();
const panelId = `${useId()}-panel`;

const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const swatchRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const open = ref(false);

/** A colour as the field writes it: `#` and lower-case digits, six of them, or eight with an opacity. Null when unreadable. */
function normalise(text: unknown, short = true): string | null {
    if (typeof text !== 'string') return null;
    const digits = text.trim().replace(/^#/, '');
    if (!short && digits.length < 6) return null;
    const rgb = hexToRgb(digits);
    if (!rgb) return null;
    const alpha = props.alpha && digits.length === 8 ? digits.slice(6).toLowerCase() : props.alpha && digits.length === 4 ? digits[3]!.repeat(2).toLowerCase() : '';
    return `#${rgbToHex(rgb)}${alpha === 'ff' ? '' : alpha}`;
}

const value = computed(() => normalise(model.value));
const editable = computed(() => !props.disabled && !props.readonly);

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly,
    fluid: props.fluid,
    focused: open.value
}));

function set(next: string | null) {
    if (next === value.value) return;
    model.value = next;
    if (next === null) emit('clear');
}

// ---- the text box ----------------------------------------------------------

const text = ref(value.value ?? '');
// The value moved from elsewhere (the panel, the form): the box follows, unless it already reads as that value.
watch(value, (next) => {
    if (normalise(text.value) !== next) text.value = next ?? '';
});

function onInput(event: Event) {
    text.value = (event.target as HTMLInputElement).value;
    const typed = text.value.trim();
    if (!typed) return set(null);
    const full = normalise(typed, false);
    if (full) set(full);
}

/** Takes what was typed, short forms included, and puts back what it could not read. */
function commitText() {
    const typed = text.value.trim();
    if (!typed) set(null);
    else {
        const read = normalise(typed);
        if (read) set(read);
    }
    text.value = value.value ?? '';
}

function onBlur(event: FocusEvent) {
    commitText();
    emit('blur', event);
}

function onInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') commitText();
    else if (event.key === 'ArrowDown' && (event.altKey || !open.value)) {
        event.preventDefault();
        show(true);
    }
}

function clear() {
    set(null);
    text.value = '';
    inputRef.value?.focus();
}

// A press on the field's padding focuses the text, as on a native text box; a press on a button keeps its own focus.
function onRootPointerdown(event: PointerEvent) {
    const target = event.target as Element;
    if (target === inputRef.value || target.closest('button')) return;
    keepFocus(event);
    inputRef.value?.focus();
}

// ---- the panel -------------------------------------------------------------

/** The picker holds the digits without `#`. */
const pickerValue = computed({
    get: () => value.value?.slice(1) ?? null,
    set: (next: unknown) => set(normalise(next))
});

useOverlay({
    anchor: rootRef,
    overlay: panelRef,
    placement: () => props.placement,
    onEscape: () => hide(),
    onPointerDownOutside: () => hide(false)
});

/** Opens the panel; with `focusPicker`, focus goes to the picker's area, as from the keyboard. */
function show(focusPicker = false) {
    if (!editable.value || open.value) return;
    open.value = true;
    emit('show');
    if (focusPicker) nextTick(() => panelRef.value?.querySelector<HTMLElement>('[role="slider"]')?.focus());
}

function hide(returnFocus = true) {
    if (!open.value) return;
    open.value = false;
    emit('hide');
    if (returnFocus) inputRef.value?.focus();
}

function onSwatchClick(event: MouseEvent) {
    if (open.value) return hide();
    // A press with the keyboard goes into the panel; one with the pointer leaves focus in the box, to type.
    show(event.detail === 0);
    if (event.detail !== 0) inputRef.value?.focus();
}

// The panel is at the end of <body>: Tab past either end closes it and returns to the box.
function onPanelKeydown(event: KeyboardEvent) {
    const panel = panelRef.value;
    if (event.key !== 'Tab' || !panel) return;
    const items = getFocusableElements(panel);
    const active = document.activeElement;
    if (event.shiftKey ? active === items[0] : active === items[items.length - 1]) {
        event.preventDefault();
        hide();
    }
}

const offered = computed(() => (props.swatches ?? []).map((color) => normalise(color)).filter((color): color is string => !!color));

defineExpose({ show, hide, focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur(), input: inputRef });
</script>

<template>
    <div ref="rootRef" v-bind="mergeProps(rootAttrs, part('root', state))" @pointerdown="onRootPointerdown">
        <button
            ref="swatchRef"
            type="button"
            v-bind="part('swatch')"
            :style="{ '--vt-colorinput-color': value ?? undefined }"
            :disabled="!editable"
            :aria-label="locale.aria.chooseColor"
            aria-haspopup="dialog"
            :aria-expanded="open ? 'true' : 'false'"
            :aria-controls="open ? panelId : undefined"
            @click="onSwatchClick"
        />
        <input
            ref="inputRef"
            type="text"
            autocomplete="off"
            spellcheck="false"
            :maxlength="alpha ? 9 : 7"
            v-bind="mergeProps(controlAttrs, part('input'))"
            :value="text"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :aria-invalid="invalid ? 'true' : undefined"
            @input="onInput"
            @keydown="onInputKeydown"
            @focus="emit('focus', $event)"
            @blur="onBlur"
        />
        <button v-if="clearable" :style="value && editable ? undefined : { visibility: 'hidden' }" type="button" tabindex="-1" :aria-label="locale.clear" v-bind="part('clear')" @click="clear">
            <Icon icon="close" />
        </button>
    </div>
    <Teleport :to="overlayTarget" :disabled="appendTo === 'self'">
        <Transition name="vt-overlay">
            <div v-if="open" :id="panelId" ref="panelRef" role="dialog" :aria-label="locale.aria.color" v-bind="part('panel')" @keydown="onPanelKeydown">
                <ColorPicker v-model="pickerValue" inline :show-input="false" :alpha="alpha" :default-color="defaultColor.replace(/^#/, '')" :aria-label="locale.aria.color" v-bind="part('picker')" />
                <div v-if="offered.length" role="group" :aria-label="locale.aria.swatches" v-bind="part('swatches')">
                    <button
                        v-for="color in offered"
                        :key="color"
                        type="button"
                        v-bind="part('option', { selected: color === value })"
                        :style="{ '--vt-colorinput-color': color }"
                        :aria-label="color"
                        :aria-pressed="color === value ? 'true' : 'false'"
                        @click="set(color)"
                    />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
