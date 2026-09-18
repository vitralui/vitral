<script setup lang="ts">
import { Avatar, Button, Card, Chart, Select, Tag, type ChartOptions } from '@vitral/vue';
import { ref, useId } from 'vue';
import { useTemplate } from '../kit/context';
import { activity, customers, healthSeverity, initials, months, plans, revenue, signups } from './data';

const { go } = useTemplate();
const rangeId = useId();
const range = ref('12m');
const ranges = [
    { label: 'Last 12 months', value: '12m' },
    { label: 'Last 6 months', value: '6m' },
    { label: 'This quarter', value: 'q' }
];

const kpis = [
    { label: 'Monthly recurring revenue', value: '$64.7K', delta: '+7.3%', up: true, series: revenue.mrr },
    { label: 'Active customers', value: '850', delta: '+42', up: true, series: [690, 702, 715, 731, 748, 760, 772, 790, 803, 818, 831, 850] },
    { label: 'Net revenue retention', value: '112%', delta: '+2 pts', up: true, series: [104, 105, 105, 106, 107, 108, 108, 109, 110, 110, 111, 112] },
    { label: 'Churn rate', value: '1.8%', delta: '+0.2 pts', up: false, series: [2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.7, 1.6, 1.6, 1.7, 1.6, 1.8] }
];

const spark = (up: boolean): ChartOptions => ({
    chart: { sparkline: { enabled: true }, height: 40 },
    colors: [up ? 'var(--vt-chart-3)' : 'var(--vt-chart-6)'],
    stroke: { width: 2, curve: 'smooth' },
    tooltip: { enabled: false }
});

const revenueSeries = [
    { name: 'New and existing MRR', data: revenue.mrr },
    { name: 'Expansion', data: revenue.expansion }
];
const revenueOptions: ChartOptions = {
    chart: { toolbar: { show: false }, height: 280 },
    xaxis: { categories: months },
    yaxis: { labels: { formatter: '${value}K' } },
    stroke: { curve: 'smooth', width: 2 },
    legend: { position: 'top', horizontalAlign: 'left' },
    tooltip: { y: { formatter: '${value}K' } }
};

const signupOptions: ChartOptions = {
    chart: { toolbar: { show: false }, height: 240 },
    xaxis: { categories: months },
    plotOptions: { bar: { borderRadius: 3, columnWidth: '60%' } },
    legend: { position: 'top', horizontalAlign: 'left' }
};

const planOptions: ChartOptions = {
    chart: { toolbar: { show: false }, height: 240 },
    labels: plans.labels,
    legend: { position: 'bottom' },
    plotOptions: { pie: { donut: { labels: { total: { label: 'Customers' } } } } }
};

const top = [...customers].sort((a, b) => b.mrr - a.mrr).slice(0, 5);
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
</script>

<template>
    <div class="tp-head">
        <div>
            <h1 class="tp-h1">Good morning, Priya</h1>
            <p class="tp-muted">Revenue is up for the sixth month running.</p>
        </div>
        <div class="tp-toolbar">
            <span :id="rangeId" class="vt-sr-only">Range</span>
            <Select v-model="range" :options="ranges" option-label="label" option-value="value" size="small" :aria-labelledby="rangeId" />
            <Button label="Export" icon="download" severity="secondary" variant="outlined" size="small" />
        </div>
    </div>

    <dl class="tp-kpis">
        <div v-for="kpi in kpis" :key="kpi.label" class="tp-kpi">
            <dt>{{ kpi.label }}</dt>
            <dd>
                {{ kpi.value }}
                <Tag :value="kpi.delta" :severity="kpi.up ? 'success' : 'danger'" rounded />
            </dd>
            <dd class="tp-spark"><Chart type="area" :series="[{ name: kpi.label, data: kpi.series }]" :options="spark(kpi.up)" :aria-label="`${kpi.label}, last 12 months`" /></dd>
        </div>
    </dl>

    <div class="tp-dash-grid">
        <Card title="Recurring revenue" subtitle="In thousands of dollars, by month">
            <Chart type="area" :series="revenueSeries" :options="revenueOptions" />
        </Card>
        <Card title="Plan mix" subtitle="Paying customers by plan">
            <Chart type="donut" :series="plans.values" :options="planOptions" />
        </Card>
    </div>

    <div class="tp-dash-grid">
        <Card title="Trials and conversions">
            <Chart type="bar" :series="signups" :options="signupOptions" />
        </Card>
        <Card title="Activity">
            <ul class="tp-rule-list">
                <li v-for="item in activity" :key="item.who + item.what">
                    <div class="tp-person">
                        <Avatar :label="initials(item.who)" shape="circle" />
                        <span>
                            <b>{{ item.who }}</b>
                            <small>{{ item.what }} · {{ item.when }}</small>
                        </span>
                    </div>
                </li>
            </ul>
        </Card>
    </div>

    <Card>
        <template #title>
            <div class="tp-card-head">
                <h2 class="tp-h3">Top accounts</h2>
                <Button label="All customers" icon="arrowRight" icon-pos="right" variant="text" size="small" @click="go('customers')" />
            </div>
        </template>
        <ul class="tp-rule-list">
            <li v-for="customer in top" :key="customer.id" class="tp-row tp-row-between">
                <span class="tp-person">
                    <Avatar :label="initials(customer.company)" />
                    <span>
                        <b>{{ customer.company }}</b>
                        <small>{{ customer.plan }} · {{ customer.seats }} seats</small>
                    </span>
                </span>
                <span class="tp-row">
                    <Tag :value="customer.health" :severity="healthSeverity(customer.health)" />
                    <b class="tp-num">{{ money.format(customer.mrr) }}</b>
                </span>
            </li>
        </ul>
    </Card>
</template>
