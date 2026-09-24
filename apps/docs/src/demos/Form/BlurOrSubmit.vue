<script setup lang="ts">
import { Form, InputText, rules } from '@vitral/vue';
import { ref } from 'vue';

const onBlurResult = ref('');
const onSubmitResult = ref('');
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1.5rem; width: 100%">
        <Form.Root :initial-values="{ email: '' }" validate-on="blur" aria-label="Checked on blur" @submit="(e) => (onBlurResult = e.valid ? 'Sent' : 'Fix the address')">
            <Form.Field name="email" label="Email (checked on blur)" required :rules="rules.email()">
                <InputText type="email" fluid />
            </Form.Field>
            <Form.Submit label="Send" severity="secondary" />
            <small style="color: var(--vt-text-muted-color)" aria-live="polite">{{ onBlurResult }}</small>
        </Form.Root>
        <Form.Root :initial-values="{ email: '' }" aria-label="Checked on submit" @submit="(e) => (onSubmitResult = e.valid ? 'Sent' : 'Fix the address')">
            <Form.Field name="email" label="Email (checked on submit)" required :rules="rules.email()">
                <InputText type="email" fluid />
            </Form.Field>
            <Form.Submit label="Send" severity="secondary" />
            <small style="color: var(--vt-text-muted-color)" aria-live="polite">{{ onSubmitResult }}</small>
        </Form.Root>
    </div>
</template>
