<script setup lang="ts">
import { isVisible, rovingIndex, rovingMove } from '@vitral/core';
import { toolbarStyle } from '@vitral/styles';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { ToolbarProps, ToolbarSlots } from './types';

// role="toolbar", named by the aria-label / aria-labelledby it is given. With
// `roving`, the WAI-ARIA toolbar keyboard: the bar is one tab stop, and
// Left/Right, Home/End move between its controls. Keys a control needs for
// itself — arrows in a text field, anything a child already handled — are
// left alone.

defineOptions({ name: 'VtToolbar' });

const props = withDefaults(defineProps<ToolbarProps>(), { unstyled: undefined, roving: false });
defineSlots<ToolbarSlots>();

const { part } = useComponent(toolbarStyle, props);
const rootRef = ref<HTMLElement | null>(null);

const CANDIDATES = 'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex], [contenteditable]:not([contenteditable="false"])';
const NON_TEXT_INPUTS = new Set(['button', 'checkbox', 'radio', 'submit', 'reset', 'image', 'range', 'color', 'file']);

/** Controls the bar took out of the tab order, with the tabindex attribute each had before. */
const managed = new Map<HTMLElement, string | null>();
let active: HTMLElement | null = null;
let observer: MutationObserver | null = null;

/** The bar's own controls in order: tabbable ones, and ones it made untabbable itself. */
function stops(): HTMLElement[] {
    const root = rootRef.value;
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>(CANDIDATES)).filter(
        (el) =>
            (el.tabIndex >= 0 || managed.has(el)) &&
            !(el as HTMLButtonElement).disabled &&
            el.closest('[role="toolbar"]') === root &&
            isVisible(el)
    );
}

function sync() {
    const list = stops();
    if (!active || !list.includes(active)) active = list[0] ?? null;
    for (const el of list) {
        if (!managed.has(el)) managed.set(el, el.getAttribute('tabindex'));
        el.tabIndex = el === active ? 0 : -1;
    }
    for (const el of managed.keys()) if (!el.isConnected) managed.delete(el);
}

function start() {
    const root = rootRef.value;
    if (!root || observer) return;
    sync();
    // Controls come, go and get disabled; keep exactly one of them tabbable.
    observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'hidden'] });
}

function stop() {
    observer?.disconnect();
    observer = null;
    for (const [el, original] of managed) {
        if (original === null) el.removeAttribute('tabindex');
        else el.setAttribute('tabindex', original);
    }
    managed.clear();
    active = null;
}

onMounted(() => props.roving && start());
watch(
    () => props.roving,
    (on) => (on ? start() : stop())
);
onBeforeUnmount(stop);

function isTextEntry(el: HTMLElement): boolean {
    if (el.isContentEditable || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
    return el instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(el.type);
}

function onKeydown(event: KeyboardEvent) {
    if (!props.roving || event.defaultPrevented || !rootRef.value) return;
    const target = event.target as HTMLElement;
    if (isTextEntry(target)) return;
    const move = rovingMove(event.key, { orientation: 'horizontal', rtl: getComputedStyle(rootRef.value).direction === 'rtl' });
    if (!move) return;
    const list = stops();
    const index = list.indexOf(target);
    if (index < 0) return;
    event.preventDefault();
    const next = list[rovingIndex(move, list.length, index)];
    if (!next) return;
    active = next;
    sync();
    next.focus();
}

function onFocusin(event: FocusEvent) {
    if (!props.roving) return;
    const target = event.target as HTMLElement;
    if (target !== active && stops().includes(target)) {
        active = target;
        sync();
    }
}
</script>

<template>
    <div ref="rootRef" role="toolbar" v-bind="part('root')" @keydown="onKeydown" @focusin="onFocusin">
        <div v-if="$slots.start" v-bind="part('start')">
            <slot name="start" />
        </div>
        <div v-if="$slots.center" v-bind="part('center')">
            <slot name="center" />
        </div>
        <div v-if="$slots.end" v-bind="part('end')">
            <slot name="end" />
        </div>
    </div>
</template>
