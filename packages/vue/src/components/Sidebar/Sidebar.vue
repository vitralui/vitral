<script setup lang="ts">
import { isClient } from '@vitral/core';
import { sidebarStyle } from '@vitral/styles';
import { computed, h, mergeProps, onBeforeUnmount, ref, useId, watch, withDirectives, type Component, type FunctionalComponent, type VNode, type VNodeArrayChildren } from 'vue';
import { useComponent } from '../../base/useComponent';
import { Tooltip } from '../../directives/tooltip';
import Drawer from '../Drawer/Drawer.vue';
import Icon from '../Icon/Icon.vue';
import type { MenuItem } from '../Menu/types';
import type { SidebarEmits, SidebarProps, SidebarSlots } from './types';

// Application navigation: a <nav> of plain links and buttons in
// the tab order, not an ARIA menu, which is for commands. The current page is
// `aria-current="page"`; a sub-list opens from a button with aria-expanded.
// The collapse button says what it will do and controls the navigation.
// Collapsed to icons, the labels stay for screen readers and show as tooltips.
// Below `mobileBreakpoint` the same content opens in a <Drawer>, a modal
// dialog. An off-canvas sidebar hidden on a wide screen leaves a strip along
// its edge, a button that brings it back, and its content goes inert.

defineOptions({ name: 'VtSidebar' });

const props = withDefaults(defineProps<SidebarProps>(), {
    unstyled: undefined,
    model: () => [],
    collapsible: 'icon',
    side: 'left',
    mobileBreakpoint: '768px',
    showToggle: true
});
const collapsed = defineModel<boolean>('collapsed', { default: false });
const visible = defineModel<boolean>('visible', { default: false });
const expandedKeys = defineModel<Record<string, boolean>>('expandedKeys', { default: () => ({}) });
const emit = defineEmits<SidebarEmits>();
const slots = defineSlots<SidebarSlots>();

const { part, locale } = useComponent(sidebarStyle, props);
const navId = `${useId()}-nav`;

// ---- small screens ----------------------------------------------------------------

const mobile = ref(false);
let query: MediaQueryList | null = null;
const onMedia = () => (mobile.value = !!query?.matches);
watch(
    () => props.mobileBreakpoint,
    (width) => {
        query?.removeEventListener?.('change', onMedia);
        query = isClient && window.matchMedia ? window.matchMedia(`(max-width: ${width})`) : null;
        query?.addEventListener?.('change', onMedia);
        onMedia();
    },
    { immediate: true }
);
onBeforeUnmount(() => query?.removeEventListener?.('change', onMedia));

const inDrawer = computed(() => mobile.value);
const iconOnly = computed(() => !inDrawer.value && props.collapsible === 'icon' && collapsed.value);
const name = computed(() => props.ariaLabel ?? locale.value.aria.navigation);
const hiddenOffcanvas = computed(() => !inDrawer.value && props.collapsible === 'offcanvas' && collapsed.value);

/** Collapses or expands the sidebar, or, in a drawer, opens or closes it. */
function toggle() {
    if (inDrawer.value) visible.value = !visible.value;
    else if (props.collapsible !== 'none') collapsed.value = !collapsed.value;
}

// ---- items --------------------------------------------------------------------------

const shown = (item: MenuItem) => item.visible !== false && !item.separator;
const keyOf = (item: MenuItem, path: string) => item.key ?? path;
const isActive = (item: MenuItem, key: string) => !!item.active || (props.activeKey !== undefined && props.activeKey === key);
const isOpen = (key: string) => !!expandedKeys.value?.[key];

function setOpen(key: string, open: boolean) {
    const next = { ...(expandedKeys.value ?? {}) };
    if (open) next[key] = true;
    else delete next[key];
    expandedKeys.value = next;
}

function onItemClick(item: MenuItem, key: string, event: MouseEvent) {
    if (item.disabled) {
        event.preventDefault();
        return;
    }
    if (item.items?.length) {
        // A parent pressed while collapsed opens the sidebar on it.
        if (iconOnly.value) {
            collapsed.value = false;
            setOpen(key, true);
        } else setOpen(key, !isOpen(key));
        return;
    }
    item.command?.({ originalEvent: event, item });
    emit('item-click', { originalEvent: event, item });
    if (inDrawer.value) visible.value = false;
}

const IconComponent = Icon as unknown as Component;

