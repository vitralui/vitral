<script setup lang="ts">
import { Button, Dialog, Label, Select, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const visible = ref(false);
const role = ref<string | null>(null);
const roles = [{ name: 'Viewer' }, { name: 'Editor' }, { name: 'Owner' }];
</script>

<template>
    <Button label="Invite someone" severity="secondary" icon="user" @click="visible = true" />
    <Dialog v-model:visible="visible" header="Invite" style="width: 24rem">
        <StackPanel spacing="0.375rem">
            <Label for="dlg-role">Role</Label>
            <Select id="dlg-role" v-model="role" :options="roles" option-label="name" option-value="name" placeholder="Choose a role" fluid />
        </StackPanel>
        <template #footer>
            <Button label="Send invite" :disabled="!role" @click="visible = false" />
        </template>
    </Dialog>
</template>
