<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputOtp',
    category: 'Form',
    description:
        'One box per character of a one-time code. Typing moves on, Backspace moves back, the arrows, Home and End walk the boxes, and a pasted or autofilled code fills them all. The group carries the code’s name; each box is named by its position.'
};
</script>

<script setup lang="ts">
import { InputOtp } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const code = ref('');
const pin = ref('');
const status = ref('');
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <label for="otp-code">Verification code</label>
            <InputOtp id="otp-code" v-model="code" :length="6" integer-only @complete="status = `Checking ${$event.value}…`" />
            <span class="demo-hint" aria-live="polite">{{ status || 'Try pasting 123456.' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Masked">
        <div class="demo-field">
            <label for="otp-pin">PIN</label>
            <InputOtp id="otp-pin" v-model="pin" mask integer-only />
        </div>
    </DemoSection>
    <DemoSection title="Sizes and states">
        <InputOtp size="small" aria-label="Small" />
        <InputOtp size="large" variant="filled" aria-label="Large, filled" />
        <InputOtp invalid aria-label="Invalid" model-value="12" />
        <InputOtp disabled aria-label="Disabled" model-value="1234" />
    </DemoSection>
</template>
