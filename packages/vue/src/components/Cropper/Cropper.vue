<script setup lang="ts">
import {
    centredCrop,
    clampCrop,
    cropHandles,
    cropKeyAction,
    cropToBlob,
    drawCrop,
    formatMessage,
    isRtl,
    moveCrop,
    parseAspect,
    resizeCrop,
    turn,
    turnedBounds,
    zoomCrop,
    type CropHandle,
    type CropLimits,
    type CropValue
} from '@vitral/core';
import { cropperStyle } from '@vitral/styles';
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { usePointerDrag } from '../../base/usePointerDrag';
import Button from '../Button/Button.vue';
import Icon from '../Icon/Icon.vue';
import SelectButton from '../SelectButton/SelectButton.vue';
import Slider from '../Slider/Slider.vue';
import type { CropOutputOptions, CropperProps, CropperSlots } from './types';

/**
 * A crop rectangle over an image. The rectangle is the one tab stop: the arrows
 * move it, Shift with an arrow resizes it, Home and End take it to the corners,
 * and each change is announced. The eight handles are for a pointer and are
 * hidden from assistive technology, because nine tab stops to crop a photograph
 * is not an improvement on one.
 *
 * The state is the crop in the image's own pixels plus the turn and the flips —
 * plain data, so it survives JSON and a server can do the cutting. `crop()`
 * does it here instead, on a canvas, when the file is what you want.
 */

defineOptions({ name: 'VtCropper' });

const props = withDefaults(defineProps<CropperProps>(), {
    unstyled: undefined,
    shape: 'rect',
    handles: undefined,
    zoomable: true,
    height: '20rem',
    previewSize: 0
});
const emit = defineEmits<{ load: [event: { width: number; height: number }]; change: [value: CropValue] }>();
defineSlots<CropperSlots>();

const value = defineModel<CropValue>({ default: () => ({ x: 0, y: 0, width: 0, height: 0, rotate: 0, flipX: false, flipY: false }) });

const { part, locale } = useComponent(cropperStyle, props);
const id = useId();
const stageRef = ref<HTMLElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const areaRef = ref<HTMLElement | null>(null);

const natural = ref({ width: 0, height: 0 });
const stage = ref({ width: 0, height: 0 });
const chosenAspect = ref<number | string | null>(null);
const ready = computed(() => natural.value.width > 0 && stage.value.width > 0);

// A circle is a square with its corners rounded off; anything else is what the
// application asked for, or what the toolbar was last set to.
const aspect = computed(() => (props.shape === 'circle' ? 1 : parseAspect(chosenAspect.value ?? props.aspect)));
const showHandles = computed(() => props.handles ?? props.shape !== 'circle');

/** The image as the crop sees it: a quarter turn swaps its sides. */
const bounds = computed(() => turnedBounds(natural.value.width, natural.value.height, value.value.rotate));
const limits = computed<CropLimits>(() => ({ bounds: bounds.value, minWidth: props.minWidth, minHeight: props.minHeight, aspect: aspect.value }));

/**
 * Where the turned image is drawn on the stage, and by how much it is scaled to
 * get there. Everything else — the crop's box, a pointer's movement — is this
 * one number applied in one direction or the other.
 */
const view = computed(() => {
    const box = bounds.value;
    if (!ready.value) return { x: 0, y: 0, width: 0, height: 0, scale: 1 };
    const scale = Math.min(stage.value.width / box.width, stage.value.height / box.height);
    const width = box.width * scale;
    const height = box.height * scale;
    return { x: (stage.value.width - width) / 2, y: (stage.value.height - height) / 2, width, height, scale };
});

const areaStyle = computed(() => ({
    left: `${view.value.x + value.value.x * view.value.scale}px`,
    top: `${view.value.y + value.value.y * view.value.scale}px`,
    width: `${value.value.width * view.value.scale}px`,
    height: `${value.value.height * view.value.scale}px`
}));

/** The image itself, drawn at the view's scale and turned about its own centre. */
const imageStyle = computed(() => {
    const { scale } = view.value;
    const width = natural.value.width * scale;
    const height = natural.value.height * scale;
    const flip = `scale(${value.value.flipX ? -1 : 1}, ${value.value.flipY ? -1 : 1})`;
    return {
        position: 'absolute' as const,
        left: `${stage.value.width / 2}px`,
        top: `${stage.value.height / 2}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(-50%, -50%) rotate(${value.value.rotate}deg) ${flip}`
    };
});

/** The preview shows the crop alone, scaled to the box it is given. */
const previewStyle = computed(() => {
    const size = props.previewSize;
    if (!size || !ready.value || !value.value.width) return undefined;
    const scale = size / value.value.width;
    const width = natural.value.width * scale;
    const height = natural.value.height * scale;
    const turned = turnedBounds(width, height, value.value.rotate);
    const flip = `scale(${value.value.flipX ? -1 : 1}, ${value.value.flipY ? -1 : 1})`;
    return {
        position: 'absolute' as const,
        left: `${turned.width / 2 - value.value.x * scale}px`,
        top: `${turned.height / 2 - value.value.y * scale}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(-50%, -50%) rotate(${value.value.rotate}deg) ${flip}`
    };
});

