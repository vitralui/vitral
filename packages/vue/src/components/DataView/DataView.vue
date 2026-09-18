<script setup lang="ts">
import { queryData } from '@vitral/core';
import { dataviewStyle } from '@vitral/styles';
import { computed, mergeProps, ref, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import Paginator from '../Paginator/Paginator.vue';
import type { DataViewEmits, DataViewProps, DataViewSlots } from './types';

// The data layer with your own template per item: the items are sorted and
// paged here (core's queryData) and handed to the `list` or `grid` slot, which
// decides their markup, and so their semantics: a list template should render
// a list. While loading, the view is `aria-busy` with a status to say so.

defineOptions({ name: 'VtDataView' });

const props = withDefaults(defineProps<DataViewProps>(), {
    unstyled: undefined,
    value: () => [],
    layout: 'list',
    sortOrder: 1,
    rows: 12,
    pageLinkSize: 5,
    paginatorPosition: 'bottom',
    alwaysShowPaginator: true
});
const first = defineModel<number>('first', { default: 0 });
const emit = defineEmits<DataViewEmits>();
defineSlots<DataViewSlots>();

const { part, locale } = useComponent(dataviewStyle, props);
const rows = ref(props.rows);
watch(
    () => props.rows,
    (value) => (rows.value = value)
);

const sorted = computed(() => {
    if (props.lazy) return props.value;
    const sort = props.sortField && props.sortOrder ? [{ field: props.sortField, order: props.sortOrder as 1 | -1 }] : [];
    return queryData(props.value, { sort, locale: locale.value.code }).items;
});
const total = computed(() => (props.lazy ? (props.totalRecords ?? props.value.length) : sorted.value.length));
const items = computed(() => {
    if (!props.paginator || props.lazy) return sorted.value;
    return sorted.value.slice(first.value, first.value + rows.value);
});
const offset = computed(() => (props.paginator ? first.value : 0));

const paginatorAttrs = (position: 'top' | 'bottom') =>
    mergeProps(part('paginator', { position }), {
        totalRecords: total.value,
        rowsPerPageOptions: props.rowsPerPageOptions,
        pageLinkSize: props.pageLinkSize,
        alwaysShow: props.alwaysShowPaginator,
        unstyled: props.unstyled
    });
const showTop = computed(() => props.paginator && (props.paginatorPosition === 'top' || props.paginatorPosition === 'both'));
const showBottom = computed(() => props.paginator && props.paginatorPosition !== 'top');
</script>

<template>
    <div v-bind="part('root', { layout })" :aria-busy="loading ? 'true' : undefined">
        <div v-if="$slots.header" v-bind="part('header')"><slot name="header" /></div>
        <Paginator v-if="showTop" v-model:first="first" v-model:rows="rows" v-bind="paginatorAttrs('top')" @page="emit('page', $event)" />
        <div v-bind="part('content')">
            <div v-if="items.length" v-bind="part('items')">
                <slot v-if="layout === 'grid'" name="grid" :items="items" :first="offset" />
                <slot v-else name="list" :items="items" :first="offset" />
            </div>
            <div v-else-if="!loading" v-bind="part('empty')">
                <slot name="empty">{{ emptyMessage ?? locale.emptyMessage }}</slot>
            </div>
        </div>
        <Paginator v-if="showBottom" v-model:first="first" v-model:rows="rows" v-bind="paginatorAttrs('bottom')" @page="emit('page', $event)" />
        <div v-if="$slots.footer" v-bind="part('footer')"><slot name="footer" /></div>
        <div v-if="loading" role="status" v-bind="part('loader')">
            <slot name="loadingicon"><Icon icon="spinner" spin /></slot>
            <span class="vt-sr-only">{{ locale.loading }}</span>
        </div>
    </div>
</template>
