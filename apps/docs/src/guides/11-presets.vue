<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Presets',
    section: 'Theming',
    description: 'Prism, Ink, Avalonia and Simple: what each one changes, and how to start a fifth.'
};
</script>

<script setup lang="ts">
import { T, t } from '../lib/i18n';
import { href } from '../lib/router';
import { Button, Tag } from '@vitral/vue';
import CodeBlock from '../parts/CodeBlock.vue';
import { themes, themeText } from '../lib/presets';
import { presetId } from '../lib/theme';

const own = `import { definePreset, palette, Base } from '@vitral/vue';

// Base is the preset the others are built on: every component's tokens,
// with nothing opinionated about the look.
export const House = definePreset(Base, {
    semantic: {
        primary: palette('#0f766e'),
        focusRing: { width: '1px', offset: '1px' }
    }
});`;
</script>

<template>
    <T k="intro">
        Four presets ship. Each is a complete theme, with every component's tokens in both schemes, each is a starting point for <code>definePreset</code>, and every
        <a :href="href('/templates')">template</a> on this site can be previewed in any of them, because a theme is easier to judge at work than on a swatch. A fifth is an object: see
        <a :href="href('/docs/theming')">theming</a>.
    </T>

    <template v-for="theme in themes" :key="theme.id">
        <h2>{{ theme.name }}</h2>
        <p>{{ themeText(theme).description }}</p>
        <p>
            <Tag v-for="trait in themeText(theme).traits" :key="trait" :value="trait" severity="secondary" style="margin-right: 0.25rem" />
        </p>
        <p>
            <Button
                :label="presetId === theme.id ? t('In use') : t('Use {name}', { name: theme.name })"
                size="small"
                :severity="presetId === theme.id ? 'secondary' : 'primary'"
                @click="presetId = theme.id"
            />
            <Button as="a" :href="href('/templates')" :label="t('See it on the templates')" size="small" variant="text" severity="secondary" />
        </p>
    </template>

    <T k="own" as="h2">Starting from nothing</T>
    <CodeBlock :code="own" label="house.ts" lang="ts" />
</template>
