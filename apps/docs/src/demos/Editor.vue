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
import FormulaExport from './Editor/FormulaExport.vue';
import FormulaImage from './Editor/FormulaImage.vue';
import FormulaOptions from './Editor/FormulaOptions.vue';
import Formulas from './Editor/Formulas.vue';
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
    <DemoSection
        title="Formulas"
        description="A formula is written in LaTeX — `\frac{a}{b}`, `\sqrt{x}`, `x^2` — and drawn. The Σ button in the toolbar and `/formula` open the panel: the source in a box, the formula drawn above it as you type, and the usual ones ready-made on buttons. In the text, press a number or a letter of a formula and it is edited where it stands, the formula redrawn around it with every key; Tab goes to the next value, Enter keeps it, Escape puts it back. A press anywhere else on the formula opens the panel with that piece selected. The drawing is outlines laid out by Vitral, not text the browser sets, so it is the same in every browser and prints as it looks; the HTML keeps the source in `data-math`."
    ><Formulas /></DemoSection>
    <DemoSection
        title="Formulas: your own, or none"
        description="`math` takes `{ templates, inlineEdit }`: the ready-made formulas the panel offers, and whether a value is edited where it stands (`false` opens the panel instead). `:math=&quot;false&quot;` still draws the formulas a document has and takes away every way of making or changing one: no button, no slash entry, no press."
    ><FormulaOptions /></DemoSection>
    <DemoSection
        title="Formulas: what comes out"
        description="The HTML is where a document's formulas leave with it. By default each goes with its drawing inside, so the HTML shows them on any page and prints as it looks — the button opens the browser's print dialog, which saves a PDF. `:math=&quot;{ output: 'source' }&quot;` writes the LaTeX alone: a fraction of the size to store, and `renderMathIn(element)` from `@vitral/core` draws it where the document is shown. `getHTML({ math })` asks for either one at any time, `renderMathHTML(html, 'drawing' | 'source')` turns stored HTML from one into the other without a page, and `editorFormulas(doc)` lists the formulas as strings. JSON, plain text and Markdown carry the LaTeX."
        class="stack"
    ><FormulaExport /></DemoSection>
    <DemoSection
        title="Formulas: one on its own"
        description="Outside the editor a formula is a function of its source. `renderMath(latex, { fontSize, color, display })` from `@vitral/core` gives the SVG as a file: sized in pixels and in a colour of its own, which is what a PDF library draws (pdfmake's `svg`, pdfkit and jsPDF through their SVG plugins) and what a server can write with no browser. `renderMathDataUri` gives the same as an address for an `<img>`, and `renderMathPng` a picture, in the browser, for what only takes pictures. Without a `fontSize` the drawing is the piece of a line a page wants, sized by the text around it."
        class="stack"
    ><FormulaImage /></DemoSection>
    <DemoSection title="Bubble toolbar" description="`bubble-menu` shows a toolbar over selected text; with `:toolbar=&quot;false&quot;` it is the only one."><BubbleToolbar /></DemoSection>
    <DemoSection title="Read only"><ReadOnly /></DemoSection>
    <DemoSection title="With count and limit" description="`max-length` stops typing and pasting at the limit; the count describes the text."><CountAndLimit /></DemoSection>
    <DemoSection title="HTML and JSON output" class="stack"><HtmlAndJson /></DemoSection>
    <DemoSection title="Composed from parts" description="`Editor.Root`, `Editor.Toolbar`, `Editor.Button`, `Editor.Content`, `Editor.BubbleMenu`, `Editor.Footer` and `Editor.Count`, also exported as `EditorRoot`, `EditorToolbar`… share one editor; `useEditor()` reaches it from your own components."><ComposedFromParts /></DemoSection>
</template>
