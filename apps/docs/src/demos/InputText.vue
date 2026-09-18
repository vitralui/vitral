<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputText',
    category: 'Form',
    description: 'A single-line text box. Every attribute you give it lands on the native input, so a <label for> and aria-describedby just work. It takes prefix and suffix content inside the field, and a clear button.'
};
</script>

<script setup lang="ts">
import { Icon, InputText } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const name = ref('');
const email = ref('ada@example.com');
const price = ref('1299.90');
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <label for="it-name">Name</label>
            <InputText id="it-name" v-model="name" placeholder="Your name" aria-describedby="it-name-hint" />
            <span id="it-name-hint" class="demo-hint">Typed: {{ name || '—' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Adornments and clear button" description="Content inside the field on either side, and the clear button.">
        <div class="demo-field">
            <label for="it-email">Email</label>
            <InputText id="it-email" v-model="email" type="email" clearable>
                <template #prefix><Icon icon="user" /></template>
            </InputText>
        </div>
        <div class="demo-field">
            <label for="it-price">Price</label>
            <InputText id="it-price" v-model="price" inputmode="decimal">
                <template #prefix>R$</template>
                <template #suffix>BRL</template>
            </InputText>
        </div>
    </DemoSection>
    <DemoSection title="Sizes, variants and states">
        <InputText placeholder="Small" size="small" aria-label="Small" />
        <InputText placeholder="Normal" aria-label="Normal" />
        <InputText placeholder="Large" size="large" aria-label="Large" />
        <InputText placeholder="Filled" variant="filled" aria-label="Filled" />
        <InputText placeholder="Invalid" invalid aria-label="Invalid" />
        <InputText placeholder="Disabled" disabled aria-label="Disabled" />
        <InputText model-value="Read only" readonly aria-label="Read only" />
    </DemoSection>
    <DemoSection title="Fluid" class="stack">
        <InputText placeholder="Fills its container" fluid aria-label="Fluid" />
    </DemoSection>
</template>
