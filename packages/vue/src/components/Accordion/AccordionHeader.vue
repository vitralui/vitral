<script setup lang="ts">
import { rovingMove } from '@vitral/core';
import { accordionStyle } from '@vitral/styles';
import { computed, inject, onBeforeUnmount, ref, useSlots } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import { AccordionKey, AccordionPanelKey, inheritUnstyled } from './context';
import type { AccordionHeaderProps, AccordionHeaderSlots } from './types';

defineOptions({ name: 'VtAccordionHeader' });

const props = withDefaults(defineProps<AccordionHeaderProps>(), { unstyled: undefined });
defineSlots<AccordionHeaderSlots>();

const accordion = inject(AccordionKey, null);
const panel = inject(AccordionPanelKey, null);
const slots = useSlots();
const { part } = useComponent(accordionStyle, inheritUnstyled(props, accordion));

const buttonRef = ref<HTMLButtonElement | null>(null);
if (accordion) onBeforeUnmount(accordion.register(buttonRef));

const open = computed(() => panel?.open.value ?? false);
const disabled = computed(() => panel?.disabled() ?? false);
const level = computed(() => accordion?.headingLevel() ?? 3);
const contentId = computed(() => (panel ? `${panel.id}-content` : undefined));
// A lazy accordion has no content element while closed; point at nothing then.
const controls = computed(() => (accordion?.lazy() && !open.value ? undefined : contentId.value));

const customIcon = computed(() => (open.value ? accordion?.collapseIcon() : accordion?.expandIcon()));
const state = computed(() => ({ open: open.value, disabled: disabled.value }));
const iconState = computed(() => ({ open: open.value, rotate: !customIcon.value && !slots.toggleicon }));

function onClick() {
    if (panel && !disabled.value) accordion?.toggle(panel.value());
}

function onKeydown(event: KeyboardEvent) {
    const move = rovingMove(event.key, { orientation: 'vertical' });
    if (!move || !buttonRef.value || !accordion) return;
    event.preventDefault();
    accordion.move(buttonRef.value, move);
}
</script>

<template>
    <component :is="`h${level}`" v-bind="part('heading', state)">
        <button
            ref="buttonRef"
            :id="panel ? `${panel.id}-header` : undefined"
            type="button"
            :aria-expanded="open ? 'true' : 'false'"
            :aria-controls="controls"
            :disabled="disabled"
            v-bind="part('header', state)"
            @click="onClick"
            @keydown="onKeydown"
        >
            <span v-bind="part('headerLabel')">
                <slot />
            </span>
            <span v-bind="part('toggleIcon', iconState)" aria-hidden="true">
                <slot name="toggleicon" :active="open">
                    <Icon :icon="customIcon ?? 'chevronDown'" />
                </slot>
            </span>
        </button>
    </component>
</template>
