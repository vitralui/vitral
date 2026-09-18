<script setup lang="ts">
import { formatMessage } from '@vitral/core';
import { editorStyle } from '@vitral/styles';
import { computed, onBeforeUnmount, onMounted, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { inheritRoot, useEditorContext } from './context';
import type { EditorCountProps } from './types';

// Words and characters (against the limit, when there is one). The text is
// described by it, so a screen reader hears the count with the field rather
// than after every keystroke.

defineOptions({ name: 'VtEditorCount' });

const props = withDefaults(defineProps<EditorCountProps>(), { unstyled: undefined, words: true, characters: true });
const ctx = useEditorContext('EditorCount');
const { part } = useComponent(editorStyle, inheritRoot(props, ctx));
const id = `${useId()}-count`;

const characters = computed(() => {
    void ctx.state.value;
    return ctx.editor.characterCount();
});
const words = computed(() => {
    void ctx.state.value;
    return ctx.editor.wordCount();
});
const limit = computed(() => ctx.maxLength.value);
const atLimit = computed(() => limit.value != null && characters.value >= limit.value);

const label = computed(() => {
    const t = ctx.locale.value.editor;
    const parts: string[] = [];
    if (props.words) parts.push(formatMessage(words.value === 1 ? t.word : t.words, { count: words.value }));
    if (props.characters) {
        if (limit.value != null) parts.push(formatMessage(t.charactersLimit, { count: characters.value, limit: limit.value }));
        else parts.push(formatMessage(characters.value === 1 ? t.character : t.characters, { count: characters.value }));
    }
    return parts.join(' · ');
});

onMounted(() => ctx.describedBy.value.push(id));
onBeforeUnmount(() => (ctx.describedBy.value = ctx.describedBy.value.filter((d) => d !== id)));
</script>

<template>
    <span :id="id" v-bind="part('count', { limit: atLimit })">{{ label }}</span>
</template>
