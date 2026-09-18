<script setup lang="ts">
import { table } from '@vitral/icons';
import { editorStyle } from '@vitral/styles';
import { computed, nextTick, ref, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { Tooltip as vTooltip } from '../../directives/tooltip';
import Icon from '../Icon/Icon.vue';
import Menu from '../Menu/Menu.vue';
import type { MenuItem } from '../Menu/types';
import { inheritRoot, useEditorContext } from './context';
import type { EditorIconButtonProps } from './types';

// Tables: a menu button to insert one and, with the caret in a table, to
// add and remove rows and columns. Tab and Shift+Tab move between cells.

defineOptions({ name: 'VtEditorTableMenu' });

const props = withDefaults(defineProps<EditorIconButtonProps>(), { unstyled: undefined });
const ctx = useEditorContext('EditorTableMenu');
const { part } = useComponent(editorStyle, inheritRoot(props, ctx));
const text = computed(() => ctx.locale.value.editor);
const name = computed(() => props.label ?? text.value.table);
const menuId = `${useId()}-menu`;
const menu = ref<InstanceType<typeof Menu> | null>(null);
let byPointer = false;

const inTable = computed(() => ctx.isActive('table'));

const items = computed<MenuItem[]>(() => {
    const t = text.value;
    const item = (key: string, label: string, run: () => boolean, disabled: boolean): MenuItem => ({ key, label, disabled, command: () => void run() });
    return [
        item('insert', t.insertTable, () => ctx.run('insertTable', 3, 3, true), inTable.value || !ctx.can('insertTable')),
        { separator: true, key: 's1' },
        item('rowBefore', t.addRowBefore, () => ctx.run('addRowBefore'), !inTable.value),
        item('rowAfter', t.addRowAfter, () => ctx.run('addRowAfter'), !inTable.value),
        item('colBefore', t.addColumnBefore, () => ctx.run('addColumnBefore'), !inTable.value),
        item('colAfter', t.addColumnAfter, () => ctx.run('addColumnAfter'), !inTable.value),
        { separator: true, key: 's2' },
        item('deleteRow', t.deleteRow, () => ctx.run('deleteRow'), !inTable.value),
        item('deleteColumn', t.deleteColumn, () => ctx.run('deleteColumn'), !inTable.value),
        item('deleteTable', t.deleteTable, () => ctx.run('deleteTable'), !inTable.value)
    ];
});

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
        v-tooltip="{ value: name, showDelay: 400 }"
        type="button"
        :aria-label="name"
        aria-haspopup="menu"
        :aria-controls="menuId"
        aria-expanded="false"
        :disabled="!ctx.editable.value"
        v-bind="part('button', { active: inTable, disabled: !ctx.editable.value })"
        @click="toggle"
        @keydown="onKeydown"
    >
        <Icon :icon="icon ?? table" v-bind="part('buttonIcon')" />
    </button>
    <Menu :id="menuId" ref="menu" popup :model="items" :aria-label="name" @show="ctx.popups.value++" @hide="onHide" />
</template>
