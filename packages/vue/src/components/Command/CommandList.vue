<script setup lang="ts">
import { commandStyle } from '@vitral/styles';
import { inject, ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useScrollbars } from '../../base/useScrollbars';
import { CommandKey, inheritUnstyled } from './context';
import type { CommandListProps, CommandSlots } from './types';

defineOptions({ name: 'VtCommandList' });

const props = withDefaults(defineProps<CommandListProps>(), { unstyled: undefined });
defineSlots<CommandSlots>();
const command = inject(CommandKey, null);
const { part } = useComponent(commandStyle, inheritUnstyled(props, command));
const listRef = ref<HTMLElement | null>(null);
useScrollbars(listRef, props);
</script>

<template>
    <div ref="listRef" :id="command?.listId" role="listbox" :aria-label="command?.label()" v-bind="part('list')">
        <slot />
    </div>
</template>
