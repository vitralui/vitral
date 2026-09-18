<script setup lang="ts">
import { commandStyle } from '@vitral/styles';
import { inject } from 'vue';
import { useComponent } from '../../base/useComponent';
import { CommandKey, inheritUnstyled } from './context';
import type { CommandSeparatorProps } from './types';

defineOptions({ name: 'VtCommandSeparator' });

const props = withDefaults(defineProps<CommandSeparatorProps>(), { unstyled: undefined });
const command = inject(CommandKey, null);
const { part } = useComponent(commandStyle, inheritUnstyled(props, command));
</script>

<template>
    <!-- A listbox may hold only options and groups, so the rule is drawing; the groups' names already divide the list. -->
    <div v-show="!command?.search.value.trim()" role="none" v-bind="part('separator')" />
</template>
