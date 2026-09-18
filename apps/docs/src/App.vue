<script setup lang="ts">
import { ScrollTop } from '@vitral/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { sections } from './lib/catalog';
import { guideSections } from './lib/guides';
import { useDocumentHead } from './lib/head';
import { route, href } from './lib/router';
import { installThemeSwitcher } from './lib/theme';
import ComponentPage from './pages/ComponentPage.vue';
import DocPage from './pages/DocPage.vue';
import Home from './pages/Home.vue';
import ChartsPage from './pages/ChartsPage.vue';
import IconsPage from './pages/IconsPage.vue';
import TemplateFullscreen from './pages/TemplateFullscreen.vue';
import TemplatePage from './pages/TemplatePage.vue';
import TemplatesPage from './pages/TemplatesPage.vue';
import SiteFooter from './parts/SiteFooter.vue';
import TopBar from './parts/TopBar.vue';

installThemeSwitcher();
useDocumentHead();

const search = ref(false);
const isDocs = computed(() => route.value.name === 'doc');

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
    <TemplateFullscreen v-if="route.name === 'template-preview'" />

    <template v-else>
        <TopBar v-model:search="search" />

        <Home v-if="route.name === 'home'" />
        <TemplatesPage v-else-if="route.name === 'templates'" />
        <TemplatePage v-else-if="route.name === 'template'" />
        <IconsPage v-else-if="route.name === 'icons'" />
        <ChartsPage v-else-if="route.name === 'charts'" />

        <div v-else class="docs">
            <nav ref="pane" class="pane" :aria-label="isDocs ? 'Documentation' : 'Components'">
                <template v-if="isDocs">
                    <template v-for="group in guideSections" :key="group.section">
                        <h2>{{ group.section }}</h2>
                        <a v-for="guide in group.items" :key="guide.id" :href="href(`/docs/${guide.id}`)" :aria-current="route.id === guide.id ? 'page' : undefined">
                            {{ guide.meta.title }}
                        </a>
                    </template>
                    <h2>Components</h2>
                    <a :href="href('/components/button')">All components →</a>
                </template>

                <template v-else>
                    <template v-for="group in sections" :key="group.category">
                        <h2>{{ group.category }}</h2>
                        <a v-for="entry in group.items" :key="entry.id" :href="href(`/components/${entry.id}`)" :aria-current="route.id === entry.id ? 'page' : undefined">
                            {{ entry.meta.title }}
                        </a>
                    </template>
                </template>
            </nav>

            <DocPage v-if="isDocs" />
            <ComponentPage v-else />
        </div>

        <SiteFooter />
        <ScrollTop :threshold="600" />
    </template>
</template>
