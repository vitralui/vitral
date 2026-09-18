<script setup lang="ts">
import { href } from '../lib/router';
import { templates } from '../templates';

const featured = templates.slice(0, 3);
const year = new Date().getFullYear();
</script>

<template>
    <footer class="footer">
        <div class="footer-inner">
            <div style="max-width: 30ch">
                <div class="brand" style="margin-bottom: 0.5rem"><span class="brand-mark" aria-hidden="true" />Vitral</div>
                <p style="margin: 0; line-height: 1.6">Stained glass: many pieces of coloured glass held in one frame, with the light (the theme) coming through all of them at once.</p>
            </div>
            <div>
                <h4>Documentation</h4>
                <ul>
                    <li><a :href="href('/docs/introduction')">Introduction</a></li>
                    <li><a :href="href('/docs/installation')">Installation</a></li>
                    <li><a :href="href('/docs/theming')">Theming</a></li>
                    <li><a :href="href('/docs/presets')">Presets</a></li>
                    <li><a :href="href('/docs/layout')">Layout panels</a></li>
                </ul>
            </div>
            <div>
                <h4>Templates</h4>
                <ul>
                    <li v-for="entry in featured" :key="entry.id"><a :href="href(`/templates/${entry.id}`)">{{ entry.category }}</a></li>
                    <li><a :href="href('/templates')">All templates</a></li>
                </ul>
            </div>
            <div>
                <h4>Components</h4>
                <ul>
                    <li><a :href="href('/components/button')">Button</a></li>
                    <li><a :href="href('/components/select')">Select</a></li>
                    <li><a :href="href('/components/datatable')">DataTable</a></li>
                    <li><a :href="href('/components/splitview')">SplitView</a></li>
                </ul>
            </div>
            <div>
                <h4>Project</h4>
                <ul>
                    <li><a :href="href('/docs/contributing')">Contributing</a></li>
                </ul>
            </div>
        </div>
        <p class="footer-note">© {{ year }} Vitral · LGPL-3.0-or-later. Built with Vitral.</p>
    </footer>
</template>
