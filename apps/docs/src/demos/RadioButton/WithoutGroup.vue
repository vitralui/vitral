<script setup lang="ts">
import { RadioButton } from '@vitral/vue';
import { ref } from 'vue';

const theme = ref('light');
</script>

<template>
    <RadioButton v-model="theme" value="light" name="rb-theme" label="Light" />
    <RadioButton v-model="theme" value="dark" name="rb-theme" label="Dark" />
    <RadioButton model-value="on" value="on" name="rb-disabled" label="Disabled checked" disabled />
</template>
