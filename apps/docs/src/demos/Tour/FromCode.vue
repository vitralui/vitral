<script setup lang="ts">
import { Button, useTour } from '@vitral/vue';
import { ref } from 'vue';

const help = ref<{ $el: HTMLElement } | null>(null);
const tour = useTour();

function explain() {
    tour.highlight({
        element: help.value,
        popover: { title: 'Help', description: 'Opens the help centre, and the chat with support.', side: 'right', align: 'center' }
    });
}
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center">
        <Button ref="help" icon="info" aria-label="Help" rounded variant="outlined" severity="secondary" />
        <Button label="What is this button?" variant="text" @click="explain" />
    </div>
</template>
