<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Fieldset',
    category: 'Panel',
    description:
        'A native `<fieldset>` with its legend, so the controls inside are announced with the group’s name. `toggleable` turns the legend into a button that shows and hides the group; `v-model:collapsed` holds the state.'
};
</script>

<script setup lang="ts">
import { Checkbox, Fieldset } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const collapsed = ref(false);
const email = ref(true);
const push = ref(false);
</script>

<template>
    <DemoSection title="Basic">
        <Fieldset legend="Shipping" style="max-width: 32rem">
            <p style="margin: 0">Orders placed before 2 p.m. leave the warehouse the same day. Anything later goes out on the next working day.</p>
        </Fieldset>
    </DemoSection>
    <DemoSection title="Toggleable" :description="`collapsed: ${collapsed}`">
        <Fieldset v-model:collapsed="collapsed" legend="Notifications" toggleable style="max-width: 32rem">
            <div style="display: grid; gap: 0.5rem">
                <Checkbox v-model="email" label="Email" binary />
                <Checkbox v-model="push" label="Push" binary />
            </div>
        </Fieldset>
    </DemoSection>
</template>
