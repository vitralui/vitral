<script setup lang="ts">
import { computed } from 'vue';
import EditorBlockSelect from './EditorBlockSelect.vue';
import EditorButton from './EditorButton.vue';
import EditorColorPicker from './EditorColorPicker.vue';
import EditorImageButton from './EditorImageButton.vue';
import EditorTableMenu from './EditorTableMenu.vue';
import type { EditorButtonCommand, EditorToolbarItem } from './types';

// One toolbar item by name: the part that draws it.

defineOptions({ name: 'VtEditorItem' });

const props = defineProps<{ item: EditorToolbarItem }>();

const rendered = computed(() => {
    switch (props.item) {
        case 'blockType':
            return { is: EditorBlockSelect, attrs: {} };
        case 'color':
            return { is: EditorColorPicker, attrs: { kind: 'color' } };
        case 'highlight':
            return { is: EditorColorPicker, attrs: { kind: 'highlight' } };
        case 'image':
            return { is: EditorImageButton, attrs: {} };
        case 'table':
            return { is: EditorTableMenu, attrs: {} };
        default:
            return { is: EditorButton, attrs: { command: props.item as EditorButtonCommand } };
    }
});
</script>

<template>
    <component :is="rendered.is" v-bind="rendered.attrs" />
</template>
