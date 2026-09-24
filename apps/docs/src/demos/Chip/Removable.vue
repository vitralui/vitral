<script setup lang="ts">
import { Chip } from '@vitral/vue';
import { ref } from 'vue';

const recipients = ref(['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson', 'Margaret Hamilton']);
</script>

<template>
    <Chip v-for="r in recipients" :key="r" :label="r" removable @remove="recipients = recipients.filter((x) => x !== r)" />
    <small v-if="!recipients.length" style="color: var(--vt-text-muted-color)">No recipients.</small>
</template>
