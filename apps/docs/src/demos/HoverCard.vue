<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'HoverCard',
    category: 'Overlay',
    description:
        'A preview of what a link points at, for sighted users: it opens when the pointer rests on the trigger or keyboard focus reaches it, stays while the pointer is over it, and closes on Escape. It takes no focus and is not announced, so everything in it must also be reachable through the link.'
};
</script>

<script setup lang="ts">
import { href } from '../lib/router';
import { Avatar, HoverCard } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';
</script>

<template>
    <DemoSection title="Basic">
        <p style="margin: 0">
            Built by
            <HoverCard>
                <template #trigger><a :href="href('/components/hovercard')">@vitral</a></template>
                <div style="display: flex; gap: 0.75rem">
                    <Avatar label="V" shape="circle" />
                    <div>
                        <strong>Vitral</strong>
                        <p style="margin: 0.25rem 0 0; font-size: 0.8125rem">One component set for Vue, themeable from tokens to pass-through.</p>
                    </div>
                </div>
            </HoverCard>
            and friends.
        </p>
    </DemoSection>
    <DemoSection title="Placement and delays">
        <HoverCard placement="right" :open-delay="200" :close-delay="100">
            <template #trigger><a :href="href('/components/avatar')">Faster, to the right</a></template>
            <img src="https://picsum.photos/id/1025/320/180" alt="A pug wrapped in a blanket" style="display: block; width: 100%; border-radius: 6px" />
        </HoverCard>
    </DemoSection>
</template>
