<script setup lang="ts">
import { accordionStyle } from '@vitral/styles';
import { computed, inject, provide, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { AccordionKey, AccordionPanelKey, inheritUnstyled } from './context';
import type { AccordionPanelProps } from './types';

defineOptions({ name: 'VtAccordionPanel' });

const props = withDefaults(defineProps<AccordionPanelProps>(), { unstyled: undefined, as: 'div' });

const accordion = inject(AccordionKey, null);
const { part } = useComponent(accordionStyle, inheritUnstyled(props, accordion));

const id = useId();
const open = computed(() => accordion?.isOpen(props.value) ?? false);
const state = computed(() => ({ open: open.value, disabled: props.disabled }));

provide(AccordionPanelKey, { id, value: () => props.value, disabled: () => !!props.disabled, open });
</script>

<template>
    <component :is="as" v-bind="part('panel', state)">
        <slot />
    </component>
</template>
