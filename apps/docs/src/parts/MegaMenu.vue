<script setup lang="ts">
import { Icon } from '@vitral/vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { sections } from '../lib/catalog';
import { guideSections } from '../lib/guides';
import { route, href } from '../lib/router';
import { templateCategories, templates } from '../templates';

/**
 * The bar's menus: a panel per section, anchored under the item that opened it
 * and no wider than what it holds. Each entry is an icon, a name and a line
 * saying what it is for. A list of forty links is a wall, not a menu.
 *
 * It is a disclosure rather than a menubar: the panel holds links, so Tab walks
 * them, Escape closes, and a press outside closes.
 */
type Panel = 'components' | 'templates' | 'docs';

const open = ref<Panel | null>(null);
const offset = ref(0);
const root = ref<HTMLElement | null>(null);

const categoryIcons: Record<string, string> = {
    Form: 'pencil',
    Button: 'check',
    Data: 'grip',
    Panel: 'folder',
    Overlay: 'maximize',
    Menu: 'menu',
    Messages: 'bell',
    Media: 'file',
    Layout: 'sidebar',
    Misc: 'star'
};

const categoryNotes: Record<string, string> = {
    Form: 'Fields, choices and the values they carry',
    Button: 'Commands, and the menus welded to them',
    Data: 'Tables, lists and trees over the data layer',
    Panel: 'Containers that group and collapse',
    Overlay: 'Dialogs, drawers and popovers',
    Menu: 'Navigation and the APG keyboard for it',
    Messages: 'What the application says back',
    Media: 'Images and files',
    Layout: 'The panels a screen is assembled from',
    Misc: 'Badges, tags and the small pieces'
};

const guideNotes: Record<string, string> = {
    'Get started': 'Install it and read the first page',
    Theming: 'Tokens, presets and colour schemes',
    Customisation: 'Pass-through, unstyled mode, locales',
    Reference: 'Accessibility, layout, contributing',
    AI: 'Documentation a coding agent can read'
};

const componentCount = computed(() => sections.reduce((total, section) => total + section.items.length, 0));

function toggle(panel: Panel, event: MouseEvent) {
    const button = event.currentTarget as HTMLElement;
    // How far the button starts from where the bar starts, which reading right
    // to left is measured from the right. `offsetLeft` would anchor the panel's
    // left edge to the button's left in both, and in right-to-left that sends a
    // 40rem panel off the side of the window.
    const host = root.value!.getBoundingClientRect();
    const box = button.getBoundingClientRect();
    offset.value = getComputedStyle(root.value!).direction === 'rtl' ? host.right - box.right : box.left - host.left;
    open.value = open.value === panel ? null : panel;
}

function onPointerDown(event: Event) {
    if (!root.value?.contains(event.target as Node)) open.value = null;
}

function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') open.value = null;
}

onMounted(() => {
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
    <div ref="root" class="mega">
        <nav class="top-nav" aria-label="Sections">
            <button type="button" :class="{ 'is-active': route.name === 'component', on: open === 'components' }" :aria-expanded="open === 'components'" @click="toggle('components', $event)">
                Components
                <Icon icon="chevronDown" />
            </button>
            <button
                type="button"
                :class="{ 'is-active': route.name === 'template' || route.name === 'templates', on: open === 'templates' }"
                :aria-expanded="open === 'templates'"
                @click="toggle('templates', $event)"
            >
                Templates
                <Icon icon="chevronDown" />
            </button>
            <button type="button" :class="{ 'is-active': route.name === 'doc', on: open === 'docs' }" :aria-expanded="open === 'docs'" @click="toggle('docs', $event)">
                Documentation
                <Icon icon="chevronDown" />
            </button>
            <a :href="href('/icons')" :class="{ 'is-active': route.name === 'icons' }" :aria-current="route.name === 'icons' ? 'page' : undefined">Icons</a>
            <a :href="href('/charts')" :class="{ 'is-active': route.name === 'charts' }" :aria-current="route.name === 'charts' ? 'page' : undefined">Charts</a>
        </nav>

        <div v-if="open" class="mega-panel" :class="{ wide: open === 'templates' }" :style="{ '--mega-offset': `${offset}px` }" @click="open = null">
            <template v-if="open === 'components'">
                <div class="mega-grid">
                    <a v-for="group in sections" :key="group.category" :href="href(`/components/${group.items[0]!.id}`)" class="mega-item">
                        <span class="mega-icon"><Icon :icon="categoryIcons[group.category] ?? 'circle'" /></span>
                        <span>
                            <b>{{ group.category }} <small>{{ group.items.length }}</small></b>
                            <em>{{ categoryNotes[group.category] }}</em>
                        </span>
                    </a>
                </div>
                <a :href="href('/components/button')" class="mega-foot">Browse all {{ componentCount }} components <Icon icon="arrowRight" /></a>
            </template>

            <template v-else-if="open === 'templates'">
                <div class="mega-columns">
                    <div v-for="group in templateCategories" :key="group.category" class="mega-group">
                        <span class="mega-group-title">{{ group.category }}</span>
                        <a v-for="entry in group.items" :key="entry.id" :href="href(`/templates/${entry.id}`)" class="mega-item">
                            <span class="mega-icon"><Icon :icon="entry.icon" /></span>
                            <span>
                                <b>{{ entry.name }}</b>
                                <em>{{ entry.summary }}</em>
                            </span>
                        </a>
                    </div>
                </div>
                <a :href="href('/templates')" class="mega-foot">All {{ templates.length }} templates, with live previews <Icon icon="arrowRight" /></a>
            </template>

            <template v-else>
                <div class="mega-grid">
                    <a v-for="group in guideSections" :key="group.section" :href="href(`/docs/${group.items[0]!.id}`)" class="mega-item">
                        <span class="mega-icon"><Icon icon="file" /></span>
                        <span>
                            <b>{{ group.section }}</b>
                            <em>{{ guideNotes[group.section] }}</em>
                        </span>
                    </a>
                </div>
                <a :href="href('/docs/introduction')" class="mega-foot">Start at the introduction <Icon icon="arrowRight" /></a>
            </template>
        </div>
    </div>
</template>
