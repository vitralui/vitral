<script setup lang="ts">
import { parseGridDefinitions, toCssLength } from '@vitral/core';
import { gridStyle } from '@vitral/styles';
import { computed, mergeProps } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { GridProps, GridSlots } from './types';

defineOptions({ name: 'VtGrid' });

const props = withDefaults(defineProps<GridProps>(), { unstyled: undefined, as: 'div' });
defineSlots<GridSlots>();

const { part } = useComponent(gridStyle, props);

const rowTracks = computed(() => parseGridDefinitions(props.rows));
const columnTracks = computed(() => parseGridDefinitions(props.columns));

const state = computed(() => ({ showGridLines: props.showGridLines }));

const layout = computed(() => ({
    display: 'grid',
    gridTemplateRows: rowTracks.value.join(' ') || undefined,
    gridTemplateColumns: columnTracks.value.join(' ') || undefined,
    rowGap: toCssLength(props.rowSpacing) ?? 'var(--vt-grid-row-spacing)',
    columnGap: toCssLength(props.columnSpacing) ?? 'var(--vt-grid-column-spacing)',
    // The line cells are positioned against the grid.
    position: props.showGridLines ? 'relative' : undefined
}));

// One box per cell. Absolutely positioned grid children take their cell as
// containing block without occupying it, so they never push an auto-placed
// child along.
const lines = computed(() => {
    if (!props.showGridLines) return [];
    const rows = Math.max(1, rowTracks.value.length);
    const columns = Math.max(1, columnTracks.value.length);
    return Array.from({ length: rows * columns }, (_, i) => {
        const row = Math.floor(i / columns) + 1;
        const column = (i % columns) + 1;
        return {
            key: `${row}-${column}`,
            style: { position: 'absolute', inset: '0', gridRow: `${row} / ${row + 1}`, gridColumn: `${column} / ${column + 1}`, pointerEvents: 'none' }
        };
    });
});
</script>

<template>
    <component :is="as" v-bind="mergeProps({ style: layout }, part('root', state))">
        <slot />
        <span v-for="line in lines" :key="line.key" aria-hidden="true" v-bind="mergeProps({ style: line.style }, part('line'))" />
    </component>
</template>
