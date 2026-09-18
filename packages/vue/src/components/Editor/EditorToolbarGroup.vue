<script setup lang="ts">
import { editorStyle } from '@vitral/styles';
import { useComponent } from '../../base/useComponent';
import { inheritRoot, useEditorContext } from './context';
import type { EditorToolbarGroupProps } from './types';

// A run of related controls in a toolbar, set off from the next by a rule.

defineOptions({ name: 'VtEditorToolbarGroup' });

const props = withDefaults(defineProps<EditorToolbarGroupProps>(), { unstyled: undefined });
defineSlots<{ default?: () => unknown }>();
const ctx = useEditorContext('EditorToolbarGroup');
const { part } = useComponent(editorStyle, inheritRoot(props, ctx));
</script>

<template>
    <div role="group" :aria-label="ariaLabel" v-bind="part('toolbarGroup')">
        <slot />
    </div>
</template>
