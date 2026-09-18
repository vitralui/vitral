<script setup lang="ts">
import { tieredmenuStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useAttrs, useId, type FunctionalComponent } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import type { TieredMenuEmits, TieredMenuProps, TieredMenuSlots } from './types';
import { useNestedMenu } from './useNestedMenu';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// The WAI-ARIA menu with submenus. Items are menuitems with one tab stop; Up
// and Down move within a menu (wrapping), Right or Enter opens a submenu on its
// first item, Left or Escape goes back to the parent. A popup opens on its
// first item and gives focus back to its trigger on Escape, Tab or a command.

defineOptions({ name: 'VtTieredMenu', inheritAttrs: false });

const props = withDefaults(defineProps<TieredMenuProps>(), { unstyled: undefined, model: () => [], appendTo: 'body', placement: 'bottom-start' });
const overlayTarget = useOverlayTarget(() => props.appendTo);
const emit = defineEmits<TieredMenuEmits>();
const slots = defineSlots<TieredMenuSlots>();

const { part, locale } = useComponent(tieredmenuStyle, props);
const attrs = useAttrs();
const autoId = useId();
const menuId = computed(() => (attrs.id as string | undefined) ?? `${autoId}-menu`);
const rootAttrs = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = attrs;
    return rest;
});

const open = ref(false);
const rendered = computed(() => !props.popup || open.value);
const target = ref<HTMLElement | null>(null);
const overlayRef = ref<HTMLElement | null>(null);
const labelFromTarget = ref<string>();
const labelledBy = computed(() => props.ariaLabelledby ?? (props.ariaLabel ? undefined : labelFromTarget.value));

const menu = useNestedMenu({
    model: () => props.model,
    horizontal: () => false,
    part,
    idPrefix: autoId,
    locale: () => locale.value.code,
    onClose: (returnFocus) => {
        if (props.popup) hide(returnFocus);
    },
    itemSlot: () => slots.item
});

useOverlay({
    anchor: () => target.value,
    overlay: overlayRef,
    placement: () => props.placement,
    zIndexKey: 'menu',
    onEscape: () => hide(true),
    onPointerDownOutside: () => hide(false)
});

function setRoot(el: unknown) {
    const node = el as HTMLElement | null;
    menu.setRoot(node);
    overlayRef.value = props.popup ? node : null;
}

function show(event?: Event) {
    const origin = (event?.currentTarget ?? event?.target) as EventTarget | null | undefined;
    if (origin instanceof HTMLElement) target.value = origin;
    if (!props.popup || open.value) return;
    const trigger = target.value;
    if (trigger && !props.ariaLabel && !props.ariaLabelledby) {
        trigger.id ||= `${autoId}-trigger`;
        labelFromTarget.value = trigger.id;
    }
    trigger?.setAttribute('aria-expanded', 'true');
    menu.reset();
    open.value = true;
    emit('show');
    nextTick(() => menu.moveTo({ path: [menu.tabStop.value], expanded: false }));
}

function hide(returnFocus = false) {
    if (!open.value) return;
    open.value = false;
    menu.reset();
    target.value?.setAttribute('aria-expanded', 'false');
    emit('hide');
    if (returnFocus) target.value?.focus();
}

function toggle(event?: Event) {
    if (open.value) hide();
    else show(event);
}

const Items: FunctionalComponent = () =>
    menu.renderList(menu.roots.value, [], { id: menuId.value, role: 'menu', 'aria-label': props.ariaLabel, 'aria-labelledby': labelledBy.value, 'aria-orientation': 'vertical' });

defineExpose({ toggle, show, hide });
</script>

<template>
    <Teleport :to="overlayTarget" :disabled="!popup || appendTo === 'self'">
        <Transition name="vt-overlay">
            <div v-if="rendered" :ref="setRoot" v-bind="mergeProps(rootAttrs, part('root', { popup }))">
                <div v-if="$slots.start" v-bind="part('start')"><slot name="start" /></div>
                <Items />
                <div v-if="$slots.end" v-bind="part('end')"><slot name="end" /></div>
            </div>
        </Transition>
    </Teleport>
</template>
