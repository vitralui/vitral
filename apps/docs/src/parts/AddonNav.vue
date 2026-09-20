<script setup lang="ts">
import { Icon } from '@vitral/vue';
import { addons } from '../lib/addons';
import { href, route } from '../lib/router';

// The addons at the head of the sidebar. They are the parts of Vitral that
// draw themselves — plain TypeScript, no framework in them — so they are worth
// finding before the component list rather than buried alphabetically inside
// it. Each is a <details>: the summary is the button, and opening it says what
// the addon draws and which package it is. Native, so it works before the
// JavaScript arrives and needs no state of its own.

// The one whose page is open starts open, since that is the one being read.
const current = (component: string) => route.value.id === component;
</script>

<template>
    <div class="addon-nav">
        <h2>Addons</h2>
        <details v-for="addon in addons" :key="addon.id" class="addon" :open="current(addon.component)">
            <summary class="addon-summary">
                <Icon :icon="addon.icon" class="addon-icon" />
                <span class="addon-title">{{ addon.title }}</span>
                <Icon icon="chevronDown" class="addon-chevron" />
            </summary>
            <div class="addon-body">
                <p class="addon-note">{{ addon.note }}</p>
                <a :href="href(addon.to)" class="addon-link" :aria-current="current(addon.component) ? 'page' : undefined">
                    {{ addon.name }}
                    <Icon icon="arrowRight" />
                </a>
            </div>
        </details>
    </div>
</template>
