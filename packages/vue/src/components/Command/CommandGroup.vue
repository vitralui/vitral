<script setup lang="ts">
import { commandStyle } from '@vitral/styles';
import { computed, inject, provide, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { CommandGroupKey, CommandKey, inheritUnstyled } from './context';
import type { CommandGroupProps, CommandSlots } from './types';

defineOptions({ name: 'VtCommandGroup' });

const props = withDefaults(defineProps<CommandGroupProps>(), { unstyled: undefined });
defineSlots<CommandSlots>();
const command = inject(CommandKey, null);
const { part } = useComponent(commandStyle, inheritUnstyled(props, command));

const id = useId();
provide(CommandGroupKey, { id });
const shown = computed(() => props.forceMount || !command || command.groupVisible(id));
</script>

<template>
    <div v-show="shown" role="presentation" data-vt-command-group v-bind="part('group')">
        <div v-if="heading" :id="`${id}-heading`" aria-hidden="true" v-bind="part('groupHeading')">{{ heading }}</div>
        <div role="group" :aria-labelledby="heading ? `${id}-heading` : undefined" v-bind="part('groupItems')">
            <slot />
        </div>
    </div>
</template>
