<script setup lang="ts">
import { tabsStyle } from '@vitral/styles';
import { computed, inject } from 'vue';
import { useComponent } from '../../base/useComponent';
import { inheritUnstyled, TabsKey } from './context';
import type { TabPanelProps, TabsSlots } from './types';

defineOptions({ name: 'VtTabPanel' });

const props = withDefaults(defineProps<TabPanelProps>(), { unstyled: undefined });
defineSlots<TabsSlots>();

const tabs = inject(TabsKey, null);
const { part } = useComponent(tabsStyle, inheritUnstyled(props, tabs));

const selected = computed(() => tabs?.active.value === props.value);
const lazy = computed(() => tabs?.lazy() ?? false);
</script>

<template>
    <div
        v-if="!lazy || selected"
        v-show="selected"
        :id="tabs?.panelId(value)"
        role="tabpanel"
        :aria-labelledby="tabs?.tabId(value)"
        tabindex="0"
        v-bind="part('panel', { selected })"
    >
        <slot />
    </div>
</template>
