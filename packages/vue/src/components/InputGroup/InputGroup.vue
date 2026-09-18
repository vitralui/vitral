<script setup lang="ts">
import { inputgroupStyle } from '@vitral/styles';
import { useComponent } from '../../base/useComponent';
import type { InputGroupProps, InputGroupSlots } from './types';

// Welding controls together is a visual decision, not a semantic one: the
// fields inside keep their own labels, and the group only gets a role when it
// is given a name.

defineOptions({ name: 'VtInputGroup' });

const props = withDefaults(defineProps<InputGroupProps>(), { unstyled: undefined });
defineSlots<InputGroupSlots>();

const { part } = useComponent(inputgroupStyle, props);
</script>

<template>
    <div :role="label ? 'group' : undefined" :aria-label="label" v-bind="part('root')">
        <slot />
    </div>
</template>
