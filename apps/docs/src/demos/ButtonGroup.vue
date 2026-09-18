<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ButtonGroup',
    category: 'Button',
    description: 'Buttons that belong together, joined into one control. It is a named `role="group"`; every button keeps its own tab stop.'
};
</script>

<script setup lang="ts">
import { Button, ButtonGroup } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';
</script>

<template>
    <DemoSection title="Basic">
        <ButtonGroup aria-label="Record">
            <Button label="Save" icon="check" />
            <Button label="Delete" icon="trash" />
            <Button label="Cancel" icon="x" />
        </ButtonGroup>
    </DemoSection>
    <DemoSection title="Outlined and secondary">
        <ButtonGroup aria-label="Pages">
            <Button icon="chevronLeft" aria-label="Previous" variant="outlined" severity="secondary" />
            <Button label="1" variant="outlined" severity="secondary" />
            <Button label="2" variant="outlined" severity="secondary" />
            <Button icon="chevronRight" aria-label="Next" variant="outlined" severity="secondary" />
        </ButtonGroup>
    </DemoSection>
    <DemoSection title="Vertical">
        <ButtonGroup orientation="vertical" aria-label="Zoom">
            <Button icon="plus" aria-label="Zoom in" severity="secondary" />
            <Button icon="minus" aria-label="Zoom out" severity="secondary" />
        </ButtonGroup>
    </DemoSection>
</template>
