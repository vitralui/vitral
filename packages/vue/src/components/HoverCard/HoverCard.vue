<script setup lang="ts">
import { hovercardStyle } from '@vitral/styles';
import { onBeforeUnmount, ref, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import type { HoverCardEmits, HoverCardProps, HoverCardSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// A preview for sighted pointer and keyboard users: the
// trigger (a link, usually) does its own job, and the card is extra. It opens
// after the pointer rests on the trigger or keyboard focus reaches it, stays
// while the pointer is over either, and closes on Escape. Because it is extra,
// it is not announced and takes no focus; what it shows must be reachable
// through the trigger too (WCAG 1.4.13: dismissable, hoverable, persistent).

defineOptions({ name: 'VtHoverCard' });

const props = withDefaults(defineProps<HoverCardProps>(), { unstyled: undefined, openDelay: 700, closeDelay: 300, placement: 'bottom', offset: 8 });
const overlayTarget = useOverlayTarget();
const emit = defineEmits<HoverCardEmits>();
defineSlots<HoverCardSlots>();

const { part } = useComponent(hovercardStyle, props);
const id = useId();
const triggerRef = ref<HTMLElement | null>(null);
const cardRef = ref<HTMLElement | null>(null);
const open = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

useOverlay({
    anchor: triggerRef,
    overlay: cardRef,
    placement: () => props.placement,
    offset: props.offset,
    onEscape: () => hide()
});

function later(fn: () => void, delay: number) {
    clearTimeout(timer);
    timer = delay > 0 ? setTimeout(fn, delay) : (fn(), undefined);
}

function show() {
    if (props.disabled || open.value) return;
    open.value = true;
    emit('show');
}

function hide() {
    clearTimeout(timer);
    if (!open.value) return;
    open.value = false;
    emit('hide');
}

const enter = () => later(show, props.openDelay);
const leave = () => later(hide, props.closeDelay);
const stay = () => clearTimeout(timer);

function onFocusin(event: FocusEvent) {
    // Keyboard focus only: a click that focuses the link is about to follow it.
    let visible = true;
    try {
        visible = (event.target as Element).matches(':focus-visible');
    } catch {
        // An engine without :focus-visible; treat focus as keyboard focus.
    }
    if (visible) enter();
}

onBeforeUnmount(() => clearTimeout(timer));

defineExpose({ show, hide });
</script>

<template>
    <span ref="triggerRef" v-bind="part('trigger')" @pointerenter="enter" @pointerleave="leave" @focusin="onFocusin" @focusout="leave" @pointerdown="hide">
        <slot name="trigger" />
    </span>
    <Teleport :to="overlayTarget">
        <Transition name="vt-overlay">
            <div v-if="open" :id="id" ref="cardRef" v-bind="part('root')" @pointerenter="stay" @pointerleave="leave">
                <slot />
            </div>
        </Transition>
    </Teleport>
</template>
