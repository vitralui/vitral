<script setup lang="ts">
import { isClient } from '@vitral/core';
import { contextmenuStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, onBeforeUnmount, ref, useAttrs, useId, watch, type FunctionalComponent } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import { useNestedMenu } from '../TieredMenu/useNestedMenu';
import type { ContextMenuEmits, ContextMenuProps, ContextMenuSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// The menu a right-click opens, and, for keyboard users, Shift+F10 or the
// context-menu key. It opens at the pointer (or under the focused target) with
// focus on its first item, behaves as a WAI-ARIA menu with submenus, and gives
// focus back to where it was on Escape, Tab or a command.

defineOptions({ name: 'VtContextMenu', inheritAttrs: false });

const props = withDefaults(defineProps<ContextMenuProps>(), { unstyled: undefined, model: () => [], appendTo: 'body' });
const overlayTarget = useOverlayTarget(() => props.appendTo);
const emit = defineEmits<ContextMenuEmits>();
const slots = defineSlots<ContextMenuSlots>();
const attrs = useAttrs();

const { part, locale } = useComponent(contextmenuStyle, props);
const autoId = useId();
const menuId = computed(() => (attrs.id as string | undefined) ?? `${autoId}-menu`);
const rootAttrs = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = attrs;
    return rest;
});

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const point = ref({ x: 0, y: 0 });
let returnTo: HTMLElement | null = null;

const menu = useNestedMenu({
    model: () => props.model,
    horizontal: () => false,
    part,
    idPrefix: autoId,
    locale: () => locale.value.code,
    onClose: (returnFocus) => hide(returnFocus),
    itemSlot: () => slots.item
});

useOverlay({
    overlay: rootRef,
    position: false,
    zIndexKey: 'menu',
    onEscape: () => hide(true),
    onPointerDownOutside: () => hide(false)
});

function setRoot(el: unknown) {
    rootRef.value = el as HTMLElement | null;
    menu.setRoot(rootRef.value);
}

/** Opens at the pointer, or, for a keyboard request, under the element that has focus. */
function show(event?: MouseEvent | KeyboardEvent) {
    event?.preventDefault();
    const origin = (event?.currentTarget instanceof HTMLElement ? event.currentTarget : null) ?? (document.activeElement as HTMLElement | null);
    const fromKeyboard = !event || event instanceof KeyboardEvent || (event.clientX === 0 && event.clientY === 0);
    if (fromKeyboard && origin && origin !== document.body) {
        const rect = origin.getBoundingClientRect();
        point.value = { x: rect.left, y: rect.bottom };
    } else if (event instanceof MouseEvent) {
        point.value = { x: event.clientX, y: event.clientY };
    }
    if (!open.value) {
        returnTo = document.activeElement as HTMLElement | null;
        menu.reset();
        open.value = true;
        emit('show');
    }
    nextTick(() => {
        keepInView();
        menu.moveTo({ path: [menu.tabStop.value], expanded: false });
    });
}

function hide(returnFocus = false) {
    if (!open.value) return;
    open.value = false;
    menu.reset();
    emit('hide');
    if (returnFocus && returnTo?.isConnected) returnTo.focus({ preventScroll: true });
    returnTo = null;
}

function toggle(event?: MouseEvent | KeyboardEvent) {
    if (open.value) hide();
    else show(event);
}

// Near the right or bottom edge, open towards the inside of the window.
function keepInView() {
    const el = rootRef.value;
    if (!el || !isClient) return;
    const rect = el.getBoundingClientRect();
    const x = point.value.x + rect.width > window.innerWidth ? Math.max(0, window.innerWidth - rect.width - 4) : point.value.x;
    const y = point.value.y + rect.height > window.innerHeight ? Math.max(0, window.innerHeight - rect.height - 4) : point.value.y;
    point.value = { x, y };
}

// ---- where it listens ------------------------------------------------------------

function onContextmenu(event: MouseEvent) {
    show(event);
}

function onTargetKeydown(event: KeyboardEvent) {
    if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') show(event);
}

let detach: (() => void) | null = null;
function resolveTarget(): EventTarget | null {
    if (!isClient) return null;
    if (props.global) return document;
    if (typeof props.target === 'string') return document.querySelector(props.target);
    return props.target ?? null;
}

function attach() {
    detach?.();
    const el = resolveTarget();
    if (!el) return;
    el.addEventListener('contextmenu', onContextmenu as EventListener);
    el.addEventListener('keydown', onTargetKeydown as EventListener);
    detach = () => {
        el.removeEventListener('contextmenu', onContextmenu as EventListener);
        el.removeEventListener('keydown', onTargetKeydown as EventListener);
        detach = null;
    };
}

watch([() => props.global, () => props.target], () => nextTick(attach), { immediate: true });
onBeforeUnmount(() => detach?.());

const Items: FunctionalComponent = () => menu.renderList(menu.roots.value, [], { id: menuId.value, role: 'menu', 'aria-label': props.ariaLabel, 'aria-orientation': 'vertical' });

defineExpose({ show, hide, toggle });
</script>

<template>
    <Teleport :to="overlayTarget">
        <Transition name="vt-overlay">
            <div v-if="open" :ref="setRoot" v-bind="mergeProps(rootAttrs, part('root'))" :style="{ left: `${point.x}px`, top: `${point.y}px` }" @contextmenu.prevent>
                <Items />
            </div>
        </Transition>
    </Teleport>
</template>
