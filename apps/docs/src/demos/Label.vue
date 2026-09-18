<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Label',
    category: 'Form',
    description:
        'A native label with the field chrome’s typography. Its `for` is checked: it must point at a control a label can name, and the label dims when that control is disabled. The required mark is visual; the control says it is required.'
};
</script>

<script setup lang="ts">
import { Checkbox, InputText, Label, Rating } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const name = ref('');
const agree = ref(false);
const stars = ref<number | null>(null);
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <Label for="label-name" required>Full name</Label>
            <InputText id="label-name" v-model="name" required aria-required="true" />
        </div>
    </DemoSection>
    <DemoSection title="Beside a checkbox, and disabled">
        <div style="display: flex; align-items: center; gap: 0.5rem">
            <Checkbox id="label-agree" v-model="agree" binary />
            <Label for="label-agree">I agree to the terms</Label>
        </div>
        <div class="demo-field">
            <Label for="label-off">Disabled field</Label>
            <InputText id="label-off" disabled />
        </div>
    </DemoSection>
    <DemoSection title="Naming a group">
        <div class="demo-field">
            <Label id="label-rating" size="large">How was it?</Label>
            <Rating v-model="stars" aria-labelledby="label-rating" />
        </div>
    </DemoSection>
</template>
