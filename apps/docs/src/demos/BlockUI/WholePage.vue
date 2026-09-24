<script setup lang="ts">
import { BlockUI, Button, ProgressSpinner } from '@vitral/vue';
import { ref } from 'vue';

const page = ref(false);

function blockPage() {
    page.value = true;
    setTimeout(() => (page.value = false), 2000);
}
</script>

<template>
    <Button label="Block for two seconds" @click="blockPage" />
    <BlockUI :blocked="page" full-screen label="Please wait">
        <template #mask><ProgressSpinner aria-hidden="true" /></template>
    </BlockUI>
</template>
