<script setup lang="ts">
import { dividerStyle } from '@vitral/styles';
import { computed, useSlots } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { DividerProps, DividerSlots } from './types';

// A static separator: role="separator" with its orientation. Its children are
// presentational, so content set into the line is decoration, not a label.

defineOptions({ name: 'VtDivider' });

const props = withDefaults(defineProps<DividerProps>(), { unstyled: undefined, layout: 'horizontal', type: 'solid' });
defineSlots<DividerSlots>();

const slots = useSlots();
const { part } = useComponent(dividerStyle, props);

const state = computed(() => ({
    layout: props.layout,
    type: props.type,
    align: props.align ?? (props.layout === 'vertical' ? 'center' : 'left'),
    hasContent: !!slots.default
}));
</script>

<template>
    <div role="separator" :aria-orientation="layout" v-bind="part('root', state)">
        <div v-if="$slots.default" v-bind="part('content')">
            <slot />
        </div>
    </div>
</template>
