<script setup lang="ts">
import { chevronsUpDown } from '@vitral/icons';
import { Avatar, Breadcrumb, Button, Icon, Menu, Sidebar, Tooltip as vTooltip, type BreadcrumbItem, type IconProp, type MenuItem } from '@vitral/vue';
import { computed, ref, useId, watch } from 'vue';
import { scrollTemplateTop, useNarrow, useTemplate } from './context';

/**
 * The chrome of an application: a sidebar holding the screens, a bar with the
 * current screen's name, and the page. The sidebar folds to its icons (below
 * 960px) rather than into a drawer, so every screen stays one tap away.
 *
 * Four applications built on one shell should not all wear the same sidebar,
 * so the arrangements a console actually picks between are props — where the
 * seam between rail and page falls (`variant`), whether the header runs over
 * the sidebar too (`header`), whether the screens are grouped, whether one of
 * them opens a sub-list, whether the brand switches workspaces, and whether a
 * quieter nav sits at the foot — and what hangs in the sidebar beside the
 * navigation stays a slot: a workspace meter, a search box, a balance.
 */
interface Props {
    brand: string;
    brandIcon: IconProp;
    icons: Record<string, IconProp>;
    /** With a `menu`, the footer becomes the button that opens it. */
    user: { name: string; role: string; initials: string; menu?: MenuItem[] };
    /** Where the seam falls: `'inset'` floats the page on the rail's colour, `'floating'` lifts the rail off the page as a card. */
    variant?: 'flush' | 'inset' | 'floating';
    /** `'site'` runs one header across the top, over the sidebar too, and leads with a breadcrumb rather than the screen's name. */
    header?: 'inline' | 'site';
    /** Screens under headings rather than in one list. Screens left out keep their place above the groups. */
    groups?: { label: string; screens: string[] }[];
    /** A sub-list under a grouped screen's item, keyed by screen: the item opens the list, and the list opens the screen. */
    submenus?: Record<string, MenuItem[]>;
    /** A second, quieter nav pinned to the foot of the first: the help and the feedback that are not screens. */
    secondary?: { label: string; icon: IconProp; command?: () => void }[];
    /** Workspaces. Given them, the brand becomes the button that switches between them. */
    switcher?: { label: string; value: string; hint?: string; icon?: IconProp }[];
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'flush',
    header: 'inline',
    groups: undefined,
    submenus: undefined,
    secondary: undefined,
    switcher: undefined
});
const workspace = defineModel<string>('workspace', { default: '' });

const { screen, screens, go, standalone, narrow: shared } = useTemplate();
const root = ref<HTMLElement | null>(null);
const narrow = useNarrow(root);
watch(narrow, (value) => (shared.value = value), { immediate: true });
// Below tablet width the sidebar folds to its icons, so the page keeps the room.
const compact = useNarrow(root, 960);
const folded = ref(false);
watch(compact, (value) => (folded.value = value), { immediate: true });

// A header across the top holds the collapse button, so the sidebar's own goes.
const sidebar = ref<InstanceType<typeof Sidebar> | null>(null);
const workspaceMenu = ref<InstanceType<typeof Menu> | null>(null);
const userMenu = ref<InstanceType<typeof Menu> | null>(null);
const id = useId();

/** A screen that hides a sub-list is keyed apart from it, so that only one of the two is the current page. */
const listKey = (id: string) => `${id}-list`;

const itemOf = (key: string): MenuItem => {
    const entry = screens.find((s) => s.id === key)!;
    const items = props.submenus?.[key];
    // A parent opens its sub-list rather than the screen; the children do that.
    return {
        label: entry.name,
        key: items ? listKey(entry.id) : entry.id,
        icon: props.icons[entry.id] ?? 'circle',
        items,
        command: items ? undefined : () => go(entry.id)
    };
};

const model = computed<MenuItem[]>(() => {
    if (!props.groups) return screens.map((entry) => itemOf(entry.id));
    const grouped = new Set(props.groups.flatMap((group) => group.screens));
    return [
        ...screens.filter((entry) => !grouped.has(entry.id)).map((entry) => itemOf(entry.id)),
        ...props.groups.map((group) => ({ label: group.label, key: group.label, items: group.screens.map(itemOf) }))
    ];
});

// The sub-list of the screen you are on starts open: shut, it would hide the
// item marked as the current one.
const expanded = ref<Record<string, boolean>>({});
watch(
    screen,
    (key) => {
        if (props.submenus?.[key]) expanded.value = { ...expanded.value, [listKey(key)]: true };
    },
    { immediate: true }
);

const chosen = computed(() => props.switcher?.find((entry) => entry.value === workspace.value) ?? props.switcher?.[0]);
const workspaces = computed<MenuItem[]>(() =>
    (props.switcher ?? []).map((entry) => ({
        label: entry.label,
        key: entry.value,
        // The one you are in is ticked; the rest keep their own mark, so the
        // labels line up either way.
        icon: entry.value === chosen.value?.value ? 'check' : (entry.icon ?? props.brandIcon),
        command: () => (workspace.value = entry.value)
    }))
);

