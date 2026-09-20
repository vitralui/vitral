<script setup lang="ts">
import { userPlus } from '@vitral/icons';
import { Avatar, Button, Column, DataGrid, Icon, InputText, SelectButton, Tag } from '@vitral/vue';
import { computed, ref } from 'vue';
import { customers, healthSeverity, initials, type Customer } from './data';

const plan = ref('All');
const planOptions = ['All', 'Starter', 'Growth', 'Scale', 'Enterprise'];
const filters = ref({ global: { value: null as string | null, matchMode: 'contains' } });
const selected = ref<Customer[]>([]);

const rows = computed(() => (plan.value === 'All' ? customers : customers.filter((customer) => customer.plan === plan.value)));
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const total = computed(() => rows.value.reduce((sum, customer) => sum + customer.mrr, 0));
</script>

<template>
    <div class="tp-head">
        <div>
            <h1 class="tp-h1">Customers</h1>
            <p class="tp-muted">{{ rows.length }} accounts · {{ money.format(total) }} MRR</p>
        </div>
        <div class="tp-toolbar">
            <Button v-if="selected.length" :label="`Email ${selected.length}`" icon="upload" severity="secondary" size="small" />
            <Button label="Add customer" :icon="userPlus" size="small" />
        </div>
    </div>

    <div class="tp-card tp-card-flush">
        <DataGrid
            v-model:filters="filters"
            v-model:selection="selected"
            :value="rows"
            data-key="id"
            :global-filter-fields="['company', 'contact', 'email', 'country']"
            paginator
            :rows="8"
            removable-sort
            selection-mode="multiple"
            caption="Customers"
            class="tp-table"
            empty-message="No customer matches that search."
        >
            <template #header>
                <div class="tp-head tp-table-head">
                    <SelectButton v-model="plan" :options="planOptions" :allow-empty="false" label="Plan" size="small" />
                    <InputText v-model="filters.global.value" placeholder="Search customers" aria-label="Search customers" size="small" clearable class="tp-table-search">
                        <template #prefix><Icon icon="search" /></template>
                    </InputText>
                </div>
            </template>
            <Column selection-mode="multiple" header-style="width: 3rem" />
            <Column field="company" header="Company" sortable>
                <template #body="{ data }">
                    <span class="tp-person">
                        <Avatar :label="initials((data as Customer).company)" />
                        <span>
                            <b>{{ (data as Customer).company }}</b>
                            <small>{{ (data as Customer).email }}</small>
                        </span>
                    </span>
                </template>
            </Column>
            <Column field="plan" header="Plan" sortable />
            <Column field="seats" header="Seats" sortable>
                <template #body="{ data }"
                    ><span class="tp-num">{{ (data as Customer).seats }}</span></template
                >
            </Column>
            <Column field="mrr" header="MRR" sortable>
                <template #body="{ data }"
                    ><span class="tp-num">{{ money.format((data as Customer).mrr) }}</span></template
                >
            </Column>
            <Column field="health" header="Health" sortable>
                <template #body="{ data }"><Tag :value="(data as Customer).health" :severity="healthSeverity((data as Customer).health)" /></template>
            </Column>
            <Column field="since" header="Customer since" />
        </DataGrid>
    </div>
</template>
