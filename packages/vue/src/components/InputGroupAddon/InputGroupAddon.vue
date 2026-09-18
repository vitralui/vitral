<script setup lang="ts">
import { inputgroupaddonStyle } from '@vitral/styles';
import { useComponent } from '../../base/useComponent';
import type { InputGroupAddonProps, InputGroupAddonSlots } from './types';

// The fixed part of a group: a unit, a currency, an icon. It is decoration
// beside a field, so it holds no role of its own — where it names the field,
// render it as a `<label>` and point it at the control.

defineOptions({ name: 'VtInputGroupAddon' });

const props = withDefaults(defineProps<InputGroupAddonProps>(), { unstyled: undefined, as: 'div' });
defineSlots<InputGroupAddonSlots>();

const { part } = useComponent(inputgroupaddonStyle, props);
</script>

<template>
    <component :is="as" v-bind="part('root')">
        <slot />
    </component>
</template>
