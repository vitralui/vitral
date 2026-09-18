<script setup lang="ts">
import { createEditorView, isEmptyEditorDoc, type EditorView } from '@vitral/core';
import { editorStyle } from '@vitral/styles';
import { computed, mergeProps, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { inheritRoot, useEditorContext } from './context';
import type { EditorContentProps } from './types';

// The text itself: a contenteditable element with role="textbox" and
// aria-multiline, named by the label the editor was given and described by the
// keyboard help and the count. Its children belong to the view, never to Vue.

defineOptions({ name: 'VtEditorContent', inheritAttrs: false });

const props = withDefaults(defineProps<EditorContentProps>(), { unstyled: undefined });
const ctx = useEditorContext('EditorContent');
const { part, cx } = useComponent(editorStyle, inheritRoot(props, ctx));
const attrs = useAttrs();
const el = ref<HTMLElement | null>(null);
const labelledBy = ref<string>();
let view: EditorView | null = null;
let label: HTMLLabelElement | null = null;

const empty = computed(() => isEmptyEditorDoc(ctx.state.value.doc));

const merged = computed(() => mergeProps(ctx.contentAttrs.value, attrs));

const describedBy = computed(() => {
    const own = merged.value['aria-describedby'] as string | undefined;
    return [own, ...ctx.describedBy.value, ctx.ids.help].filter(Boolean).join(' ') || undefined;
});

const ariaLabelledby = computed(() => (merged.value['aria-labelledby'] as string | undefined) ?? (merged.value['aria-label'] ? undefined : labelledBy.value));

const focusFromLabel = (event: Event) => {
    event.preventDefault();
    ctx.focus();
};

// A <label for> cannot name a contenteditable element; point aria-labelledby at it instead.
function linkLabel() {
    label?.removeEventListener('click', focusFromLabel);
    label = null;
    labelledBy.value = undefined;
    const id = ctx.ids.content;
    if (!id || !el.value) return;
    const found = Array.from(el.value.ownerDocument.querySelectorAll('label[for]')).find((l) => (l as HTMLLabelElement).htmlFor === id) as HTMLLabelElement | undefined;
    if (!found) return;
    label = found;
    label.id ||= `${id}-label`;
    labelledBy.value = label.id;
    label.addEventListener('click', focusFromLabel);
}

function onMousedown() {
    ctx.selecting.value = true;
}

onMounted(() => {
    view = createEditorView(el.value!, ctx.editor, {
        editable: () => ctx.editable.value,
        handleKey: ctx.handleKey,
        taskLabel: ctx.locale.value.editor.taskDone,
        selectedClass: cx('selectedNode')
    });
    ctx.attachView(view, el.value);
    linkLabel();
});

watch(() => ctx.ids.content, linkLabel, { flush: 'post' });

onBeforeUnmount(() => {
    label?.removeEventListener('click', focusFromLabel);
    view?.destroy();
    ctx.attachView(null);
});
</script>

<template>
    <div
        ref="el"
        v-bind="mergeProps(merged, part('content'))"
        :id="ctx.ids.content"
        :class="empty ? cx('contentEmpty') : undefined"
        role="textbox"
        aria-multiline="true"
        :aria-labelledby="ariaLabelledby"
        :aria-describedby="describedBy"
        :aria-readonly="ctx.readonly.value ? 'true' : undefined"
        :aria-disabled="ctx.disabled.value ? 'true' : undefined"
        :aria-invalid="ctx.invalid.value ? 'true' : undefined"
        :aria-placeholder="ctx.placeholder.value || undefined"
        :data-placeholder="ctx.placeholder.value || undefined"
        :contenteditable="ctx.editable.value ? 'true' : 'false'"
        :tabindex="ctx.disabled.value ? -1 : 0"
        spellcheck="true"
        translate="no"
        @focus="ctx.onContentFocus"
        @blur="ctx.onContentBlur"
        @mousedown="onMousedown"
    />
</template>
