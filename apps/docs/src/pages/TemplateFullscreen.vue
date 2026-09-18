<script setup lang="ts">
import { Button, Select, useTheme } from '@vitral/vue';
import { computed, ref, useId, watch } from 'vue';
import { route } from '../lib/router';
import ThemeMenu from '../parts/ThemeMenu.vue';
import { templateOf } from '../templates';

// A template on its own, as it would run as an application: the site's bar
// and footer are gone, and a small bar at the foot leads back, switches the
// screen and opens the same theme menu as the site (preset, colour, scheme).
// `?shot` hides the bar, for the screenshots the gallery shows.
const theme = useTheme();
const entry = computed(() => templateOf(route.value.id));
const screen = ref('');
const selectId = useId();
const shot = new URLSearchParams(location.search).has('shot');

watch(
    () => route.value.path,
    (path) => {
        const wanted = path.split('/')[4];
        const screens = entry.value?.screens ?? [];
        screen.value = screens.find((item) => item.id === wanted)?.id ?? screens[0]?.id ?? '';
    },
    { immediate: true }
);

const options = computed(() => (entry.value?.screens ?? []).map((item) => ({ label: item.name, value: item.id })));
</script>

<template>
    <div v-if="entry" class="tpl-full">
        <component :is="entry.layout" v-model:screen="screen" standalone />
        <nav v-if="!shot" class="tpl-float" aria-label="Preview">
            <Button as="a" :href="`#/templates/${entry.id}`" icon="arrowLeft" label="Back" size="small" variant="text" severity="secondary" :aria-label="`Back to ${entry.name}`" />
            <span class="tpl-float-sep" aria-hidden="true" />
            <span :id="selectId" class="vt-sr-only">Screen</span>
            <Select v-model="screen" :options="options" option-label="label" option-value="value" size="small" :aria-labelledby="selectId" />
            <span class="tpl-float-sep" aria-hidden="true" />
            <ThemeMenu placement="top" size="small" />
            <Button
                :icon="theme.isDark.value ? 'sun' : 'moon'"
                size="small"
                variant="text"
                severity="secondary"
                :aria-label="theme.isDark.value ? 'Switch to the light scheme' : 'Switch to the dark scheme'"
                @click="theme.toggleDark()"
            />
        </nav>
    </div>
    <main v-else class="home">
        <section class="home-band">
            <div class="home-wrap home-head">
                <h1>No template called “{{ route.id }}”</h1>
                <a href="#/templates">See all templates</a>
            </div>
        </section>
    </main>
</template>
