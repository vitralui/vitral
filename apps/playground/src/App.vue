<script setup lang="ts">
import { Astra, Avalonia, Button, en, Ink, Prism, ptBR, Select, Simple, useLocale, useTheme, useVitral, type Preset } from '@vitral/vue';
import { computed, onBeforeUnmount, ref, watch, type Component } from 'vue';
import { categoryOrder, type DemoMeta } from '../../docs/src/demo';

const modules = import.meta.glob<{ default: Component; meta?: DemoMeta }>('../../docs/src/demos/*.vue', { eager: true });

const demos = Object.entries(modules)
    .map(([path, mod]) => {
        const file = path.split('/').pop()!.replace('.vue', '');
        return { id: file.toLowerCase(), file, meta: mod.meta ?? { title: file, category: 'Misc' as const }, component: mod.default };
    })
    .sort((a, b) => a.meta.title.localeCompare(b.meta.title));

const sections = categoryOrder.map((category) => ({ category, items: demos.filter((d) => d.meta.category === category) })).filter((s) => s.items.length > 0);

const route = ref(location.hash.replace(/^#\/?/, ''));
const onHash = () => (route.value = location.hash.replace(/^#\/?/, ''));
window.addEventListener('hashchange', onHash);
onBeforeUnmount(() => window.removeEventListener('hashchange', onHash));
const current = computed(() => demos.find((d) => d.id === route.value) ?? demos[0]);

// ---- theme toolbar -------------------------------------------------------

const theme = useTheme();
const { setLocale } = useLocale();
const { config } = useVitral();

const builtIn: Record<string, Preset> = { prism: Prism, ink: Ink, avalonia: Avalonia, simple: Simple, astra: Astra };
const presetOptions = [
    { label: 'Ink', value: 'ink' },
    { label: 'Prism', value: 'prism' },
    { label: 'Astra', value: 'astra' },
    { label: 'Avalonia', value: 'avalonia' },
    { label: 'Simple', value: 'simple' }
];
// `?preset=ink` opens the catalog in that theme.
const presetId = ref(new URLSearchParams(location.search).get('preset') ?? 'ink');
const primary = ref<string | null>(null);

watch(presetId, (id) => {
    primary.value = null;
    theme.setPreset(builtIn[id]!);
}, { immediate: true });

const swatches = [
    { name: 'Emerald', value: '{emerald}', color: '#10b981' },
    { name: 'Indigo', value: '{indigo}', color: '#6366f1' },
    { name: 'Violet', value: '{violet}', color: '#8b5cf6' },
    { name: 'Rose', value: '{rose}', color: '#f43f5e' },
    { name: 'Amber', value: '{amber}', color: '#f59e0b' },
    { name: 'Teal', value: '{teal}', color: '#14b8a6' },
    { name: 'Sky', value: '{sky}', color: '#0ea5e9' }
];

function pickPrimary(value: string) {
    primary.value = value;
    theme.setPrimary(value);
}

const schemeOptions = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' }
];

const localeId = ref('en');
watch(localeId, (id) => setLocale(id === 'pt-BR' ? ptBR : en));
const localeOptions = [
    { label: 'English', value: 'en' },
    { label: 'Português (Brasil)', value: 'pt-BR' }
];

const variantOptions = [
    { label: 'Outlined', value: 'outlined' },
    { label: 'Filled', value: 'filled' }
];
</script>

<template>
    <div class="shell">
        <header class="shell-bar">
            <div class="shell-brand"><span class="shell-brand-mark" aria-hidden="true" />Vitral</div>
            <label>
                Theme
                <Select v-model="presetId" :options="presetOptions" option-label="label" option-value="value" size="small" aria-label="Theme" style="min-width: 10rem" />
            </label>
            <label>
                Scheme
                <Select v-model="theme.colorScheme.value" :options="schemeOptions" option-label="label" option-value="value" size="small" aria-label="Color scheme" />
            </label>
            <label>
                Fields
                <Select v-model="config.inputVariant" :options="variantOptions" option-label="label" option-value="value" size="small" aria-label="Field variant" />
            </label>
            <label>
                Locale
                <Select v-model="localeId" :options="localeOptions" option-label="label" option-value="value" size="small" aria-label="Locale" />
            </label>
            <div role="group" aria-label="Primary color" style="display: flex; gap: 0.375rem; align-items: center">
                <button
                    v-for="s in swatches"
                    :key="s.value"
                    class="swatch"
                    type="button"
                    :aria-label="s.name"
                    :aria-pressed="primary === s.value ? 'true' : 'false'"
                    :style="{ background: s.color }"
                    @click="pickPrimary(s.value)"
                />
            </div>
            <Button :icon="theme.isDark.value ? 'sun' : 'moon'" variant="text" severity="secondary" :aria-label="theme.isDark.value ? 'Switch to light' : 'Switch to dark'" @click="theme.toggleDark()" />
        </header>

        <nav class="shell-nav" aria-label="Components">
            <template v-for="section in sections" :key="section.category">
                <h2>{{ section.category }}</h2>
                <a v-for="demo in section.items" :key="demo.id" :href="`#/${demo.id}`" :aria-current="current?.id === demo.id ? 'page' : undefined">
                    {{ demo.meta.title }}
                </a>
            </template>
        </nav>

        <main class="shell-main">
            <template v-if="current">
                <div class="page-head">
                    <h1>{{ current.meta.title }}</h1>
                    <p v-if="current.meta.description">{{ current.meta.description }}</p>
                </div>
                <component :is="current.component" :key="current.id" />
            </template>
        </main>
    </div>
</template>
