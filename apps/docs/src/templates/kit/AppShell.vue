<script setup lang="ts">
import { Avatar, Button, Icon, Sidebar, type IconProp, type MenuItem } from '@vitral/vue';
import { computed, ref, watch } from 'vue';
import { scrollTemplateTop, useNarrow, useTemplate } from './context';

/**
 * The chrome of an application: a sidebar holding the screens, a bar with the
 * current screen's name, and the page. The sidebar folds to its
 * icons (below 960px) rather than into a drawer, so every screen stays one tap away.
 */
const props = defineProps<{
    brand: string;
    brandIcon: IconProp;
    icons: Record<string, IconProp>;
    user: { name: string; role: string; initials: string };
}>();

const { screen, screens, go, standalone, narrow: shared } = useTemplate();
const root = ref<HTMLElement | null>(null);
const narrow = useNarrow(root);
watch(narrow, (value) => (shared.value = value), { immediate: true });
// Below tablet width the sidebar folds to its icons, so the page keeps the room.
const compact = useNarrow(root, 960);
const folded = ref(false);
watch(compact, (value) => (folded.value = value), { immediate: true });

const model = computed<MenuItem[]>(() => screens.map((entry) => ({ label: entry.name, key: entry.id, icon: props.icons[entry.id] ?? 'circle', command: () => go(entry.id) })));
const title = computed(() => screens.find((entry) => entry.id === screen.value)?.name ?? '');

watch(screen, () => scrollTemplateTop(root.value, standalone()));
</script>

<template>
    <div ref="root" class="tp tp-app">
        <Sidebar v-model:collapsed="folded" :model="model" :active-key="screen" mobile-breakpoint="0px" :aria-label="brand" class="tp-app-sidebar">
            <template #header="{ collapsed }">
                <span class="tp-brand">
                    <span class="tp-brand-mark"><Icon :icon="brandIcon" /></span>
                    <span v-if="!collapsed">{{ brand }}</span>
                </span>
            </template>
            <template #footer="{ collapsed }">
                <span class="tp-app-user">
                    <Avatar :label="user.initials" shape="circle" />
                    <span v-if="!collapsed">
                        <b>{{ user.name }}</b>
                        <small>{{ user.role }}</small>
                    </span>
                </span>
            </template>
        </Sidebar>

        <div class="tp-app-body">
            <header class="tp-app-bar">
                <span class="tp-app-title">{{ title }}</span>
                <div class="tp-app-actions">
                    <slot name="actions" :narrow="narrow" />
                    <Button icon="bell" variant="text" severity="secondary" aria-label="Notifications" badge="3" />
                </div>
            </header>
            <component :is="standalone() ? 'main' : 'div'" class="tp-app-main">
                <slot />
            </component>
        </div>
    </div>
</template>
