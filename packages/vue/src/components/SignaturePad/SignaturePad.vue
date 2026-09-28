<script setup lang="ts">
import {
    addSignaturePoint,
    createSignaturePressure,
    signatureInkVaries,
    signatureOutline,
    signatureStrokePath,
    signatureSVG,
    smoothSignatureStroke,
    type SignatureInk,
    type SignaturePoint
} from '@vitral/core';
import { signaturepadStyle } from '@vitral/styles';
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import Button from '../Button/Button.vue';
import type { SignaturePadEmits, SignaturePadProps, SignaturePadStroke } from './types';

// The signature is drawn as SVG paths, so it stays sharp at any size and is
// saved as the lines it is. `v-model` holds it as an SVG data URL, ready for
// an <img> or a form; `v-model:strokes` holds the points, to draw it again.

defineOptions({ name: 'VtSignaturePad' });

const props = withDefaults(defineProps<SignaturePadProps>(), { unstyled: undefined, placeholder: undefined, showControls: true, thinning: 0.5, smoothing: 0.5, pressure: true, minDistance: 1.5 });
const model = defineModel<string | null>({ default: null });
const strokes = defineModel<SignaturePadStroke[]>('strokes', { default: () => [] });
const emit = defineEmits<SignaturePadEmits>();

const { part, locale } = useComponent(signaturepadStyle, props);
const id = useId();

const svgRef = ref<SVGSVGElement | null>(null);
/** The pad's own units: its size when it first appeared, which later sizes scale. */
const box = ref({ width: 600, height: 200 });
const drawing = ref<SignaturePoint[] | null>(null);
const empty = computed(() => !strokes.value.length && !drawing.value);
const active = computed(() => !props.disabled && !props.readonly);

/** The theme's width, read once the pad is in the page. */
const themeWidth = ref(2.5);

onMounted(() => {
    const rect = svgRef.value?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) box.value = { width: Math.round(rect.width), height: Math.round(rect.height) };
    if (svgRef.value) themeWidth.value = Number(getComputedStyle(svgRef.value).getPropertyValue('--vt-signaturepad-pen-width')) || 2.5;
});

const ink = computed<SignatureInk>(() => ({ width: props.penWidth ?? themeWidth.value, thinning: props.thinning, smoothing: props.smoothing, taper: props.taper }));
const varies = computed(() => signatureInkVaries(ink.value));
const pressure = createSignaturePressure();

function pointOf(event: PointerEvent): SignaturePoint {
    const rect = svgRef.value!.getBoundingClientRect();
    const sx = rect.width ? box.value.width / rect.width : 1;
    const sy = rect.height ? box.value.height / rect.height : 1;
    const x = (event.clientX - rect.left) * sx;
    const y = (event.clientY - rect.top) * sy;
    const pen = props.pressure && event.pointerType === 'pen' ? event.pressure : undefined;
    return [x, y, pressure.at(x, y, event.timeStamp, pen)];
}

function onDown(event: PointerEvent) {
    if (!active.value || event.button > 0) return;
    event.preventDefault();
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    pressure.start();
    drawing.value = [pointOf(event)];
    emit('begin');
}

function onMove(event: PointerEvent) {
    if (!drawing.value) return;
    const next = [...drawing.value];
    // Samples the browser coalesced between two events keep a fast stroke smooth.
    const samples = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [];
    for (const sample of samples.length ? samples : [event]) addSignaturePoint(next, pointOf(sample), props.minDistance);
    drawing.value = next;
}

function onUp() {
    if (!drawing.value) return;
    strokes.value = [...strokes.value, drawing.value];
    drawing.value = null;
    publish();
    emit('end');
}

const inkColor = () => (svgRef.value ? getComputedStyle(svgRef.value).getPropertyValue('--vt-signaturepad-pen-color').trim() : '') || '#000';

/** The signature as a standalone SVG, in the pad's units, drawn with the same ink as on screen. */
function toSVG(): string {
    const { width, ...rest } = ink.value;
    return signatureSVG(strokes.value, { ...box.value, color: props.penColor ?? inkColor(), strokeWidth: width, ink: rest });
}

function publish() {
    model.value = strokes.value.length ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(toSVG())}` : null;
}

/** The signature drawn onto a canvas, as a PNG. */
function toPNG(scale = 2): Promise<Blob | null> {
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = box.value.width * scale;
            canvas.height = box.value.height * scale;
            canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => resolve(blob), 'image/png');
        };
        image.onerror = () => resolve(null);
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(toSVG())}`;
    });
}

function undo() {
    if (!strokes.value.length) return;
    strokes.value = strokes.value.slice(0, -1);
    publish();
}

function clear() {
    strokes.value = [];
    drawing.value = null;
    publish();
}

// The stored SVG is drawn with the ink on show: change the ink, and it follows.
watch(ink, () => strokes.value.length && publish(), { deep: true });

// Emptied from outside — a form reset — the ink goes too.
watch(model, (value) => {
    if (!value && strokes.value.length) strokes.value = [];
});

const cancel = () => (drawing.value = null);
onBeforeUnmount(cancel);

const paths = computed(() =>
    [...strokes.value, ...(drawing.value ? [drawing.value] : [])].map((s) =>
        varies.value ? signatureOutline(s, ink.value) : signatureStrokePath(smoothSignatureStroke(s, ink.value.smoothing ?? 0))
    )
);
const inkStyle = computed(() => (varies.value ? { fill: props.penColor } : { stroke: props.penColor, strokeWidth: props.penWidth }));

defineExpose({ clear, undo, toSVG, toPNG, isEmpty: () => !strokes.value.length });
</script>

<template>
    <div v-bind="part('root', { disabled, readonly, empty })" role="group" :aria-label="locale.aria.signature" :aria-describedby="`${id}-help`">
        <svg
            ref="svgRef"
            :viewBox="`0 0 ${box.width} ${box.height}`"
            preserveAspectRatio="none"
            role="img"
            :aria-label="empty ? locale.aria.signHere : locale.aria.signature"
            v-bind="part('canvas')"
            :style="height ? { height } : undefined"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="cancel"
            @lostpointercapture="onUp"
        >
            <path v-for="(d, i) in paths" :key="i" :d="d" v-bind="part('ink', { filled: varies })" :style="inkStyle" />
        </svg>
        <span aria-hidden="true" v-bind="part('line')" />
        <span v-if="empty && placeholder !== false" aria-hidden="true" v-bind="part('placeholder')">{{ placeholder ?? locale.aria.signHere }}</span>
        <span :id="`${id}-help`" class="vt-sr-only">{{ locale.aria.signatureInstructions }}</span>
        <div v-if="showControls && active && !empty" v-bind="part('controls')">
            <Button icon="rotateLeft" size="small" variant="text" severity="secondary" rounded :aria-label="locale.aria.undoStroke" @click="undo" />
            <Button icon="trash" size="small" variant="text" severity="secondary" rounded :aria-label="locale.aria.clearSignature" @click="clear" />
        </div>
    </div>
</template>
