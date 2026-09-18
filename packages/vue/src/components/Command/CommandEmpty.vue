<script setup lang="ts">
import { commandStyle } from '@vitral/styles';
import { computed, inject } from 'vue';
import { useComponent } from '../../base/useComponent';
import { CommandKey, inheritUnstyled } from './context';
import type { CommandEmptyProps, CommandSlots } from './types';

defineOptions({ name: 'VtCommandEmpty' });

const props = withDefaults(defineProps<CommandEmptyProps>(), { unstyled: undefined });
defineSlots<CommandSlots>();
const command = inject(CommandKey, null);
const { part, locale } = useComponent(commandStyle, inheritUnstyled(props, command));
const shown = computed(() => !!command && command.count.value === 0);
</script>

<template>
    <div v-if="shown" role="presentation" v-bind="part('empty')">
        <slot>{{ locale.emptySearchMessage }}</slot>
    </div>
</template>
