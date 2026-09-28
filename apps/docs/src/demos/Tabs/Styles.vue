<script setup lang="ts">
import { Badge, Icon, Tab, TabList, TabPanel, TabPanels, Tabs } from '@vitral/vue';
import { ref } from 'vue';

const views = [
    { value: 'overview', label: 'Overview', icon: 'home' },
    { value: 'activity', label: 'Activity', icon: 'bell', count: 4 },
    { value: 'files', label: 'Files', icon: 'folder' },
    { value: 'settings', label: 'Settings', icon: 'sliders' }
];
const tinted = ref('overview');
const underline = ref('overview');
const pills = ref('activity');
const segmented = ref('files');
const withIcons = ref('activity');

// Every look below is the same component with its tokens changed for this
// instance (`dt`), and — for the segmented strip's track — a class or a style
// through pass-through (`pt`). A preset sets the same tokens for every Tabs.

/** The selected tab on a tint of the accent, the pill still under it. */
const tintedTokens = { tabs: { tab: { activeBackground: 'color-mix(in srgb, {primary.color} 10%, transparent)', activeColor: '{primary.color}' } } };

/** An underline as wide as the tab, over a hairline along the whole strip. */
const underlineTokens = {
    tabs: {
        tablist: { borderWidth: '1px', gap: '0' },
        tab: { borderRadius: '0', hoverBackground: 'transparent', padding: '0.625rem 1rem' },
        indicator: { width: '100%', thickness: '2px', borderRadius: '0' }
    }
};

/** Filled pills: the selected tab is the solid accent, and the indicator steps aside. */
const pillTokens = {
    tabs: {
        tablist: { gap: '0.375rem' },
        tab: { borderRadius: '{borderRadius.pill}', padding: '0.375rem 0.875rem', activeBackground: '{primary.color}', activeColor: '{primary.contrastColor}' },
        indicator: { thickness: '0' }
    }
};

/** A segmented control: a track, and the selected tab raised on it. */
const segmentedTokens = {
    tabs: {
        tablist: { padding: '0.25rem', gap: '0.25rem' },
        tab: { borderRadius: '{borderRadius.md}', activeBackground: '{content.background}', activeColor: '{text.hoverColor}', hoverBackground: 'transparent' },
        indicator: { thickness: '0' }
    }
};
const trackPt = { tablist: { style: 'background: var(--vt-content-hover-background); border-radius: var(--vt-border-radius-lg); align-self: flex-start' } };
const raisedPt = { tab: ({ state }: { state: unknown }) => ((state as { selected?: boolean }).selected ? { style: 'box-shadow: 0 1px 2px rgb(0 0 0 / 0.12)' } : {}) };
</script>

<template>
    <div style="display: grid; gap: 1.75rem; width: 100%">
        <section>
            <small class="demo-caption">A tinted selection</small>
            <Tabs v-model:value="tinted" :dt="tintedTokens">
                <TabList aria-label="Tinted">
                    <Tab v-for="v in views" :key="v.value" :value="v.value">{{ v.label }}</Tab>
                </TabList>
            </Tabs>
        </section>

        <section>
            <small class="demo-caption">Underline</small>
            <Tabs v-model:value="underline" :dt="underlineTokens">
                <TabList aria-label="Underline">
                    <Tab v-for="v in views" :key="v.value" :value="v.value">{{ v.label }}</Tab>
                </TabList>
            </Tabs>
        </section>

        <section>
            <small class="demo-caption">Pills</small>
            <Tabs v-model:value="pills" :dt="pillTokens">
                <TabList aria-label="Pills">
                    <Tab v-for="v in views" :key="v.value" :value="v.value">{{ v.label }}</Tab>
                </TabList>
            </Tabs>
        </section>

        <section>
            <small class="demo-caption">Segmented</small>
            <Tabs v-model:value="segmented" :dt="segmentedTokens">
                <TabList aria-label="Segmented" :pt="trackPt">
                    <Tab v-for="v in views" :key="v.value" :value="v.value" :pt="raisedPt">{{ v.label }}</Tab>
                </TabList>
            </Tabs>
        </section>

        <section>
            <small class="demo-caption">Icons and a count</small>
            <Tabs v-model:value="withIcons" :dt="underlineTokens">
                <TabList aria-label="With icons">
                    <Tab v-for="v in views" :key="v.value" :value="v.value">
                        <Icon :icon="v.icon" />
                        {{ v.label }}
                        <Badge v-if="v.count" :value="v.count" severity="danger" />
                    </Tab>
                </TabList>
                <TabPanels>
                    <TabPanel v-for="v in views" :key="v.value" :value="v.value">
                        <p style="margin: 0">{{ v.label }} lives here.</p>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </section>
    </div>
</template>

<style scoped>
.demo-caption {
    display: block;
    margin-bottom: 0.375rem;
    color: var(--vt-text-muted-color);
}
</style>
