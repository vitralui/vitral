<script setup lang="ts">
import { getField } from '@vitral/core';
import { timelineStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { TimelineProps, TimelineSlots } from './types';

// An ordered list of events — the order is the meaning, so it is an <ol> and
// a screen reader says "item 2 of 5". The markers and the connecting line are
// drawing, hidden from assistive technology; a meaningful marker says so in
// its own content. Name the timeline with `aria-label` when there are several.

defineOptions({ name: 'VtTimeline' });

const props = withDefaults(defineProps<TimelineProps>(), { unstyled: undefined, value: () => [], align: 'left', layout: 'vertical' });
const slots = defineSlots<TimelineSlots>();

const { part } = useComponent(timelineStyle, props);
const state = computed(() => ({ layout: props.layout, align: props.align, opposite: !!slots.opposite }));
const keyOf = (item: unknown, index: number) => (props.dataKey ? (getField(item, props.dataKey) as PropertyKey) : index);
</script>

<template>
    <ol v-bind="part('root', state)">
        <li v-for="(item, index) in value" :key="keyOf(item, index)" v-bind="part('event')">
            <div v-bind="part('opposite')">
                <slot name="opposite" :item="item" :index="index" />
            </div>
            <div v-bind="part('separator')" aria-hidden="true">
                <slot name="marker" :item="item" :index="index"><span v-bind="part('marker')" /></slot>
                <slot name="connector" :item="item" :index="index"><span v-bind="part('connector')" /></slot>
            </div>
            <div v-bind="part('content')">
                <slot name="content" :item="item" :index="index" />
            </div>
        </li>
    </ol>
</template>
