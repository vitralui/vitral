<script setup lang="ts">
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@vitral/vue';
</script>

<template>
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
</template>
