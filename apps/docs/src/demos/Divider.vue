<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Divider',
    category: 'Panel',
    description: 'A line between pieces of content: horizontal or vertical, solid, dashed or dotted, with optional content set into it. It is role="separator" with its orientation.'
};
</script>

<script setup lang="ts">
import { Button, Divider } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';
</script>

<template>
    <DemoSection title="Types" class="stack">
        <span>Solid</span>
        <Divider />
        <span>Dashed</span>
        <Divider type="dashed" />
        <span>Dotted</span>
        <Divider type="dotted" />
    </DemoSection>
    <DemoSection title="Content" class="stack">
        <Divider>Left</Divider>
        <Divider align="center">Center</Divider>
        <Divider align="right" type="dashed">Right</Divider>
    </DemoSection>
    <DemoSection title="Vertical">
        <div style="display: flex; align-items: center; width: 100%">
            <div style="flex: 1; text-align: center">
                <Button label="Sign in" />
            </div>
            <Divider layout="vertical" style="min-height: 6rem">or</Divider>
            <div style="flex: 1; text-align: center">
                <Button label="Create account" severity="secondary" />
            </div>
        </div>
    </DemoSection>
</template>
