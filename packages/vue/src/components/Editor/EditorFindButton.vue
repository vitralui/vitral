<script setup lang="ts">
import { ariaEditorShortcut, formatEditorShortcut } from '@vitral/core';
import { search } from '@vitral/icons';
import { editorStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import { Tooltip as vTooltip } from '../../directives/tooltip';
import Icon from '../Icon/Icon.vue';
import { inheritRoot, useEditorContext } from './context';
import type { EditorIconButtonProps } from './types';

// Opens and shuts the find bar. It needs an <EditorFind> to draw the bar.

defineOptions({ name: 'VtEditorFindButton' });

const props = withDefaults(defineProps<EditorIconButtonProps>(), { unstyled: undefined });
const ctx = useEditorContext('EditorFindButton');
const { part } = useComponent(editorStyle, inheritRoot(props, ctx));
const name = computed(() => props.label ?? ctx.locale.value.editor.find);
const tip = computed(() => `${name.value} (${formatEditorShortcut('Mod-f')})`);

function toggle() {
    if (ctx.find.isOpen) ctx.find.close();
    else ctx.find.open();
}
</script>

<template>
    <button v-tooltip="{ value: tip, showDelay: 400 }" type="button" :aria-label="name" :aria-keyshortcuts="ariaEditorShortcut('Mod-f')" v-bind="part('button')" @click="toggle">
        <Icon :icon="icon ?? search" v-bind="part('buttonIcon')" />
    </button>
</template>
