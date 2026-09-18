<script setup lang="ts">
import { getFocusableElements } from '@vitral/core';
import { popoverStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useAttrs, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import type { PopoverEmits, PopoverProps, PopoverSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// A popover: a non-modal dialog anchored to the
// control that opened it. Opening moves focus in; Escape, a press outside or
// tabbing past either end closes it, and focus goes back to the trigger (or,
// tabbing forward, on to whatever follows it). Name it through attributes —
// `aria-label` or `aria-labelledby` — which land on the dialog element.

defineOptions({ name: 'VtPopover', inheritAttrs: false });

const props = withDefaults(defineProps<PopoverProps>(), {
    unstyled: undefined,
    placement: 'bottom-start',
    dismissable: true,
    closeOnEscape: true,
    offset: 8,
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const emit = defineEmits<PopoverEmits>();
defineSlots<PopoverSlots>();
const attrs = useAttrs();

const { part } = useComponent(popoverStyle, props);
const fallbackId = useId();
const id = computed(() => (attrs.id as string | undefined) ?? fallbackId);

const visible = ref(false);
const target = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
let returnTo: HTMLElement | null = null;

useOverlay({
    anchor: target,
    overlay: panelRef,
    placement: () => props.placement,
    offset: props.offset,
    onEscape: () => {
        if (props.closeOnEscape) hide();
    },
    onPointerDownOutside: () => {
        if (props.dismissable) hide(false);
    }
});

watch(
    panelRef,
    (panel) => {
        if (!panel) return;
        const first = getFocusableElements(panel)[0];
        if (first) first.focus({ preventScroll: true });
        else {
            if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
            panel.focus({ preventScroll: true });
        }
    },
    { flush: 'post' }
);

function targetOf(event?: Event, el?: HTMLElement | null): HTMLElement | null {
    return el ?? (event?.currentTarget as HTMLElement | null) ?? (event?.target as HTMLElement | null) ?? null;
}

/** Opens anchored to `target`, or to the element the event came from. */
async function show(event?: Event, el?: HTMLElement | null) {
    const next = targetOf(event, el);
    if (visible.value) {
        if (!next || next === target.value) return;
        // Another trigger: close here and reopen there, so the panel re-anchors.
        visible.value = false;
        await nextTick();
    } else {
        returnTo = document.activeElement as HTMLElement | null;
    }
    target.value = next;
    visible.value = true;
    emit('show');
}

/** Closes; focus goes back to the trigger unless it has already moved elsewhere. */
function hide(returnFocus = true) {
    if (!visible.value) return;
    const panel = panelRef.value;
    visible.value = false;
    emit('hide');
    const active = document.activeElement;
    const ours = !active || active === document.body || !!panel?.contains(active);
    if (returnFocus && ours) (returnTo?.isConnected ? returnTo : target.value)?.focus({ preventScroll: true });
}

function toggle(event?: Event, el?: HTMLElement | null) {
    const next = targetOf(event, el);
    if (visible.value && (!next || next === target.value)) hide();
    else show(event, el);
}

// The panel lives at the end of <body>, far from its trigger in the tab order,
// so Tab past either end closes it and continues from the trigger.
function onKeydown(event: KeyboardEvent) {
    const panel = panelRef.value;
    if (event.key !== 'Tab' || !panel) return;
    const items = getFocusableElements(panel);
    const active = document.activeElement;
    const leaving = items.length === 0 || (event.shiftKey ? active === items[0] || active === panel : active === items[items.length - 1]);
    if (!leaving) return;
    event.preventDefault();
    const anchor = target.value;
    const order = getFocusableElements(document.body).filter((el) => !panel.contains(el));
    hide(false);
    if (!anchor) return;
    const next = event.shiftKey ? anchor : (order[order.indexOf(anchor) + 1] ?? anchor);
    next.focus({ preventScroll: true });
}

defineExpose({ show, hide, toggle, visible, id, target });
</script>

<template>
    <Teleport :to="overlayTarget" :disabled="appendTo === 'self'">
        <Transition name="vt-overlay">
            <div v-if="visible" :id="id" ref="panelRef" role="dialog" v-bind="mergeProps(part('root'), attrs)" @keydown="onKeydown">
                <div v-bind="part('content')">
                    <slot :close-callback="() => hide()" />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
