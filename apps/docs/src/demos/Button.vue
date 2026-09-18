<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Button',
    category: 'Button',
    description: 'A command. Eight severities, four variants, three sizes, icons on any side, a loading state and a badge, and it can render as a link or a router link.'
};
</script>

<script setup lang="ts">
import { graduationCap } from '@vitral/icons';
import { Button } from '@vitral/vue';
import { h, ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const severities = ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'help', 'contrast'] as const;
const loading = ref(false);

// Stands in for another library's icon component (lucide-vue-next, @iconify/vue…).
const Sparkle = () =>
    h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
        h('path', { d: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6' })
    ]);
const markup = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>';
function load() {
    loading.value = true;
    setTimeout(() => (loading.value = false), 1600);
}
</script>

<template>
    <DemoSection title="Severities" description="Filled is the default variant. `secondary` is the quiet button of a toolbar; `primary` is the one that commits.">
        <Button v-for="s in severities" :key="s" :label="s" :severity="s" />
    </DemoSection>
    <DemoSection title="Outlined">
        <Button v-for="s in severities" :key="s" :label="s" :severity="s" variant="outlined" />
    </DemoSection>
    <DemoSection title="Text">
        <Button v-for="s in severities" :key="s" :label="s" :severity="s" variant="text" />
    </DemoSection>
    <DemoSection title="Icons">
        <Button label="New" icon="plus" />
        <Button label="Next" icon="arrowRight" icon-pos="right" severity="secondary" />
        <Button label="Upload" icon="upload" icon-pos="top" severity="secondary" variant="outlined" />
        <Button icon="search" aria-label="Search" />
        <Button icon="trash" severity="danger" variant="text" aria-label="Delete" />
        <Button icon="star" rounded severity="warn" aria-label="Favourite" />
    </DemoSection>
    <DemoSection title="Icons from anywhere" description="An imported icon, another library's component, or trusted SVG markup. An icon font's classes work too: `icon=&quot;fa-solid fa-user&quot;`, once its stylesheet is on the page.">
        <Button label="Course" :icon="graduationCap" severity="secondary" />
        <Button label="Component" :icon="Sparkle" severity="secondary" />
        <Button label="Markup" :icon="markup" severity="secondary" />
    </DemoSection>
    <DemoSection title="Sizes and shape">
        <Button label="Small" size="small" />
        <Button label="Normal" />
        <Button label="Large" size="large" />
        <Button label="Rounded" rounded severity="help" />
        <Button label="Raised" raised severity="secondary" />
    </DemoSection>
    <DemoSection title="States" description="Loading disables the button and sets aria-busy.">
        <Button label="Save" icon="check" :loading="loading" @click="load" />
        <Button label="Disabled" disabled />
        <Button label="Notifications" icon="bell" badge="8" severity="secondary" />
        <Button as="a" href="https://github.com/vitralui/vitral" target="_blank" label="A link" icon="externalLink" icon-pos="right" variant="link" />
    </DemoSection>
</template>
