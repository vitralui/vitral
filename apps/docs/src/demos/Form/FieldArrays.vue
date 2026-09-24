<script setup lang="ts">
import { Button, Form, InputText, rules, type FormSubmitEvent } from '@vitral/vue';
import { ref } from 'vue';

const trip = ref({ title: 'Team offsite', guests: [{ name: 'Ada Lovelace', email: 'ada@example.com' }, { name: '', email: '' }] });
const result = ref('');

function onSubmit(event: FormSubmitEvent) {
    result.value = event.valid ? JSON.stringify(event.values, null, 2) : `${Object.keys(event.errors).length} field(s) to fix`;
}
</script>

<template>
    <Form.Root v-model="trip" aria-label="Trip" style="width: 100%; max-width: 40rem" @submit="onSubmit">
        <Form.Field name="title" label="Trip" required>
            <InputText fluid />
        </Form.Field>
        <Form.FieldArray v-slot="{ fields, append, remove, move }" name="guests" label="Guests" :rules="rules.minLength(1, 'Add at least one guest.')">
            <div v-for="guest in fields" :key="guest.key" style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: 0.75rem">
                <Form.Field :name="`${guest.name}.name`" :label="`Guest ${guest.index + 1}`" required>
                    <InputText autocomplete="off" />
                </Form.Field>
                <Form.Field :name="`${guest.name}.email`" :label="`Email of guest ${guest.index + 1}`" required :rules="rules.email()">
                    <InputText type="email" autocomplete="off" />
                </Form.Field>
                <div style="display: flex; gap: 0.25rem; padding-top: 1.4rem">
                    <Button icon="arrowUp" variant="text" severity="secondary" :disabled="guest.first" :aria-label="`Move guest ${guest.index + 1} up`" @click="move(guest.index, guest.index - 1)" />
                    <Button icon="arrowDown" variant="text" severity="secondary" :disabled="guest.last" :aria-label="`Move guest ${guest.index + 1} down`" @click="move(guest.index, guest.index + 1)" />
                    <Button icon="trash" variant="text" severity="danger" :aria-label="`Remove guest ${guest.index + 1}`" @click="remove(guest.index)" />
                </div>
            </div>
            <Form.Message />
            <div>
                <Button label="Add a guest" icon="plus" variant="outlined" severity="secondary" @click="append({ name: '', email: '' })" />
            </div>
        </Form.FieldArray>
        <Form.Submit label="Book" />
    </Form.Root>
    <pre v-if="result" class="demo-output" style="margin: 0; font-size: 0.75rem">{{ result }}</pre>
</template>
