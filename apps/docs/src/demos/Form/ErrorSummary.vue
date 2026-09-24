<script setup lang="ts">
import { DatePicker, Form, InputText, RadioButton, RadioGroup, rules, Select, type FormSubmitEvent } from '@vitral/vue';
import { ref } from 'vue';

const today = new Date();
const countries = [
    { name: 'Brazil', code: 'BR' },
    { name: 'Portugal', code: 'PT' },
    { name: 'Angola', code: 'AO' }
];
const result = ref('');

function onSubmit(event: FormSubmitEvent) {
    result.value = event.valid ? JSON.stringify(event.values, null, 2) : `${Object.keys(event.errors).length} field(s) to fix`;
}
</script>

<template>
    <Form.Root :initial-values="{ fullName: '', email: '', born: null, country: null, plan: null }" aria-label="Application" style="width: 100%; max-width: 30rem" @submit="onSubmit">
        <Form.Summary />
        <Form.Field name="fullName" label="Full name" required>
            <InputText autocomplete="name" fluid />
        </Form.Field>
        <Form.Field name="email" label="Email" required :rules="rules.email()">
            <InputText type="email" autocomplete="email" fluid />
        </Form.Field>
        <Form.Field name="born" label="Date of birth" description="For example, 27/03/1990." required :rules="rules.max(today, 'The date has to be in the past.')">
            <DatePicker />
        </Form.Field>
        <Form.Field name="country" label="Country" required>
            <Select :options="countries" option-label="name" option-value="code" placeholder="Choose a country" fluid />
        </Form.Field>
        <Form.Field name="plan" label="Plan" required>
            <RadioGroup orientation="horizontal">
                <RadioButton value="basic" label="Basic" />
                <RadioButton value="team" label="Team" />
            </RadioGroup>
        </Form.Field>
        <Form.Submit label="Apply" />
    </Form.Root>
    <pre v-if="result" class="demo-output" style="margin: 0; font-size: 0.75rem">{{ result }}</pre>
</template>
