<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'RadioButton',
    category: 'Form',
    description:
        'Native radios under drawn rings. A RadioGroup names the group and gives its radios one name and one v-model, so the browser moves and checks with the arrow keys and Tab stops once — the WAI-ARIA radio group, without script.'
};
</script>

<script setup lang="ts">
import { RadioButton, RadioGroup } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const delivery = ref('standard');
const plans = [
    { id: 'free', name: 'Free', price: 0 },
    { id: 'pro', name: 'Pro', price: 12 },
    { id: 'team', name: 'Team', price: 30 }
];
const plan = ref<(typeof plans)[number] | null>(plans[1]!);
const size = ref<string | null>(null);
const theme = ref('light');
</script>

<template>
    <DemoSection title="Radio group" description="Tab into the group, then use the arrow keys.">
        <div class="demo-stack">
            <span id="rb-delivery" class="demo-hint">Delivery</span>
            <RadioGroup v-model="delivery" aria-labelledby="rb-delivery">
                <RadioButton value="standard" label="Standard (5–7 days)" />
                <RadioButton value="express" label="Express (2 days)" />
                <RadioButton value="pickup" label="Pick up in store" />
                <RadioButton value="drone" label="Drone" disabled />
            </RadioGroup>
            <span class="demo-hint">Value: {{ delivery }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Horizontal, with object values">
        <div class="demo-stack">
            <span id="rb-plan" class="demo-hint">Plan</span>
            <RadioGroup v-model="plan" orientation="horizontal" aria-labelledby="rb-plan">
                <RadioButton v-for="p in plans" :key="p.id" :value="p">{{ p.name }} <span class="demo-hint">${{ p.price }}/mo</span></RadioButton>
            </RadioGroup>
            <span class="demo-hint">Value: {{ plan }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Invalid and sizes">
        <div class="demo-stack">
            <span id="rb-size" class="demo-hint">Size (required)</span>
            <RadioGroup v-model="size" orientation="horizontal" aria-labelledby="rb-size" :invalid="size === null">
                <RadioButton value="s" label="Small" size="small" />
                <RadioButton value="m" label="Medium" />
                <RadioButton value="l" label="Large" size="large" />
            </RadioGroup>
        </div>
    </DemoSection>
    <DemoSection title="Without a group" description="Standalone radios share a group by their `name`.">
        <RadioButton v-model="theme" value="light" name="rb-theme" label="Light" />
        <RadioButton v-model="theme" value="dark" name="rb-theme" label="Dark" />
        <RadioButton model-value="on" value="on" name="rb-disabled" label="Disabled checked" disabled />
    </DemoSection>
</template>
