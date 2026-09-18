<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Toolbar',
    category: 'Panel',
    description:
        'A row of controls in start, center and end groups, with role="toolbar" and the name you give it. `roving` turns on the APG toolbar keyboard — one tab stop, Left/Right and Home/End between controls — which is off by default because text fields need those keys.'
};
</script>

<script setup lang="ts">
import { Button, Icon, InputText, Toolbar } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const query = ref('');
</script>

<template>
    <DemoSection title="Start, center and end" class="stack">
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
    </DemoSection>
    <DemoSection title="Roving focus" description="Tab reaches the bar once; the arrow keys move between its buttons. The disabled one is skipped." class="stack">
        <Toolbar aria-label="Text formatting" roving>
            <template #start>
                <Button icon="copy" severity="secondary" variant="text" aria-label="Copy" />
                <Button icon="pencil" severity="secondary" variant="text" aria-label="Edit" />
                <Button icon="star" severity="secondary" variant="text" aria-label="Favourite" disabled />
                <Button icon="externalLink" severity="secondary" variant="text" aria-label="Open" />
            </template>
            <template #end>
                <Button label="Share" icon="user" severity="secondary" />
            </template>
        </Toolbar>
    </DemoSection>
</template>
