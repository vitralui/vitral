<script setup lang="ts">
import { sigma } from '@vitral/icons';
import { editorStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import { Tooltip as vTooltip } from '../../directives/tooltip';
import Icon from '../Icon/Icon.vue';
import { inheritRoot, useEditorContext } from './context';
import type { EditorIconButtonProps } from './types';

// Opens the formula panel: for a new formula where the caret is, or, with the
// selection on a formula, to change that one — which is what its pressed state
// says. The panel is `@vitral/editor`'s, the same one a press on a formula in
// the text opens. Where formulas are switched off the button is not drawn.

defineOptions({ name: 'VtEditorMathButton' });

const props = withDefaults(defineProps<EditorIconButtonProps>(), { unstyled: undefined });
const ctx = useEditorContext('EditorMathButton');
const { part } = useComponent(editorStyle, inheritRoot(props, ctx));
const name = computed(() => props.label ?? ctx.locale.value.editor.math);

const active = computed(() => ctx.isActive('math'));
const disabled = computed(() => !ctx.math.enabled.value || ctx.isActive('codeBlock'));

function open(event: MouseEvent) {
    // On a formula the panel hangs from the formula; for a new one, from this button.
    ctx.math.open(active.value ? null : (event.currentTarget as HTMLElement));
}
</script>

<template>
    <button
        v-if="ctx.math.on.value"
        v-tooltip="{ value: name, showDelay: 400 }"
        type="button"
        :aria-label="name"
        aria-haspopup="dialog"
        :aria-pressed="active ? 'true' : 'false'"
        :disabled="disabled"
        v-bind="part('button', { active, disabled })"
        @click="open"
    >
        <Icon :icon="icon ?? sigma" v-bind="part('buttonIcon')" />
    </button>
</template>
