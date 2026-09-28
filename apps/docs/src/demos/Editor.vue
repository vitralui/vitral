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
import FindAndReplace from './Editor/FindAndReplace.vue';
import HtmlAndJson from './Editor/HtmlAndJson.vue';
import ReadOnly from './Editor/ReadOnly.vue';
import InlineChips from './Editor/InlineChips.vue';
import SlashMenu from './Editor/SlashMenu.vue';
</script>

<template>
    <DemoSection title="Default"><DefaultEditor /></DemoSection>
    <DemoSection title="Custom toolbar" description="`toolbar` takes groups of item names; the `toolbar` slot replaces the bar with parts of your own."><CustomToolbar /></DemoSection>
    <DemoSection
        title="Slash menu and block actions"
        description="Type `/` where a word starts and the blocks are offered, filtered as you type; Enter or a press puts one in. Beside the block the caret is in there is a handle, and it opens duplicate, move, turn into text and delete. `slash-menu` and `block-menu` take your own entries, or `false` for none."
    ><SlashMenu /></DemoSection>
    <DemoSection title="Find and replace" description="Ctrl+F (⌘F) opens the bar over the text and Ctrl+H (⌘⌥F) opens it with the replace row; so does the `find` toolbar item. Every match is washed in yellow and the one in hand in orange, painted with highlights rather than written into the document, so undo, the caret and a screen reader see only the text. Match case, whole words and regular expressions — where `$1` works in the replacement — are toggles beside the field. Enter goes to the next match and Shift+Enter to the one before; a replacement keeps the formatting of the words it replaces, and Replace all is one step to undo. `:find=&quot;false&quot;` leaves the keys to the browser."><FindAndReplace /></DemoSection>
    <DemoSection title="Inline chips" description="A chip is one piece in the line — a person, a tag, a variable — that the caret goes around and one Backspace removes. `chips` takes a trigger per kind: type @ or # and pick from the list, which `items` may fill later, from a server. `run('insertChip', { id, label, kind })` puts one in from code. The HTML keeps what each chip stands for, in `data-chip`."><InlineChips /></DemoSection>
    <DemoSection title="Bubble toolbar" description="`bubble-menu` shows a toolbar over selected text; with `:toolbar=&quot;false&quot;` it is the only one."><BubbleToolbar /></DemoSection>
    <DemoSection title="Read only"><ReadOnly /></DemoSection>
    <DemoSection title="With count and limit" description="`max-length` stops typing and pasting at the limit; the count describes the text."><CountAndLimit /></DemoSection>
    <DemoSection title="HTML and JSON output" class="stack"><HtmlAndJson /></DemoSection>
    <DemoSection title="Composed from parts" description="`Editor.Root`, `Editor.Toolbar`, `Editor.Button`, `Editor.Content`, `Editor.BubbleMenu`, `Editor.Footer` and `Editor.Count`, also exported as `EditorRoot`, `EditorToolbar`… share one editor; `useEditor()` reaches it from your own components."><ComposedFromParts /></DemoSection>
</template>
