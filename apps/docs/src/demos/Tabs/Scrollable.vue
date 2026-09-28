<script setup lang="ts">
import { SelectButton, Tab, TabList, TabPanel, TabPanels, Tabs } from '@vitral/vue';
import { ref } from 'vue';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const tab = ref('January');
const upright = ref('January');
const buttons = ref<'sides' | 'start' | 'end' | 'none'>('sides');
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%">
        <SelectButton v-model="buttons" :options="['sides', 'start', 'end', 'none']" :allow-empty="false" aria-label="Where the buttons go" />
        <Tabs v-model:value="tab" scrollable :scroll-buttons="buttons" style="width: 100%; max-width: 32rem">
            <TabList aria-label="Months">
                <Tab v-for="m in months" :key="m" :value="m">{{ m }}</Tab>
            </TabList>
            <TabPanels>
                <TabPanel v-for="m in months" :key="m" :value="m">
                    <p style="margin: 0">The report for {{ m }}.</p>
                </TabPanel>
            </TabPanels>
        </Tabs>
        <!-- Upright, the strip scrolls within the height the Tabs are given. -->
        <Tabs v-model:value="upright" orientation="vertical" scrollable :scroll-buttons="buttons" style="width: 100%; height: 14rem">
            <TabList aria-label="Months, upright">
                <Tab v-for="m in months" :key="m" :value="m">{{ m }}</Tab>
            </TabList>
            <TabPanels>
                <TabPanel v-for="m in months" :key="m" :value="m">
                    <p style="margin: 0">The report for {{ m }}.</p>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>
