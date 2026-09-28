<script setup lang="ts">
import { banknote, receipt, users } from '@vitral/icons';
import { Card, Stat } from '@vitral/vue';
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 1rem; width: 100%">
        <Card><Stat label="Revenue" :icon="banknote" :value="48250" :format="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }" :delta="0.124" caption="vs last month" /></Card>
        <Card><Stat label="Active users" :icon="users" :value="18400" :format="{ notation: 'compact' }" :delta="0.031" caption="vs last month" /></Card>
        <Card><Stat label="Churn" icon="trendingDown" :value="2.4" suffix="%" :delta="0" caption="no change" /></Card>
        <Card><Stat label="Orders" :icon="receipt" loading /></Card>
    </div>
</template>
