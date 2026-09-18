<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Coding agents',
    section: 'AI',
    description: 'Every page of this site is also plain Markdown, and the whole of it is one file, so an assistant can read the documentation instead of guessing at it.'
};
</script>

<script setup lang="ts">
import { base, href } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';

const files = `${base}/llms.txt         the index: every page, with a line on what it covers
${base}/llms-full.txt    all of it in one file
${base}/docs/theming.md  any page, with .md instead of the trailing slash
${base}/components/select.md`;

const rules = `# Vitral

Docs: https://vitralui.github.io/vitral/llms.txt

- Import components from \`@vitral/vue\`: \`import { Button, Select } from '@vitral/vue'\`.
  In Nuxt they are global (\`<VtButton>\`) through \`@vitral/nuxt\`.
- Do not write utility classes and do not hand-write CSS to restyle a component.
  The look is tokens: \`dt('button.background')\`, a preset, or the \`dt\` prop.
- To change one instance's markup or classes, use pass-through (\`pt\`), not a wrapper.
- \`unstyled\` drops every class and keeps the behaviour and the ARIA.
- Icons are names resolved from \`@vitral/icons\`: \`<Button icon="search" />\`.
  Anything outside the base set has to be registered first.
- Fields are real controls: \`<label for>\`, \`name\` and \`aria-describedby\` reach
  them without extra props.`;

const ask = `Read https://vitralui.github.io/vitral/components/datatable.md
and write me a table of invoices with sorting, filtering and paging.`;
</script>

<template>
    <p>
        An assistant that has not read the documentation writes what it remembers of some other library: utility classes over the components, a stylesheet fighting the theme,
        icon imports that do not exist. None of that is a hard problem — it is a reading problem. So the build writes this site twice: once as the pages you are looking at, and
        once as Markdown, in the shape <a href="https://llmstxt.org" target="_blank" rel="noreferrer">llms.txt</a> describes.
    </p>

    <h2>What is published</h2>
    <CodeBlock :code="files" label="on every build" lang="text" />
    <p>
        <a :href="`${base}/llms.txt`">llms.txt</a> is the index: the guides, every component and every template, each with the line that describes it, linking to the Markdown
        rather than the page. <a :href="`${base}/llms-full.txt`">llms-full.txt</a> is the lot, concatenated, for a model with the context to hold it. And any page answers with
        <code>.md</code> in place of its trailing slash, which is the cheapest thing to hand an agent that only needs one component.
    </p>
    <p>
        The Markdown is generated from the rendered page, so it carries the prose, the headings and the API tables — which are themselves read out of each component's
        <code>types.ts</code> at build time. A component's page also gets the source of its examples appended, because on the site those sit behind a button and an agent cannot
        press it.
    </p>

    <h2>Point an agent at it</h2>
    <p>The whole of it is one line in a prompt:</p>
    <CodeBlock :code="ask" label="a prompt" lang="text" />
    <p>
        For a project you work in every day, put the rules where the agent reads them — <code>AGENTS.md</code>, <code>CLAUDE.md</code>, <code>.cursor/rules</code>, or whatever
        your tool calls it. This is the short version worth pasting, and it is about the things a model gets wrong from habit rather than from ignorance:
    </p>
    <CodeBlock :code="rules" label="AGENTS.md" lang="md" />

    <h2>Why those rules</h2>
    <ul>
        <li>
            <strong>Tokens, not CSS.</strong> The look of every component is custom properties, which a <a :href="href('/docs/presets')">preset</a> sets and
            <a :href="href('/docs/theming')">the <code>dt</code> prop</a> overrides for one instance. A stylesheet written beside it works until the scheme changes.
        </li>
        <li>
            <strong><a :href="href('/docs/pass-through')">Pass-through</a> for markup.</strong> Every internal element is addressable by name, so an agent never has to wrap a
            component to reach inside it.
        </li>
        <li>
            <strong>Icons are registered names.</strong> The components resolve the set they use themselves; anything else is a named import, or one
            <code>registerIcons</code> call. A made-up name renders as a class, silently.
        </li>
        <li>
            <strong>The accessibility is already there.</strong> Each component follows its
            <a href="https://www.w3.org/WAI/ARIA/apg/patterns/" target="_blank" rel="noreferrer">WAI-ARIA APG pattern</a> and is tested against it, so added
            <code>role</code> and <code>aria-*</code> attributes usually break it rather than help.
        </li>
    </ul>

    <h2>Keeping it honest</h2>
    <p>
        Nothing here is written by hand, which is the point: the Markdown is the site, the API tables are the source, and both are rebuilt on every push. A page that goes out of
        date goes out of date in one place.
    </p>
</template>
