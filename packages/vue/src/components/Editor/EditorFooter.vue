<script setup lang="ts">
import { editorStyle } from '@vitral/styles';
import { useComponent } from '../../base/useComponent';
import { inheritRoot, useEditorContext } from './context';
import type { EditorFooterProps } from './types';

// The strip under the text: the count, or anything an application puts there.

defineOptions({ name: 'VtEditorFooter' });

const props = withDefaults(defineProps<EditorFooterProps>(), { unstyled: undefined });
defineSlots<{ default?: () => unknown }>();
const ctx = useEditorContext('EditorFooter');
const { part } = useComponent(editorStyle, inheritRoot(props, ctx));
</script>

<template>
    <div v-bind="part('footer')">
        <slot />
    </div>
</template>
