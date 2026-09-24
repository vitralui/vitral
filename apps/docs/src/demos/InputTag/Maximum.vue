<script setup lang="ts">
import { InputTag, Label, Message, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const colours = ref(['red', 'green']);
const rejected = ref('');

function onReject(event: { value: string; reason: string }) {
    rejected.value = event.reason === 'duplicate' ? `“${event.value}” is already there.` : 'That is as many as it takes.';
}
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="tag-max">Up to three colours</Label>
        <InputTag id="tag-max" v-model="colours" :max="3" placeholder="Add a colour" fluid @add="rejected = ''" @remove="rejected = ''" @reject="onReject" />
        <Message v-if="rejected" severity="danger" size="small" variant="simple">{{ rejected }}</Message>
    </StackPanel>
</template>
