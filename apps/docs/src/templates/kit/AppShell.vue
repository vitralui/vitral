<script setup lang="ts">
import { Avatar, Button, Icon, Sidebar, type IconProp, type MenuItem } from '@vitral/vue';
import { computed, ref, watch } from 'vue';
import { scrollTemplateTop, useNarrow, useTemplate } from './context';

/**
 * The chrome of an application: a sidebar holding the screens, a bar with the
 * current screen's name, and the page. The sidebar folds to its icons (below
 * 960px) rather than into a drawer, so every screen stays one tap away.
 *
 * What differs between applications is not the shape but what lives in the
 * sidebar beside the navigation — a workspace switcher, a search box, a balance,
 * a meter — so those are slots, and the two structural choices an application
 * does make (whether the page is inset, whether the screens are grouped) are
 * props.
 */
interface Props {
    brand: string;
    brandIcon: IconProp;
    icons: Record<string, IconProp>;
    user: { name: string; role: string; initials: string };
    /** `'inset'` detaches the page from the sidebar and rounds it, the way a console with a dark rail does. */
    variant?: 'flush' | 'inset';
    /** Screens under headings rather than in one list. Screens left out keep their place above the groups. */
    groups?: { label: string; screens: string[] }[];
}

const props = withDefaults(defineProps<Props>(), { variant: 'flush', groups: undefined });

const { screen, screens, go, standalone, narrow: shared } = useTemplate();
const root = ref<HTMLElement | null>(null);
const narrow = useNarrow(root);
watch(narrow, (value) => (shared.value = value), { immediate: true });
// Below tablet width the sidebar folds to its icons, so the page keeps the room.
const compact = useNarrow(root, 960);
const folded = ref(false);
watch(compact, (value) => (folded.value = value), { immediate: true });

const itemOf = (id: string): MenuItem => {
    const entry = screens.find((s) => s.id === id)!;
    return { label: entry.name, key: entry.id, icon: props.icons[entry.id] ?? 'circle', command: () => go(entry.id) };
};

const model = computed<MenuItem[]>(() => {
    if (!props.groups) return screens.map((entry) => itemOf(entry.id));
    const grouped = new Set(props.groups.flatMap((group) => group.screens));
    return [
        ...screens.filter((entry) => !grouped.has(entry.id)).map((entry) => itemOf(entry.id)),
        ...props.groups.map((group) => ({ label: group.label, key: group.label, items: group.screens.map(itemOf) }))
    ];
});

const title = computed(() => screens.find((entry) => entry.id === screen.value)?.name ?? '');

watch(screen, () => scrollTemplateTop(root.value, standalone()));
</script>

<template>
    <div ref="root" class="tp tp-app" :class="`tp-app-${variant}`">
        <Sidebar v-model:collapsed="folded" :model="model" :active-key="screen" mobile-breakpoint="0px" :aria-label="brand" class="tp-app-sidebar">
            <template #header="{ collapsed }">
                <span class="tp-brand">
                    <span class="tp-brand-mark"><Icon :icon="brandIcon" /></span>
                    <span v-if="!collapsed">{{ brand }}</span>
                </span>
                <slot name="aside" :collapsed="collapsed" />
            </template>
            <template #footer="{ collapsed }">
                <slot name="asideFooter" :collapsed="collapsed" />
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
