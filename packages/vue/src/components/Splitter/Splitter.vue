<script setup lang="ts">
import { boundaryLimits, normalizeSizes, pixelsToPercent, resizePanels, setPanelSize } from '@vitral/core';
import { splitterStyle } from '@vitral/styles';
import { computed, mergeProps, ref, useId, useSlots, type VNode } from 'vue';
import { useComponent } from '../../base/useComponent';
import { flattenChildren } from '../UniformGrid/children';
import SplitterPanel from './SplitterPanel.vue';
import type { SplitterEmits, SplitterProps, SplitterSlots } from './types';

// The WAI-ARIA window splitter. Each gutter is a focusable separator whose
// value is the size of the panel before it; arrows move it by `step`, Home and
// End to its limits, and a drag moves it under the pointer. The arithmetic of
// moving one boundary while both panels keep their minimums is in core.

defineOptions({ name: 'VtSplitter' });

const props = withDefaults(defineProps<SplitterProps>(), { unstyled: undefined, layout: 'horizontal', step: 5, as: 'div' });
const emit = defineEmits<SplitterEmits>();
defineSlots<SplitterSlots>();

const slots = useSlots();
const { part, locale } = useComponent(splitterStyle, props);
const baseId = useId();

interface Panel {
    node: VNode;
    key: string;
    id: string;
    size: number | undefined;
    minSize: number;
}

/** Sizes the user has set by dragging or with the keyboard; ignored once the panels change in number. */
const stored = ref<number[] | null>(null);
/** The gutter being dragged, or -1. */
const activeGutter = ref(-1);
const dragging = ref(false);

