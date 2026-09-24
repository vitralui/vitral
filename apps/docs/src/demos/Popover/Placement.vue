<script setup lang="ts">
import { Button, Popover } from '@vitral/vue';
import { ref } from 'vue';

const members = ref<InstanceType<typeof Popover> | null>(null);
const people = [
    { name: 'Ana Souza', role: 'Owner' },
    { name: 'Bruno Lima', role: 'Editor' },
    { name: 'Carla Dias', role: 'Viewer' }
];
</script>

<template>
    <Button
        label="Team members"
        icon="user"
        severity="secondary"
        aria-haspopup="dialog"
        :aria-expanded="members?.visible ? 'true' : 'false'"
        @click="members?.toggle($event)"
    />
    <Popover ref="members" placement="right-start" aria-label="Team members">
        <ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; min-width: 14rem">
            <li v-for="p in people" :key="p.name" style="display: flex; justify-content: space-between; gap: 1rem">
                <span>{{ p.name }}</span>
                <small style="color: var(--vt-text-muted-color)">{{ p.role }}</small>
            </li>
        </ul>
        <Button label="Manage" variant="link" size="small" style="margin-top: 0.5rem" @click="members?.hide()" />
    </Popover>
</template>
