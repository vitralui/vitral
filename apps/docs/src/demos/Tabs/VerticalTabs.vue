<script setup lang="ts">
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@vitral/vue';
import { ref } from 'vue';

const vertical = ref<string | number>(0);
</script>

<template>
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
</template>
