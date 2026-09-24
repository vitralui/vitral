<script setup lang="ts">
import { Panel } from '@vitral/vue';
</script>

<template>
    <Panel header="Details" toggleable :collapsed="true" toggle-icon="plus" style="width: 100%">
        <p style="margin: 0">A custom icon replaces the chevron and does not turn over.</p>
    </Panel>
</template>
