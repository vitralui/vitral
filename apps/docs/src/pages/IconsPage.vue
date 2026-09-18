<script setup lang="ts">
import { baseIcons, ICON_STROKE_WIDTH, renderSvg, type IconDef } from '@vitral/icons';
import { categories, iconList } from '@vitral/icons/registry';
import { Button, Icon, IconField, InputIcon, InputText, Select, Slider } from '@vitral/vue';
import { computed, ref, shallowRef, useId } from 'vue';
import CodeBlock from '../parts/CodeBlock.vue';

const externalExample = `<script setup lang="ts">
import { h, markRaw } from 'vue';
import { Camera } from 'lucide-vue-next';
import { Icon as Iconify } from '@iconify/vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { graduationCap } from '@vitral/icons';

// A component that needs its own props is wrapped in a function.
const MdiHome = () => h(Iconify, { icon: 'mdi:home' });
const FaUser = () => h(FontAwesomeIcon, { icon: faUser });

// Components kept in a model are marked raw, so Vue does not make them reactive.
const items = [
    { label: 'Photo', icon: markRaw(Camera) },
    { label: 'Home', icon: MdiHome },
    { label: 'Course', icon: graduationCap }
];
<\/script>

<template>
    <Button label="Shoot" :icon="Camera" />
    <Button label="Profile" :icon="FaUser" />
    <Button label="Me" icon="fa-solid fa-user" />        <!-- an icon font's classes -->
    <Button label="Logo" :icon="'<svg viewBox=…>…</svg>'" />  <!-- trusted markup -->
    <Menu :model="items" />
</template>`;

/**
 * Every icon in `@vitral/icons`, searchable by name, category and tag. A tile
 * selects its icon; the panel beside the grid copies what you came for — the
 * name, the `<Icon>` line or the SVG itself — and says so to a screen reader.
 */

const base = new Set(baseIcons.map((def) => def.name));
const labelOf = new Map<string, string>(categories.map((category) => [category.id, category.label]));

const query = ref('');
const category = ref<string>('all');
const size = ref(24);
const stroke = ref(ICON_STROKE_WIDTH);
const selected = shallowRef<IconDef | null>(null);
const announcement = ref('');
const copied = ref<'name' | 'snippet' | 'svg' | null>(null);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;
const ids = { size: useId(), stroke: useId(), search: useId(), category: useId() };

const categoryOptions = computed(() => [
    { label: `All categories (${iconList.length})`, value: 'all' },
    ...categories.map((c) => ({ label: `${c.label} (${c.icons.length})`, value: c.id }))
]);

// Words are matched independently against the name (split at its capitals),
// the category and the tags, so "cart plus" finds `cartPlus`.
const haystack = new Map(
    iconList.map((def) => [def, [def.name.toLowerCase(), def.name.replace(/([A-Z])/g, ' $1').toLowerCase(), def.category ?? '', labelOf.get(def.category ?? '') ?? '', ...(def.tags ?? [])].join(' ').toLowerCase()])
);

const groups = computed(() => {
    const words = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return categories
        .filter((c) => category.value === 'all' || c.id === category.value)
        .map((c) => ({ ...c, icons: c.icons.filter((def) => words.every((word) => haystack.get(def)!.includes(word))) }))
        .filter((c) => c.icons.length > 0);
});

const count = computed(() => groups.value.reduce((total, group) => total + group.icons.length, 0));

const snippet = computed(() => {
    const def = selected.value;
    if (!def) return '';
    if (base.has(def.name)) return `<Icon icon="${def.name}" />`;
    return `<Icon :icon="${def.name}" />`;
});
const importLine = computed(() => (selected.value ? `import { ${selected.value.name} } from '@vitral/icons';` : ''));
const svg = computed(() => (selected.value ? renderSvg(selected.value, { width: '24', height: '24' }) : ''));

async function writeClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Older browsers and insecure origins: the selection route still works.
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand?.('copy') ?? false;
        area.remove();
        return ok;
    }
}

async function copy(what: 'name' | 'snippet' | 'svg') {
    const def = selected.value;
    if (!def) return;
    const text = what === 'name' ? def.name : what === 'snippet' ? `${base.has(def.name) ? '' : `${importLine.value}\n`}${snippet.value}` : svg.value;
    const ok = await writeClipboard(text);
    const noun = what === 'name' ? 'name' : what === 'snippet' ? 'Icon snippet' : 'SVG';
    // Cleared first, so copying the same thing twice is announced twice.
    copied.value = ok ? what : null;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => (copied.value = null), 1600);
    announcement.value = '';
    requestAnimationFrame(() => (announcement.value = ok ? `Copied the ${noun} of ${def.name}.` : `Could not copy the ${noun}; select it from the panel instead.`));
}

function select(def: IconDef) {
    selected.value = selected.value === def ? null : def;
    copied.value = null;
}

function clear() {
    query.value = '';
    category.value = 'all';
}
</script>

