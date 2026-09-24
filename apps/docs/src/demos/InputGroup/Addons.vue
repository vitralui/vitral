<script setup lang="ts">
import { InputGroup, InputGroupAddon, InputNumber, InputText } from '@vitral/vue';
import { ref } from 'vue';

const user = ref('');
const price = ref<number | null>(120);
const site = ref('');
</script>

<template>
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
</template>
