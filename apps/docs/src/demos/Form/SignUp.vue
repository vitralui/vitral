<script setup lang="ts">
import { Checkbox, Form, InputNumber, InputPassword, InputText, rules, StackPanel, type FormSubmitEvent } from '@vitral/vue';
import { ref } from 'vue';

const signUp = ref({ name: '', email: '', password: '', confirm: '', website: '', age: null, terms: false });
const result = ref('');

function onSubmit(event: FormSubmitEvent) {
    result.value = event.valid ? JSON.stringify(event.values, null, 2) : `${Object.keys(event.errors).length} field(s) to fix`;
}
</script>

<template>
    <Form.Root v-model="signUp" aria-label="Sign up" style="width: 100%; max-width: 26rem" @submit="onSubmit">
        <Form.Field name="name" label="Full name" required :rules="rules.minLength(2)">
            <InputText autocomplete="name" fluid />
        </Form.Field>
        <Form.Field name="email" label="Email" description="We send the confirmation here." required :rules="rules.email()">
            <InputText type="email" autocomplete="email" fluid />
        </Form.Field>
        <Form.Field name="password" label="Password" required :rules="rules.minLength(8)">
            <InputPassword autocomplete="new-password" toggle-mask fluid />
        </Form.Field>
        <Form.Field name="confirm" label="Repeat the password" required :rules="rules.equalsField('password')">
            <InputText type="password" autocomplete="new-password" fluid />
        </Form.Field>
        <Form.Field name="website" label="Website" :rules="rules.url()">
            <InputText type="url" placeholder="https://" fluid />
        </Form.Field>
        <Form.Field name="age" label="Age" required :rules="[rules.min(18, 'You have to be 18 or older.'), rules.max(120)]">
            <InputNumber :use-grouping="false" />
        </Form.Field>
        <Form.Field name="terms" :rules="rules.required('Accept the terms to go on.')">
            <Checkbox label="I accept the terms of use" />
        </Form.Field>
        <StackPanel orientation="horizontal" spacing="0.5rem" align="center" wrap>
            <Form.Submit label="Create account" />
            <Form.Reset label="Start over" />
        </StackPanel>
    </Form.Root>
    <pre v-if="result" class="demo-output" style="margin: 0; font-size: 0.75rem">{{ result }}</pre>
</template>
