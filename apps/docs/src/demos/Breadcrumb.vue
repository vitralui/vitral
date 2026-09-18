<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Breadcrumb',
    category: 'Menu',
    description:
        'Where the page sits in a hierarchy. It is the WAI-ARIA breadcrumb: a navigation landmark named by the locale around an ordered list, the last item marked aria-current="page", and the separators hidden from assistive technology.'
};
</script>

<script setup lang="ts">
import { Breadcrumb, type BreadcrumbItem } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';

const home: BreadcrumbItem = { url: '#/breadcrumb' };
const trail: BreadcrumbItem[] = [
    { label: 'Electronics', url: '#/breadcrumb' },
    { label: 'Computers', url: '#/breadcrumb' },
    { label: 'Laptops', url: '#/breadcrumb' },
    { label: 'Vitral 14' }
];
const folders: BreadcrumbItem[] = [
    { label: 'Documents', icon: 'folder', url: '#/breadcrumb' },
    { label: 'Projects', icon: 'folder', url: '#/breadcrumb' },
    { label: 'README.md', icon: 'file' }
];
</script>

<template>
    <DemoSection title="With a home item">
        <Breadcrumb :home="home" :model="trail" />
    </DemoSection>
    <DemoSection title="Icons and a custom separator">
        <Breadcrumb :model="folders">
            <template #separator>/</template>
        </Breadcrumb>
    </DemoSection>
</template>
