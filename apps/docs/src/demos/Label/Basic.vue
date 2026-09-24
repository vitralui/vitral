<script setup lang="ts">
import { InputText, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const name = ref('');
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="label-name" required>Full name</Label>
        <InputText id="label-name" v-model="name" required aria-required="true" />
    </StackPanel>
</template>
