<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'IconField',
    category: 'Form',
    description:
        'An icon inside a field. `<InputIcon>` before the field puts it at the start, after the field at the end; the field pads its text past it and keeps its own label. Icons are decorative unless given a `label`.'
};
</script>

<script setup lang="ts">
import { IconField, InputIcon, InputNumber, InputText, Password } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const query = ref('');
const email = ref('');
const amount = ref<number | null>(120);
</script>

<template>
    <DemoSection title="Start and end">
        <div class="demo-field">
            <label for="if-search">Search</label>
            <IconField>
                <InputIcon icon="search" />
                <InputText id="if-search" v-model="query" placeholder="Search" />
            </IconField>
        </div>
        <div class="demo-field">
            <label for="if-email">Email</label>
            <IconField>
                <InputText id="if-email" v-model="email" type="email" />
                <InputIcon icon="user" />
            </IconField>
        </div>
    </DemoSection>
    <DemoSection title="Both, with a meaningful icon">
        <div class="demo-field">
            <label for="if-both">Username</label>
            <IconField fluid>
                <InputIcon icon="user" />
                <InputText id="if-both" invalid />
                <InputIcon icon="warning" label="Invalid" style="color: var(--vt-danger-color)" />
            </IconField>
        </div>
    </DemoSection>
    <DemoSection title="Other fields">
        <IconField>
            <InputIcon icon="calendar" />
            <InputNumber v-model="amount" aria-label="Days" />
        </IconField>
        <IconField>
            <InputIcon icon="spinner" spin />
            <Password aria-label="Password" :feedback="false" />
        </IconField>
    </DemoSection>
</template>
