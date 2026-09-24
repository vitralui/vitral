<script setup lang="ts">
import { IconField, InputIcon, InputText, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const query = ref('');
const email = ref('');
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="if-search">Search</Label>
            <IconField>
                <InputIcon icon="search" />
                <InputText id="if-search" v-model="query" placeholder="Search" />
            </IconField>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="if-email">Email</Label>
            <IconField>
                <InputText id="if-email" v-model="email" type="email" />
                <InputIcon icon="user" />
            </IconField>
        </StackPanel>
    </StackPanel>
</template>
