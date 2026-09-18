<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputGroup',
    category: 'Form',
    description:
        'Fields, buttons and `InputGroupAddon`s welded into one control: inner corners squared, one shared border between neighbours. When the group holds more than one control, `label` names it.'
};
</script>

<script setup lang="ts">
import { Button, InputGroup, InputGroupAddon, InputNumber, InputText } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const user = ref('');
const price = ref<number | null>(120);
const site = ref('');
const query = ref('');
const from = ref<number | null>(10);
const to = ref<number | null>(90);
</script>

<template>
    <DemoSection title="Addons">
        <InputGroup style="max-width: 20rem">
            <InputGroupAddon>@</InputGroupAddon>
            <InputText v-model="user" aria-label="Username" placeholder="Username" />
        </InputGroup>
        <InputGroup style="max-width: 20rem">
            <InputGroupAddon>$</InputGroupAddon>
            <InputNumber v-model="price" aria-label="Price" />
            <InputGroupAddon>.00</InputGroupAddon>
        </InputGroup>
        <InputGroup style="max-width: 24rem">
            <InputGroupAddon>https://</InputGroupAddon>
            <InputText v-model="site" aria-label="Website" placeholder="example.com" />
        </InputGroup>
    </DemoSection>
    <DemoSection title="With a button">
        <InputGroup style="max-width: 24rem">
            <InputText v-model="query" aria-label="Search" placeholder="Keyword" />
            <Button label="Search" icon="search" />
        </InputGroup>
    </DemoSection>
    <DemoSection title="A named range" description="Two controls, one name: the group is announced as “Price range”.">
        <InputGroup label="Price range" style="max-width: 24rem">
            <InputNumber v-model="from" aria-label="From" />
            <InputGroupAddon>to</InputGroupAddon>
            <InputNumber v-model="to" aria-label="To" />
        </InputGroup>
    </DemoSection>
</template>
