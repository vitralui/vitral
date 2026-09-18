<script setup lang="ts">
import { imageStyle } from '@vitral/styles';
import { computed, mergeProps, ref, useAttrs, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useModal } from '../../composables/useModal';
import Icon from '../Icon/Icon.vue';
import type { ImageEmits, ImageProps, ImageSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// An <img>. With `preview`, the image sits in a button that opens a modal
// dialog (named by the image's `alt`) holding the image and a toolbar: rotate,
// zoom, close. The dialog keeps Tab inside, Escape or a press on the veil
// closes it, and focus returns to the button; + and − zoom, and R rotates.
// Zoomed in, the image pans: drag it, or use the arrow keys.

defineOptions({ name: 'VtImage', inheritAttrs: false });

const props = withDefaults(defineProps<ImageProps>(), { unstyled: undefined, alt: '', zoomStep: 0.25, minZoom: 0.5, maxZoom: 3 });
const overlayTarget = useOverlayTarget();
const emit = defineEmits<ImageEmits>();
defineSlots<ImageSlots>();
const attrs = useAttrs();

const { part, locale } = useComponent(imageStyle, props);
const open = ref(false);
const scale = ref(1);
const rotation = ref(0);
const pan = ref({ x: 0, y: 0 });
const maskRef = ref<HTMLElement | null>(null);
const dialogRef = ref<HTMLElement | null>(null);

const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
const imageAttrs = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { class: _c, style: _s, ...rest } = attrs;
    return rest;
});
const previewStyle = computed(() => {
    const style: Record<string, string> = { transform: `translate(${pan.value.x}px, ${pan.value.y}px) rotate(${rotation.value}deg) scale(${scale.value})` };
    if (scale.value > 1) style.cursor = dragFrom.value ? 'grabbing' : 'grab';
    if (dragFrom.value) style.transition = 'none';
    return style;
});
const round = (n: number) => Math.round(n * 100) / 100;

const { onMaskPointerdown, onMaskClick } = useModal({
    panel: dialogRef,
    mask: maskRef,
    dismissableMask: true,
    onClose: () => hide()
});

// ---- panning -------------------------------------------------------------------------

const dragFrom = ref<{ x: number; y: number; id: number } | null>(null);
let dragged = false;

/** Keeps the image from being pushed further than its zoomed overflow. */
function setPan(x: number, y: number, image: HTMLElement | null) {
    const size = image ? Math.max(image.offsetWidth, image.offsetHeight) : 0;
    const limit = size ? (size * (scale.value - 1)) / 2 : Infinity;
    const clamp = (n: number) => Math.max(-limit, Math.min(limit, n));
    pan.value = { x: clamp(x), y: clamp(y) };
}

function onPreviewPointerdown(event: PointerEvent) {
    if (scale.value <= 1 || event.button !== 0) return;
    event.preventDefault();
    dragFrom.value = { x: event.clientX - pan.value.x, y: event.clientY - pan.value.y, id: event.pointerId };
    dragged = false;
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
}

function onPreviewPointermove(event: PointerEvent) {
    if (!dragFrom.value || event.pointerId !== dragFrom.value.id) return;
    dragged = true;
    setPan(event.clientX - dragFrom.value.x, event.clientY - dragFrom.value.y, event.currentTarget as HTMLElement);
}

function onPreviewPointerup(event: PointerEvent) {
    if (dragFrom.value?.id === event.pointerId) dragFrom.value = null;
}

watch(scale, (value) => {
    if (value <= 1) pan.value = { x: 0, y: 0 };
    else setPan(pan.value.x, pan.value.y, dialogRef.value?.querySelector<HTMLElement>('[data-vt-preview]') ?? null);
});

function show() {
    scale.value = 1;
    rotation.value = 0;
    pan.value = { x: 0, y: 0 };
    open.value = true;
    emit('show');
}

function hide() {
    if (!open.value) return;
    open.value = false;
    emit('hide');
}