<template>
    <main class="icons-page" :style="{ '--icons-size': `${size}px` }">
        <div class="doc-head">
            <span class="eyebrow">Icons</span>
            <h1>{{ iconList.length }} icons, drawn for Vitral</h1>
            <p>
                One outline set on a 24×24 grid: round 2-unit strokes, no fill, in the current text colour. Each icon is a named export of
                <code>@vitral/icons</code>, so an application bundles only the ones it imports. Size and stroke come from the theme's
                <code>icon.size</code> and <code>icon.strokeWidth</code> tokens; <code>size</code> and <code>stroke-width</code> override them on one icon.
            </p>
        </div>

        <div class="icons-toolbar" role="search">
            <div class="icons-field icons-search">
                <label :for="ids.search">Search</label>
                <IconField>
                    <InputIcon icon="search" />
                    <InputText :id="ids.search" v-model="query" type="search" placeholder="Name, category or keyword" fluid />
                </IconField>
            </div>
            <div class="icons-field">
                <label :for="ids.category">Category</label>
                <Select :id="ids.category" v-model="category" :options="categoryOptions" option-label="label" option-value="value" fluid />
            </div>
            <div class="icons-field">
                <span :id="ids.size" class="icons-label">Size <output>{{ size }}px</output></span>
                <div class="icons-control">
                    <Slider v-model="size" :min="16" :max="48" :step="4" :aria-labelledby="ids.size" :format-value="(v: number) => `${v} pixels`" />
                </div>
            </div>
            <div class="icons-field">
                <span :id="ids.stroke" class="icons-label">Stroke <output>{{ stroke }}</output></span>
                <div class="icons-control">
                    <Slider v-model="stroke" :min="1" :max="3" :step="0.25" :aria-labelledby="ids.stroke" />
                </div>
            </div>
        </div>

        <p class="icons-count" role="status" aria-live="polite">
            {{ count === iconList.length ? `${count} icons` : `${count} of ${iconList.length} icons` }}
        </p>

        <div class="icons-layout">
            <div class="icons-results">
                <section v-for="group in groups" :key="group.id" class="icons-group" :aria-labelledby="`icons-${group.id}`">
                    <h2 :id="`icons-${group.id}`">{{ group.label }} <small>{{ group.icons.length }}</small></h2>
                    <ul class="icons-grid" role="list">
                        <li v-for="def in group.icons" :key="def.name">
                            <button
                                type="button"
                                class="icons-tile"
                                :class="{ on: selected === def }"
                                :aria-pressed="selected === def"
                                :aria-label="def.name"
                                :title="def.name"
                                @click="select(def)"
                            >
                                <Icon :icon="def" :size="size" :stroke-width="stroke" />
                                <span aria-hidden="true">{{ def.name }}</span>
                            </button>
                        </li>
                    </ul>
                </section>

                <div v-if="!count" class="icons-empty">
                    <Icon icon="search" :size="32" />
                    <p>No icon matches “{{ query }}”.</p>
                    <Button label="Clear the search" severity="secondary" variant="outlined" size="small" @click="clear" />
                </div>
            </div>

            <aside class="icons-panel" aria-label="Selected icon">
                <template v-if="selected">
                    <div class="icons-preview">
                        <Icon :icon="selected" :size="96" :stroke-width="stroke" />
                    </div>
                    <h2>{{ selected.name }}</h2>
                    <p class="icons-meta">{{ labelOf.get(selected.category ?? '') }}</p>
                    <p class="icons-tags">
                        <span v-for="tag in selected.tags" :key="tag">{{ tag }}</span>
                    </p>
                    <div class="icons-actions">
                        <Button :label="copied === 'name' ? 'Copied' : 'Copy name'" :icon="copied === 'name' ? 'check' : 'copy'" severity="secondary" variant="outlined" size="small" @click="copy('name')" />
                        <Button :label="copied === 'snippet' ? 'Copied' : 'Copy <Icon>'" :icon="copied === 'snippet' ? 'check' : 'copy'" severity="secondary" variant="outlined" size="small" @click="copy('snippet')" />
                        <Button :label="copied === 'svg' ? 'Copied' : 'Copy SVG'" :icon="copied === 'svg' ? 'check' : 'copy'" severity="secondary" variant="outlined" size="small" @click="copy('svg')" />
                    </div>
                    <CodeBlock :code="base.has(selected.name) ? snippet : `${importLine}\n\n${snippet}`" label="Usage" lang="vue" />
                    <p v-if="!base.has(selected.name)" class="icons-note">
                        By name — <code>icon="{{ selected.name }}"</code> — after <code>registerIcons([{{ selected.name }}])</code>, or the plugin's <code>icons</code> option.
                    </p>
                </template>
                <p v-else class="icons-hint">Pick an icon to copy its name, its <code>&lt;Icon&gt;</code> line or its SVG.</p>
            </aside>
        </div>

        <section class="icons-external" aria-labelledby="icons-external">
            <h2 id="icons-external">Icons from other libraries</h2>
            <p>
                Every <code>icon</code> prop — on a button, a menu item, a toast, a tree node — goes through <code>&lt;Icon&gt;</code>, which takes more than this
                set: another library's Vue component, SVG markup you trust, or the classes of an icon font. Whatever it is gets the <code>vt-icon</code> class, the
                theme's size and the same hidden-or-labelled accessibility.
            </p>
            <CodeBlock :code="externalExample" label="Other libraries" lang="vue" />
        </section>

        <p class="vt-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
    </main>
</template>
