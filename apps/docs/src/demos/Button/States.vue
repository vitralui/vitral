<script setup lang="ts">
import { Button } from '@vitral/vue';
import { ref } from 'vue';

const loading = ref(false);

function load() {
    loading.value = true;
    setTimeout(() => (loading.value = false), 1600);
}
</script>

<template>
    <Button label="Save" icon="check" :loading="loading" @click="load" />
    <Button label="Disabled" disabled />
    <Button label="Notifications" icon="bell" badge="8" severity="secondary" />
    <Button as="a" href="https://github.com/vitralui/vitral" target="_blank" label="A link" icon="externalLink" icon-pos="right" variant="link" />
</template>
