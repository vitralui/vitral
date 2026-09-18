<script setup lang="ts">
import { radialOffset, rovingIndex, rovingMove } from '@vitral/core';
import { speeddialStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useAttrs, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import { Tooltip as vTooltip } from '../../directives/tooltip';
import Button from '../Button/Button.vue';
import Icon from '../Icon/Icon.vue';
import type { MenuItem } from '../Menu/types';
import type { SpeedDialEmits, SpeedDialProps, SpeedDialSlots } from './types';

// A menu button that fans its actions out. The button carries aria-expanded
// and controls a role="menu" of menuitems, each named by its label (shown as
// a tooltip). Opening from the keyboard — Enter, Space, or an arrow — focuses
// the first action; the arrows move between them (wrapping), Escape and Tab
// close and give focus back, and a choice runs the command and closes.

defineOptions({ name: 'VtSpeedDial', inheritAttrs: false });

const props = withDefaults(defineProps<SpeedDialProps>(), {
    unstyled: undefined,
    model: () => [],
    direction: 'up',
    type: 'linear',
    showIcon: 'plus',
    rotateAnimation: true,
    transitionDelay: 30,
    hideOnClickOutside: true,
    severity: 'primary'
});
const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<SpeedDialEmits>();
defineSlots<SpeedDialSlots>();
const attrs = useAttrs();

const { part } = useComponent(speeddialStyle, props);
const menuId = `${useId()}-menu`;
const rootRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const actionEls: (HTMLElement | null)[] = [];
const focusedIndex = ref(0);

const items = computed(() => props.model.filter((item) => item.visible !== false && !item.separator));
const radial = computed(() => props.type !== 'linear');
const state = computed(() => ({
    open: visible.value,
    direction: props.direction,
    radial: radial.value,
    rotate: props.rotateAnimation && !props.hideIcon,
    disabled: props.disabled
}));
const icon = computed(() => (visible.value && props.hideIcon ? props.hideIcon : props.showIcon));
const tooltipSide = computed(() => {
    if (props.tooltipPlacement) return props.tooltipPlacement;
    const main = props.direction.split('-')[0];
    return main === 'left' || main === 'right' ? 'top' : 'left';
});
const orientation = computed(() => {
    if (radial.value) return 'both';
    const main = props.direction.split('-')[0];
    return main === 'left' || main === 'right' ? 'horizontal' : 'vertical';
});

function itemStyle(index: number) {
    const count = items.value.length;
    const order = visible.value ? index : count - 1 - index;
    const style: Record<string, string> = { '--_delay': `${order * props.transitionDelay}ms` };
    if (radial.value) {
        const { x, y } = radialOffset(index, count, props.type as 'circle', props.direction, props.radius || count * 20);
        style['--_x'] = `${x}px`;
        style['--_y'] = `${y}px`;
    }
    return style;
}

useOverlay({
    overlay: computed(() => (visible.value ? listRef.value : null)),
    position: false,
    zIndexKey: 'overlay',
    onEscape: () => hide(true),
    onPointerDownOutside: (event) => {
        if (props.hideOnClickOutside && !rootRef.value?.contains(event.target as Node)) hide(false);
    }
});

function focusAction(index: number) {
    if (index < 0) return;
    focusedIndex.value = index;
    nextTick(() => actionEls[index]?.focus());
}

function show(focusFirst = false) {
    if (props.disabled || visible.value) return;
    visible.value = true;
    emit('show');
    if (focusFirst) focusAction(rovingIndex('first', items.value.length, -1, (i) => !!items.value[i]?.disabled));
}

function hide(returnFocus = false) {
    if (!visible.value) return;
    visible.value = false;
    emit('hide');
    if (returnFocus) rootRef.value?.querySelector<HTMLElement>('.vt-speeddial-trigger, [aria-controls]')?.focus();
}

function onButtonClick(event: MouseEvent) {
    emit('click', event);
    // A click with no pointer behind it (detail 0) is a keyboard press: take focus into the actions.
    if (visible.value) hide();
    else show(event.detail === 0);
}

function onButtonKeydown(event: KeyboardEvent) {
    if (!rovingMove(event.key, { homeEnd: false })) return;
    event.preventDefault();
    show(true);
    if (visible.value) focusAction(rovingIndex('first', items.value.length, -1, (i) => !!items.value[i]?.disabled));
}

function onMenuKeydown(event: KeyboardEvent) {
    const count = items.value.length;
    const move = rovingMove(event.key, { orientation: orientation.value as 'vertical' });
    if (move) {
        event.preventDefault();
        // A line that opens up or left lists its first action nearest the button, so the arrows follow the eye.
        const main = props.direction.split('-')[0];
        const flipped = !radial.value && (main === 'up' || main === 'left');
        const actual = flipped && (move === 'next' || move === 'previous') ? (move === 'next' ? 'previous' : 'next') : move;
        focusAction(rovingIndex(actual, count, focusedIndex.value, (i) => !!items.value[i]?.disabled));
        return;
    }
    if (event.key === 'Tab') hide(true);
    else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        actionEls[focusedIndex.value]?.click();
    }
}

function onAction(item: MenuItem, event: MouseEvent) {
    if (item.disabled) {
        event.preventDefault();
        return;
    }
    item.command?.({ originalEvent: event, item });
    hide(true);
}

defineExpose({ show, hide });
</script>

<template>
    <div ref="rootRef" v-bind="mergeProps({ class: attrs.class, style: attrs.style }, part('root', state))">
        <Button
            class="vt-speeddial-trigger"
            v-bind="mergeProps({ ...attrs, class: undefined, style: undefined }, part('button'))"
            :severity="severity"
            :disabled="disabled"
            :unstyled="unstyled"
            :aria-label="ariaLabel"
            aria-haspopup="menu"
            :aria-expanded="visible ? 'true' : 'false'"
            :aria-controls="menuId"
            @click="onButtonClick"
            @keydown="onButtonKeydown"
        >
            <slot name="icon" :visible="visible"><Icon :icon="icon" /></slot>
        </Button>
        <ul :id="menuId" ref="listRef" role="menu" :aria-label="ariaLabel" v-bind="part('list')" @keydown="onMenuKeydown">
            <li v-for="(item, index) in items" :key="item.key ?? index" role="none" v-bind="part('item')" :style="itemStyle(index)">
                <component
                    :is="item.url ? 'a' : 'button'"
                    :ref="(el: unknown) => (actionEls[index] = el as HTMLElement | null)"
                    v-tooltip="{ value: item.label, placement: tooltipSide }"
                    role="menuitem"
                    :type="item.url ? undefined : 'button'"
                    :href="item.url && !item.disabled ? item.url : undefined"
                    :target="item.url ? item.target : undefined"
                    :tabindex="visible && index === focusedIndex ? 0 : -1"
                    :aria-label="item.label"
                    :aria-disabled="item.disabled ? 'true' : undefined"
                    v-bind="part('action', { disabled: item.disabled })"
                    @click="onAction(item, $event)"
                    @focus="focusedIndex = index"
                >
                    <slot name="item" :item="item" :index="index">
                        <Icon v-if="item.icon" :icon="item.icon" />
                    </slot>
                </component>
            </li>
        </ul>
        <Transition name="vt-fade">
            <div v-if="mask && visible" v-bind="part('mask')" @click="hide()" />
        </Transition>
    </div>
</template>
