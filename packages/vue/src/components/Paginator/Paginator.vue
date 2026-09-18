<script setup lang="ts">
import { clampFirst, formatMessage, goToPage, pageCount as countPages, pageLinks, pageOf, pageReportParams } from '@vitral/core';
import { paginatorStyle } from '@vitral/styles';
import { computed, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import Select from '../Select/Select.vue';
import type { PaginatorEmits, PaginatorPageEvent, PaginatorProps, PaginatorSlots, PaginatorTemplateItem } from './types';

// A navigation landmark holding plain buttons: there is no APG pattern for a
// pager beyond that, so every control is a native button in the tab order.
// The ends are announced disabled (aria-disabled) rather than disabled, so
// focus stays on "Next" when it reaches the last page instead of falling to
// the document.

defineOptions({ name: 'VtPaginator' });

const props = withDefaults(defineProps<PaginatorProps>(), {
    unstyled: undefined,
    totalRecords: 0,
    pageLinkSize: 5,
    template: (): PaginatorTemplateItem[] => ['FirstPageLink', 'PrevPageLink', 'PageLinks', 'NextPageLink', 'LastPageLink', 'RowsPerPageDropdown'],
    alwaysShow: true
});
const first = defineModel<number>('first', { default: 0 });
const rows = defineModel<number>('rows', { default: 10 });
const emit = defineEmits<PaginatorEmits>();
defineSlots<PaginatorSlots>();

const { part, locale } = useComponent(paginatorStyle, props);

const items = computed<string[]>(() => (typeof props.template === 'string' ? props.template.split(/\s+/).filter(Boolean) : props.template));
const pageCount = computed(() => countPages(props.totalRecords, rows.value));
const page = computed(() => Math.min(pageOf(first.value, rows.value), pageCount.value - 1));
const links = computed(() => pageLinks(page.value, pageCount.value, props.pageLinkSize));
const atStart = computed(() => page.value <= 0);
const atEnd = computed(() => page.value >= pageCount.value - 1);
const state = computed<PaginatorPageEvent>(() => ({ page: page.value, first: first.value, rows: rows.value, pageCount: pageCount.value }));
const report = computed(() => formatMessage(props.currentPageReportTemplate ?? locale.value.pageReport, pageReportParams(first.value, rows.value, props.totalRecords)));
const visible = computed(() => props.alwaysShow || pageCount.value > 1);
const rowOptions = computed(() => (props.rowsPerPageOptions ?? []).map((n) => ({ label: String(n), value: n })));

function changePage(target: number) {
    const next = goToPage(target, rows.value, props.totalRecords);
    if (next.first === first.value) return;
    first.value = next.first;
    emit('page', next);
}

// A new page size keeps the first row on screen, rather than jumping back to page one.
function changeRows(value: unknown) {
    const size = Number(value);
    if (!(size > 0) || size === rows.value) return;
    const nextFirst = pageOf(first.value, size) * size;
    rows.value = size;
    first.value = nextFirst;
    emit('page', { page: pageOf(nextFirst, size), first: nextFirst, rows: size, pageCount: countPages(props.totalRecords, size) });
}

// When the data shrinks under the current page (a filter, a delete), move to the last page that exists.
// A total of 0 is left alone: a lazy table reports it before its first page arrives.
watch(
    () => props.totalRecords,
    (total) => {
        if (!(total > 0)) return;
        const clamped = clampFirst(first.value, rows.value, total);
        if (clamped < first.value) {
            first.value = clamped;
            emit('page', { page: pageOf(clamped, rows.value), first: clamped, rows: rows.value, pageCount: countPages(total, rows.value) });
        }
    }
);

const pageLabel = (n: number) => formatMessage(locale.value.aria.page, { page: n + 1 });
</script>

<template>
    <nav v-if="visible" v-bind="part('root')" :aria-label="locale.aria.pagination">
        <div v-if="$slots.start" v-bind="part('start')"><slot name="start" v-bind="state" /></div>
        <template v-for="item in items" :key="item">
            <button
                v-if="item === 'FirstPageLink'"
                type="button"
                v-bind="part('first')"
                :aria-label="locale.aria.first"
                :aria-disabled="atStart ? 'true' : undefined"
                @click="changePage(0)"
            >
                <Icon icon="chevronsLeft" />
            </button>
            <button
                v-else-if="item === 'PrevPageLink'"
                type="button"
                v-bind="part('prev')"
                :aria-label="locale.aria.previous"
                :aria-disabled="atStart ? 'true' : undefined"
                @click="changePage(page - 1)"
            >
                <Icon icon="chevronLeft" />
            </button>
            <span v-else-if="item === 'PageLinks'" v-bind="part('pages')">
                <button
                    v-for="n in links"
                    :key="n"
                    type="button"
                    v-bind="part('page', { selected: n === page })"
                    :aria-label="pageLabel(n)"
                    :aria-current="n === page ? 'page' : undefined"
                    @click="changePage(n)"
                >
                    {{ n + 1 }}
                </button>
            </span>
            <button
                v-else-if="item === 'NextPageLink'"
                type="button"
                v-bind="part('next')"
                :aria-label="locale.aria.next"
                :aria-disabled="atEnd ? 'true' : undefined"
                @click="changePage(page + 1)"
            >
                <Icon icon="chevronRight" />
            </button>
            <button
                v-else-if="item === 'LastPageLink'"
                type="button"
                v-bind="part('last')"
                :aria-label="locale.aria.last"
                :aria-disabled="atEnd ? 'true' : undefined"
                @click="changePage(pageCount - 1)"
            >
                <Icon icon="chevronsRight" />
            </button>
            <span v-else-if="item === 'CurrentPageReport'" v-bind="part('current')" aria-live="polite">{{ report }}</span>
            <Select
                v-else-if="item === 'RowsPerPageDropdown' && rowOptions.length"
                v-bind="part('rowsPerPage')"
                :model-value="rows"
                :options="rowOptions"
                option-label="label"
                option-value="value"
                size="small"
                :aria-label="locale.rowsPerPage"
                @update:model-value="changeRows"
            />
        </template>
        <div v-if="$slots.end" v-bind="part('end')"><slot name="end" v-bind="state" /></div>
    </nav>
</template>