const toNumber = (value: unknown): number | undefined => {
    const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

// The panels are read from the slot during render (the template calls
// `collect()`), and remembered for the event handlers.
let panels: Panel[] = [];
let sizes: number[] = [];

function currentSizes(): number[] {
    const saved = stored.value;
    return saved && saved.length === panels.length ? saved : normalizeSizes(panels.map((panel) => panel.size));
}

function collect(): Panel[] {
    panels = flattenChildren(slots.default?.())
        .filter((child) => child.node.type === SplitterPanel)
        .map((child, index) => {
            const p = (child.node.props ?? {}) as Record<string, unknown>;
            return {
                node: child.node,
                key: child.key,
                id: typeof p.id === 'string' && p.id ? p.id : `${baseId}-panel-${index}`,
                size: toNumber(p.size),
                minSize: toNumber(p.minSize ?? p['min-size']) ?? 0
            };
        });
    sizes = currentSizes();
    return panels;
}

const horizontal = computed(() => props.layout !== 'vertical');
const gutterSize = 'var(--vt-splitter-gutter-size, 4px)';

const state = computed(() => ({ layout: props.layout, resizing: activeGutter.value >= 0 && dragging.value }));

const rootStyle = computed(() => ({
    display: 'flex',
    flexDirection: horizontal.value ? 'row' : 'column',
    '--vt-splitter-gutter-size': props.gutterSize === undefined ? undefined : `${props.gutterSize}px`
}));

// A panel's share of the space the gutters leave: exact, whatever the number of panels.
const panelStyle = (index: number) => ({
    flex: `0 0 calc((100% - ${panels.length - 1} * ${gutterSize}) * ${(sizes[index] ?? 0) / 100})`
});
const gutterStyle = { flex: `0 0 ${gutterSize}`, touchAction: 'none' };

const mins = () => panels.map((panel) => panel.minSize);
const limits = (index: number) => boundaryLimits(sizes, index, mins());
const valueNow = (index: number) => Math.round(sizes[index] ?? 0);
const isLast = (index: number) => index >= panels.length - 1;

const same = (a: number[], b: number[]) => a.length === b.length && a.every((value, i) => value === b[i]);

function commit(next: number[], event: Event): boolean {
    if (same(next, currentSizes())) return false;
    stored.value = next;
    sizes = next;
    emit('resize', { originalEvent: event, sizes: [...next] });
    return true;
}

// ---- pointer --------------------------------------------------------------

interface Drag {
    index: number;
    pointerId: number;
    origin: number;
    available: number;
    start: number[];
    reversed: boolean;
}

let drag: Drag | null = null;

function onPointerDown(event: PointerEvent, index: number) {
    if (event.button !== 0 || drag) return;
    const gutter = event.currentTarget as HTMLElement;
    const root = gutter.parentElement;
    if (!root) return;
    event.preventDefault();
    gutter.focus({ preventScroll: true });
    // The space the panels share, measured on the panels themselves.
    const available = panels.reduce((sum, panel) => {
        const rect = document.getElementById(panel.id)?.getBoundingClientRect();
        return sum + (rect ? (horizontal.value ? rect.width : rect.height) : 0);
    }, 0);
    drag = {
        index,
        pointerId: event.pointerId,
        origin: horizontal.value ? event.clientX : event.clientY,
        available,
        start: [...currentSizes()],
        reversed: horizontal.value && getComputedStyle(root).direction === 'rtl'
    };
    gutter.setPointerCapture?.(event.pointerId);
    activeGutter.value = index;
    dragging.value = true;
    emit('resizestart', { originalEvent: event, sizes: [...drag.start] });
}

function onPointerMove(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const moved = (horizontal.value ? event.clientX : event.clientY) - drag.origin;
    const delta = pixelsToPercent(drag.reversed ? -moved : moved, drag.available);
    commit(resizePanels(drag.start, drag.index, delta, mins()), event);
}

function onPointerUp(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const gutter = event.currentTarget as HTMLElement;
    drag = null;
    dragging.value = false;
    activeGutter.value = -1;
    if (gutter.hasPointerCapture?.(event.pointerId)) gutter.releasePointerCapture(event.pointerId);
    emit('resizeend', { originalEvent: event, sizes: [...currentSizes()] });
}

// ---- keyboard -------------------------------------------------------------

let keyboardResize = false;

function onKeydown(event: KeyboardEvent, index: number) {
    const current = currentSizes();
    const step = props.step;
    const reversed = horizontal.value && getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    let next: number[] | null = null;
    switch (event.key) {
        case 'ArrowLeft':
            if (horizontal.value) next = resizePanels(current, index, reversed ? step : -step, mins());
            break;
        case 'ArrowRight':
            if (horizontal.value) next = resizePanels(current, index, reversed ? -step : step, mins());
            break;
        case 'ArrowUp':
            if (!horizontal.value) next = resizePanels(current, index, -step, mins());
            break;
        case 'ArrowDown':
            if (!horizontal.value) next = resizePanels(current, index, step, mins());
            break;
        case 'Home':
            next = setPanelSize(current, index, 0, mins());
            break;
        case 'End':
            next = setPanelSize(current, index, 100, mins());
            break;
    }
    if (!next) return;
    event.preventDefault();
    if (!keyboardResize && !same(next, current)) {
        keyboardResize = true;
        emit('resizestart', { originalEvent: event, sizes: [...current] });
    }
    commit(next, event);
}

function onKeyup(event: KeyboardEvent) {
    if (!keyboardResize) return;
    keyboardResize = false;
    emit('resizeend', { originalEvent: event, sizes: [...currentSizes()] });
}
</script>

<template>
    <component :is="as" v-bind="mergeProps({ style: rootStyle }, part('root', state))">
        <template v-for="(panel, index) in collect()" :key="panel.key">
            <component :is="panel.node" :id="panel.id" :style="panelStyle(index)" />
            <div
                v-if="!isLast(index)"
                role="separator"
                tabindex="0"
                :aria-orientation="horizontal ? 'vertical' : 'horizontal'"
                :aria-valuenow="valueNow(index)"
                :aria-valuemin="limits(index).min"
                :aria-valuemax="limits(index).max"
                :aria-controls="panel.id"
                :aria-label="locale.aria.resize"
                v-bind="mergeProps({ style: gutterStyle }, part('gutter', { active: activeGutter === index }))"
                @pointerdown="onPointerDown($event, index)"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointercancel="onPointerUp"
                @lostpointercapture="onPointerUp"
                @keydown="onKeydown($event, index)"
                @keyup="onKeyup"
            >
                <div v-bind="part('gutterHandle')" />
            </div>
        </template>
    </component>
</template>
