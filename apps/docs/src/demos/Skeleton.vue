<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Skeleton',
    category: 'Messages',
    description:
        'The outline of content that is still loading. The sweep stops under `prefers-reduced-motion`; mark the region that is loading with `aria-busy` so the placeholder is not read out.'
};
</script>

<script setup lang="ts">
import { Skeleton } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';
</script>

<template>
    <DemoSection title="Shapes">
        <Skeleton shape="circle" width="3rem" />
        <Skeleton width="3rem" height="3rem" />
        <Skeleton width="10rem" height="3rem" border-radius="1rem" />
        <Skeleton width="10rem" :animated="false" />
    </DemoSection>
    <DemoSection title="A card loading">
        <div aria-busy="true" style="display: grid; gap: 0.75rem; width: 100%; max-width: 24rem">
            <div style="display: flex; gap: 0.75rem; align-items: center">
                <Skeleton shape="circle" width="3rem" />
                <div style="display: grid; gap: 0.5rem; flex: 1">
                    <Skeleton width="60%" />
                    <Skeleton width="40%" />
                </div>
            </div>
            <Skeleton height="8rem" />
            <div style="display: flex; justify-content: space-between">
                <Skeleton width="5rem" height="2rem" />
                <Skeleton width="5rem" height="2rem" />
            </div>
        </div>
    </DemoSection>
</template>
