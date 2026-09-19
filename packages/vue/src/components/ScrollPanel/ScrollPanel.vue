<script setup lang="ts">
import { scrollOffsetAt, scrollThumb } from '@vitral/core';
import { scrollpanelStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, onBeforeUnmount, onMounted, reactive, ref, useAttrs } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { ScrollPanelProps, ScrollPanelSlots } from './types';
import { useDrag } from '../../base/useDrag';

// A scroll container with the theme's own bars. The content keeps native
// scrolling (wheel, touch, and the keyboard, since the content area is a
// focusable region) and only the drawing of the bars is replaced. The drawn
// bars are for the pointer and hidden from assistive technology. Size it with
// `style`; name it with `aria-label` when it holds more than decoration.

defineOptions({ name: 'VtScrollPanel', inheritAttrs: false });

const props = withDefaults(defineProps<ScrollPanelProps>(), { unstyled: undefined });
defineSlots<ScrollPanelSlots>();
const attrs = useAttrs();

const { part } = useComponent(scrollpanelStyle, props);
const contentRef = ref<HTMLElement | null>(null);
const metrics = reactive({ clientHeight: 0, scrollHeight: 0, scrollTop: 0, clientWidth: 0, scrollWidth: 0, scrollLeft: 0 });
const dragging = ref<'x' | 'y' | null>(null);

const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
const contentAttrs = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { class: _c, style: _s, ...rest } = attrs;
    return rest;
});

const y = computed(() => scrollThumb({ viewport: metrics.clientHeight, content: metrics.scrollHeight, offset: metrics.scrollTop }));
const x = computed(() => scrollThumb({ viewport: metrics.clientWidth, content: metrics.scrollWidth, offset: metrics.scrollLeft }));

function measure() {
    const el = contentRef.value;
    if (!el) return;
    metrics.clientHeight = el.clientHeight;
    metrics.scrollHeight = el.scrollHeight;
    metrics.scrollTop = el.scrollTop;
    metrics.clientWidth = el.clientWidth;
    metrics.scrollWidth = el.scrollWidth;
    metrics.scrollLeft = el.scrollLeft;
}

let observer: ResizeObserver | null = null;
let mutations: MutationObserver | null = null;
onMounted(() => {
    measure();
    const el = contentRef.value;
    if (!el) return;
    if (typeof ResizeObserver === 'function') {
        observer = new ResizeObserver(measure);
        observer.observe(el);
    }
    if (typeof MutationObserver === 'function') {
        mutations = new MutationObserver(() => nextTick(measure));
        mutations.observe(el, { childList: true, subtree: true, characterData: true });
    }
});
onBeforeUnmount(() => {
    observer?.disconnect();
    mutations?.disconnect();
});

const drag = useDrag();
let grab = 0;
function onThumbPointerdown(axis: 'x' | 'y', event: PointerEvent) {
    if (event.button > 0) return;
    event.preventDefault();
    dragging.value = axis;
    const thumb = axis === 'y' ? y.value : x.value;
    grab = (axis === 'y' ? event.clientY : event.clientX) - thumb.position;
    // From the document: the thumb moves under the finger as the panel
    // scrolls, and a capture on it is not kept everywhere.
    drag.track(event.pointerId, { move: onThumbPointermove, end: onThumbPointerup });
}

function onThumbPointermove(event: PointerEvent) {
    const el = contentRef.value;
    if (!dragging.value || !el) return;
    if (dragging.value === 'y') el.scrollTop = scrollOffsetAt(event.clientY - grab, y.value.size, { viewport: metrics.clientHeight, content: metrics.scrollHeight });
    else el.scrollLeft = scrollOffsetAt(event.clientX - grab, x.value.size, { viewport: metrics.clientWidth, content: metrics.scrollWidth });
    measure();
}

function onThumbPointerup() {
    dragging.value = null;
    drag.release();
}

// A press on the track pages towards it, as a native bar does.
function onTrackPointerdown(axis: 'x' | 'y', event: PointerEvent) {
    const el = contentRef.value;
    if (!el || event.target !== event.currentTarget) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    if (axis === 'y') {
        const before = event.clientY - rect.top < y.value.position;
        el.scrollTop += (before ? -1 : 1) * metrics.clientHeight;
    } else {
        const before = event.clientX - rect.left < x.value.position;
        el.scrollLeft += (before ? -1 : 1) * metrics.clientWidth;
    }
    measure();
}

/** Scrolls the content to `top`. */
function scrollTop(top: number) {
    if (contentRef.value) contentRef.value.scrollTop = top;
    measure();
}

defineExpose({ scrollTop, refresh: measure, content: contentRef });
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root'))">
        <div ref="contentRef" tabindex="0" v-bind="mergeProps(contentAttrs, part('content'))" @scroll.passive="measure">
            <slot />
        </div>
        <div v-if="y.visible" aria-hidden="true" v-bind="part('bar', { axis: 'y', active: dragging === 'y' })" @pointerdown="onTrackPointerdown('y', $event)">
            <div
                v-bind="part('thumb')"
                :style="{ height: `${y.size}px`, transform: `translateY(${y.position}px)` }"
                @pointerdown="onThumbPointerdown('y', $event)"
            />
        </div>
        <div v-if="x.visible" aria-hidden="true" v-bind="part('bar', { axis: 'x', active: dragging === 'x' })" @pointerdown="onTrackPointerdown('x', $event)">
            <div
                v-bind="part('thumb')"
                :style="{ width: `${x.size}px`, transform: `translateX(${x.position}px)` }"
                @pointerdown="onThumbPointerdown('x', $event)"
            />
        </div>
    </div>
</template>
