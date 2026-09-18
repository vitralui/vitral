<script setup lang="ts">
import { Icon, type IconProp } from '@vitral/vue';
import { ref, watch } from 'vue';
import { scrollTemplateTop, useNarrow, useTemplate } from './context';

/**
 * The chrome of a page nobody is signed in to: a brand, the screen, and a line
 * of small print. There is no navigation, because there is nowhere to go until
 * the form is answered — which is the whole reason these screens get a shell of
 * their own rather than the application's.
 *
 * `bleed` is for a screen that wants the whole canvas, edge to edge: the
 * split-screen sign-in draws its own panel where this shell would have drawn
 * its margins.
 */
defineProps<{ brand: string; brandIcon: IconProp; bleed?: boolean }>();

const { screen, standalone, narrow: shared } = useTemplate();
const root = ref<HTMLElement | null>(null);
const narrow = useNarrow(root);
watch(narrow, (value) => (shared.value = value), { immediate: true });
watch(screen, () => scrollTemplateTop(root.value, standalone()));
</script>

<template>
    <div ref="root" class="tp tp-auth" :class="{ 'tp-auth-bleed': bleed }">
        <header class="tp-auth-bar">
            <span class="tp-brand">
                <span class="tp-brand-mark"><Icon :icon="brandIcon" /></span>
                {{ brand }}
            </span>
            <slot name="actions" :narrow="narrow" />
        </header>

        <main class="tp-auth-canvas">
            <slot />
        </main>

        <footer v-if="!bleed" class="tp-auth-foot">
            <p>© {{ brand }}. <a href="#">Privacy</a> · <a href="#">Terms</a> · <a href="#">Support</a></p>
        </footer>
    </div>
</template>
