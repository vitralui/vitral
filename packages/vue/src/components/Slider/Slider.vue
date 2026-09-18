<script setup lang="ts">
import { clamp, nearestThumb, normalizeRange, pointerRatio, ratioToValue, setRangeThumb, sliderKeyValue, snapToStep, thumbBounds, valueToRatio, type SliderRangeValue } from '@vitral/core';
import { sliderStyle } from '@vitral/styles';
import { computed, mergeProps, ref, useId, type ComponentPublicInstance } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import type { SliderEmits, SliderProps, SliderValue } from './types';

// The WAI-ARIA slider (and multi-thumb slider): each thumb is a focusable
// role="slider" carrying its value and the range it may move in — for a range,
// up to the other thumb. The arithmetic lives in @vitral/core; this file only
// maps keys and pointer positions onto it.

defineOptions({ name: 'VtSlider', inheritAttrs: false });

const props = withDefaults(defineProps<SliderProps>(), { unstyled: undefined, min: 0, max: 100, step: 1, orientation: 'horizontal' });
const model = defineModel<SliderValue | null>();
const emit = defineEmits<SliderEmits>();

const { part, locale } = useComponent(sliderStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();
const id = useId();

const rootRef = ref<HTMLElement | null>(null);
const trackRef = ref<HTMLElement | null>(null);
const thumbEls: (HTMLElement | null)[] = [];
const activeThumb = ref<0 | 1 | null>(null);
const dragging = ref(false);
let dragOffset = 0;
let valueAtStart: SliderValue | null | undefined = null;

const scale = computed(() => ({ min: props.min, max: Math.max(props.min, props.max), step: props.step }));
const vertical = computed(() => props.orientation === 'vertical');
const thumbs = computed<(0 | 1)[]>(() => (props.range ? [0, 1] : [0]));

/** Both thumbs' values, in order and on the scale; a single slider repeats its one value. */
const values = computed<SliderRangeValue>(() => {
    const { min, max } = scale.value;
    if (props.range) return normalizeRange(Array.isArray(model.value) ? model.value : null, scale.value);
    const value = typeof model.value === 'number' ? clamp(model.value, min, max) : min;
    return [value, value];
});

const percent = (value: number) => valueToRatio(value, scale.value.min, scale.value.max) * 100;

const rangeStyle = computed(() => {
    const start = props.range ? percent(values.value[0]) : 0;
    const end = percent(values.value[props.range ? 1 : 0]);
    return vertical.value ? { bottom: `${start}%`, height: `${end - start}%` } : { left: `${start}%`, width: `${end - start}%` };
});

const thumbStyle = (index: 0 | 1) => (vertical.value ? { bottom: `${percent(values.value[index])}%` } : { left: `${percent(values.value[index])}%` });

const state = computed(() => ({ orientation: props.orientation, range: props.range, disabled: props.disabled, dragging: dragging.value }));

// ---- names ----------------------------------------------------------------

const perThumbNames = computed(() => Array.isArray(props.ariaLabel) || Array.isArray(props.ariaLabelledby));
/** One name for a whole range is joined with "minimum"/"maximum" through hidden text, so the thumbs differ. */
const sharedRangeName = computed(() => props.range && !perThumbNames.value);
const labelId = `${id}-label`;
const thumbNameId = (index: 0 | 1) => `${id}-thumb-${index}`;

function names(index: 0 | 1): Record<string, string | undefined> {
    const labelledby = Array.isArray(props.ariaLabelledby) ? props.ariaLabelledby[index] : props.ariaLabelledby;
    const label = Array.isArray(props.ariaLabel) ? props.ariaLabel[index] : props.ariaLabel;
    if (!sharedRangeName.value) return { 'aria-labelledby': labelledby, 'aria-label': labelledby ? undefined : label };
    if (labelledby) return { 'aria-labelledby': `${labelledby} ${thumbNameId(index)}` };
    if (label) return { 'aria-labelledby': `${labelId} ${thumbNameId(index)}` };
    return { 'aria-labelledby': thumbNameId(index) };
}

function boundsOf(index: 0 | 1): [number, number] {
    return props.range ? thumbBounds(values.value, index, scale.value) : [scale.value.min, scale.value.max];
}

function thumbAria(index: 0 | 1) {
    const [lo, hi] = boundsOf(index);
    const value = values.value[index];
    return {
        role: 'slider',
        tabindex: props.disabled ? undefined : 0,
        'aria-valuemin': lo,
        'aria-valuemax': hi,
        'aria-valuenow': value,
        'aria-valuetext': props.formatValue?.(value),
        'aria-orientation': props.orientation,
        'aria-disabled': props.disabled ? 'true' : undefined,
        ...names(index)
    };
}

// Attributes a user puts on <Slider> describe the control, so they go to the
// thumb; a range has two, so its `id` stays on the root where it is unique.
const thumbAttrs = computed(() => {
    if (!props.range) return controlAttrs.value;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = controlAttrs.value;
    return rest;
});
const rootId = computed(() => (props.range && controlAttrs.value.id ? { id: controlAttrs.value.id } : {}));

function setThumbRef(el: Element | ComponentPublicInstance | null, index: 0 | 1) {
    thumbEls[index] = el as HTMLElement | null;
}

// ---- value ----------------------------------------------------------------

const sameValue = (a: SliderValue | null | undefined, b: SliderValue | null | undefined) =>
    Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((v, i) => v === b[i]) : a === b;

/** Moves one thumb towards `raw`, snapped and bounded; true when the value changed. */
function setValue(index: 0 | 1, raw: number): boolean {
    const next: SliderValue = props.range ? setRangeThumb(values.value, index, raw, scale.value) : snapToStep(raw, scale.value);
    if (sameValue(next, model.value)) return false;
    model.value = next;
    return true;
}

function onKeydown(index: 0 | 1, event: KeyboardEvent) {
    if (props.disabled) return;
    const next = sliderKeyValue(event.key, values.value[index], scale.value, boundsOf(index));
    if (next === null) return;
    event.preventDefault();
    if (setValue(index, next)) emit('change', model.value as SliderValue);
}

// ---- pointer --------------------------------------------------------------

function valueAt(event: PointerEvent): number {
    const rect = trackRef.value!.getBoundingClientRect();
    const offset = vertical.value ? event.clientY - rect.top : event.clientX - rect.left;
    const ratio = pointerRatio(offset, vertical.value ? rect.height : rect.width, vertical.value);
    return ratioToValue(ratio, scale.value.min, scale.value.max);
}

// A press on the track jumps the nearer thumb there; a press on a thumb grabs
// it where it was pressed, so it does not jump by the pointer's offset.
function onPointerdown(event: PointerEvent) {
    if (props.disabled || event.button > 0 || !trackRef.value) return;
    event.preventDefault();
    const pointed = valueAt(event);
    const thumb = (event.target as Element).closest<HTMLElement>('[role="slider"]');
    const grabbed = thumb && rootRef.value?.contains(thumb) ? (Number(thumb.dataset.index) as 0 | 1) : null;
    const index = grabbed ?? (props.range ? nearestThumb(values.value, pointed) : 0);
    valueAtStart = Array.isArray(model.value) ? [...model.value] : model.value;
    dragOffset = grabbed === null ? 0 : pointed - values.value[index];
    if (grabbed === null) setValue(index, pointed);
    activeThumb.value = index;
    dragging.value = true;
    thumbEls[index]?.focus({ preventScroll: true });
    try {
        rootRef.value?.setPointerCapture?.(event.pointerId);
    } catch {
        // No active pointer with that id (a synthetic event); moves still arrive while over the slider.
    }
}

function onPointermove(event: PointerEvent) {
    if (!dragging.value || activeThumb.value === null) return;
    setValue(activeThumb.value, valueAt(event) - dragOffset);
}

function onPointerup(event: PointerEvent) {
    if (!dragging.value) return;
    dragging.value = false;
    activeThumb.value = null;
    try {
        if (rootRef.value?.hasPointerCapture?.(event.pointerId)) rootRef.value.releasePointerCapture(event.pointerId);
    } catch {
        // Already released.
    }
    const value = model.value as SliderValue;
    if (!sameValue(value, valueAtStart)) emit('change', value);
    emit('slideend', { originalEvent: event, value });
}

defineExpose({ focus: (index: 0 | 1 = 0) => thumbEls[index]?.focus() });
</script>

<template>
    <div
        ref="rootRef"
        v-bind="mergeProps(rootAttrs, rootId, part('root', state))"
        @pointerdown="onPointerdown"
        @pointermove="onPointermove"
        @pointerup="onPointerup"
        @pointercancel="onPointerup"
        @lostpointercapture="onPointerup"
    >
        <div ref="trackRef" v-bind="part('track')">
            <div v-bind="part('range')" :style="rangeStyle" />
            <span
                v-for="index in thumbs"
                :key="index"
                :ref="(el) => setThumbRef(el, index)"
                :data-index="index"
                v-bind="mergeProps(thumbAttrs, thumbAria(index), part('thumb', { index, active: activeThumb === index }))"
                :style="thumbStyle(index)"
                @keydown="onKeydown(index, $event)"
            />
        </div>
        <template v-if="sharedRangeName">
            <span v-if="typeof ariaLabel === 'string' && !ariaLabelledby" :id="labelId" hidden v-bind="part('label')">{{ ariaLabel }}</span>
            <span :id="thumbNameId(0)" hidden v-bind="part('label')">{{ locale.aria.minimum }}</span>
            <span :id="thumbNameId(1)" hidden v-bind="part('label')">{{ locale.aria.maximum }}</span>
        </template>
    </div>
</template>
