<script setup lang="ts">
import { BlockUI, Button, InputText, ProgressSpinner } from '@vitral/vue';
import { ref } from 'vue';

const blocked = ref(false);
</script>

<template>
    <Button :label="blocked ? 'Unblock' : 'Block'" style="align-self: flex-start" @click="blocked = !blocked" />
    <BlockUI :blocked="blocked" label="Saving the form">
        <div style="display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; border: 1px solid var(--vt-content-border-color); border-radius: 8px">
            <label for="block-name">Name</label>
            <InputText id="block-name" />
            <Button label="Save" style="align-self: flex-start" />
        </div>
        <template #mask><ProgressSpinner aria-hidden="true" /></template>
    </BlockUI>
</template>
