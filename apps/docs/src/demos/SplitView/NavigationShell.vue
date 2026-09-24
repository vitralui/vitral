<script setup lang="ts">
import { Button, Icon, Label, Select, SplitView, StackPanel } from '@vitral/vue';
import { computed, ref } from 'vue';

type Mode = 'inline' | 'overlay' | 'compactInline' | 'compactOverlay';

const modes = [
    { label: 'Compact overlay', value: 'compactOverlay' },
    { label: 'Compact inline', value: 'compactInline' },
    { label: 'Overlay', value: 'overlay' },
    { label: 'Inline', value: 'inline' }
];
const placements = [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' }
];

const mode = ref<Mode>('compactOverlay');
const placement = ref<'left' | 'right'>('left');
const open = ref(false);
const compactMode = computed(() => mode.value === 'compactInline' || mode.value === 'compactOverlay');
const floating = computed(() => mode.value === 'overlay' || mode.value === 'compactOverlay');

const items = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'documents', label: 'Documents', icon: 'folder' },
    { id: 'favorites', label: 'Favorites', icon: 'star' },
    { id: 'people', label: 'People', icon: 'user' },
    { id: 'alerts', label: 'Notifications', icon: 'bell' }
];
const settings = { id: 'settings', label: 'Settings', icon: 'sliders' };
const page = ref('home');
const current = computed(() => [...items, settings].find((item) => item.id === page.value)!);

function go(id: string, close: () => void) {
    page.value = id;
    // A floating pane gets out of the way once a page is chosen, as NavigationView's does.
    if (floating.value) close();
}
</script>

<template>
    <div class="controls">
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="sv-mode">Display mode</Label>
            <Select id="sv-mode" v-model="mode" :options="modes" option-label="label" option-value="value" size="small" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="sv-placement">Placement</Label>
            <Select id="sv-placement" v-model="placement" :options="placements" option-label="label" option-value="value" size="small" />
        </StackPanel>
    </div>

    <SplitView v-model:open="open" class="app-frame" :display-mode="mode" :placement="placement" :open-pane-length="248" pane-label="Main navigation">
        <template #pane="{ paneId, toggle, close, open: isOpen }">
            <div class="nav">
                <Button
                    icon="menu"
                    variant="text"
                    severity="secondary"
                    class="nav-toggle"
                    :aria-label="isOpen ? 'Close navigation' : 'Open navigation'"
                    :aria-controls="paneId"
                    :aria-expanded="isOpen ? 'true' : 'false'"
                    @click="toggle"
                />
                <nav aria-label="Pages" class="nav-list">
                    <button v-for="item in items" :key="item.id" type="button" class="nav-item" :aria-current="page === item.id ? 'page' : undefined" @click="go(item.id, close)">
                        <Icon :icon="item.icon" />
                        <span class="nav-label">{{ item.label }}</span>
                    </button>
                </nav>
                <button type="button" class="nav-item nav-footer" :aria-current="page === settings.id ? 'page' : undefined" @click="go(settings.id, close)">
                    <Icon :icon="settings.icon" />
                    <span class="nav-label">{{ settings.label }}</span>
                </button>
            </div>
        </template>

        <template #default="{ paneId, toggle, open: isOpen }">
            <div class="page">
                <header class="page-bar">
                    <Button
                        v-if="!compactMode && !isOpen"
                        icon="menu"
                        variant="text"
                        severity="secondary"
                        aria-label="Open navigation"
                        :aria-controls="paneId"
                        aria-expanded="false"
                        @click="toggle"
                    />
                    <h4>{{ current.label }}</h4>
                </header>
                <p class="page-text">
                    Display mode <code>{{ mode }}</code>, pane on the {{ placement }}.
                    {{ floating ? 'Open, the pane floats over this content; press outside it or Escape to close.' : 'Open, the pane pushes this content aside.' }}
                </p>
                <div class="cards">
                    <div v-for="n in 6" :key="n" class="card" :class="`c${((n - 1) % 5) + 1}`">{{ current.label }} {{ n }}</div>
                </div>
            </div>
        </template>
    </SplitView>
</template>

<style scoped>
.controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    width: 100%;
}

.controls .demo-field {
    min-width: 12rem;
}

.app-frame {
    width: 100%;
    height: 24rem;
    background: var(--vt-content-background);
    border: 1px solid var(--vt-content-border-color);
    border-radius: var(--vt-border-radius-lg);
}

.nav {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0.25rem 0;
}

/* Centred on the same 24px line as the nav icons, in the middle of the 48px strip. */
.nav-toggle {
    margin-inline-start: calc(24px - var(--vt-control-min-height) / 2);
    margin-bottom: 0.25rem;
}

.nav-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    width: calc(100% - 0.5rem);
    min-height: 2.25rem;
    margin: 0 0.25rem;
    /* The icon sits centred in the 48px compact strip. */
    padding: 0 0 0 calc(24px - 0.25rem - 0.5rem);
    font: inherit;
    text-align: start;
    color: var(--vt-navigation-item-color);
    background: transparent;
    border: 0;
    border-radius: var(--vt-navigation-item-border-radius);
    cursor: pointer;
    white-space: nowrap;
}

.nav-item:hover {
    background: var(--vt-navigation-item-focus-background);
}

.nav-item[aria-current='page'] {
    background: var(--vt-navigation-item-active-background);
    color: var(--vt-navigation-item-active-color);
}

.nav-item[aria-current='page']::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 3px;
    height: 1rem;
    border-radius: 3px;
    background: var(--vt-primary-color);
    transform: translateY(-50%);
}

.nav-item:focus-visible {
    outline: var(--vt-focus-ring-width) var(--vt-focus-ring-style) var(--vt-focus-ring-color);
    outline-offset: -2px;
}

.nav-footer {
    margin-top: auto;
}

.page {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem 1rem 1rem;
}

.page-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 2rem;
}

.page-bar h4 {
    margin: 0;
    margin-inline-end: auto;
    font-size: 1.125rem;
    font-weight: 600;
}

.page-text {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--vt-text-muted-color);
}

.cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: 0.5rem;
}

.card {
    --c: var(--vt-chart-1);
    min-height: 4.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    color: var(--vt-text-color);
    background: color-mix(in srgb, var(--c) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 50%, transparent);
    border-radius: var(--vt-border-radius-md);
}

.c1 {
    --c: var(--vt-chart-1);
}

.c2 {
    --c: var(--vt-chart-2);
}

.c3 {
    --c: var(--vt-chart-3);
}

.c4 {
    --c: var(--vt-chart-4);
}

.c5 {
    --c: var(--vt-chart-5);
}
</style>
