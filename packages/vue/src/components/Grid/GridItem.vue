<script setup lang="ts">
import { gridPlacement } from '@vitral/core';
import { griditemStyle } from '@vitral/styles';
import { computed, mergeProps } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { GridItemProps, GridItemSlots } from './types';

defineOptions({ name: 'VtGridItem' });

const props = withDefaults(defineProps<GridItemProps>(), { unstyled: undefined, row: 0, column: 0, rowSpan: 1, columnSpan: 1, as: 'div' });
defineSlots<GridItemSlots>();

const { part } = useComponent(griditemStyle, props);

// Cells are counted from 0 and CSS counts lines from 1; a child with no
// position sits in the first cell.
const placement = computed(() => ({
    gridRow: gridPlacement(props.row, props.rowSpan),
    gridColumn: gridPlacement(props.column, props.columnSpan)
}));
</script>

<template>
    <component :is="as" v-bind="mergeProps({ style: placement }, part('root'))">
        <slot />
    </component>
</template>
