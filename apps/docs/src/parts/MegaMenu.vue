<script setup lang="ts">
import { Button, Drawer, Icon } from '@vitral/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { categoryName } from '../demo';
import { sections } from '../lib/catalog';
import { guideSections, sectionName } from '../lib/guides';
import { t } from '../lib/i18n';
import { route, href } from '../lib/router';
import { addons, addonTitle } from '../lib/addons';
import { chartEntries } from '../lib/charts';
import { direction } from '../lib/theme';
import { templateCategories, templates, templateText } from '../templates';

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

// A panel is placed from the side the bar starts on; when the page turns
// over, that side moves, so the panel and the drawer close.
watch(direction, () => {
    open.value = null;
    drawer.value = false;
});
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

/**
 * The order is the way through the site: what there is (the two catalogues,
 * next to each other because a reader looking for a chart should not have to
 * know it is an addon), then how to use it, then whole applications built from
 * it. Icons is a shortcut beside them rather than a panel of its own.
 */
const panels = computed<{ key: Panel; label: string; active: () => boolean }[]>(() => [
    { key: 'components', label: t('Components'), active: () => route.value.name === 'components' || (route.value.name === 'component' && !addonRoutes.has(route.value.id)) },
    { key: 'addons', label: 'Addons', active: () => route.value.name === 'charts' || (route.value.name === 'component' && addonRoutes.has(route.value.id)) },
    { key: 'docs', label: t('Documentation'), active: () => route.value.name === 'doc' },
    { key: 'templates', label: 'Templates', active: () => route.value.name === 'template' || route.value.name === 'templates' }
]);

const drawer = ref(false);
const search = defineModel<boolean>('search', { default: false });

const shortcuts = computed(() => [{ label: t('Icons'), to: '/icons', note: t('The icon set, searchable'), icon: 'star', active: route.value.name === 'icons' }]);

