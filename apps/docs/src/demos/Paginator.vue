<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Paginator',
    category: 'Data',
    description: 'Moves through pages of data, with first, previous, numbered, next and last buttons, and a rows-per-page choice.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Paginator/Basic.vue';
import CurrentPageReport from './Paginator/CurrentPageReport.vue';
import StartAndEnd from './Paginator/StartAndEnd.vue';
</script>

<template>
    <DemoSection title="Basic" description="120 records, ten per page, with a choice of page size."><Basic /></DemoSection>
    <DemoSection title="Current page report" description="The report follows the locale (`pageReport`); a template of your own can say it differently."><CurrentPageReport /></DemoSection>
    <DemoSection title="Start and end content"><StartAndEnd /></DemoSection>
</template>
