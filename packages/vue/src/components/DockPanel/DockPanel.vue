<script setup lang="ts">
import { dockLayout, dockTemplateAreas, toCssLength, type DockArea, type DockEdge } from '@vitral/core';
import { dockpanelStyle } from '@vitral/styles';
import { mergeProps, useSlots } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { DockPanelProps, DockPanelSlots } from './types';

defineOptions({ name: 'VtDockPanel' });

const props = withDefaults(defineProps<DockPanelProps>(), { unstyled: undefined, as: 'div' });
defineSlots<DockPanelSlots>();

const slots = useSlots();
const { part } = useComponent(dockpanelStyle, props);

const EDGES: DockEdge[] = ['top', 'bottom', 'left', 'right'];
const track = (area: DockArea) => (area === 'fill' ? 'minmax(0, 1fr)' : 'auto');

// Called from the template: which slots were passed is only known at render.
function layout() {
    const dock = dockLayout(
        EDGES.filter((edge) => !!slots[edge]),
        props.dockOrder
    );
    return {
        style: {
            display: 'grid',
            gridTemplateColumns: dock.columns.map(track).join(' '),
            gridTemplateRows: dock.rows.map(track).join(' '),
            gridTemplateAreas: dockTemplateAreas(dock),
            gap: toCssLength(props.spacing) ?? 'var(--vt-dockpanel-spacing)'
        }
    };
}

const region = (area: DockArea) => (area === 'fill' ? { gridArea: area, minWidth: 0, minHeight: 0 } : { gridArea: area });
</script>

<template>
    <component :is="as" v-bind="mergeProps(layout(), part('root'))">
        <div v-if="$slots.top" v-bind="mergeProps({ style: region('top') }, part('top'))"><slot name="top" /></div>
        <div v-if="$slots.left" v-bind="mergeProps({ style: region('left') }, part('left'))"><slot name="left" /></div>
        <div v-bind="mergeProps({ style: region('fill') }, part('fill'))"><slot /></div>
        <div v-if="$slots.right" v-bind="mergeProps({ style: region('right') }, part('right'))"><slot name="right" /></div>
        <div v-if="$slots.bottom" v-bind="mergeProps({ style: region('bottom') }, part('bottom'))"><slot name="bottom" /></div>
    </component>
</template>
