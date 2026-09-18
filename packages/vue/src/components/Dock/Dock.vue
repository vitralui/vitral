<script setup lang="ts">
import { rovingIndex, rovingMove } from '@vitral/core';
import { dockStyle } from '@vitral/styles';
import { computed, mergeProps, ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import { Tooltip as vTooltip } from '../../directives/tooltip';
import Icon from '../Icon/Icon.vue';
import type { MenuItem } from '../Menu/types';
import type { DockProps, DockSlots } from './types';

// A WAI-ARIA menu laid along one edge: one tab stop, the arrows along the
// dock move between items (wrapping), Home and End go to the ends, Enter and
// Space run an item. Each item is named by its label, which also shows as a
// tooltip; the magnification is decoration and stops for reduced motion.

defineOptions({ name: 'VtDock' });

const props = withDefaults(defineProps<DockProps>(), { unstyled: undefined, model: () => [], position: 'bottom', magnification: true });
defineSlots<DockSlots>();

const { part } = useComponent(dockStyle, props);
const items = computed(() => props.model.filter((item) => item.visible !== false && !item.separator));
const vertical = computed(() => props.position === 'left' || props.position === 'right');
const tooltipSide = computed(() => ({ bottom: 'top', top: 'bottom', left: 'right', right: 'left' })[props.position] as 'top');
const hovered = ref<number | null>(null);
const focused = ref(0);
const els: (HTMLElement | null)[] = [];

const tabStop = computed(() => {
    const current = items.value[focused.value];
    if (current && !current.disabled) return focused.value;
    return items.value.findIndex((item) => !item.disabled);
});

function distance(index: number) {
    return hovered.value === null ? undefined : Math.abs(index - hovered.value);
}

function focusAt(index: number) {
    if (index < 0) return;
    focused.value = index;
    els[index]?.focus();
}

function onKeydown(event: KeyboardEvent) {
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    const move = rovingMove(event.key, { orientation: vertical.value ? 'vertical' : 'horizontal', rtl });
    if (move) {
        event.preventDefault();
        focusAt(rovingIndex(move, items.value.length, focused.value, (i) => !!items.value[i]?.disabled));
    } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        els[focused.value]?.click();
    }
}

function onClick(item: MenuItem, index: number, event: MouseEvent) {
    focused.value = index;
    if (item.disabled) {
        event.preventDefault();
        return;
    }
    item.command?.({ originalEvent: event, item });
}
</script>

<template>
    <div v-bind="part('root', { position, magnify: magnification })">
        <ul
            role="menu"
            :aria-orientation="vertical ? 'vertical' : 'horizontal'"
            :aria-label="ariaLabel"
            :aria-labelledby="ariaLabelledby"
            v-bind="part('list')"
            @keydown="onKeydown"
            @mouseleave="hovered = null"
        >
            <li
                v-for="(item, index) in items"
                :key="item.key ?? index"
                role="none"
                v-bind="mergeProps(part('item', { distance: distance(index), disabled: !!item.disabled }), { class: item.class })"
                @mouseenter="hovered = index"
            >
                <component
                    :is="item.url ? 'a' : 'div'"
                    :ref="(el: unknown) => (els[index] = el as HTMLElement | null)"
                    v-tooltip="{ value: item.label, placement: tooltipSide }"
                    role="menuitem"
                    :href="item.url && !item.disabled ? item.url : undefined"
                    :target="item.url ? item.target : undefined"
                    :tabindex="index === tabStop ? 0 : -1"
                    :aria-label="item.label"
                    :aria-disabled="item.disabled ? 'true' : undefined"
                    v-bind="part('action')"
                    @click="onClick(item, index, $event)"
                    @focus="focused = index"
                >
                    <slot name="item" :item="item" :index="index">
                        <Icon v-if="item.icon" :icon="item.icon" />
                    </slot>
                </component>
            </li>
        </ul>
    </div>
</template>
