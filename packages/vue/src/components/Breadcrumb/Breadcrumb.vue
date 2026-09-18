<script setup lang="ts">
import { breadcrumbStyle } from '@vitral/styles';
import { computed, mergeProps } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { BreadcrumbItem, BreadcrumbProps, BreadcrumbSlots } from './types';

// The WAI-ARIA breadcrumb: a <nav> named "Breadcrumb" around an ordered list,
// the current page marked aria-current="page", and separators hidden from
// assistive technology. An item with a `url` is a link, one with a `command`
// a button, anything else plain text.

defineOptions({ name: 'VtBreadcrumb' });

const props = withDefaults(defineProps<BreadcrumbProps>(), { unstyled: undefined, model: () => [] });
defineSlots<BreadcrumbSlots>();

const { part, locale } = useComponent(breadcrumbStyle, props);

interface Entry {
    key: string;
    item: BreadcrumbItem;
    icon: BreadcrumbItem['icon'];
    home: boolean;
    current: boolean;
}

const entries = computed<Entry[]>(() => {
    const list: Omit<Entry, 'current'>[] = [];
    if (props.home) list.push({ key: 'home', item: props.home, icon: props.home.icon ?? (props.home.label ? undefined : 'home'), home: true });
    props.model.forEach((item, i) => {
        if (item.visible !== false) list.push({ key: item.key ?? String(i), item, icon: item.icon, home: false });
    });
    return list.map((entry, i) => ({ ...entry, current: i === list.length - 1 }));
});

const isAction = (item: BreadcrumbItem) => !!(item.url || item.command);

function tagOf({ item }: Entry) {
    if (item.url && !item.disabled) return 'a';
    if (item.command && !item.disabled) return 'button';
    // A disabled link keeps the link role so it can say it is disabled.
    return isAction(item) ? 'a' : 'span';
}

const state = (entry: Entry) => ({ current: entry.current, disabled: !!entry.item.disabled, action: isAction(entry.item) });

function linkAttrs(entry: Entry) {
    const { item } = entry;
    const tag = tagOf(entry);
    return mergeProps(part('link', state(entry)), {
        href: tag === 'a' && !item.disabled ? item.url : undefined,
        target: tag === 'a' && !item.disabled ? item.target : undefined,
        type: tag === 'button' ? 'button' : undefined,
        role: tag === 'a' && item.disabled ? 'link' : undefined,
        'aria-disabled': tag === 'a' && item.disabled ? 'true' : undefined,
        'aria-current': entry.current ? 'page' : undefined
    });
}

function onClick(event: Event, { item }: Entry) {
    if (item.disabled) {
        event.preventDefault();
        return;
    }
    item.command?.({ originalEvent: event, item });
}
</script>

<template>
    <nav v-bind="part('root')" :aria-label="locale.aria.breadcrumb">
        <ol v-bind="part('list')">
            <template v-for="(entry, i) in entries" :key="entry.key">
                <li v-if="i > 0" aria-hidden="true" v-bind="part('separator')">
                    <slot name="separator">
                        <Icon icon="chevronRight" />
                    </slot>
                </li>
                <li v-bind="mergeProps(part('item', state(entry)), { class: entry.item.class })">
                    <component :is="tagOf(entry)" v-bind="linkAttrs(entry)" @click="onClick($event, entry)">
                        <slot name="item" :item="entry.item" :label="entry.item.label" :current="entry.current">
                            <Icon v-if="entry.icon" :icon="entry.icon" v-bind="part('itemIcon')" />
                            <span v-if="entry.item.label" v-bind="part('itemLabel')">{{ entry.item.label }}</span>
                            <span v-else-if="entry.home" v-bind="part('hiddenLabel')">{{ locale.aria.home }}</span>
                        </slot>
                    </component>
                </li>
            </template>
        </ol>
    </nav>
</template>
