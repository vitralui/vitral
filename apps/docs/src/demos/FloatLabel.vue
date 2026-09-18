<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'FloatLabel',
    category: 'Form',
    description:
        'A real `<label>` that starts inside the field and lifts out of it on focus or once there is a value. Give the field `placeholder=" "` so its empty state can be read from CSS. `IftaLabel` keeps the label inside, above the value, at all times.'
};
</script>

<script setup lang="ts">
import { FloatLabel, IftaLabel, InputText, Select } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const over = ref('');
const inside = ref('');
const on = ref('Ada');
const city = ref<string | null>(null);
const cities = ['Lisbon', 'Porto', 'São Paulo', 'Rio de Janeiro'];
const email = ref('');
const wrong = ref('not-an-email');
</script>

<template>
    <DemoSection title="Variants" description="over (the default), in and on.">
        <FloatLabel>
            <InputText id="fl-over" v-model="over" placeholder=" " />
            <label for="fl-over">Over</label>
        </FloatLabel>
        <FloatLabel variant="in">
            <InputText id="fl-in" v-model="inside" placeholder=" " />
            <label for="fl-in">In</label>
        </FloatLabel>
        <FloatLabel variant="on">
            <InputText id="fl-on" v-model="on" placeholder=" " />
            <label for="fl-on">On</label>
        </FloatLabel>
    </DemoSection>
    <DemoSection title="With a select" description="A select has no placeholder state to read, so `filled` tells the wrapper.">
        <FloatLabel :filled="city != null" style="min-width: 14rem">
            <Select v-model="city" :options="cities" id="fl-city" fluid />
            <label for="fl-city">City</label>
        </FloatLabel>
    </DemoSection>
    <DemoSection title="IftaLabel">
        <IftaLabel>
            <InputText id="ifta-email" v-model="email" placeholder="you@example.com" />
            <label for="ifta-email">Email</label>
        </IftaLabel>
        <IftaLabel invalid>
            <InputText id="ifta-wrong" v-model="wrong" invalid />
            <label for="ifta-wrong">Email</label>
        </IftaLabel>
    </DemoSection>
</template>
