<script setup lang="ts">
import { Button, Drawer, Icon } from '@vitral/vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { sections } from '../lib/catalog';
import { guideSections } from '../lib/guides';
import { route, href } from '../lib/router';
import { addons } from '../lib/addons';
import { chartEntries } from '../lib/charts';
import { templateCategories, templates } from '../templates';

/**
 * The bar's menus: a panel per section, anchored under the item that opened it
 * and no wider than what it holds. Each entry is an icon, a name and a line
 * saying what it is for. A list of forty links is a wall, not a menu.
 *
 * It is a disclosure rather than a menubar: the panel holds links, so Tab walks
 * them, Escape closes, and a press outside closes.
 */
type Panel = 'components' | 'addons' | 'templates' | 'docs';

const open = ref<Panel | null>(null);
const offset = ref(0);
const root = ref<HTMLElement | null>(null);

/**
 * The same sections, on a phone. Below 900px the bar has no room for the
 * panels, and until now it simply dropped them: the only way to another part of
 * the site was the footer. The drawer is the panels' content in one column,
 * opened by the one button there is room for.
 */
/**
 * The three panels, as data: a panel has to be rendered immediately after the
 * button that opened it, or Tab leaves the trigger and walks the rest of the
 * bar before it ever reaches what was just revealed. A disclosure's content
 * follows its disclosure.
 */
const addonRoutes = new Set(addons.map((addon) => addon.component));

const panels: { key: Panel; label: string; active: () => boolean }[] = [
    { key: 'components', label: 'Components', active: () => route.value.name === 'component' && !addonRoutes.has(route.value.id) },
    { key: 'templates', label: 'Templates', active: () => route.value.name === 'template' || route.value.name === 'templates' },
    { key: 'docs', label: 'Documentation', active: () => route.value.name === 'doc' },
    // The four packages that draw themselves, the charts gallery among them:
    // a reader looking for the chart page should not have to know it is one.
    { key: 'addons', label: 'Addons', active: () => route.value.name === 'charts' || (route.value.name === 'component' && addonRoutes.has(route.value.id)) }
];

const drawer = ref(false);
const search = defineModel<boolean>('search', { default: false });

const shortcuts = computed(() => [{ label: 'Icons', to: '/icons', note: 'The icon set, searchable', icon: 'star', active: route.value.name === 'icons' }]);

/** What the addons panel lists: the packages, and where each is shown off. */
const addonLinks = computed(() =>
    addons.map((addon) => ({
        ...addon,
        note: addon.id === 'chart' ? `${chartEntries.length} kinds, drawn live` : addon.note,
        active: addon.to === '/charts' ? route.value.name === 'charts' : route.value.id === addon.component
    }))
);

// A link inside the drawer has done its job; the drawer should not stay open
// over the page it just opened.
function leave() {
    drawer.value = false;
}

function openSearch() {
    drawer.value = false;
    search.value = true;
}

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
            <template v-for="panel in panels" :key="panel.key">
                <button type="button" :class="{ 'is-active': panel.active(), on: open === panel.key }" :aria-expanded="open === panel.key" @click="toggle(panel.key, $event)">
                    {{ panel.label }}
                    <Icon icon="chevronDown" />
                </button>

                <!-- Right after its own button, so Tab goes into what it opened. -->
                <div v-if="open === panel.key" class="mega-panel" :class="{ wide: panel.key === 'templates' }" :style="{ '--mega-offset': `${offset}px` }" @click="open = null">
                <template v-if="panel.key === 'components'">
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

                <template v-else-if="panel.key === 'addons'">
                    <div class="mega-grid">
                        <a v-for="addon in addonLinks" :key="addon.id" :href="href(addon.to)" class="mega-item" :class="{ 'is-active': addon.active }">
                            <span class="mega-icon"><Icon :icon="addon.icon" /></span>
                            <span>
                                <b>{{ addon.title }} <code>{{ addon.name }}</code></b>
                                <em>{{ addon.note }}</em>
                            </span>
                        </a>
                    </div>
                </template>

                <template v-else-if="panel.key === 'templates'">
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
            </template>

            <a :href="href('/icons')" :class="{ 'is-active': route.name === 'icons' }" :aria-current="route.name === 'icons' ? 'page' : undefined">Icons</a>
        </nav>

        <Button
            class="mega-burger"
            icon="menu"
            variant="text"
            severity="secondary"
            aria-label="Sections"
            aria-haspopup="dialog"
            :aria-expanded="drawer"
            @click="drawer = true"
        />

        <Drawer v-model:visible="drawer" header="Sections" position="left" class="mega-drawer">
            <button type="button" class="mega-drawer-search" @click="openSearch">
                <Icon icon="search" />
                Search the documentation
            </button>

            <nav aria-label="Sections">
                <a v-for="item in shortcuts" :key="item.to" :href="href(item.to)" class="mega-drawer-link" :aria-current="item.active ? 'page' : undefined" @click="leave">
                    <span class="mega-icon"><Icon :icon="item.icon" /></span>
                    <span>
                        <b>{{ item.label }}</b>
                        <em>{{ item.note }}</em>
                    </span>
                </a>

                <h2>Components <small>{{ componentCount }}</small></h2>
                <a v-for="group in sections" :key="group.category" :href="href(`/components/${group.items[0]!.id}`)" class="mega-drawer-link" @click="leave">
                    <span class="mega-icon"><Icon :icon="categoryIcons[group.category] ?? 'circle'" /></span>
                    <span>
                        <b>{{ group.category }} <small>{{ group.items.length }}</small></b>
                        <em>{{ categoryNotes[group.category] }}</em>
                    </span>
                </a>

                <h2>Documentation</h2>
                <a v-for="group in guideSections" :key="group.section" :href="href(`/docs/${group.items[0]!.id}`)" class="mega-drawer-link" @click="leave">
                    <span class="mega-icon"><Icon icon="file" /></span>
                    <span>
                        <b>{{ group.section }}</b>
                        <em>{{ guideNotes[group.section] }}</em>
                    </span>
                </a>

                <h2>Templates <small>{{ templates.length }}</small></h2>
                <a v-for="entry in templates" :key="entry.id" :href="href(`/templates/${entry.id}`)" class="mega-drawer-link" @click="leave">
                    <span class="mega-icon"><Icon :icon="entry.icon" /></span>
                    <span>
                        <b>{{ entry.name }}</b>
                        <em>{{ entry.summary }}</em>
                    </span>
                </a>

                <h2>Addons <small>{{ addonLinks.length }}</small></h2>
                <a v-for="addon in addonLinks" :key="addon.id" :href="href(addon.to)" class="mega-drawer-link" :aria-current="addon.active ? 'page' : undefined" @click="leave">
                    <span class="mega-icon"><Icon :icon="addon.icon" /></span>
                    <span>
                        <b>{{ addon.title }}</b>
                        <em>{{ addon.note }}</em>
                    </span>
                </a>
            </nav>
        </Drawer>

    </div>
</template>