/** What the addons panel lists: the packages, and where each is shown off. */
const addonLinks = computed(() =>
    addons.map((addon) => ({
        ...addon,
        title: addonTitle(addon),
        note: addon.id === 'chart' ? t('{count} kinds, drawn live', { count: chartEntries.length }) : t(addon.note),
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

/** How far from the edge of the window a panel is allowed to sit. */
const MARGIN = 12;

/**
 * Where the open panel starts, measured from the bar's leading edge — which
 * reading right to left is its right edge. It starts under the item that
 * opened it and slides back along the bar when that would take it off the
 * side of the window: the templates panel is 50rem wide and its item is the
 * last but one, so anchored to the item alone it hung 341px past the edge and
 * gave the whole page a horizontal scrollbar.
 */
function place() {
    const host = root.value;
    const panel = host?.querySelector<HTMLElement>('.mega-panel');
    const button = host?.querySelector<HTMLElement>('.top-nav button.on');
    if (!host || !panel || !button) return;
    const bar = host.getBoundingClientRect();
    const box = button.getBoundingClientRect();
    const rtl = getComputedStyle(host).direction === 'rtl';
    const width = panel.offsetWidth;
    const viewport = document.documentElement.clientWidth;
    const wanted = rtl ? bar.right - box.right : box.left - bar.left;
    // The furthest it can start and still end inside the window, and the
    // nearest it can start and still begin inside it.
    const furthest = rtl ? bar.right - MARGIN - width : viewport - MARGIN - width - bar.left;
    const nearest = rtl ? bar.right - viewport + MARGIN : MARGIN - bar.left;
    offset.value = Math.max(nearest, Math.min(wanted, furthest));
}

async function toggle(panel: Panel) {
    open.value = open.value === panel ? null : panel;
    if (!open.value) return;
    // The panel has to be in the document before it can be measured.
    await nextTick();
    place();
}

function onPointerDown(event: Event) {
    if (!root.value?.contains(event.target as Node)) open.value = null;
}

function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') open.value = null;
}

/** A window that changed size while a panel is open is placed again. */
function onResize() {
    if (open.value) place();
}

onMounted(() => {
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('keydown', onKeydown);
    window.removeEventListener('resize', onResize);
});
</script>

<template>
    <div ref="root" class="mega">
        <nav class="top-nav" :aria-label="t('Sections')" accesskey="2">
            <template v-for="panel in panels" :key="panel.key">
                <button type="button" :class="{ 'is-active': panel.active(), on: open === panel.key }" :aria-expanded="open === panel.key" @click="toggle(panel.key)">
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
                                <b>{{ categoryName(group.category) }} <small>{{ group.items.length }}</small></b>
                                <em>{{ t(categoryNotes[group.category]!) }}</em>
                            </span>
                        </a>
                    </div>
                    <a :href="href('/components')" class="mega-foot">{{ t('Browse all {count} components', { count: componentCount }) }} <Icon icon="arrowRight" /></a>
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
                            <span class="mega-group-title">{{ t(group.category) }}</span>
                            <a v-for="entry in group.items" :key="entry.id" :href="href(`/templates/${entry.id}`)" class="mega-item">
                                <span class="mega-icon"><Icon :icon="entry.icon" /></span>
                                <span>
                                    <b>{{ entry.name }}</b>
                                    <em>{{ templateText(entry).summary }}</em>
                                </span>
                            </a>
                        </div>
                    </div>
                    <a :href="href('/templates')" class="mega-foot">{{ t('All {count} templates, with live previews', { count: templates.length }) }} <Icon icon="arrowRight" /></a>
                </template>

                <template v-else>
                    <div class="mega-grid">
                        <a v-for="group in guideSections" :key="group.section" :href="href(`/docs/${group.items[0]!.id}`)" class="mega-item">
                            <span class="mega-icon"><Icon icon="file" /></span>
                            <span>
                                <b>{{ sectionName(group.section) }}</b>
                                <em>{{ t(guideNotes[group.section]!) }}</em>
                            </span>
                        </a>
                    </div>
                    <a :href="href('/docs/introduction')" class="mega-foot">{{ t('Start at the introduction') }} <Icon icon="arrowRight" /></a>
                </template>
                </div>
            </template>

            <a :href="href('/icons')" :class="{ 'is-active': route.name === 'icons' }" :aria-current="route.name === 'icons' ? 'page' : undefined">{{ t('Icons') }}</a>
        </nav>

        <Button
            class="mega-burger"
            icon="menu"
            variant="text"
            severity="secondary"
            :aria-label="t('Sections')"
            aria-haspopup="dialog"
            :aria-expanded="drawer"
            @click="drawer = true"
        />

        <Drawer v-model:visible="drawer" :header="t('Sections')" position="left" class="mega-drawer">
            <button type="button" class="mega-drawer-search" @click="openSearch">
                <Icon icon="search" />
                {{ t('Search the documentation') }}
            </button>

            <nav :aria-label="t('Sections')">
                <a v-for="item in shortcuts" :key="item.to" :href="href(item.to)" class="mega-drawer-link" :aria-current="item.active ? 'page' : undefined" @click="leave">
                    <span class="mega-icon"><Icon :icon="item.icon" /></span>
                    <span>
                        <b>{{ item.label }}</b>
                        <em>{{ item.note }}</em>
                    </span>
                </a>

                <h2>{{ t('Components') }} <small>{{ componentCount }}</small></h2>
                <a v-for="group in sections" :key="group.category" :href="href(`/components/${group.items[0]!.id}`)" class="mega-drawer-link" @click="leave">
                    <span class="mega-icon"><Icon :icon="categoryIcons[group.category] ?? 'circle'" /></span>
                    <span>
                        <b>{{ categoryName(group.category) }} <small>{{ group.items.length }}</small></b>
                        <em>{{ t(categoryNotes[group.category]!) }}</em>
                    </span>
                </a>

                <h2>{{ t('Addons') }} <small>{{ addonLinks.length }}</small></h2>
                <a v-for="addon in addonLinks" :key="addon.id" :href="href(addon.to)" class="mega-drawer-link" :aria-current="addon.active ? 'page' : undefined" @click="leave">
                    <span class="mega-icon"><Icon :icon="addon.icon" /></span>
                    <span>
                        <b>{{ addon.title }}</b>
                        <em>{{ addon.note }}</em>
                    </span>
                </a>

                <h2>{{ t('Documentation') }}</h2>
                <a v-for="group in guideSections" :key="group.section" :href="href(`/docs/${group.items[0]!.id}`)" class="mega-drawer-link" @click="leave">
                    <span class="mega-icon"><Icon icon="file" /></span>
                    <span>
                        <b>{{ sectionName(group.section) }}</b>
                        <em>{{ t(guideNotes[group.section]!) }}</em>
                    </span>
                </a>

                <h2>Templates <small>{{ templates.length }}</small></h2>
                <a v-for="entry in templates" :key="entry.id" :href="href(`/templates/${entry.id}`)" class="mega-drawer-link" @click="leave">
                    <span class="mega-icon"><Icon :icon="entry.icon" /></span>
                    <span>
                        <b>{{ entry.name }}</b>
                        <em>{{ templateText(entry).summary }}</em>
                    </span>
                </a>

            </nav>
        </Drawer>

    </div>
</template>
