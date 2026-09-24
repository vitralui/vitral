<script setup lang="ts">
import { Checkbox } from '@vitral/vue';
import { ref } from 'vue';

const accepted = ref(false);
const newsletter = ref('no');
</script>

<template>
    <Checkbox v-model="accepted" label="I accept the terms" />
    <Checkbox v-model="newsletter" true-value="yes" false-value="no" label="Send me the newsletter" />
    <small style="color: var(--vt-text-muted-color)">accepted: {{ accepted }}, newsletter: {{ newsletter }}</small>
</template>
