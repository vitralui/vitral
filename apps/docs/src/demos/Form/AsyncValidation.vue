<script setup lang="ts">
import { Form, InputText, rules, type FormSubmitEvent } from '@vitral/vue';
import { ref } from 'vue';

// A fake server that takes a moment to answer.
const takenNames = ['admin', 'root', 'vitral', 'ada', 'grace'];

function wait(ms: number, signal: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Superseded', 'AbortError'));
        });
    });
}

const available = rules.custom<string>(async (value, { signal }) => {
    if (!value) return true;
    await wait(700, signal);
    return !takenNames.includes(value.toLowerCase()) || `“${value}” is taken. Try another.`;
});
const usernameRules = [rules.required(), rules.pattern(/^[a-z0-9_]+$/i, 'Use letters, digits or underscores.'), available];
const result = ref('');

function onSubmit(event: FormSubmitEvent) {
    result.value = event.valid ? JSON.stringify(event.values, null, 2) : `${Object.keys(event.errors).length} field(s) to fix`;
}
</script>

<template>
    <Form.Root :initial-values="{ username: '' }" validate-on="input" aria-label="Choose a username" style="width: 100%; max-width: 26rem" @submit="onSubmit">
        <Form.Field v-slot="{ validating, invalid, value }" name="username" label="Username" :rules="usernameRules" :debounce="300">
            <InputText autocomplete="username" fluid />
            <small style="color: var(--vt-text-muted-color)" aria-live="polite">{{ validating ? 'Checking…' : value && !invalid ? 'Available.' : '' }}</small>
        </Form.Field>
        <Form.Submit label="Claim it" />
    </Form.Root>
    <pre v-if="result" class="demo-output" style="margin: 0; font-size: 0.75rem">{{ result }}</pre>
</template>
