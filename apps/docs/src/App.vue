<script setup lang="ts">
import { Drawer, Icon, ScrollTop } from '@vitral/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { entryOf } from './lib/catalog';
import { guideOf } from './lib/guides';
import { t } from './lib/i18n';
import { templateOf } from './templates';
import { useDocumentHead } from './lib/head';
import { route, href } from './lib/router';
import { installThemeSwitcher } from './lib/theme';
import { pages } from './lib/pages';
import ComponentPage from './pages/ComponentPage.vue';
import DocPage from './pages/DocPage.vue';
import NotFound from './pages/NotFound.vue';
import PaneLinks from './parts/PaneLinks.vue';
import SiteFooter from './parts/SiteFooter.vue';
import TopBar from './parts/TopBar.vue';

installThemeSwitcher();
useDocumentHead();

const search = ref(false);
/** The pane as a drawer, on a screen too narrow to show it beside the page. */
const paneOpen = ref(false);
const isDocs = computed(() => route.value.name === 'doc');

/**
 * A route whose shape is right but whose id names nothing: `/docs/typo`,
 * `/components/buton`. The catalogues are here already, so the shell answers
 * it rather than each page falling back to its first entry and showing the
 * wrong thing at an address that has nothing behind it.
 */
const missing = computed(() => {
    const { name, id } = route.value;
    if (name === 'doc') return !guideOf(id);
    if (name === 'component') return !entryOf(id);
    if (name === 'template' || name === 'template-preview') return !templateOf(id);
    return false;
});

// ---- the pane follows the page --------------------------------------------
// The pane scrolls on its own and the component list is long, so a direct hit
// on /components/treetable would open with the pane at the top and the page you
// are on out of sight below it. This brings the current link into view, but
// only when it is not already there: clicking a link you can see must not make
// the list jump under the pointer.
const pane = ref<HTMLElement | null>(null);

function revealCurrent(smooth: boolean) {
    const el = pane.value;
    if (!el || el.scrollHeight <= el.clientHeight) return;
    const link = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (!link) return;
    const box = el.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    if (item.top >= box.top && item.bottom <= box.bottom) return;
    // Centred rather than flush against an edge: the links around it are how
    // you tell where you are in a list of ninety.
    const delta = item.top - box.top - (box.height - item.height) / 2;
    el.scrollTo({ top: el.scrollTop + delta, behavior: smooth ? 'smooth' : 'instant' });
}

// On arrival there is nothing to animate, and afterwards the movement says the
// list followed you rather than jumped.
onMounted(() => nextTick(() => revealCurrent(false)));
// A link in the drawer has done its job once the page it opens is up.
watch(() => route.value.path, () => (paneOpen.value = false));
watch(() => route.value.path, () => nextTick(() => revealCurrent(true)));

// A new page starts at its top, at once, whatever the page's smooth scrolling
// says, and for every route in one place.
watch(
    () => route.value.path,
    () => nextTick(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }))
);

function onKeydown(event: KeyboardEvent) {
    // A focused widget that uses the shortcut itself (the editor's link) has handled it.
    if (event.defaultPrevented) return;
    if (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        search.value = true;
    }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
    <!-- A template opened full screen is the whole page: no bar, no footer. -->
    <component :is="pages['template-preview']!.component" v-if="route.name === 'template-preview' && !missing" />

    <template v-else>
        <!-- WCAG 2.4.1: every page opens with the same bar and the same
             sidebar, so a keyboard needs a way past them to the thing it came
             for. Visible only once it has focus. -->
        <a class="skip-link" href="#content">{{ t('Skip to content') }}</a>
        <TopBar v-model:search="search" />

        <!-- `display: contents`, so it is a place to send focus and nothing to
             the layout. -->
        <div id="content" tabindex="-1" accesskey="1" class="content-target">

        <NotFound v-if="route.name === 'not-found' || missing" />
        <!-- The one-of-a-kind pages, each fetched when first opened (see lib/pages). -->
        <component :is="pages[route.name]!.component" v-else-if="pages[route.name]" />

        <div v-else class="docs">
            <!-- Below the width where the pane fits, a bar under the site's own
                 opens the same list as a drawer, the way VitePress does. -->
            <div class="docs-localnav">
                <button type="button" class="docs-localnav-button" aria-haspopup="dialog" :aria-expanded="paneOpen" @click="paneOpen = true">
                    <Icon icon="sidebar" />
                    {{ isDocs ? t('Documentation') : t('Components') }}
                </button>
            </div>
            <Drawer v-model:visible="paneOpen" :header="isDocs ? t('Documentation') : t('Components')" position="left" class="pane-drawer">
                <nav class="pane" :aria-label="isDocs ? t('Documentation') : t('Components')">
                    <PaneLinks :docs="isDocs" />
                </nav>
            </Drawer>

            <nav ref="pane" class="pane" :aria-label="isDocs ? t('Documentation') : t('Components')">
                <PaneLinks :docs="isDocs" />
            </nav>

            <DocPage v-if="isDocs" />
            <ComponentPage v-else />
        </div>

        </div>

        <SiteFooter />
        <ScrollTop :threshold="600" />
    </template>
</template>
