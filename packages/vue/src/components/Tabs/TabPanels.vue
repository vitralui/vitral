<script setup lang="ts">
import { tabsStyle } from '@vitral/styles';
import { inject } from 'vue';
import { useComponent } from '../../base/useComponent';
import { inheritUnstyled, TabsKey } from './context';
import type { TabPanelsProps, TabsSlots } from './types';

defineOptions({ name: 'VtTabPanels' });

const props = withDefaults(defineProps<TabPanelsProps>(), { unstyled: undefined });
defineSlots<TabsSlots>();

const { part } = useComponent(tabsStyle, inheritUnstyled(props, inject(TabsKey, null)));
</script>

<template>
    <div v-bind="part('panels')">
        <slot />
    </div>
</template>
