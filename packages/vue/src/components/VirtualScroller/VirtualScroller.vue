<script setup lang="ts">
import { getField, scrollOffsetFor, virtualWindow } from '@vitral/core';
import { virtualscrollerStyle } from '@vitral/styles';
import { computed, mergeProps, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { VirtualScrollerEmits, VirtualScrollerProps, VirtualScrollerSlots } from './types';

// A scroll container that renders only the items near its viewport, placed
// in a spacer as long as all of them; the window is core's arithmetic. It is
// a keyboard-scrollable region (tabindex 0), so arrow keys and Page Up/Down
// scroll it; the items keep whatever roles the content gives them. Name the
// region with `aria-label` when it holds more than decoration. While loading,
// the region is `aria-busy`.

defineOptions({ name: 'VtVirtualScroller', inheritAttrs: false });

const props = withDefaults(defineProps<VirtualScrollerProps>(), { unstyled: undefined, items: () => [], orientation: 'vertical', delay: 0 });
const emit = defineEmits<VirtualScrollerEmits>();
defineSlots<VirtualScrollerSlots>();
const attrs = useAttrs();

const { part, locale } = useComponent(virtualscrollerStyle, props);
const rootRef = ref<HTMLElement | null>(null);
const scroll = ref(0);
const viewport = ref(0);
const horizontal = computed(() => props.orientation === 'horizontal');

const window_ = computed(() =>
    virtualWindow({ scrollOffset: scroll.value, viewportSize: viewport.value, itemSize: props.itemSize, count: props.items.length, overscan: props.numToleratedItems })
);
const range = computed(() => (props.disabled ? { first: 0, last: props.items.length } : window_.value));
const rendered = computed(() => props.items.slice(range.value.first, range.value.last));
const offset = computed(() => (props.disabled ? 0 : window_.value.offset));
const styleOffset = computed(() => ({ transform: horizontal.value ? `translateX(${offset.value}px)` : `translateY(${offset.value}px)` }));
const spacerStyle = computed(() => {
    const size = `${window_.value.totalSize}px`;
    return horizontal.value ? { width: size } : { height: size };
});
const rootStyle = computed(() => ({ height: props.scrollHeight, width: props.scrollWidth }));

function measure() {
    const el = rootRef.value;
    if (!el) return;
    viewport.value = horizontal.value ? el.clientWidth : el.clientHeight;
    scroll.value = horizontal.value ? el.scrollLeft : el.scrollTop;
}

let lazyTimer: ReturnType<typeof setTimeout> | undefined;
watch(
    () => [window_.value.first, window_.value.last] as const,
    ([first, last], previous) => {
        if (previous && first === previous[0] && last === previous[1]) return;
        emit('scroll-index-change', { first: window_.value.visibleFirst, last: window_.value.visibleLast });
        if (!props.lazy) return;
        clearTimeout(lazyTimer);
        const fire = () => emit('lazy-load', { first, last });
        if (props.delay > 0) lazyTimer = setTimeout(fire, props.delay);
        else fire();
    }
);

function onScroll(event: Event) {
    measure();
    emit('scroll', event);
}

let observer: ResizeObserver | null = null;
onMounted(() => {
    measure();
    if (props.lazy) emit('lazy-load', { first: window_.value.first, last: window_.value.last });
    if (typeof ResizeObserver === 'function' && rootRef.value) {
        observer = new ResizeObserver(measure);
        observer.observe(rootRef.value);
    }
});
onBeforeUnmount(() => {
    observer?.disconnect();
    clearTimeout(lazyTimer);
});
watch(() => props.orientation, measure, { flush: 'post' });

/** Scrolls item `index` into view. */
function scrollToIndex(index: number, align: 'start' | 'end' | 'nearest' = 'start', behavior: ScrollBehavior = 'auto') {
    const el = rootRef.value;
    if (!el) return;
    const to = scrollOffsetFor(index, props.itemSize, viewport.value, scroll.value, align);
    if (typeof el.scrollTo === 'function') el.scrollTo(horizontal.value ? { left: to, behavior } : { top: to, behavior });
    else if (horizontal.value) el.scrollLeft = to;
    else el.scrollTop = to;
    measure();
}

const keyOf = (item: unknown, index: number) => (props.dataKey ? (getField(item, props.dataKey) as PropertyKey) : index);
const optionsOf = (index: number) => ({
    index,
    count: props.items.length,
    first: index === 0,
    last: index === props.items.length - 1,
    even: index % 2 === 0,
    odd: index % 2 === 1
});
const itemStyle = computed(() => (horizontal.value ? { width: `${props.itemSize}px`, flexShrink: '0' } : { height: `${props.itemSize}px` }));

defineExpose({ scrollToIndex, getRenderedRange: () => ({ ...range.value }), element: rootRef });
</script>

<template>
    <div
        ref="rootRef"
        tabindex="0"
        v-bind="mergeProps(attrs, part('root', { orientation, inline: disabled }))"
        :style="rootStyle"
        :aria-busy="loading ? 'true' : undefined"
        @scroll.passive="onScroll"
    >
        <div v-if="!disabled" v-bind="part('spacer')" :style="spacerStyle" aria-hidden="true" />
        <slot name="content" :items="rendered" :first="range.first" :last="range.last" :style-offset="styleOffset" :item-size="itemSize">
            <div v-bind="part('content')" :style="styleOffset">
                <div v-for="(item, i) in rendered" :key="keyOf(item, range.first + i)" :style="itemStyle">
                    <slot name="item" :item="item" :options="optionsOf(range.first + i)" />
                </div>
            </div>
        </slot>
        <div v-if="loading" v-bind="part('loader')">
            <slot name="loader">
                <Icon icon="spinner" spin />
                <span class="vt-sr-only">{{ locale.loading }}</span>
            </slot>
        </div>
    </div>
</template>
