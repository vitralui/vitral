<script setup lang="ts">
import { Button, Dialog, InputText } from '@vitral/vue';
import { ref } from 'vue';

const visible = ref(false);
</script>

<template>
    <Button label="Open a modeless dialog" severity="secondary" @click="visible = true" />
    <Dialog v-model:visible="visible" header="Find" :modal="false" position="bottom-right" style="width: 20rem">
        <InputText aria-label="Find text" placeholder="Search the page…" fluid />
    </Dialog>
</template>
