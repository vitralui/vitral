<script setup lang="ts">
import { iconfieldStyle } from '@vitral/styles';
import { provide } from 'vue';
import { useComponent } from '../../base/useComponent';
import { IconFieldKey } from './context';
import type { IconFieldProps, IconFieldSlots } from './types';

// A layout wrapper: the field inside keeps its own label, name and events, and
// the icons are drawn over its padding. Nothing here is announced — an icon
// that means something says so through its own `label`.

defineOptions({ name: 'VtIconField' });

const props = withDefaults(defineProps<IconFieldProps>(), { unstyled: undefined });
defineSlots<IconFieldSlots>();

const { part } = useComponent(iconfieldStyle, props);
provide(IconFieldKey, { unstyled: () => props.unstyled });
</script>

<template>
    <div v-bind="part('root', { fluid })">
        <slot />
    </div>
</template>
