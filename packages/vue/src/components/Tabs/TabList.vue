<script setup lang="ts">
import { tabsStyle } from '@vitral/styles';
import { computed, inject, mergeProps, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { inheritUnstyled, TabsKey } from './context';
import type { TabListProps, TabsSlots } from './types';

// class and style dress the strip; every other attribute (the aria-label the
// tablist should have, an id) lands on the element with role="tablist".

defineOptions({ name: 'VtTabList', inheritAttrs: false });

const props = withDefaults(defineProps<TabListProps>(), { unstyled: undefined });
defineSlots<TabsSlots>();

const tabs = inject(TabsKey, null);
const { part } = useComponent(tabsStyle, inheritUnstyled(props, tabs));
const { rootAttrs, controlAttrs } = useSplitAttrs();

const rootRef = ref<HTMLElement | null>(null);
const orientation = computed(() => tabs?.orientation() ?? 'horizontal');
const state = computed(() => ({ orientation: orientation.value }));

// ---- the selection indicator -------------------------------------------
// It spans the selected tab's box along the strip; the stylesheet draws the
// pill inside it and animates the move. The first placement is not animated.

const box = ref<{ offset: number; size: number } | null>(null);
const animated = ref(false);
let observer: ResizeObserver | null = null;
let observed: HTMLElement | null = null;

function afterPaint(callback: () => void) {
    const frame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb: () => void) => setTimeout(cb, 16);
    frame(() => frame(callback));
}

function measure() {
    const root = rootRef.value;
    const tab = tabs?.activeElement() ?? null;
    if (!root || !tab) {
        box.value = null;
        return;
    }
    const outer = root.getBoundingClientRect();
    const inner = tab.getBoundingClientRect();
    // The indicator is placed from the left of the strip's content, so the
    // measurement has to be too. Reading right to left the browser reports
    // `scrollLeft` as 0 at the far right and negative going left, which is the
    // distance from the other end; this is the same number in both.
    const scrolled =
        getComputedStyle(root).direction === 'rtl' ? root.scrollLeft + root.scrollWidth - root.clientWidth : root.scrollLeft;
    box.value =
        orientation.value === 'vertical'
            ? { offset: inner.top - outer.top + root.scrollTop, size: inner.height }
            : { offset: inner.left - outer.left + scrolled, size: inner.width };
    if (!animated.value && box.value.size > 0) afterPaint(() => (animated.value = true));
    // Follow the selected tab's own size too: a label that changes, a font that loads.
    if (observer && observed !== tab) {
        if (observed) observer.unobserve(observed);
        observer.observe(tab);
        observed = tab;
    }
}

onMounted(() => {
    if (typeof ResizeObserver === 'function' && rootRef.value) {
        observer = new ResizeObserver(() => measure());
        observer.observe(rootRef.value);
    }
    measure();
});
onBeforeUnmount(() => observer?.disconnect());
watch([() => tabs?.active.value, orientation], measure, { flush: 'post' });

const indicatorState = computed(() => ({ orientation: orientation.value, hidden: !box.value || box.value.size === 0, animated: animated.value }));
const indicatorStyle = computed(() => {
    const b = box.value;
    if (!b) return undefined;
    return orientation.value === 'vertical' ? { transform: `translateY(${b.offset}px)`, height: `${b.size}px` } : { transform: `translateX(${b.offset}px)`, width: `${b.size}px` };
});
</script>

<template>
    <div ref="rootRef" v-bind="mergeProps(rootAttrs, part('tablist', state))">
        <div role="tablist" :aria-orientation="orientation" v-bind="mergeProps(controlAttrs, part('list', state))">
            <slot />
        </div>
        <span aria-hidden="true" v-bind="part('indicator', indicatorState)" :style="indicatorStyle" />
    </div>
</template>
