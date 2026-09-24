<script setup lang="ts">
import { InputTag, Label, Message, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const emails = ref<string[]>([]);
const rejected = ref('');

const isEmail = (tag: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(tag);

function onReject(event: { value: string; reason: string }) {
    rejected.value = event.reason === 'duplicate' ? `“${event.value}” is already there.` : `“${event.value}” is not an address.`;
}
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="tag-emails">Invite by email</Label>
        <InputTag
            id="tag-emails"
            v-model="emails"
            :separator="[',', ';', ' ']"
            :validate="isEmail"
            placeholder="name@example.com"
            :invalid="!!rejected"
            fluid
            @add="rejected = ''"
            @reject="onReject"
        />
        <Message v-if="rejected" severity="danger" size="small" variant="simple">{{ rejected }}</Message>
    </StackPanel>
</template>
