<script setup lang="ts">
import type { EditorContent } from '@vitral/core';
import { computed, getCurrentInstance, ref, useAttrs } from 'vue';
import { defaultBubbleMenu, defaultToolbar } from '@vitral/editor/buttons';
import EditorBubbleMenu from './EditorBubbleMenu.vue';
import EditorContentPart from './EditorContent.vue';
import EditorCount from './EditorCount.vue';
import EditorFooter from './EditorFooter.vue';
import EditorRoot from './EditorRoot.vue';
import EditorToolbar from './EditorToolbar.vue';
import type { EditorJSON, EditorProps, EditorRootEmits, EditorSlots } from './types';

// The ready-made editor, assembled from the same parts an application can
// compose itself: a root, a toolbar, the text, a floating toolbar and a count.

defineOptions({ name: 'VtEditor', inheritAttrs: false });

const props = withDefaults(defineProps<EditorProps>(), {
    unstyled: undefined,
    variant: undefined,
    readonly: false,
    disabled: false,
    invalid: false,
    autofocus: false,
    toolbar: true,
    bubbleMenu: false,
    showCount: undefined,
    showWordCount: true
});
const model = defineModel<string | null>();
const json = defineModel<EditorJSON | null>('json');
const emit = defineEmits<EditorRootEmits>();
const slots = defineSlots<EditorSlots>();
const attrs = useAttrs();
const instance = getCurrentInstance();
const root = ref<InstanceType<typeof EditorRoot> | null>(null);

const rootProps = computed(() => ({
    placeholder: props.placeholder,
    readonly: props.readonly,
    disabled: props.disabled,
    invalid: props.invalid,
    variant: props.variant,
    maxLength: props.maxLength,
    autofocus: props.autofocus,
    colors: props.colors,
    historyDelay: props.historyDelay,
    unstyled: props.unstyled,
    pt: props.pt,
    dt: props.dt
}));

// JSON is written on every change only when someone listens for it.
const jsonBinding = computed(() => (instance?.vnode.props?.['onUpdate:json'] ? { json: json.value, 'onUpdate:json': (v: EditorJSON | null | undefined) => (json.value = v ?? null) } : {}));

const groups = computed(() => (Array.isArray(props.toolbar) ? props.toolbar : defaultToolbar));
const bubbleItems = computed(() => (props.bubbleMenu === true ? defaultBubbleMenu : Array.isArray(props.bubbleMenu) ? props.bubbleMenu : []));
const countVisible = computed(() => props.showCount ?? props.maxLength != null);

defineExpose({
    get editor() {
        return root.value?.editor;
    },
    get commands() {
        return root.value?.commands;
    },
    focus: () => root.value?.focus(),
    blur: () => root.value?.blur(),
    getHTML: () => root.value?.getHTML() ?? '',
    getJSON: () => root.value?.getJSON(),
    getText: () => root.value?.getText() ?? '',
    getMarkdown: () => root.value?.getMarkdown() ?? '',
    setContent: (value: EditorContent) => root.value?.setContent(value),
    can: (name: string, ...args: unknown[]) => ((root.value?.can as ((n: string, ...a: unknown[]) => boolean) | undefined)?.(name, ...args) ?? false),
    isActive: (name: string, a?: Record<string, unknown>) => root.value?.isActive(name, a) ?? false
});
</script>

<template>
    <EditorRoot
        ref="root"
        v-bind="{ ...attrs, ...rootProps, ...jsonBinding }"
        v-model="model"
        @text-change="emit('text-change', $event)"
        @selection-change="emit('selection-change', $event)"
        @focus="emit('focus', $event)"
        @blur="emit('blur', $event)"
        @load="emit('load', $event)"
    >
        <slot name="toolbar">
            <EditorToolbar v-if="toolbar !== false" :items="groups" />
        </slot>
        <EditorContentPart />
        <EditorBubbleMenu v-if="bubbleItems.length" :items="bubbleItems" />
        <EditorFooter v-if="countVisible || slots.footer">
            <slot name="footer">
                <EditorCount :words="showWordCount" />
            </slot>
        </EditorFooter>
    </EditorRoot>
</template>
