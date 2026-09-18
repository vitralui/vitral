<script setup lang="ts">
import { toCssLength, uniformGridSize } from '@vitral/core';
import { uniformgridStyle } from '@vitral/styles';
import { mergeProps, useSlots } from 'vue';
import { useComponent } from '../../base/useComponent';
import { flattenChildren, type SlotChild } from './children';
import type { UniformGridProps, UniformGridSlots } from './types';

defineOptions({ name: 'VtUniformGrid' });

const props = withDefaults(defineProps<UniformGridProps>(), { unstyled: undefined, as: 'div' });
defineSlots<UniformGridSlots>();

const slots = useSlots();
const { part } = useComponent(uniformgridStyle, props);

// The grid is sized from its children, so the slot is rendered once, in
// the template, and those same children are what the panel draws: `layout()`
// runs first (it is the root's props), `cells()` then hands them to the loop.
let rendered: SlotChild[] = [];
let offset = 0;

function layout() {
    rendered = flattenChildren(slots.default?.());
    const size = uniformGridSize({ count: rendered.length, rows: props.rows, columns: props.columns, firstColumn: props.firstColumn });
    offset = size.firstColumn;
    return {
        style: {
            display: 'grid',
            gridTemplateColumns: `repeat(${size.columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${size.rows}, minmax(0, 1fr))`,
            gap: toCssLength(props.spacing) ?? 'var(--vt-uniformgrid-spacing)'
        }
    };
}

const cells = () => rendered;
const cellStyle = (index: number) => (index === 0 && offset > 0 ? { gridColumnStart: offset + 1 } : undefined);
</script>

<template>
    <component :is="as" v-bind="mergeProps(layout(), part('root'))">
        <component :is="cell.node" v-for="(cell, index) in cells()" :key="cell.key" :style="cellStyle(index)" />
    </component>
</template>
