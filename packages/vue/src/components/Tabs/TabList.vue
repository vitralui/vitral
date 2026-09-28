<script setup lang="ts">
import { tabsStyle } from '@vitral/styles';
import { computed, inject, mergeProps, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import { inheritUnstyled, TabsKey } from './context';
import type { TabListProps, TabsSlots } from './types';

// class and style dress the strip; every other attribute (the aria-label the
// tablist should have, an id) lands on the element with role="tablist".

defineOptions({ name: 'VtTabList', inheritAttrs: false });

const props = withDefaults(defineProps<TabListProps>(), { unstyled: undefined });
defineSlots<TabsSlots>();

const tabs = inject(TabsKey, null);
const { part, locale } = useComponent(tabsStyle, inheritUnstyled(props, tabs));
const { rootAttrs, controlAttrs } = useSplitAttrs();

/** The strip the tabs sit in, which scrolls when they do not fit and which the indicator is measured against. */
const rootRef = ref<HTMLElement | null>(null);
const orientation = computed(() => tabs?.orientation() ?? 'horizontal');
const scrollable = computed(() => tabs?.scrollable() ?? false);
const buttons = computed(() => (scrollable.value ? (tabs?.scrollButtons() ?? 'sides') : 'none'));
/** Together at one end, the pair stays put and a button that has nowhere to go is disabled rather than hidden. */
const grouped = computed(() => buttons.value === 'start' || buttons.value === 'end');
const state = computed(() => ({ orientation: orientation.value, scrollable: scrollable.value }));

// ---- scrolling ---------------------------------------------------------------
// A button at each end that still has tabs out of sight, and only there. The
// buttons are for the pointer: the arrow keys already move along the tabs,
// and the selected one is brought into view whichever way it was chosen.

const canBack = ref(false);
const canForward = ref(false);
const vertical = () => orientation.value === 'vertical';
const rtl = () => !!rootRef.value && getComputedStyle(rootRef.value).direction === 'rtl';

/** How far the strip is from its start, the same number reading either way. */
function progress(): { done: number; room: number } {
    const el = rootRef.value;
    if (!el) return { done: 0, room: 0 };
    if (vertical()) return { done: el.scrollTop, room: el.scrollHeight - el.clientHeight };
    // Right to left, `scrollLeft` is 0 at the start and negative towards the end.
    return { done: rtl() ? -el.scrollLeft : el.scrollLeft, room: el.scrollWidth - el.clientWidth };
}

function updateArrows() {
    if (!scrollable.value) {
        canBack.value = canForward.value = false;
        return;
    }
    const { done, room } = progress();
    canBack.value = done > 1;
    canForward.value = done < room - 1;
}

/** Nearly a page at a time, so the tab at the edge stays in sight for continuity. */
function page(direction: 1 | -1) {
    const el = rootRef.value;
    if (!el) return;
    const amount = (vertical() ? el.clientHeight : el.clientWidth) * 0.8 * direction;
    if (vertical()) el.scrollBy({ top: amount, behavior: 'smooth' });
    else el.scrollBy({ left: rtl() ? -amount : amount, behavior: 'smooth' });
}

function revealActive() {
    if (!scrollable.value) return;
    const tab = tabs?.activeElement();
    // `nearest` moves the strip only as far as needed, and never the page.
    if (tab && typeof tab.scrollIntoView === 'function') tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: animated.value ? 'smooth' : 'auto' });
}

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

const listRef = ref<HTMLElement | null>(null);

onMounted(() => {
    if (typeof ResizeObserver === 'function' && rootRef.value) {
        observer = new ResizeObserver(() => {
            measure();
            updateArrows();
        });
        observer.observe(rootRef.value);
        // Tabs added or relabelled change how much there is to scroll.
        if (listRef.value) observer.observe(listRef.value);
    }
    measure();
    updateArrows();
    revealActive();
});
onBeforeUnmount(() => observer?.disconnect());
watch([() => tabs?.active.value, orientation], measure, { flush: 'post' });
watch(() => tabs?.active.value, revealActive, { flush: 'post' });
watch([scrollable, orientation], updateArrows, { flush: 'post' });

const indicatorState = computed(() => ({ orientation: orientation.value, hidden: !box.value || box.value.size === 0, animated: animated.value }));
const indicatorStyle = computed(() => {
    const b = box.value;
    if (!b) return undefined;
    return orientation.value === 'vertical' ? { transform: `translateY(${b.offset}px)`, height: `${b.size}px` } : { transform: `translateX(${b.offset}px)`, width: `${b.size}px` };
});
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('tablist', state))">
        <span v-if="buttons === 'start'" v-bind="part('navGroup', { orientation, end: 'start' })">
            <template v-for="dir in ([-1, 1] as const)" :key="dir">
                <button
                    type="button"
                    tabindex="-1"
                    :aria-label="dir < 0 ? locale.aria.previous : locale.aria.next"
                    :disabled="dir < 0 ? !canBack : !canForward"
                    v-bind="part('navButton', { orientation, end: dir < 0 ? 'start' : 'end', grouped: true })"
                    @click="page(dir)"
                >
                    <Icon :icon="orientation === 'vertical' ? (dir < 0 ? 'chevronUp' : 'chevronDown') : dir < 0 ? 'chevronLeft' : 'chevronRight'" />
                </button>
            </template>
        </span>
        <!-- Out of the tab order, and hidden rather than removed so the strip does not jump when one goes. -->
        <button
            v-if="buttons === 'sides'"
            type="button"
            tabindex="-1"
            :aria-label="locale.aria.previous"
            :hidden="!canBack"
            v-bind="part('navButton', { orientation, end: 'start' })"
            @click="page(-1)"
        >
            <Icon :icon="orientation === 'vertical' ? 'chevronUp' : 'chevronLeft'" />
        </button>
        <div ref="rootRef" v-bind="part('content', state)" @scroll.passive="updateArrows">
            <div ref="listRef" role="tablist" :aria-orientation="orientation" v-bind="mergeProps(controlAttrs, part('list', state))">
                <slot />
            </div>
            <span aria-hidden="true" v-bind="part('indicator', indicatorState)" :style="indicatorStyle" />
        </div>
        <button
            v-if="buttons === 'sides'"
            type="button"
            tabindex="-1"
            :aria-label="locale.aria.next"
            :hidden="!canForward"
            v-bind="part('navButton', { orientation, end: 'end' })"
            @click="page(1)"
        >
            <Icon :icon="orientation === 'vertical' ? 'chevronDown' : 'chevronRight'" />
        </button>
        <span v-if="buttons === 'end'" v-bind="part('navGroup', { orientation, end: 'end' })">
            <template v-for="dir in ([-1, 1] as const)" :key="dir">
                <button
                    type="button"
                    tabindex="-1"
                    :aria-label="dir < 0 ? locale.aria.previous : locale.aria.next"
                    :disabled="dir < 0 ? !canBack : !canForward"
                    v-bind="part('navButton', { orientation, end: dir < 0 ? 'start' : 'end', grouped: true })"
                    @click="page(dir)"
                >
                    <Icon :icon="orientation === 'vertical' ? (dir < 0 ? 'chevronUp' : 'chevronDown') : dir < 0 ? 'chevronLeft' : 'chevronRight'" />
                </button>
            </template>
        </span>
    </div>
</template>
