<script setup lang="ts">
import { Button, InputGroup, InputText } from '@vitral/vue';
import { ref } from 'vue';

const query = ref('');
</script>

<template>
    <InputGroup style="max-width: 24rem">
        <InputText v-model="query" aria-label="Search" placeholder="Keyword" />
        <Button label="Search" icon="search" />
    </InputGroup>
</template>
