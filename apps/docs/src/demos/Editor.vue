<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Editor',
    category: 'Form',
    description:
        'Rich text with its own engine and no dependency: headings, lists, tables, images, links and Markdown shortcuts, bound as sanitised HTML.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import BubbleToolbar from './Editor/BubbleToolbar.vue';
import ComposedFromParts from './Editor/ComposedFromParts.vue';
import CountAndLimit from './Editor/CountAndLimit.vue';
import CustomToolbar from './Editor/CustomToolbar.vue';
import DefaultEditor from './Editor/DefaultEditor.vue';
import HtmlAndJson from './Editor/HtmlAndJson.vue';
import ReadOnly from './Editor/ReadOnly.vue';
import SlashMenu from './Editor/SlashMenu.vue';
</script>

<template>
    <DemoSection title="Default"><DefaultEditor /></DemoSection>
    <DemoSection title="Custom toolbar" description="`toolbar` takes groups of item names; the `toolbar` slot replaces the bar with parts of your own."><CustomToolbar /></DemoSection>
    <DemoSection
        title="Slash menu and block actions"
        description="Type `/` where a word starts and the blocks are offered, filtered as you type; Enter or a press puts one in. Beside the block the caret is in there is a handle, and it opens duplicate, move, turn into text and delete. `slash-menu` and `block-menu` take your own entries, or `false` for none."
    ><SlashMenu /></DemoSection>
    <DemoSection title="Bubble toolbar" description="`bubble-menu` shows a toolbar over selected text; with `:toolbar=&quot;false&quot;` it is the only one."><BubbleToolbar /></DemoSection>
    <DemoSection title="Read only"><ReadOnly /></DemoSection>
    <DemoSection title="With count and limit" description="`max-length` stops typing and pasting at the limit; the count describes the text."><CountAndLimit /></DemoSection>
    <DemoSection title="HTML and JSON output" class="stack"><HtmlAndJson /></DemoSection>
    <DemoSection title="Composed from parts" description="`Editor.Root`, `Editor.Toolbar`, `Editor.Button`, `Editor.Content`, `Editor.BubbleMenu`, `Editor.Footer` and `Editor.Count`, also exported as `EditorRoot`, `EditorToolbar`… share one editor; `useEditor()` reaches it from your own components."><ComposedFromParts /></DemoSection>
</template>
