<script setup lang="ts">
import { isClient } from '@vitral/core';
import { menubarStyle } from '@vitral/styles';
import { computed, nextTick, onBeforeUnmount, ref, useId, watch, type FunctionalComponent } from 'vue';
import { useAnchored } from '../../base/anchored';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import { useNestedMenu } from '../TieredMenu/useNestedMenu';
import type { MenubarEmits, MenubarProps, MenubarSlots } from './types';

// The WAI-ARIA menubar: one tab stop; Left and Right move along the bar
// (wrapping), Down and Up open a menu on its first or last item, Enter and
// Space open it or run the item. Inside, Right and Left open and close
// submenus, or, where there is none, move to the neighbouring bar item and
// show its menu. Escape closes one level. A pointer opens menus on click and,
// once one is open, on hover. Below `breakpoint` the bar becomes a menu
// button whose menu lists the items in a column.

defineOptions({ name: 'VtMenubar' });

const props = withDefaults(defineProps<MenubarProps>(), { unstyled: undefined, model: () => [], breakpoint: '960px' });
const emit = defineEmits<MenubarEmits>();
const slots = defineSlots<MenubarSlots>();

const { part, locale } = useComponent(menubarStyle, props);
const autoId = useId();
const listId = `${autoId}-menubar`;
const buttonRef = ref<HTMLButtonElement | null>(null);

// ---- small screens ----------------------------------------------------------------

const mobile = ref(false);
const mobileOpen = ref(false);
let query: MediaQueryList | null = null;
const onMedia = () => {
    mobile.value = !!query?.matches;
    if (!mobile.value) mobileOpen.value = false;
};
watch(
    () => props.breakpoint,
    (width) => {
        query?.removeEventListener?.('change', onMedia);
        query = isClient && window.matchMedia ? window.matchMedia(`(max-width: ${width})`) : null;
        query?.addEventListener?.('change', onMedia);
        onMedia();
    },
    { immediate: true }
);
onBeforeUnmount(() => query?.removeEventListener?.('change', onMedia));

const menu = useNestedMenu({
    model: () => props.model,
    horizontal: () => !mobile.value,
    part,
    idPrefix: autoId,
    locale: () => locale.value.code,
    hoverOpens: () => mobile.value,
    inline: () => mobile.value,
    onClose: (returnFocus) => {
        if (mobile.value) setMobile(false, returnFocus);
    },
    itemSlot: () => slots.item
});

function setMobile(open: boolean, returnFocus = true) {
    if (mobileOpen.value === open) return;
    mobileOpen.value = open;
    emit('mobile-toggle', open);
    if (open) nextTick(() => menu.moveTo({ path: [menu.tabStop.value], expanded: false }));
    else {
        menu.reset();
        if (returnFocus) buttonRef.value?.focus();
    }
}

function onButtonKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        setMobile(true);
    }
}

// The small-screen column hangs under the whole bar, as wide as it.
const anchored = useAnchored('menu');

const listShown = computed(() => !mobile.value || mobileOpen.value);
const Items: FunctionalComponent = () =>
    menu.renderList(menu.roots.value, [], {
        id: listId,
        role: mobile.value ? 'menu' : 'menubar',
        'aria-orientation': mobile.value ? 'vertical' : 'horizontal',
        'aria-label': props.ariaLabel,
        'aria-labelledby': props.ariaLabelledby,
        ...anchored.hooks(mobile.value && { reference: (el) => el.parentElement, placement: 'bottom-start' as const, matchWidth: true })
    });
</script>

<template>
    <div :ref="(el) => menu.setRoot(el as HTMLElement | null)" v-bind="part('root', { mobile, open: mobileOpen })">
        <div v-if="$slots.start" v-bind="part('start')"><slot name="start" /></div>
        <button
            v-if="mobile"
            ref="buttonRef"
            type="button"
            :aria-label="ariaLabel ?? locale.aria.menu"
            aria-haspopup="menu"
            :aria-expanded="mobileOpen ? 'true' : 'false'"
            :aria-controls="mobileOpen ? listId : undefined"
            v-bind="part('button')"
            @click="setMobile(!mobileOpen)"
            @keydown="onButtonKeydown"
        >
            <slot name="buttonicon"><Icon icon="menu" /></slot>
        </button>
        <Items v-if="listShown" />
        <div v-if="$slots.end" v-bind="part('end')"><slot name="end" /></div>
    </div>
</template>
