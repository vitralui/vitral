<script setup lang="ts">
import { Button, Message, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const shown = ref(true);
const key = ref(0);
</script>

<template>
    <StackPanel spacing="0.625rem" style="width: 100%">
        <Message v-if="shown" :key="key" severity="info" title="New sign-in" closable @close="shown = false">
            Someone signed in from a new device in São Paulo.
            <template #action>
                <Button label="Review" size="small" severity="secondary" />
            </template>
        </Message>
        <Button v-else label="Show it again" severity="secondary" size="small" @click="(shown = true), key++" />
    </StackPanel>
</template>
