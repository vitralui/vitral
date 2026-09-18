<script setup lang="ts">
import { activeEditorBlockType } from '@vitral/core';
import { codeBlock, heading1, heading2, heading3, pilcrow, type IconDef } from '@vitral/icons';
import { editorStyle } from '@vitral/styles';
import { computed, nextTick, ref, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import Menu from '../Menu/Menu.vue';
import type { MenuItem } from '../Menu/types';
import { inheritRoot, useEditorContext } from './context';
import type { EditorBlockSelectProps } from './types';

// The block type: a menu button showing the current type, opening a menu of
// the others (APG menu button: Enter, Space or Down opens it).

defineOptions({ name: 'VtEditorBlockSelect' });

type BlockOption = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'codeBlock';

const props = withDefaults(defineProps<EditorBlockSelectProps>(), { unstyled: undefined, options: () => ['paragraph', 'heading1', 'heading2', 'heading3', 'codeBlock'] });
const ctx = useEditorContext('EditorBlockSelect');
const { part } = useComponent(editorStyle, inheritRoot(props, ctx));
const text = computed(() => ctx.locale.value.editor);
const name = computed(() => props.label ?? text.value.blockType);
const menuId = `${useId()}-menu`;

const menu = ref<InstanceType<typeof Menu> | null>(null);
let byPointer = false;

const ICONS: Record<BlockOption, IconDef> = { paragraph: pilcrow, heading1, heading2, heading3, codeBlock };
const COMMANDS: Record<BlockOption, () => void> = {
    paragraph: () => ctx.run('setParagraph'),
    heading1: () => ctx.run('setHeading', 1),
    heading2: () => ctx.run('setHeading', 2),
    heading3: () => ctx.run('setHeading', 3),
    codeBlock: () => ctx.run('setCodeBlock')
};

const current = computed(() => {
    void ctx.state.value;
    return activeEditorBlockType(ctx.editor.state) as BlockOption;
});

const currentLabel = computed(() => text.value[current.value] ?? text.value.paragraph);

const items = computed<MenuItem[]>(() =>
    props.options.map((option) => ({
        key: option,
        label: text.value[option],
        icon: ICONS[option],
        command: () => COMMANDS[option]()
    }))
);

function toggle(event: MouseEvent) {
    byPointer = event.detail > 0;
    menu.value?.toggle(event);
}

function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    byPointer = false;
    menu.value?.show(event);
}

function onHide() {
    ctx.popups.value--;
    if (byPointer) nextTick(() => ctx.focus());
}
</script>

<template>
    <button
        type="button"
        :aria-label="`${name}: ${currentLabel}`"
        aria-haspopup="menu"
        :aria-controls="menuId"
        aria-expanded="false"
        :disabled="!ctx.editable.value"
        v-bind="part('button', { wide: true, disabled: !ctx.editable.value })"
        @click="toggle"
        @keydown="onKeydown"
    >
        <span v-bind="part('buttonLabel')">{{ currentLabel }}</span>
        <Icon icon="chevronDown" v-bind="part('buttonChevron')" />
    </button>
    <Menu :id="menuId" ref="menu" popup :model="items" :aria-label="name" @show="ctx.popups.value++" @hide="onHide" />
</template>
