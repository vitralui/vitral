<script setup lang="ts">
import { Button, useTheme } from '@vitral/vue';
import { REPO_URL } from '../lib/links';
import MegaMenu from './MegaMenu.vue';
import SearchDialog from './SearchDialog.vue';
import ThemeMenu from './ThemeMenu.vue';

const search = defineModel<boolean>('search', { default: false });
const theme = useTheme();
</script>

<template>
    <header class="topbar">
        <div class="topbar-inner">
            <a class="brand" href="#/">
                <span class="brand-mark" aria-hidden="true" />
                Vitral
                <span class="brand-version">0.1</span>
            </a>

            <MegaMenu />

            <div class="top-actions">
                <button class="search-btn" type="button" @click="search = true">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                        <circle cx="7" cy="7" r="4.25" />
                        <path d="M10.2 10.2l3.3 3.3" />
                    </svg>
                    Search
                    <kbd>Ctrl K</kbd>
                </button>
                <ThemeMenu />
                <Button
                    :icon="theme.isDark.value ? 'sun' : 'moon'"
                    variant="text"
                    severity="secondary"
                    :aria-label="theme.isDark.value ? 'Switch to the light scheme' : 'Switch to the dark scheme'"
                    @click="theme.toggleDark()"
                />
                <a class="icon-link" :href="REPO_URL" target="_blank" rel="noreferrer" aria-label="Vitral on GitHub">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path
                            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
                        />
                    </svg>
                </a>
            </div>
        </div>
    </header>

    <SearchDialog v-model:visible="search" />
</template>
