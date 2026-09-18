<script setup lang="ts">
import { rovingMove } from '@vitral/core';
import { tabsStyle } from '@vitral/styles';
import { computed, inject, onBeforeUnmount, ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import { inheritUnstyled, TabsKey, type TabEntry } from './context';
import type { TabProps, TabsSlots } from './types';

defineOptions({ name: 'VtTab' });

const props = withDefaults(defineProps<TabProps>(), { unstyled: undefined });
defineSlots<TabsSlots>();

const tabs = inject(TabsKey, null);
const { part } = useComponent(tabsStyle, inheritUnstyled(props, tabs));

const el = ref<HTMLElement | null>(null);
const entry: TabEntry = { value: () => props.value, disabled: () => !!props.disabled, el };
if (tabs) onBeforeUnmount(tabs.register(entry));

const selected = computed(() => tabs?.active.value === props.value);
const inTabOrder = computed(() => tabs?.tabStop.value === props.value);
// A lazy panel does not exist until its tab is selected; point at nothing before then.
const controls = computed(() => (tabs && (!tabs.lazy() || selected.value) ? tabs.panelId(props.value) : undefined));
const state = computed(() => ({ selected: selected.value, disabled: props.disabled }));

function onClick() {
    if (!props.disabled) tabs?.select(props.value);
}

function onKeydown(event: KeyboardEvent) {
    if (!tabs || !el.value) return;
    const move = rovingMove(event.key, { orientation: tabs.orientation(), rtl: getComputedStyle(el.value).direction === 'rtl' });
    if (!move) return;
    event.preventDefault();
    tabs.move(entry, move);
}
</script>

<template>
    <button
        ref="el"
        :id="tabs?.tabId(value)"
        type="button"
        role="tab"
        :aria-selected="selected ? 'true' : 'false'"
        :aria-controls="controls"
        :tabindex="inTabOrder ? 0 : -1"
        :disabled="disabled"
        v-bind="part('tab', state)"
        @click="onClick"
        @keydown="onKeydown"
    >
        <slot />
    </button>
</template>
