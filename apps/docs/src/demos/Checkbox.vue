<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Checkbox',
    category: 'Form',
    description:
        'A native checkbox under a drawn box, so labels, forms, Space and screen readers all work as they do for the real thing. v-model is a boolean, or an array when each box has a `value`; the mixed state is announced as such. Content sits beside the box.'
};
</script>

<script setup lang="ts">
import { href } from '../lib/router';
import { Checkbox } from '@vitral/vue';
import { computed, ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const accepted = ref(false);
const newsletter = ref('no');
const toppings = ref<string[]>(['cheese']);
const all = ['cheese', 'mushroom', 'olives'];
const allChecked = computed({
    get: () => toppings.value.length === all.length,
    set: (on: boolean) => (toppings.value = on ? [...all] : [])
});
const mixed = computed(() => toppings.value.length > 0 && toppings.value.length < all.length);
</script>

<template>
    <DemoSection title="Binary">
        <Checkbox v-model="accepted" label="I accept the terms" />
        <Checkbox v-model="newsletter" true-value="yes" false-value="no" label="Send me the newsletter" />
        <span class="demo-hint">accepted: {{ accepted }}, newsletter: {{ newsletter }}</span>
    </DemoSection>
    <DemoSection title="Group and mixed state" description="The parent box is indeterminate while only some toppings are chosen.">
        <div role="group" aria-labelledby="cb-toppings" style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem">
            <span id="cb-toppings" class="demo-hint">Toppings</span>
            <Checkbox v-model="allChecked" :indeterminate="mixed" label="All toppings" />
            <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; padding-inline-start: 1.75rem">
                <Checkbox v-model="toppings" value="cheese" label="Cheese" name="topping" />
                <Checkbox v-model="toppings" value="mushroom" label="Mushroom" name="topping" />
                <Checkbox v-model="toppings" value="olives" label="Olives" name="topping" />
            </div>
            <span class="demo-hint">{{ toppings }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Rich content">
        <Checkbox binary>I have read the <a :href="href('/checkbox')">privacy notice</a></Checkbox>
    </DemoSection>
    <DemoSection title="Sizes and states">
        <Checkbox :model-value="true" size="small" label="Small" />
        <Checkbox :model-value="true" label="Normal" />
        <Checkbox :model-value="true" size="large" label="Large" />
        <Checkbox :model-value="false" invalid label="Invalid" />
        <Checkbox :model-value="false" disabled label="Disabled" />
        <Checkbox :model-value="true" disabled label="Disabled checked" />
        <Checkbox :model-value="true" readonly label="Read only" />
    </DemoSection>
</template>
