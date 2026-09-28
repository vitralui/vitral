<script setup lang="ts">
import { Button, InputText, Label, SignaturePad } from '@vitral/vue';
import { ref } from 'vue';

const name = ref('');
const signature = ref<string | null>(null);
const pad = ref<InstanceType<typeof SignaturePad> | null>(null);
const sent = ref('');

async function submit() {
    const png = await pad.value?.toPNG();
    sent.value = png ? `Sent ${name.value || 'the form'} with a ${Math.max(1, Math.round(png.size / 1024))} KB PNG.` : 'Sign first.';
}
</script>

<template>
    <form style="display: grid; gap: 0.75rem; max-width: 28rem" @submit.prevent="submit">
        <Label for="sig-name">Full name</Label>
        <InputText id="sig-name" v-model="name" />
        <Label id="sig-label">Signature</Label>
        <SignaturePad ref="pad" v-model="signature" aria-labelledby="sig-label" height="8rem" pen-color="#1d4ed8" />
        <div style="display: flex; gap: 0.75rem; align-items: center">
            <Button type="submit" label="Send" :disabled="!signature" />
            <span role="status">{{ sent }}</span>
        </div>
    </form>
</template>
