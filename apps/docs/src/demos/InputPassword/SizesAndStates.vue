<script setup lang="ts">
import { InputPassword } from '@vitral/vue';
</script>

<template>
    <InputPassword size="small" aria-label="Small" :feedback="false" />
    <InputPassword variant="filled" aria-label="Filled" :feedback="false" />
    <InputPassword invalid aria-label="Invalid" :feedback="false" />
    <InputPassword disabled aria-label="Disabled" model-value="secret" />
</template>