const previewBox = computed(() => {
    const size = props.previewSize;
    if (!size || !value.value.width) return undefined;
    return { position: 'relative' as const, width: `${size}px`, height: `${Math.round((size * value.value.height) / value.value.width)}px` };
});

// ---- keeping the crop legal -----------------------------------------------

function set(rect: { x: number; y: number; width: number; height: number }) {
    value.value = { ...value.value, ...rect };
}

/** A crop of its own when there is none, and a legal one whenever the rules change. */
function settle() {
    if (!ready.value) return;
    const current = value.value;
    if (!current.width || !current.height) set(centredCrop(limits.value));
    else set(clampCrop(current, limits.value));
}

// The sources are the numbers, not the objects they arrive in: `bounds` is a
// computed that builds a fresh object each time, and `settle` writes the value
// that computed reads, so watching it by identity is a loop that never settles.
watch([aspect, () => bounds.value.width, () => bounds.value.height, () => props.minWidth, () => props.minHeight], settle);

function onLoad() {
    const image = imageRef.value;
    if (!image) return;
    natural.value = { width: image.naturalWidth, height: image.naturalHeight };
    measure();
    emit('load', { ...natural.value });
    settle();
}

/**
 * The stage's box. The observer keeps it current, but it is read directly too:
 * an observer does not report until after the first paint, and in a renderer
 * without one this is the only measurement there is.
 */
function measure() {
    const box = stageRef.value?.getBoundingClientRect();
    if (box?.width && box.height) stage.value = { width: box.width, height: box.height };
}

let observer: ResizeObserver | null = null;
onMounted(() => {
    if (typeof ResizeObserver === 'function' && stageRef.value) {
        observer = new ResizeObserver(([entry]) => {
            const box = entry?.contentRect;
            if (box?.width && box.height) stage.value = { width: box.width, height: box.height };
        });
        observer.observe(stageRef.value);
    }
    measure();
    if (imageRef.value?.complete && imageRef.value.naturalWidth) onLoad();
});
onBeforeUnmount(() => observer?.disconnect());
watch(() => props.src, () => (natural.value = { width: 0, height: 0 }));

// ---- the pointer ------------------------------------------------------------

type Grab = { handle: CropHandle | null; start: { x: number; y: number; width: number; height: number } };

const drag = usePointerDrag<Grab>({
    threshold: 2,
    onStart: () => !props.disabled,
    onMove: (grab, info) => {
        const scale = view.value.scale || 1;
        const dx = info.dx / scale;
        const dy = info.dy / scale;
        set(grab.handle ? resizeCrop(grab.start, grab.handle, dx, dy, limits.value) : moveCrop(grab.start, dx, dy, limits.value));
    },
    onEnd: () => emit('change', { ...value.value }),
    onCancel: (grab) => grab && set(grab.start)
});

function press(event: PointerEvent, handle: CropHandle | null) {
    if (props.disabled) return;
    event.preventDefault();
    drag.press(event, { handle, start: { ...value.value } });
}

// ---- the keyboard -----------------------------------------------------------

const announcement = ref('');

function announce() {
    const { x, y, width, height } = value.value;
    announcement.value = formatMessage(locale.value.aria.cropPosition, {
        width: Math.round(width),
        height: Math.round(height),
        x: Math.round(x),
        y: Math.round(y)
    });
}

function onKeydown(event: KeyboardEvent) {
    if (props.disabled) return;
    // A step of one image pixel is imperceptible on a large photograph, so the
    // arrows move by a hundredth of the image and Shift by a tenth.
    const step = Math.max(1, Math.round(bounds.value.width / 100));
    const next = cropKeyAction(event.key, value.value, limits.value, {
        step,
        large: event.shiftKey && !event.altKey,
        resize: event.shiftKey,
        rtl: isRtl(areaRef.value)
    });
    if (!next) return;
    event.preventDefault();
    set(next);
    announce();
    emit('change', { ...value.value });
}

// ---- the toolbar ------------------------------------------------------------

const zoom = computed({
    // The slider reads as a zoom: all the way up is the closest crop.
    get: () => {
        if (!ready.value || !value.value.width) return 0;
        const widest = clampCrop({ ...value.value, width: bounds.value.width, height: bounds.value.height }, limits.value);
        const range = widest.width - Math.max(1, props.minWidth ?? 1);
        return range <= 0 ? 0 : Math.round(((widest.width - value.value.width) / range) * 100);
    },
    set: (percent) => {
        const widest = clampCrop({ ...value.value, width: bounds.value.width, height: bounds.value.height }, limits.value);
        const min = Math.max(1, props.minWidth ?? Math.max(16, bounds.value.width * 0.05));
        const width = widest.width - ((widest.width - min) * percent) / 100;
        set(zoomCrop(value.value, width / (value.value.width || width), limits.value));
    }
});

