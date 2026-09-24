<script setup lang="ts">
import { Icon, InputText, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const email = ref('ada@example.com');
const price = ref('1299.90');
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="it-email">Email</Label>
            <InputText id="it-email" v-model="email" type="email" clearable>
                <template #prefix><Icon icon="user" /></template>
            </InputText>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="it-price">Price</Label>
            <InputText id="it-price" v-model="price" inputmode="decimal">
                <template #prefix>R$</template>
                <template #suffix>BRL</template>
            </InputText>
        </StackPanel>
    </StackPanel>
</template>
