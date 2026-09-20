<script setup lang="ts">
import { download } from '@vitral/icons';
import { Avatar, Button, Column, DataGrid, DatePicker, Icon, InputText, MultiSelect, Select, Tag } from '@vitral/vue';
import { computed, ref, useId } from 'vue';
import { categories, money, signed, transactions, type Transaction } from './data';

const id = useId();
const field = (name: string) => `${id}-${name}`;

const query = ref('');
const picked = ref<string[]>([]);
const account = ref<string | null>(null);
const since = ref<Date | null>(null);
const accountOptions = ['Everyday', 'Harborline Card'];

const rows = computed(() =>
    transactions.filter(
        (item) =>
            item.payee.toLowerCase().includes(query.value.trim().toLowerCase()) &&
            (picked.value.length === 0 || picked.value.includes(item.category)) &&
            (!account.value || item.account === account.value) &&
            (!since.value || item.date >= since.value)
    )
);
const moneyIn = computed(() => rows.value.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0));
const moneyOut = computed(() => rows.value.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0));

function clear() {
    query.value = '';
    picked.value = [];
    account.value = null;
    since.value = null;
}

const day = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
</script>

<template>
    <div class="tp-head">
        <div>
            <h1 class="tp-h1">Transactions</h1>
            <p class="tp-muted">
                {{ rows.length }} shown · in <span class="tp-delta-up">{{ money.format(moneyIn) }}</span> · out {{ money.format(Math.abs(moneyOut)) }}
            </p>
        </div>
        <Button label="Export CSV" :icon="download" severity="secondary" variant="outlined" size="small" />
    </div>

    <div class="tp-card tp-filter-bar" role="search" aria-label="Filter transactions">
        <div class="tp-field">
            <label :for="field('q')" class="tp-label">Payee</label>
            <InputText :id="field('q')" v-model="query" placeholder="Search" clearable fluid>
                <template #prefix><Icon icon="search" /></template>
            </InputText>
        </div>
        <div class="tp-field">
            <span :id="field('cat')" class="tp-label">Categories</span>
            <MultiSelect v-model="picked" :options="categories" placeholder="All categories" :max-selected-labels="2" :aria-labelledby="field('cat')" fluid />
        </div>
        <div class="tp-field">
            <span :id="field('acc')" class="tp-label">Account</span>
            <Select v-model="account" :options="accountOptions" placeholder="All accounts" show-clear :aria-labelledby="field('acc')" fluid />
        </div>
        <div class="tp-field">
            <label :for="field('since')" class="tp-label">Since</label>
            <DatePicker :id="field('since')" v-model="since" placeholder="Any date" show-clear-button fluid />
        </div>
        <Button label="Clear" variant="text" severity="secondary" @click="clear" />
    </div>

    <div class="tp-card tp-card-flush">
        <DataGrid
            :value="rows"
            data-key="id"
            paginator
            :rows="8"
            sort-field="date"
            :sort-order="-1"
            removable-sort
            caption="Transactions"
            class="tp-table"
            empty-message="No transactions match these filters."
        >
            <Column field="date" header="Date" sortable>
                <template #body="{ data }"
                    ><span class="tp-num">{{ day((data as Transaction).date) }}</span></template
                >
            </Column>
            <Column field="payee" header="Payee" sortable>
                <template #body="{ data }">
                    <span class="tp-person">
                        <Avatar :label="(data as Transaction).payee.slice(0, 1)" shape="circle" />
                        <span>
                            <b>{{ (data as Transaction).payee }}</b>
                            <small>{{ (data as Transaction).account }}</small>
                        </span>
                    </span>
                </template>
            </Column>
            <Column field="category" header="Category" sortable>
                <template #body="{ data }"
                    ><Tag :value="(data as Transaction).category" :severity="(data as Transaction).category === 'Income' ? 'success' : 'secondary'"
                /></template>
            </Column>
            <Column field="status" header="Status">
                <template #body="{ data }"
                    ><span :class="{ 'tp-muted': (data as Transaction).status === 'Posted' }">{{ (data as Transaction).status }}</span></template
                >
            </Column>
            <Column field="amount" header="Amount" sortable align="right">
                <template #body="{ data }">
                    <b class="tp-num" :class="{ 'tp-delta-up': (data as Transaction).amount > 0 }">{{ signed((data as Transaction).amount) }}</b>
                </template>
            </Column>
        </DataGrid>
    </div>
</template>
