<script setup lang="ts">
import { InputMask, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const phone = ref('');
const done = ref(false);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="mask-phone">Phone</Label>
        <InputMask id="mask-phone" v-model="phone" mask="(999) 999-9999" placeholder="(999) 999-9999" autocomplete="tel-national" @complete="done = true" />
        <small style="color: var(--vt-text-muted-color)">Value: {{ phone || '—' }} {{ done ? '· complete' : '' }}</small>
    </StackPanel>
</template>