function renderItem(item: MenuItem, key: string): VNode {
    const parent = !!item.items?.length;
    const active = isActive(item, key);
    const open = parent && isOpen(key);
    const subId = `${navId}-${key.replace(/[^\w-]/g, '_')}`;
    const content: VNodeArrayChildren = slots.item
        ? (slots.item({ item, collapsed: iconOnly.value, active }) as VNodeArrayChildren)
        : [
              item.icon ? h(IconComponent, mergeProps(part('itemIcon'), { icon: item.icon })) : null,
              h('span', part('itemLabel'), item.label),
              parent ? h(IconComponent, mergeProps(part('itemToggle', { open }), { icon: 'chevronRight' })) : null
          ];
    const link = !!item.url && !parent;
    const control = h(
        link ? 'a' : 'button',
        mergeProps(part('item', { active, disabled: !!item.disabled }), {
            type: link ? undefined : 'button',
            href: link && !item.disabled ? item.url : undefined,
            target: link ? item.target : undefined,
            disabled: !link && item.disabled ? true : undefined,
            'aria-disabled': link && item.disabled ? 'true' : undefined,
            'aria-current': active ? 'page' : undefined,
            'aria-expanded': parent ? (open ? 'true' : 'false') : undefined,
            'aria-controls': parent && open ? subId : undefined,
            class: item.class as string,
            onClick: (event: MouseEvent) => onItemClick(item, key, event)
        }),
        content
    );
    const withTip = withDirectives(control, [[Tooltip, { value: item.label, placement: props.side === 'right' ? 'left' : 'right', disabled: !iconOnly.value }]]);
    return h('li', { key }, [
        withTip,
        open
            ? h(
                  'ul',
                  mergeProps(part('sublist'), { id: subId }),
                  (item.items ?? []).filter(shown).map((child, i) => renderItem(child, keyOf(child, `${key}_${i}`)))
              )
            : null
    ]);
}

function renderGroups(): VNode[] {
    const out: VNode[] = [];
    let loose: VNode[] = [];
    const flush = () => {
        if (loose.length) out.push(h('div', mergeProps(part('group'), { key: `loose-${out.length}` }), [h('ul', part('list'), loose)]));
        loose = [];
    };
    props.model.filter(shown).forEach((item, i) => {
        const key = keyOf(item, String(i));
        if (!item.items?.length || item.url || item.command) {
            loose.push(renderItem(item, key));
            return;
        }
        flush();
        const labelId = `${navId}-group-${i}`;
        out.push(
            h('div', mergeProps(part('group'), { key, role: 'group', 'aria-labelledby': labelId }), [
                h('div', mergeProps(part('groupLabel'), { id: labelId }), item.label),
                h(
                    'ul',
                    part('list'),
                    item.items.filter(shown).map((child, j) => renderItem(child, keyOf(child, `${key}_${j}`)))
                )
            ])
        );
    });
    flush();
    return out;
}

const Body: FunctionalComponent = () => {
    const state = { collapsed: iconOnly.value };
    const toggleButton =
        props.showToggle && (inDrawer.value || props.collapsible !== 'none')
            ? h(
                  'button',
                  mergeProps(part('toggle'), {
                      type: 'button',
                      'aria-label': inDrawer.value ? locale.value.aria.close : collapsed.value ? locale.value.aria.expandSidebar : locale.value.aria.collapseSidebar,
                      'aria-expanded': inDrawer.value ? undefined : collapsed.value ? 'false' : 'true',
                      'aria-controls': inDrawer.value ? undefined : navId,
                      onClick: toggle
                  }),
                  [h(IconComponent, { icon: inDrawer.value ? 'x' : 'sidebar' })]
              )
            : null;
    return [
        slots.header || toggleButton ? h('div', part('header'), [slots.header ? h('div', part('headerContent'), slots.header(state) as VNodeArrayChildren) : null, toggleButton]) : null,
        h('nav', mergeProps(part('nav'), { id: navId, 'aria-label': name.value }), [...renderGroups(), ...((slots.default?.(state) as VNode[] | undefined) ?? [])]),
        slots.footer ? h('div', part('footer'), [h('div', part('footerContent'), slots.footer(state) as VNodeArrayChildren)]) : null
    ];
};

defineExpose({ toggle, mobile });
</script>

<template>
    <Drawer v-if="inDrawer" v-model:visible="visible" :position="side" :aria-label="name" :show-close-icon="false" :unstyled="unstyled" v-bind="part('drawer')">
        <div v-bind="part('root', { side, inDrawer: true })">
            <Body />
        </div>
    </Drawer>
    <div v-else v-bind="part('root', { side, collapsed: collapsible !== 'none' && collapsed, offcanvas: collapsible === 'offcanvas' })">
        <button
            v-if="hiddenOffcanvas"
            type="button"
            :aria-label="locale.aria.expandSidebar"
            aria-expanded="false"
            :aria-controls="navId"
            v-bind="part('rail')"
            @click="toggle"
        >
            <Icon icon="chevronRight" />
        </button>
        <div :inert="hiddenOffcanvas ? true : undefined" v-bind="part('content')">
            <Body />
        </div>
    </div>
</template>
