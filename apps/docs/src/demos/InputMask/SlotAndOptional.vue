<script setup lang="ts">
import { InputMask, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const date = ref('');
const serial = ref('');
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="mask-date">Date</Label>
            <InputMask id="mask-date" v-model="date" mask="99/99/9999" slot-char="mm/dd/yyyy" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="mask-serial">Serial (last two optional)</Label>
            <InputMask id="mask-serial" v-model="serial" mask="aa-9999?-**" :auto-clear="false" />
        </StackPanel>
    </StackPanel>
</template>
