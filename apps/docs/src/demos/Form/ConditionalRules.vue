<script setup lang="ts">
import { Form, InputNumber, InputText, SelectButton, rules, type FormSubmitEvent } from '@vitral/vue';
import { ref } from 'vue';

// The tax id is asked of a company only, and is checked again whenever the kind changes.
const taxIdRules = [
    rules.when((values: { kind?: string }) => values.kind === 'Company', [rules.required('A company needs its tax id.'), rules.pattern(/^\d{14}$/, 'Fourteen digits, no dots.')], { deps: ['kind'] })
];
const seatRules = [rules.required(), rules.integer(), rules.min(1)];
const planRules = [rules.required(), rules.oneOf(['Team', 'Business'], 'Seats are sold on Team and Business.')];
const result = ref('');

function onSubmit(event: FormSubmitEvent) {
    result.value = event.valid ? JSON.stringify(event.values, null, 2) : `${Object.keys(event.errors).length} field(s) to fix`;
}
</script>

<template>
    <Form.Root :initial-values="{ kind: 'Person', taxId: '', plan: 'Free', seats: 2.5 }" aria-label="Billing" style="width: 100%; max-width: 26rem" @submit="onSubmit">
        <Form.Field name="kind" label="Billed as">
            <SelectButton :options="['Person', 'Company']" :allow-empty="false" />
        </Form.Field>
        <Form.Field name="taxId" label="Tax id" :rules="taxIdRules">
            <InputText inputmode="numeric" fluid />
        </Form.Field>
        <Form.Field name="plan" label="Plan" :rules="planRules">
            <SelectButton :options="['Free', 'Team', 'Business']" />
        </Form.Field>
        <Form.Field name="seats" label="Seats" :rules="seatRules">
            <InputNumber :min-fraction-digits="0" :max-fraction-digits="2" fluid />
        </Form.Field>
        <Form.Submit label="Continue" />
    </Form.Root>
    <pre v-if="result" class="demo-output" style="margin: 0; font-size: 0.75rem">{{ result }}</pre>
</template>
