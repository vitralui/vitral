<script setup lang="ts">
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@vitral/vue';
import { ref } from 'vue';

const tab = ref<string | number>('recent');
const views = [
    { value: 'recent', label: 'Recent', body: 'Files you opened in the last week.' },
    { value: 'shared', label: 'Shared with me', body: 'Files other people gave you access to.' },
    { value: 'favorites', label: 'Favorites', body: 'Files you starred.' },
    { value: 'trash', label: 'Recycle bin', body: 'Deleted files, kept for 30 days.', disabled: true }
];
</script>

<template>
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
    <small style="color: var(--vt-text-muted-color)">value: {{ tab }}</small>
</template>
