<script setup lang="ts">
import { Inplace, InputText } from '@vitral/vue';
import { ref } from 'vue';

const name = ref('Ada Lovelace');
</script>

<template>
    <Inplace closable>
        <template #display>{{ name || 'Click to add a name' }}</template>
        <template #content>
            <InputText v-model="name" aria-label="Name" />
        </template>
    </Inplace>
</template>
