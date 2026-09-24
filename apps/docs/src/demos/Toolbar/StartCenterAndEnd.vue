<script setup lang="ts">
import { Button, Icon, InputText, Toolbar } from '@vitral/vue';
import { ref } from 'vue';

const query = ref('');
</script>

<template>
    <Toolbar aria-label="Documents">
        <template #start>
            <Button label="New" icon="plus" />
            <Button label="Upload" icon="upload" severity="secondary" />
        </template>
        <template #center>
            <InputText v-model="query" placeholder="Search" aria-label="Search documents">
                <template #prefix>
                    <Icon icon="search" />
                </template>
            </InputText>
        </template>
        <template #end>
            <Button icon="download" severity="secondary" variant="text" aria-label="Download" />
            <Button icon="trash" severity="danger" variant="text" aria-label="Delete" />
        </template>
    </Toolbar>
</template>
