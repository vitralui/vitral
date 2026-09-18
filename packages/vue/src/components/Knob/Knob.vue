<script setup lang="ts">
import { arcPath, clamp, KNOB_SWEEP, knobAngle, knobValueAt, sliderKeyValue } from '@vitral/core';
import { knobStyle } from '@vitral/styles';
import { computed, mergeProps, ref } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import type { KnobEmits, KnobProps } from './types';

// A WAI-ARIA slider drawn as a dial. The drawing is the focusable slider: it
// carries the value, its bounds and its text, and takes the slider keys:
// arrows step, Page Up/Down step by ten, Home and End go to the ends. A press
// or drag anywhere on the dial sets the value under the pointer; the geometry
// is core's. Name it with `aria-label` or `aria-labelledby`.

defineOptions({ name: 'VtKnob', inheritAttrs: false });

const props = withDefaults(defineProps<KnobProps>(), {
    unstyled: undefined,
    min: 0,
    max: 100,
    step: 1,
    size: 100,
    strokeWidth: 14,
    showValue: true,
    valueTemplate: '{value}'
});
const model = defineModel<number | null>();
const emit = defineEmits<KnobEmits>();

const { part } = useComponent(knobStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();

const svgRef = ref<SVGSVGElement | null>(null);
const dragging = ref(false);
let startValue: number | null = null;

// The drawing works in a 100×100 box and scales to `size`.
const CENTER = 50;
const radius = computed(() => CENTER - props.strokeWidth / 2);
const scale = computed(() => ({ min: props.min, max: Math.max(props.min, props.max), step: props.step }));
const value = computed(() => clamp(model.value ?? props.min, scale.value.min, scale.value.max));
const valueText = computed(() => props.valueTemplate.replace(/\{value\}/g, String(value.value)));
const interactive = computed(() => !props.readonly && !props.disabled);

const rangePath = computed(() => arcPath(CENTER, CENTER, radius.value, -KNOB_SWEEP / 2, KNOB_SWEEP / 2));
// The value arc grows from the minimum, or from zero when the range spans it.
const origin = computed(() => clamp(0, scale.value.min, scale.value.max));
const valuePath = computed(() => {
    const a = knobAngle(origin.value, scale.value.min, scale.value.max);
    const b = knobAngle(value.value, scale.value.min, scale.value.max);
    return arcPath(CENTER, CENTER, radius.value, Math.min(a, b), Math.max(a, b));
});

function set(next: number): boolean {
    if (next === value.value && model.value !== null && model.value !== undefined) return false;
    model.value = next;
    return true;
}

function onKeydown(event: KeyboardEvent) {
    if (!interactive.value) return;
    const next = sliderKeyValue(event.key, value.value, scale.value);
    if (next === null) return;
    event.preventDefault();
    if (set(next)) emit('change', next);
}

function valueAt(event: PointerEvent): number {
    const rect = svgRef.value!.getBoundingClientRect();
    return knobValueAt(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2), scale.value);
}

function onPointerdown(event: PointerEvent) {
    if (!interactive.value || event.button > 0) return;
    event.preventDefault();
    svgRef.value?.focus();
    startValue = value.value;
    dragging.value = true;
    set(valueAt(event));
    try {
        svgRef.value?.setPointerCapture?.(event.pointerId);
    } catch {
        // A synthetic event has no pointer to capture.
    }
}

function onPointermove(event: PointerEvent) {
    if (dragging.value) set(valueAt(event));
}

function onPointerup() {
    if (!dragging.value) return;
    dragging.value = false;
    if (value.value !== startValue) emit('change', value.value);
}
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root', { readonly, disabled }))">
        <svg
            ref="svgRef"
            viewBox="0 0 100 100"
            :width="size"
            :height="size"
            role="slider"
            :tabindex="disabled ? -1 : 0"
            :aria-valuemin="scale.min"
            :aria-valuemax="scale.max"
            :aria-valuenow="value"
            :aria-valuetext="valueTemplate === '{value}' ? undefined : valueText"
            :aria-readonly="readonly ? 'true' : undefined"
            :aria-disabled="disabled ? 'true' : undefined"
            v-bind="mergeProps(controlAttrs, part('svg'))"
            @keydown="onKeydown"
            @pointerdown="onPointerdown"
            @pointermove="onPointermove"
            @pointerup="onPointerup"
            @pointercancel="onPointerup"
        >
            <path :d="rangePath" :stroke-width="strokeWidth" :style="rangeColor ? { stroke: rangeColor } : undefined" v-bind="part('range')" />
            <path v-if="valuePath" :d="valuePath" :stroke-width="strokeWidth" :style="valueColor ? { stroke: valueColor } : undefined" v-bind="part('value')" />
            <text v-if="showValue" x="50" y="50" aria-hidden="true" :style="textColor ? { fill: textColor } : undefined" v-bind="part('text')">{{ valueText }}</text>
        </svg>
    </div>
</template>
