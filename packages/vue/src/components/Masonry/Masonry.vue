<script setup lang="ts">
import { masonryLayout } from '@vitral/core';
import { masonryStyle } from '@vitral/styles';
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { MasonryProps, MasonrySlots } from './types';

// Each item goes into the shortest column so far. The items stay in the
// order they were given — which is what a keyboard and a screen reader
// follow — and are only moved on screen.

defineOptions({ name: 'VtMasonry' });

const props = withDefaults(defineProps<MasonryProps>(), { unstyled: undefined });
defineSlots<MasonrySlots>();

const { part } = useComponent(masonryStyle, props);

const rootRef = ref<HTMLElement | null>(null);
const laid = ref(false);
const height = ref<number | null>(null);

/** A CSS length in pixels: px, rem and em read directly, anything else measured. */
const px = (value: string, el: HTMLElement) => {
    const m = /^(-?[\d.]+)(px|rem|em)?$/.exec(value.trim());
    if (m) {
        const n = parseFloat(m[1]!);
        if (!m[2] || m[2] === 'px') return n;
        const base = parseFloat(getComputedStyle(m[2] === 'rem' ? document.documentElement : el).fontSize) || 16;
        return n * base;
    }
    const probe = document.createElement('div');
    probe.style.cssText = `position:absolute;visibility:hidden;width:${value}`;
    el.appendChild(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
};

let frame = 0;
function layout() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
        const root = rootRef.value;
        if (!root) return;
        const items = Array.from(root.children) as HTMLElement[];
        const style = getComputedStyle(root);
        const gap = px(props.gap ?? style.getPropertyValue('--vt-masonry-gap').trim() ?? '1rem', root) || 0;
        const min = px(props.minColumnWidth ?? style.getPropertyValue('--vt-masonry-min-column-width').trim() ?? '15rem', root) || 240;
        const width = root.clientWidth;
        // Not laid out yet (hidden, or not in the page): keep the CSS columns.
        if (width <= 0) return;
        const plan = masonryLayout([], { width, gap, columns: props.columns, minColumnWidth: min });
        // Widths first: an item's height depends on how wide its column is.
        for (const item of items) item.style.width = `${plan.columnWidth}px`;
        laid.value = true;
        nextTick(() => {
            const heights = items.map((item) => item.getBoundingClientRect().height);
            const result = masonryLayout(heights, { width, gap, columns: props.columns, minColumnWidth: min });
            items.forEach((item, i) => (item.style.translate = `${result.positions[i]!.x}px ${result.positions[i]!.y}px`));
            height.value = result.height;
        });
    });
}

let observer: ResizeObserver | null = null;
function observe() {
    if (!observer || !rootRef.value) return;
    observer.disconnect();
    observer.observe(rootRef.value);
    for (const child of Array.from(rootRef.value.children)) observer.observe(child);
}

onMounted(() => {
    if (typeof ResizeObserver !== 'undefined') observer = new ResizeObserver(() => layout());
    observe();
    layout();
});
// Items added or removed are measured and placed again.
onUpdated(() => {
    observe();
    layout();
});
onBeforeUnmount(() => {
    observer?.disconnect();
    cancelAnimationFrame(frame);
});

const style = computed(() => ({
    ...(props.gap ? { '--vt-masonry-gap': props.gap } : {}),
    ...(props.minColumnWidth ? { '--vt-masonry-min-column-width': props.minColumnWidth } : {}),
    ...(props.columns && !laid.value ? { columns: String(props.columns) } : {}),
    ...(laid.value && height.value !== null ? { height: `${height.value}px` } : {})
}));

defineExpose({ layout });
</script>

<template>
    <div ref="rootRef" v-bind="part('root', { laid })" :style="style">
        <slot />
    </div>
</template>
