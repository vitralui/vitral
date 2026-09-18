<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Tabs',
    category: 'Panel',
    description:
        "Views that share one place on the page. It is the WAI-ARIA tabs pattern with automatic activation: the tab list is a single tab stop, the arrows select as they move (wrapping), Home/End jump. The selected tab is marked by an accent pill, which slides to it."
};
</script>

<script setup lang="ts">
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const tab = ref<string | number>('recent');
const views = [
    { value: 'recent', label: 'Recent', body: 'Files you opened in the last week.' },
    { value: 'shared', label: 'Shared with me', body: 'Files other people gave you access to.' },
    { value: 'favorites', label: 'Favorites', body: 'Files you starred.' },
    { value: 'trash', label: 'Recycle bin', body: 'Deleted files, kept for 30 days.', disabled: true }
];
const vertical = ref<string | number>(0);
</script>

<template>
    <DemoSection title="Basic">
        <Tabs v-model:value="tab" style="width: 100%">
            <TabList aria-label="Files">
                <Tab v-for="v in views" :key="v.value" :value="v.value" :disabled="v.disabled">{{ v.label }}</Tab>
            </TabList>
            <TabPanels>
                <TabPanel v-for="v in views" :key="v.value" :value="v.value">
                    <p style="margin: 0">{{ v.body }}</p>
                </TabPanel>
            </TabPanels>
        </Tabs>
        <span class="demo-hint">value: {{ tab }}</span>
    </DemoSection>
    <DemoSection title="Vertical">
        <Tabs v-model:value="vertical" orientation="vertical" style="width: 100%">
            <TabList aria-label="Settings">
                <Tab :value="0">Account</Tab>
                <Tab :value="1">Notifications</Tab>
                <Tab :value="2">Billing</Tab>
            </TabList>
            <TabPanels>
                <TabPanel :value="0"><p style="margin: 0">Name, email and password.</p></TabPanel>
                <TabPanel :value="1"><p style="margin: 0">What to be told about, and where.</p></TabPanel>
                <TabPanel :value="2"><p style="margin: 0">Plan, invoices and payment method.</p></TabPanel>
            </TabPanels>
        </Tabs>
    </DemoSection>
    <DemoSection title="Manual activation" description="With `select-on-focus` off, the arrows only move focus; Enter or Space selects.">
        <Tabs value="a" :select-on-focus="false" lazy>
            <TabList aria-label="Manual">
                <Tab value="a">Overview</Tab>
                <Tab value="b">Activity</Tab>
                <Tab value="c">Members</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="a"><p style="margin: 0">Rendered only while selected (`lazy`).</p></TabPanel>
                <TabPanel value="b"><p style="margin: 0">Recent activity.</p></TabPanel>
                <TabPanel value="c"><p style="margin: 0">Who is in the project.</p></TabPanel>
            </TabPanels>
        </Tabs>
    </DemoSection>
</template>
