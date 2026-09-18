<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputNumber',
    category: 'Form',
    description:
        'A number box. It is the WAI-ARIA spinbutton: ArrowUp/ArrowDown step, PageUp/PageDown step ten, Home/End go to min/max. The text is read as you type and committed, clamped and formatted on blur or Enter; formats follow the locale.'
};
</script>

<script setup lang="ts">
import { InputNumber } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const quantity = ref<number | null>(3);
const price = ref<number | null>(1299.9);
const dollars = ref<number | null>(49.99);
const opacity = ref<number | null>(0.8);
const distance = ref<number | null>(12.5);
const rating = ref<number | null>(4);
const width = ref<number | null>(320);
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <label for="in-qty">Quantity</label>
            <InputNumber id="in-qty" v-model="quantity" :min="0" :max="99" placeholder="0" />
            <span class="demo-hint">Value: {{ quantity ?? 'null' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Formats" description="Currency, percent, a suffix and a fixed number of digits — each read back correctly when typed.">
        <div class="demo-field">
            <label for="in-brl">Preço (pt-BR)</label>
            <InputNumber id="in-brl" v-model="price" mode="currency" currency="BRL" locale="pt-BR" />
            <span class="demo-hint">Value: {{ price ?? 'null' }}</span>
        </div>
        <div class="demo-field">
            <label for="in-usd">Price (en-US)</label>
            <InputNumber id="in-usd" v-model="dollars" mode="currency" currency="USD" locale="en-US" />
            <span class="demo-hint">Value: {{ dollars ?? 'null' }}</span>
        </div>
        <div class="demo-field">
            <label for="in-opacity">Opacity</label>
            <InputNumber id="in-opacity" v-model="opacity" mode="percent" :min="0" :max="1" :step="0.05" />
            <span class="demo-hint">Value: {{ opacity ?? 'null' }}</span>
        </div>
        <div class="demo-field">
            <label for="in-distance">Distance</label>
            <InputNumber id="in-distance" v-model="distance" suffix=" km" :min-fraction-digits="1" :max-fraction-digits="1" :step="0.5" />
            <span class="demo-hint">Value: {{ distance ?? 'null' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Spin buttons" description="Stacked puts up over down at the end of the field; horizontal puts minus and plus either side. Hold a button to keep stepping.">
        <div class="demo-field">
            <label for="in-rating">Rating (stacked)</label>
            <InputNumber id="in-rating" v-model="rating" show-buttons :min="1" :max="5" />
        </div>
        <div class="demo-field">
            <label for="in-width">Width (horizontal)</label>
            <InputNumber id="in-width" v-model="width" show-buttons button-layout="horizontal" :step="10" :min="0" suffix=" px" />
        </div>
    </DemoSection>
    <DemoSection title="Sizes, variants and states">
        <InputNumber :model-value="1" show-buttons size="small" aria-label="Small" />
        <InputNumber :model-value="2" show-buttons aria-label="Normal" />
        <InputNumber :model-value="3" show-buttons size="large" aria-label="Large" />
        <InputNumber :model-value="4" variant="filled" aria-label="Filled" />
        <InputNumber :model-value="5" invalid aria-label="Invalid" />
        <InputNumber :model-value="6" show-buttons disabled aria-label="Disabled" />
        <InputNumber :model-value="7" show-buttons readonly aria-label="Read only" />
    </DemoSection>
</template>
