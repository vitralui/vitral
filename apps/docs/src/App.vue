<script setup lang="ts">
import { ScrollTop } from '@vitral/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { sections } from './lib/catalog';
import { guideSections } from './lib/guides';
import { route } from './lib/router';
import { installThemeSwitcher } from './lib/theme';
import ComponentPage from './pages/ComponentPage.vue';
import DocPage from './pages/DocPage.vue';
import Home from './pages/Home.vue';
import IconsPage from './pages/IconsPage.vue';
import TemplateFullscreen from './pages/TemplateFullscreen.vue';
import TemplatePage from './pages/TemplatePage.vue';
import TemplatesPage from './pages/TemplatesPage.vue';
import SiteFooter from './parts/SiteFooter.vue';
import TopBar from './parts/TopBar.vue';

installThemeSwitcher();

const search = ref(false);
const isDocs = computed(() => route.value.name === 'doc');

// A new page starts at its top — at once, whatever the page's smooth
// scrolling says, and for every route in one place.
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

        <div v-else class="docs">
            <nav class="pane" :aria-label="isDocs ? 'Documentation' : 'Components'">
                <template v-if="isDocs">
                    <template v-for="group in guideSections" :key="group.section">
                        <h2>{{ group.section }}</h2>
                        <a v-for="guide in group.items" :key="guide.id" :href="`#/docs/${guide.id}`" :aria-current="route.id === guide.id ? 'page' : undefined">
                            {{ guide.meta.title }}
                        </a>
                    </template>
                    <h2>Components</h2>
                    <a href="#/components/button">All components →</a>
                </template>

                <template v-else>
                    <template v-for="group in sections" :key="group.category">
                        <h2>{{ group.category }}</h2>
                        <a v-for="entry in group.items" :key="entry.id" :href="`#/components/${entry.id}`" :aria-current="route.id === entry.id ? 'page' : undefined">
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
