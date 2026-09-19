<script setup lang="ts">
import { editorStyle } from '@vitral/styles';
import { onBeforeUnmount, onMounted, onUpdated, ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import { inheritRoot, useEditorContext } from './context';
import { useRoving } from './roving';
import EditorToolbarGroup from './EditorToolbarGroup.vue';
import EditorItem from './EditorItem.vue';
import type { EditorToolbarProps } from './types';
import { defaultToolbar } from '@vitral/editor/buttons';
import { keepFocus } from '../../base/press';

// The WAI-ARIA toolbar: one tab stop, Left/Right/Home/End between the
// controls, Escape back to the text. Alt+F10 in the text lands here.

defineOptions({ name: 'VtEditorToolbar' });

const props = withDefaults(defineProps<EditorToolbarProps>(), { unstyled: undefined, items: () => defaultToolbar });
defineSlots<{ default?: () => unknown }>();
const ctx = useEditorContext('EditorToolbar');
const { part } = useComponent(editorStyle, inheritRoot(props, ctx));
const el = ref<HTMLElement | null>(null);
const roving = useRoving(el, { onEscape: () => ctx.focus() });

onMounted(() => {
    ctx.toolbar.value = el.value;
    roving.sync();
});
onUpdated(roving.sync);
onBeforeUnmount(() => {
    if (ctx.toolbar.value === el.value) ctx.toolbar.value = null;
});

// Presses on the bar keep focus (and the selection) in the text.
function onPointerdown(event: PointerEvent) {
    keepFocus(event, (target) => !!target.closest('input, textarea, select'));
}

</script>

<template>
    <div
        ref="el"
        role="toolbar"
        :aria-label="ariaLabel ?? ctx.locale.value.editor.toolbar"
        :aria-controls="ctx.ids.content"
        v-bind="part('toolbar')"
        @keydown="roving.onKeydown"
        @focusin="roving.onFocusin"
        @pointerdown="onPointerdown"
    >
        <slot>
            <EditorToolbarGroup v-for="(group, i) in items" :key="i">
                <EditorItem v-for="item in group" :key="item" :item="item" />
            </EditorToolbarGroup>
        </slot>
    </div>
</template>
