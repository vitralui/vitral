<script setup lang="ts">
import { CopyButton, InputGroup, InputGroupAddon, InputText } from '@vitral/vue';

const key = 'sk_live_51Hx9c2vT7qPz';
</script>

<template>
    <InputGroup style="max-width: 24rem">
        <InputText :model-value="key" readonly aria-label="API key" />
        <InputGroupAddon><CopyButton :value="key" /></InputGroupAddon>
    </InputGroup>
</template>
