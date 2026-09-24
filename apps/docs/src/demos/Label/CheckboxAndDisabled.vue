<script setup lang="ts">
import { Checkbox, InputText, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const agree = ref(false);
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <div style="display: flex; align-items: center; gap: 0.5rem">
            <Checkbox id="label-agree" v-model="agree" binary />
            <Label for="label-agree">I agree to the terms</Label>
        </div>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="label-off">Disabled field</Label>
            <InputText id="label-off" disabled />
        </StackPanel>
    </StackPanel>
</template>
