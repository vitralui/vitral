<script setup lang="ts">
import { rovingIndex, type RovingMove } from '@vitral/core';
import { tabsStyle } from '@vitral/styles';
import { computed, provide, shallowReactive, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { TabsKey, type TabEntry } from './context';
import type { TabsProps, TabsSlots, TabValue } from './types';

// The WAI-ARIA tabs pattern with automatic activation: the tablist is one tab
// stop (the selected tab), arrows along its orientation move and select,
// wrapping at the ends, Home/End jump. Each tab controls its panel, and each
// panel is labelled by its tab.

defineOptions({ name: 'VtTabs' });

const props = withDefaults(defineProps<TabsProps>(), { unstyled: undefined, orientation: 'horizontal', selectOnFocus: true });
const model = defineModel<TabValue>('value');
defineSlots<TabsSlots>();

const { part } = useComponent(tabsStyle, props);

const id = useId();
const slug = (value: TabValue) => String(value).replace(/[^\w-]/g, '_');
// Tabs register in the order they are set up, which is the order they render in.
const tabs = shallowReactive<TabEntry[]>([]);

const firstEnabled = computed(() => tabs.find((tab) => !tab.disabled())?.value());
const active = computed(() => (model.value !== undefined && model.value !== null ? model.value : firstEnabled.value));
const tabStop = computed(() => {
    const selected = tabs.find((tab) => tab.value() === active.value && !tab.disabled());
    return selected ? selected.value() : firstEnabled.value;
});

const inDocumentOrder = (a: TabEntry, b: TabEntry) => (a.el.value!.compareDocumentPosition(b.el.value!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

function select(value: TabValue) {
    model.value = value;
}

provide(TabsKey, {
    unstyled: () => props.unstyled,
    orientation: () => props.orientation,
    lazy: () => props.lazy,
    active,
    tabStop,
    activeElement: () => tabs.find((tab) => tab.value() === active.value)?.el.value ?? null,
    select,
    register(entry) {
        tabs.push(entry);
        return () => {
            const index = tabs.indexOf(entry);
            if (index >= 0) tabs.splice(index, 1);
        };
    },
    move(from: TabEntry, move: RovingMove) {
        const ordered = tabs.filter((tab) => tab.el.value).sort(inDocumentOrder);
        const next = ordered[rovingIndex(move, ordered.length, ordered.indexOf(from), (i) => ordered[i]!.disabled())];
        if (!next || next === from) return;
        next.el.value?.focus();
        if (props.selectOnFocus) select(next.value());
    },
    tabId: (value) => `${id}-tab-${slug(value)}`,
    panelId: (value) => `${id}-panel-${slug(value)}`
});

const state = computed(() => ({ orientation: props.orientation }));
</script>

<template>
    <div v-bind="part('root', state)">
        <slot />
    </div>
</template>
