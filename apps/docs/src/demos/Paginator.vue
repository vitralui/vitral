<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Paginator',
    category: 'Data',
    description:
        'Moves through pages of data. A navigation landmark of native buttons: each page is named ("Page 3") and the current one carries aria-current; the ends stay focusable but announced disabled, so focus is never dropped. The page arithmetic lives in @vitral/core.'
};
</script>

<script setup lang="ts">
import { Paginator } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const first = ref(0);
const rows = ref(10);
const reportFirst = ref(40);
const reportRows = ref(20);
const compactFirst = ref(0);
const lastEvent = ref('');
</script>

<template>
    <DemoSection title="Basic" description="120 records, ten per page, with a choice of page size.">
        <div class="demo-stack" style="width: 100%">
            <Paginator
                v-model:first="first"
                v-model:rows="rows"
                :total-records="120"
                :rows-per-page-options="[10, 20, 50]"
                @page="lastEvent = `page ${$event.page + 1} of ${$event.pageCount}, first row ${$event.first}`"
            />
            <span class="demo-hint">first = {{ first }}, rows = {{ rows }}{{ lastEvent ? ` — ${lastEvent}` : '' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Current page report" description="The report follows the locale (`pageReport`); a template of your own can say it differently.">
        <div class="demo-stack" style="width: 100%">
            <Paginator
                v-model:first="reportFirst"
                v-model:rows="reportRows"
                :total-records="1287"
                template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                :rows-per-page-options="[20, 50, 100]"
            />
            <Paginator v-model:first="reportFirst" v-model:rows="reportRows" :total-records="1287" template="PrevPageLink PageLinks NextPageLink CurrentPageReport" current-page-report-template="Page {page} of {pageCount}" :page-link-size="7" />
        </div>
    </DemoSection>
    <DemoSection title="Start and end content">
        <div class="demo-stack" style="width: 100%">
            <Paginator v-model:first="compactFirst" :rows="25" :total-records="340" template="PrevPageLink PageLinks NextPageLink" :page-link-size="3">
                <template #start="{ page, pageCount }">
                    <span class="demo-hint">Invoices · page {{ page + 1 }} of {{ pageCount }}</span>
                </template>
                <template #end>
                    <span class="demo-hint">340 invoices</span>
                </template>
            </Paginator>
        </div>
    </DemoSection>
</template>