function rotate(direction: 1 | -1) {
    const rotation = turn(value.value.rotate, direction);
    // The crop is in the turned image's pixels, so it turns with the image or it
    // would point at a different part of the picture than it did a moment ago.
    const box = bounds.value;
    const rect = value.value;
    const turnedRect =
        direction === 1
            ? { x: box.height - rect.y - rect.height, y: rect.x, width: rect.height, height: rect.width }
            : { x: rect.y, y: box.width - rect.x - rect.width, width: rect.height, height: rect.width };
    // One write, clamped against the bounds it is about to have. Turning and
    // then settling would be two, and the second would read the model back
    // before the parent had taken the first, putting the turn back to where it
    // started.
    const next = clampCrop(turnedRect, { ...limits.value, bounds: turnedBounds(natural.value.width, natural.value.height, rotation) });
    value.value = { ...value.value, ...next, rotate: rotation };
    emit('change', { ...value.value, ...next, rotate: rotation });
}

function flip(axis: 'x' | 'y') {
    const box = bounds.value;
    const rect = value.value;
    value.value =
        axis === 'x'
            ? { ...rect, x: box.width - rect.x - rect.width, flipX: !rect.flipX }
            : { ...rect, y: box.height - rect.y - rect.height, flipY: !rect.flipY };
    emit('change', { ...value.value });
}

function reset() {
    value.value = { ...centredCrop(limits.value), rotate: 0, flipX: false, flipY: false };
    emit('change', { ...value.value });
}

// ---- the output -------------------------------------------------------------

/** The crop drawn on a canvas, at its own size or at the one you ask for. */
function crop(options: CropOutputOptions = {}): HTMLCanvasElement | null {
    const image = imageRef.value;
    if (!image || !natural.value.width) return null;
    return drawCrop(image, natural.value, value.value, options);
}

/** The crop as a file, for an upload. */
async function toBlob(type = 'image/png', options: CropOutputOptions & { quality?: number } = {}): Promise<Blob | null> {
    const canvas = crop(options);
    return canvas ? cropToBlob(canvas, type, options.quality) : null;
}

defineExpose({ crop, toBlob, reset });

const state = computed(() => ({ shape: props.shape, dragging: drag.active.value, disabled: props.disabled }));
</script>

<template>
    <div v-bind="part('root', state)">
        <div ref="stageRef" v-bind="part('stage')" :style="{ height: typeof height === 'number' ? `${height}px` : height }">
            <img v-if="src" ref="imageRef" :src="src" :alt="alt ?? ''" v-bind="part('image')" :style="imageStyle" @load="onLoad" />

            <div
                v-if="ready"
                :id="`${id}-area`"
                ref="areaRef"
                role="group"
                :tabindex="disabled ? -1 : 0"
                :aria-label="locale.aria.crop"
                :aria-describedby="`${id}-help`"
                :aria-disabled="disabled || undefined"
                v-bind="part('area')"
                :style="areaStyle"
                @pointerdown="press($event, null)"
                @keydown="onKeydown"
                @focus="announce"
            >
                <span v-bind="part('grid')" />
                <span
                    v-for="handle in showHandles ? cropHandles : []"
                    :key="handle"
                    aria-hidden="true"
                    v-bind="part('handle', { handle })"
                    @pointerdown.stop="press($event, handle)"
                />
            </div>
        </div>

        <p :id="`${id}-help`" class="vt-sr-only">{{ locale.aria.cropInstructions }}</p>
        <p class="vt-sr-only" role="status" aria-live="polite">{{ announcement }}</p>

        <div v-if="$slots.toolbar || zoomable || rotatable || aspects?.length || previewSize" v-bind="part('toolbar')">
            <slot name="toolbar" :value="value" :reset="reset">
                <SelectButton
                    v-if="aspects?.length"
                    :model-value="chosenAspect ?? aspect ?? 'free'"
                    :options="aspects as { label: string; value: number | string | null }[]"
                    option-label="label"
                    option-value="value"
                    size="small"
                    :allow-empty="false"
                    :disabled="disabled"
                    @update:model-value="chosenAspect = $event as number | string | null"
                />
                <template v-if="rotatable">
                    <Button icon="rotateLeft" variant="text" severity="secondary" size="small" :aria-label="locale.aria.rotateLeft" :disabled="disabled" @click="rotate(-1)" />
                    <Button icon="rotateRight" variant="text" severity="secondary" size="small" :aria-label="locale.aria.rotateRight" :disabled="disabled" @click="rotate(1)" />
                    <Button icon="arrowLeftRight" variant="text" severity="secondary" size="small" :aria-label="locale.aria.flipHorizontal" :disabled="disabled" @click="flip('x')" />
                    <Button icon="arrowUpDown" variant="text" severity="secondary" size="small" :aria-label="locale.aria.flipVertical" :disabled="disabled" @click="flip('y')" />
                </template>
                <div v-if="zoomable" v-bind="part('zoom')">
                    <Slider v-model="zoom" :min="0" :max="100" :disabled="disabled || !ready" :aria-label="locale.aria.zoomIn" />
                </div>
                <div v-if="previewSize" v-bind="part('preview')" :style="previewBox">
                    <img v-if="src && ready" :src="src" alt="" :style="previewStyle" />
                </div>
                <slot name="preview" :value="value" />
            </slot>
        </div>
    </div>
</template>
