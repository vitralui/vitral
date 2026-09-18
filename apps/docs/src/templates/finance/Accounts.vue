<script setup lang="ts">
import { creditCard, eye, eyeOff, piggyBank, trendingUp, wallet } from '@vitral/icons';
import { Avatar, Button, Card, Chart, Icon, ProgressBar, Tag, type ChartOptions } from '@vitral/vue';
import { computed, ref } from 'vue';
import { useTemplate } from '../kit/context';
import { accounts, budget, income, money, months, netWorth, signed, spending, transactions } from './data';

const { go } = useTemplate();
const hidden = ref(false);
const shown = (value: number) => (hidden.value ? '••••••' : money.format(value));

const total = computed(() => accounts.reduce((sum, account) => sum + account.balance, 0));
const icon = { Checking: wallet, Savings: piggyBank, Investments: trendingUp, 'Credit card': creditCard };

const worthOptions: ChartOptions = {
    chart: { toolbar: { show: false }, height: 220 },
    xaxis: { categories: months },
    yaxis: { labels: { formatter: '${value}K' } },
    stroke: { curve: 'smooth', width: 2 },
    tooltip: { y: { formatter: '${value}K' } },
    legend: { show: false }
};

const flowOptions: ChartOptions = {
    chart: { toolbar: { show: false }, height: 220 },
    xaxis: { categories: months.slice(-6) },
    yaxis: { labels: { formatter: '${value}K' } },
    plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
    legend: { position: 'top', horizontalAlign: 'left' },
    tooltip: { y: { formatter: '${value}K' } }
};
const flow = [
    { name: 'Money in', data: income.slice(-6) },
    { name: 'Money out', data: spending.slice(-6) }
];

const recent = computed(() => transactions.slice(0, 5));
</script>

<template>
    <div class="tp-head">
        <div>
            <span class="tp-muted">Total balance</span>
            <h1 class="tp-h1 tp-balance">{{ shown(total) }}</h1>
        </div>
        <Button :icon="hidden ? eye : eyeOff" :label="hidden ? 'Show balances' : 'Hide balances'" severity="secondary" variant="outlined" size="small" @click="hidden = !hidden" />
    </div>

    <ul class="tp-kpis tp-accounts" aria-label="Accounts">
        <li v-for="account in accounts" :key="account.id" class="tp-kpi tp-account" :class="{ 'tp-account-card': account.kind === 'Credit card' }">
            <div class="tp-row tp-row-between">
                <span class="tp-row"><Icon :icon="icon[account.kind]" /> {{ account.name }}</span>
                <small>{{ account.number }}</small>
            </div>
            <b class="tp-account-balance">{{ shown(account.balance) }}</b>
            <small>
                {{ account.kind }} ·
                <span :class="account.change >= 0 ? 'tp-delta-up' : 'tp-delta-down'">{{ hidden ? '••' : signed(account.change) }}</span>
                this month
            </small>
        </li>
    </ul>

    <div class="tp-dash-grid tp-dash-grid-even">
        <Card title="Net worth" subtitle="Thousands of dollars, last 12 months">
            <Chart type="area" :series="[{ name: 'Net worth', data: netWorth }]" :options="worthOptions" />
        </Card>
        <Card title="Cash flow" subtitle="Money in and out, last 6 months">
            <Chart type="bar" :series="flow" :options="flowOptions" />
        </Card>
    </div>

    <div class="tp-dash-grid">
        <Card>
            <template #title>
                <div class="tp-card-head">
                    <h2 class="tp-h3">Recent activity</h2>
                    <Button label="All transactions" icon="arrowRight" icon-pos="right" variant="text" size="small" @click="go('transactions')" />
                </div>
            </template>
            <ul class="tp-rule-list">
                <li v-for="item in recent" :key="item.id" class="tp-row tp-row-between">
                    <span class="tp-person">
                        <Avatar :label="item.payee.slice(0, 1)" shape="circle" />
                        <span>
                            <b>{{ item.payee }}</b>
                            <small>{{ item.category }} · {{ item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}</small>
                        </span>
                    </span>
                    <span class="tp-row">
                        <Tag v-if="item.status === 'Pending'" value="Pending" severity="secondary" />
                        <b class="tp-num" :class="{ 'tp-delta-up': item.amount > 0 }">{{ hidden ? '••••' : signed(item.amount) }}</b>
                    </span>
                </li>
            </ul>
        </Card>
        <Card title="Budgets" subtitle="September">
            <div class="tp-stack">
                <div v-for="line in budget" :key="line.label" class="tp-progress-row">
                    <div>
                        <span>{{ line.label }}</span>
                        <span :class="line.value > line.limit ? 'tp-delta-down' : 'tp-muted'">{{ money.format(line.value) }} of {{ money.format(line.limit) }}</span>
                    </div>
                    <ProgressBar
                        :value="Math.min(100, Math.round((line.value / line.limit) * 100))"
                        :show-value="false"
                        :aria-label="`${line.label} budget used`"
                        :class="{ 'tp-over': line.value > line.limit }"
                    />
                </div>
            </div>
        </Card>
    </div>
</template>