const zoom = (direction: 1 | -1) => (scale.value = round(Math.min(props.maxZoom, Math.max(props.minZoom, scale.value + direction * props.zoomStep))));
const rotate = (direction: 1 | -1) => (rotation.value += direction * 90);

function onDialogKeydown(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === '+' || event.key === '=') zoom(1);
    else if (event.key === '-') zoom(-1);
    else if (event.key.toLowerCase() === 'r') rotate(event.shiftKey ? -1 : 1);
    else if (scale.value > 1 && event.key.startsWith('Arrow') && !(event.target instanceof HTMLButtonElement)) {
        const step = 40;
        const dx = event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0;
        const dy = event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0;
        setPan(pan.value.x + dx, pan.value.y + dy, dialogRef.value?.querySelector<HTMLElement>('[data-vt-preview]') ?? null);
    } else return;
    event.preventDefault();
}

// A press on the veil around the image closes; one on the image or the toolbar does not.
function onDialogClick(event: MouseEvent) {
    // A pan that ends over the veil is not a press on it.
    if (dragged) {
        dragged = false;
        return;
    }
    if (event.target === event.currentTarget) hide();
}

defineExpose({ show, hide });
</script>

<template>
    <span v-bind="mergeProps(rootAttrs, part('root'))">
        <slot name="image" :error-callback="(e: Event) => emit('error', e)">
            <button v-if="preview" type="button" aria-haspopup="dialog" :aria-label="alt ? `${locale.aria.preview}: ${alt}` : locale.aria.preview" v-bind="part('trigger')" @click="show">
                <img :src="src" alt="" :width="width" :height="height" v-bind="mergeProps(imageAttrs, part('image'))" @error="emit('error', $event)" />
                <span v-bind="part('indicator')" aria-hidden="true">
                    <slot name="indicator"><Icon icon="eye" /></slot>
                </span>
            </button>
            <img v-else :src="src" :alt="alt" :width="width" :height="height" v-bind="mergeProps(imageAttrs, part('image'))" @error="emit('error', $event)" />
        </slot>
        <Teleport :to="overlayTarget">
            <Transition name="vt-fade">
                <div v-if="open" ref="maskRef" v-bind="part('mask')" @pointerdown="onMaskPointerdown" @click="onMaskClick">
                    <div
                        ref="dialogRef"
                        role="dialog"
                        aria-modal="true"
                        :aria-label="alt || locale.aria.preview"
                        tabindex="-1"
                        v-bind="part('dialog')"
                        @keydown="onDialogKeydown"
                        @click="onDialogClick"
                    >
                        <div role="toolbar" :aria-label="alt || locale.aria.preview" v-bind="part('toolbar')">
                            <button type="button" :aria-label="locale.aria.rotateLeft" v-bind="part('action')" @click="rotate(-1)"><Icon icon="rotateLeft" /></button>
                            <button type="button" :aria-label="locale.aria.rotateRight" v-bind="part('action')" @click="rotate(1)"><Icon icon="refresh" /></button>
                            <button type="button" :aria-label="locale.aria.zoomOut" :disabled="scale <= minZoom" v-bind="part('action')" @click="zoom(-1)"><Icon icon="zoomOut" /></button>
                            <button type="button" :aria-label="locale.aria.zoomIn" :disabled="scale >= maxZoom" v-bind="part('action')" @click="zoom(1)"><Icon icon="zoomIn" /></button>
                            <button type="button" :aria-label="locale.aria.close" v-bind="part('action')" @click="hide"><Icon icon="x" /></button>
                        </div>
                        <slot name="preview" :style="previewStyle" :preview-callback="hide">
                            <img
                                :src="previewSrc ?? src"
                                :alt="alt"
                                data-vt-preview
                                draggable="false"
                                v-bind="part('preview')"
                                :style="previewStyle"
                                @pointerdown="onPreviewPointerdown"
                                @pointermove="onPreviewPointermove"
                                @pointerup="onPreviewPointerup"
                                @pointercancel="onPreviewPointerup"
                            />
                        </slot>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </span>
</template>