const title = computed(() => screens.find((entry) => entry.id === screen.value)?.name ?? '');
const trail = computed<BreadcrumbItem[]>(() => [{ label: chosen.value?.label ?? props.brand }, { label: title.value }]);

watch(screen, () => scrollTemplateTop(root.value, standalone()));
</script>

<template>
    <div ref="root" class="tp tp-app" :class="[`tp-app-${variant}`, { 'tp-app-headered': header === 'site' }]">
        <!-- A sticky site header: the bar spans the sidebar too, and carries the
             collapse button beside a breadcrumb instead of the screen's name. -->
        <header v-if="header === 'site'" class="tp-app-top">
            <Button
                icon="sidebar"
                variant="text"
                severity="secondary"
                :aria-label="folded ? 'Expand the sidebar' : 'Collapse the sidebar'"
                :aria-expanded="!folded"
                @click="sidebar?.toggle()"
            />
            <span class="tp-app-rule" />
            <Breadcrumb :model="trail" :aria-label="`${brand}, where you are`" />
            <div class="tp-app-actions">
                <slot name="actions" :narrow="narrow" />
                <Button icon="bell" variant="text" severity="secondary" aria-label="Notifications" badge="3" />
            </div>
        </header>

        <div class="tp-app-row">
            <Sidebar
                ref="sidebar"
                v-model:collapsed="folded"
                v-model:expanded-keys="expanded"
                :model="model"
                :active-key="screen"
                mobile-breakpoint="0px"
                :show-toggle="header !== 'site'"
                :aria-label="brand"
                class="tp-app-sidebar"
            >
                <template #header="{ collapsed }">
                    <!-- One workspace is a name; several are a button that says
                         which one you are in and opens the others. -->
                    <button
                        v-if="switcher"
                        type="button"
                        class="tp-brand tp-brand-switch"
                        aria-haspopup="true"
                        :aria-controls="`${id}-workspaces`"
                        @click="workspaceMenu?.toggle($event)"
                    >
                        <span class="tp-brand-mark"><Icon :icon="chosen?.icon ?? brandIcon" /></span>
                        <span v-if="!collapsed" class="tp-brand-name">
                            <b>{{ chosen?.label }}</b>
                            <small v-if="chosen?.hint">{{ chosen.hint }}</small>
                        </span>
                        <Icon v-if="!collapsed" :icon="chevronsUpDown" />
                    </button>
                    <span v-else class="tp-brand">
                        <span class="tp-brand-mark"><Icon :icon="brandIcon" /></span>
                        <span v-if="!collapsed">{{ brand }}</span>
                    </span>
                    <Menu v-if="switcher" :id="`${id}-workspaces`" ref="workspaceMenu" :model="workspaces" popup aria-label="Switch workspace" />
                    <slot name="aside" :collapsed="collapsed" />
                </template>

                <!-- After the screens, and pushed to the foot of the same nav:
                     the pages every application has and no one navigates by. -->
                <template v-if="secondary" #default="{ collapsed }">
                    <ul class="tp-aside-nav" :class="{ 'tp-aside-nav-folded': collapsed }">
                        <li v-for="item in secondary" :key="item.label">
                            <button
                                v-tooltip.right="{ value: item.label, disabled: !collapsed }"
                                type="button"
                                :aria-label="collapsed ? item.label : undefined"
                                @click="item.command?.()"
                            >
                                <Icon :icon="item.icon" />
                                <span v-if="!collapsed">{{ item.label }}</span>
                            </button>
                        </li>
                    </ul>
                </template>

                <template #footer="{ collapsed }">
                    <slot name="asideFooter" :collapsed="collapsed" />
                    <button
                        v-if="user.menu"
                        type="button"
                        class="tp-app-user tp-app-user-button"
                        aria-haspopup="true"
                        :aria-controls="`${id}-user`"
                        @click="userMenu?.toggle($event)"
                    >
                        <Avatar :label="user.initials" shape="circle" />
                        <span v-if="!collapsed">
                            <b>{{ user.name }}</b>
                            <small>{{ user.role }}</small>
                        </span>
                        <Icon v-if="!collapsed" :icon="chevronsUpDown" />
                    </button>
                    <Menu v-if="user.menu" :id="`${id}-user`" ref="userMenu" :model="user.menu" popup :aria-label="user.name" />
                    <span v-else class="tp-app-user">
                        <Avatar :label="user.initials" shape="circle" />
                        <span v-if="!collapsed">
                            <b>{{ user.name }}</b>
                            <small>{{ user.role }}</small>
                        </span>
                    </span>
                </template>
            </Sidebar>

            <div class="tp-app-body">
                <header v-if="header === 'inline'" class="tp-app-bar">
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
    </div>
</template>
