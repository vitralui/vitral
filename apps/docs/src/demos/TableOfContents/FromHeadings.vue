<script setup lang="ts">
import { TableOfContents } from '@vitral/vue';

const sections = [
    { id: 'toc-install', title: 'Install', sub: [{ id: 'toc-npm', title: 'With a package manager' }, { id: 'toc-cdn', title: 'From a CDN' }] },
    { id: 'toc-theme', title: 'Pick a theme', sub: [{ id: 'toc-tokens', title: 'Tokens' }] },
    { id: 'toc-use', title: 'Use a component', sub: [] },
    { id: 'toc-ship', title: 'Ship it', sub: [] }
];
</script>

<template>
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) 13rem; gap: 2rem; align-items: start">
        <article id="toc-demo-article" style="line-height: 1.7">
            <template v-for="section in sections" :key="section.id">
                <h2 :id="section.id" style="margin: 1.5rem 0 0.5rem; font-size: 1.25rem">{{ section.title }}</h2>
                <p>A few paragraphs stand in for the section's text. The outline beside it follows as the page scrolls past each heading.</p>
                <p>Headings keep their own ids; the outline links to them, so a link to a section still works when shared.</p>
                <template v-for="sub in section.sub" :key="sub.id">
                    <h3 :id="sub.id" style="margin: 1rem 0 0.25rem; font-size: 1.05rem">{{ sub.title }}</h3>
                    <p>A subsection, drawn one step in.</p>
                </template>
            </template>
        </article>
        <TableOfContents source="#toc-demo-article" selector="h2, h3" :offset="72" style="position: sticky; top: 5rem" />
    </div>
</template>
