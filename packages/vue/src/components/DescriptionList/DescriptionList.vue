<script setup lang="ts">
import { descriptionlistStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { DescriptionListProps, DescriptionListSlots } from './types';

defineOptions({ name: 'VtDescriptionList' });

const props = withDefaults(defineProps<DescriptionListProps>(), { unstyled: undefined, items: () => [], columns: 1, layout: 'vertical', emptyValue: '—' });
const slots = defineSlots<DescriptionListSlots>();

const { part } = useComponent(descriptionlistStyle, props);

const state = computed(() => ({ layout: props.layout, bordered: props.bordered, striped: props.striped, size: props.size }));
const listStyle = computed(() => ({
    '--vt-descriptionlist-columns': String(Math.max(1, Math.floor(props.columns))),
    ...(props.labelWidth ? { '--vt-descriptionlist-label-width': props.labelWidth } : {})
}));
const heading = computed(() => (props.headingLevel ? `h${props.headingLevel}` : 'div'));
const empty = (value: unknown) => value === undefined || value === null || value === '';
</script>

<template>
    <div v-bind="part('root', state)">
        <div v-if="title || slots.title || slots.extra" v-bind="part('header')">
            <component :is="heading" v-if="title || slots.title" v-bind="part('title')">
                <slot name="title">{{ title }}</slot>
            </component>
            <div v-if="slots.extra" v-bind="part('extra')"><slot name="extra" /></div>
        </div>
        <dl :style="listStyle" v-bind="part('list')">
            <!-- A <div> around each pair is allowed in a <dl>, and it is what lets a pair take a cell of the grid. -->
            <div
                v-for="(item, index) in items"
                :key="item.key ?? item.label"
                :style="item.span && item.span > 1 ? { '--vt-descriptionlist-span': String(item.span) } : undefined"
                v-bind="part('item')"
            >
                <dt v-bind="part('label')">
                    <slot name="label" :item="item" :index="index">{{ item.label }}</slot>
                </dt>
                <dd v-bind="part('value')">
                    <slot name="value" :item="item" :index="index">{{ empty(item.value) ? emptyValue : item.value }}</slot>
                </dd>
            </div>
        </dl>
    </div>
</template>
