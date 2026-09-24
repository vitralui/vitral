<script setup lang="ts">
import { Button, Dialog, InputText, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const visible = ref(false);
const name = ref('Ana Souza');
const email = ref('ana@example.com');
</script>

<template>
    <Button label="Edit profile" icon="pencil" @click="visible = true" />
    <Dialog v-model:visible="visible" header="Edit profile" style="width: 28rem">
        <StackPanel spacing="0.875rem">
            <span style="font-size: 0.875rem; color: var(--vt-text-muted-color)">Update how others see you.</span>
            <StackPanel spacing="0.375rem">
                <Label for="dlg-name">Name</Label>
                <InputText id="dlg-name" v-model="name" fluid />
            </StackPanel>
            <StackPanel spacing="0.375rem">
                <Label for="dlg-email">Email</Label>
                <InputText id="dlg-email" v-model="email" type="email" fluid />
            </StackPanel>
        </StackPanel>
        <template #footer>
            <Button label="Cancel" severity="secondary" @click="visible = false" />
            <Button label="Save" @click="visible = false" />
        </template>
    </Dialog>
</template>
