<script setup lang="ts">
import {
    colorAreaAt,
    colorAreaKeyValue,
    equals,
    formatColor,
    formatMessage,
    getFocusableElements,
    hexToHsb,
    hsbToHex,
    parseColor,
    pointerRatio,
    ratioToValue,
    sliderKeyValue,
    type Hsb
} from '@vitral/core';
import { colorpickerStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, shallowRef, useAttrs, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import type { ColorPickerEmits, ColorPickerProps, ColorPickerValue } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// A swatch button that opens a non-modal dialog (or, inline, a group) holding
// two WAI-ARIA sliders — the saturation/brightness area, which Left/Right and
// Up/Down both move, and the hue strip — and a text box for the hex value.
// Opening moves focus to the area; Escape, a press outside or tabbing past
// either end closes and gives focus back to the swatch. The conversions and
// the area's keys are core's.

defineOptions({ name: 'VtColorPicker', inheritAttrs: false });

const props = withDefaults(defineProps<ColorPickerProps>(), {
    unstyled: undefined,
    format: 'hex',
    defaultColor: 'ff0000',
    showInput: true,
    placement: 'bottom-start',
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const model = defineModel<ColorPickerValue | null>();
const emit = defineEmits<ColorPickerEmits>();

const { part, locale } = useComponent(colorpickerStyle, props);
const attrs = useAttrs();
const id = useId();
const panelId = `${id}-panel`;
const inputId = `${id}-hex`;

const swatchRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const areaRef = ref<HTMLElement | null>(null);
const hueRef = ref<HTMLElement | null>(null);
const open = ref(false);

/** The colour being edited. Held as HSB so the hue survives a trip through grey. */
const hsb = shallowRef<Hsb>(parseColor(model.value, false) ?? hexToHsb(props.defaultColor, false) ?? { h: 0, s: 100, b: 100 });
let emitted: unknown;
watch(
    () => model.value,
    (value) => {
        if (value !== undefined && equals(value, emitted)) return;
        const parsed = parseColor(value, false) ?? hexToHsb(props.defaultColor, false);
        if (parsed) hsb.value = parsed;
    }
);

const hex = computed(() => hsbToHex(hsb.value));
const hexText = ref(hex.value);
watch(hex, (value) => (hexText.value = value));

const pureHue = computed(() => `#${hsbToHex({ h: hsb.value.h, s: 100, b: 100 })}`);
const areaHandle = computed(() => ({ left: `${hsb.value.s}%`, top: `${100 - hsb.value.b}%`, background: `#${hex.value}` }));
const hueHandle = computed(() => ({ left: `${(hsb.value.h / 360) * 100}%`, background: pureHue.value }));
const shown = computed(() => ({ h: Math.round(hsb.value.h), s: Math.round(hsb.value.s), b: Math.round(hsb.value.b) }));
const areaText = computed(() => formatMessage(locale.value.aria.saturationBrightnessValue, { s: shown.value.s, b: shown.value.b }));
const interactive = computed(() => !props.disabled);

// Naming attributes describe the whole picker: the swatch in popup mode, the group inline.
const groupName = computed(() => (attrs['aria-label'] || attrs['aria-labelledby'] ? {} : { 'aria-label': locale.value.aria.color }));
const swatchName = computed(() => (attrs['aria-label'] || attrs['aria-labelledby'] ? {} : { 'aria-label': `${locale.value.aria.color} #${hex.value}` }));

function set(next: Hsb, event?: Event): boolean {
    const current = hsb.value;
    if (next.h === current.h && next.s === current.s && next.b === current.b) return false;
    hsb.value = next;
    const value = formatColor(next, props.format);
    emitted = value;
    model.value = value;
    if (event) emit('change', { originalEvent: event, value });
    return true;
}

// ---- popup ---------------------------------------------------------------------------

useOverlay({
    anchor: swatchRef,
    overlay: computed(() => (props.inline ? null : panelRef.value)),
    placement: () => props.placement,
    onEscape: () => hide(),
    onPointerDownOutside: () => hide(false)
});

function show() {
    if (props.disabled || props.inline || open.value) return;
    open.value = true;
    emit('show');
    nextTick(() => areaRef.value?.focus());
}

function hide(returnFocus = true) {
    if (!open.value) return;
    open.value = false;
    emit('hide');
    if (returnFocus) swatchRef.value?.focus();
}

// The panel is at the end of <body>: Tab past either end closes it and returns to the swatch.
function onPanelKeydown(event: KeyboardEvent) {
    const panel = panelRef.value;
    if (props.inline || event.key !== 'Tab' || !panel) return;
    const items = getFocusableElements(panel);
    const active = document.activeElement;
    if (event.shiftKey ? active === items[0] : active === items[items.length - 1]) {
        event.preventDefault();
        hide();
    }
}

// ---- keys ----------------------------------------------------------------------------

function onAreaKeydown(event: KeyboardEvent) {
    if (!interactive.value) return;
    const next = colorAreaKeyValue(event.key, { ...hsb.value, s: shown.value.s, b: shown.value.b }, event.shiftKey);
    if (!next) return;
    event.preventDefault();
    set(next, event);
}

function onHueKeydown(event: KeyboardEvent) {
    if (!interactive.value) return;
    const h = sliderKeyValue(event.key, shown.value.h, { min: 0, max: 360, step: event.shiftKey ? 10 : 1 });
    if (h === null) return;
    event.preventDefault();
    set({ ...hsb.value, h }, event);
}

function commitHex(event: Event) {
    const parsed = hexToHsb(hexText.value, false);
    if (parsed) set({ ...parsed, h: parsed.s === 0 ? hsb.value.h : parsed.h }, event);
    else hexText.value = hex.value;
}

function onHexKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        event.preventDefault();
        commitHex(event);
    }
}

// ---- pointer -------------------------------------------------------------------------

let dragging: 'area' | 'hue' | null = null;
let startHex = '';

function pointAt(el: HTMLElement, event: PointerEvent) {
    const rect = el.getBoundingClientRect();
    return { x: pointerRatio(event.clientX - rect.left, rect.width), y: pointerRatio(event.clientY - rect.top, rect.height) };
}

function track(event: PointerEvent) {
    if (dragging === 'area' && areaRef.value) {
        const { x, y } = pointAt(areaRef.value, event);
        set(colorAreaAt(x, y, hsb.value.h));
    } else if (dragging === 'hue' && hueRef.value) {
        const { x } = pointAt(hueRef.value, event);
        set({ ...hsb.value, h: Math.round(ratioToValue(x, 0, 360)) });
    }
}

function onPointerdown(kind: 'area' | 'hue', event: PointerEvent) {
    if (!interactive.value || event.button > 0) return;
    event.preventDefault();
    dragging = kind;
    startHex = hex.value;
    const el = event.currentTarget as HTMLElement;
    el.focus();
    try {
        el.setPointerCapture?.(event.pointerId);
    } catch {
        // A synthetic event has no pointer to capture.
    }
    track(event);
}

function onPointerup(event: PointerEvent) {
    if (!dragging) return;
    dragging = null;
    if (hex.value !== startHex) emit('change', { originalEvent: event, value: formatColor(hsb.value, props.format) as ColorPickerValue });
}

defineExpose({ show, hide });
</script>

<template>
    <div v-bind="mergeProps(inline ? { role: 'group', ...groupName, ...attrs } : { class: attrs.class, style: attrs.style }, part('root', { disabled, inline }))">
        <button
            v-if="!inline"
            ref="swatchRef"
            type="button"
            v-bind="mergeProps({ ...attrs, class: undefined, style: undefined }, swatchName, part('swatch'))"
            :style="{ background: `#${hex}` }"
            :disabled="disabled"
            aria-haspopup="dialog"
            :aria-expanded="open ? 'true' : 'false'"
            :aria-controls="open ? panelId : undefined"
            @click="open ? hide() : show()"
        />
        <Teleport :to="overlayTarget" :disabled="inline || appendTo === 'self'">
            <Transition name="vt-overlay">
                <div
                    v-if="inline || open"
                    :id="panelId"
                    ref="panelRef"
                    :role="inline ? undefined : 'dialog'"
                    :aria-label="inline ? undefined : locale.aria.color"
                    v-bind="part('panel', { inline })"
                    @keydown="onPanelKeydown"
                >
                    <div
                        ref="areaRef"
                        role="slider"
                        :tabindex="disabled ? -1 : 0"
                        :aria-label="locale.aria.saturationBrightness"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        :aria-valuenow="shown.s"
                        :aria-valuetext="areaText"
                        :aria-disabled="disabled ? 'true' : undefined"
                        :style="{ backgroundColor: pureHue }"
                        v-bind="part('area')"
                        @keydown="onAreaKeydown"
                        @pointerdown="onPointerdown('area', $event)"
                        @pointermove="track"
                        @pointerup="onPointerup"
                        @pointercancel="onPointerup"
                    >
                        <span v-bind="part('handle')" :style="areaHandle" />
                    </div>
                    <div
                        ref="hueRef"
                        role="slider"
                        :tabindex="disabled ? -1 : 0"
                        :aria-label="locale.aria.hue"
                        aria-valuemin="0"
                        aria-valuemax="360"
                        :aria-valuenow="shown.h"
                        :aria-valuetext="`${shown.h}°`"
                        :aria-disabled="disabled ? 'true' : undefined"
                        v-bind="part('hue')"
                        @keydown="onHueKeydown"
                        @pointerdown="onPointerdown('hue', $event)"
                        @pointermove="track"
                        @pointerup="onPointerup"
                        @pointercancel="onPointerup"
                    >
                        <span v-bind="part('handle')" :style="hueHandle" />
                    </div>
                    <div v-if="showInput" v-bind="part('footer')">
                        <span v-bind="part('preview')" :style="{ background: `#${hex}` }" aria-hidden="true" />
                        <span v-bind="part('field')">
                            <input
                                :id="inputId"
                                v-model="hexText"
                                type="text"
                                maxlength="7"
                                spellcheck="false"
                                autocomplete="off"
                                :disabled="disabled"
                                :aria-label="locale.aria.hex"
                                v-bind="part('input')"
                                @change="commitHex"
                                @keydown="onHexKeydown"
                            />
                        </span>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>
