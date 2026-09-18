<script setup lang="ts">
import { useTheme } from '@vitral/vue';
import { computed } from 'vue';
import { SHOT_HEIGHT, SHOT_WIDTH, shotOf } from '../lib/shots';
import type { TemplateMeta } from '../templates';

/**
 * A picture of a template's screen, in the site's scheme. Decorative: the card
 * around it carries the name and the link.
 */
const props = defineProps<{ template: TemplateMeta; screen?: string }>();
const theme = useTheme();
const src = computed(() => shotOf(props.template.id, props.screen ?? props.template.screens[0]!.id, theme.isDark.value));
</script>

<template>
    <span class="tpl-thumb">
        <img :src="src" alt="" :width="SHOT_WIDTH" :height="SHOT_HEIGHT" loading="lazy" decoding="async" />
    </span>
</template>
