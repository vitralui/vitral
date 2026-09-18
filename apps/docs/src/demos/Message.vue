<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Message',
    category: 'Messages',
    description:
        'An inline message: a title, the message, an action and a close button. `danger` and `warn` are announced at once, as alerts; the others politely.'
};
</script>

<script setup lang="ts">
import { Button, Message } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const shown = ref(true);
const key = ref(0);
</script>

<template>
    <DemoSection title="InfoBar" description="Title and message share a line while they fit.">
        <div class="demo-stack" style="display: flex; flex-direction: column; gap: 0.625rem; width: 100%">
            <Message severity="info" title="Update available">Restart the app to install version 2.4.</Message>
            <Message severity="success" title="Backup complete">1,204 files were copied to the cloud.</Message>
            <Message severity="warn" title="Storage almost full">You have used 92% of your 15 GB.</Message>
            <Message severity="danger" title="Sync failed">The server could not be reached. Check your connection and try again.</Message>
        </div>
    </DemoSection>
    <DemoSection title="Action and close" description="The action slot holds a button or link; `closable` adds a close button that emits `close`.">
        <div class="demo-stack" style="display: flex; flex-direction: column; gap: 0.625rem; width: 100%">
            <Message v-if="shown" :key="key" severity="info" title="New sign-in" closable @close="shown = false">
                Someone signed in from a new device in São Paulo.
                <template #action>
                    <Button label="Review" size="small" severity="secondary" />
                </template>
            </Message>
            <Button v-else label="Show it again" severity="secondary" size="small" @click="(shown = true), key++" />
        </div>
    </DemoSection>
    <DemoSection title="Variants" description="`outlined` and `simple`; every severity works with each.">
        <div class="demo-stack" style="display: flex; flex-direction: column; gap: 0.625rem; width: 100%">
            <Message severity="secondary" variant="outlined">Drafts are kept for 30 days.</Message>
            <Message severity="danger" variant="outlined" title="Invalid token">Sign in again to continue.</Message>
            <Message severity="danger" variant="simple">Password must have at least 8 characters.</Message>
            <Message severity="success" variant="simple" icon="check">Username is available.</Message>
        </div>
    </DemoSection>
</template>
