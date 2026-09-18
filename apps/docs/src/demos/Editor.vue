<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Editor',
    category: 'Form',
    description:
        'Rich text with its own editing engine and no dependency: headings, lists and task lists, quotes, code, links, images, tables, colours from the palette, Markdown shortcuts and undo. v-model is sanitised HTML (and v-model:json the document). The text is a labelled multi-line textbox; the toolbar is one tab stop — Alt+F10 reaches it, Escape comes back.'
};
</script>

<script setup lang="ts">
import { Editor, EditorButton, EditorToolbar, EditorToolbarGroup, type EditorJSON } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const article = ref(
    '<h2>Release notes</h2><p>This editor writes <strong>semantic HTML</strong>, keeps <em>undo</em> history and understands <code>Markdown</code> as you type — try <code>## </code>, <code>- </code> or <code>**bold**</code>.</p>' +
        '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Paste from Word or Google Docs</p></li><li data-type="taskItem" data-checked="false"><p>Select text and press Ctrl+K for a link</p></li></ul>' +
        '<blockquote><p>Nothing pasted can run a script: only what the schema knows survives.</p></blockquote>'
);
const note = ref('<p>Only the basics here.</p>');
const bubble = ref('<p>Select some of this text: a floating toolbar appears over it, with bold, italic, a link and a colour.</p>');
const readonlyText = ref(
    '<h3>Terms</h3><p>Read-only text can still be <mark data-color="yellow">selected and copied</mark>, and <a href="https://example.com" target="_blank">links</a> open.</p><ol><li><p>First</p></li><li><p>Second</p></li></ol>'
);
const bio = ref('<p>Keep it short.</p>');
const output = ref('<p>Type here and watch <strong>both</strong> formats change.</p>');
const outputJson = ref<EditorJSON | null>(null);
const composed = ref('<p>This one is built from parts, with a toolbar of its own and a word count.</p>');
const words = ref(0);
</script>

<template>
    <DemoSection title="Default">
        <div class="demo-field" style="width: 100%">
            <label for="ed-article">Article</label>
            <Editor id="ed-article" v-model="article" placeholder="Write something…" />
        </div>
    </DemoSection>

    <DemoSection title="Custom toolbar" description="`toolbar` takes groups of item names; the `toolbar` slot replaces the bar with parts of your own.">
        <div class="demo-stack" style="width: 100%">
            <Editor v-model="note" :toolbar="[['bold', 'italic', 'strike'], ['bulletList', 'orderedList'], ['link', 'undo', 'redo']]" aria-label="Note" />
            <Editor aria-label="Minimal" placeholder="The toolbar slot">
                <template #toolbar>
                    <EditorToolbar>
                        <EditorToolbarGroup>
                            <EditorButton command="heading2" />
                            <EditorButton command="bold" />
                            <EditorButton command="italic" />
                        </EditorToolbarGroup>
                        <EditorToolbarGroup>
                            <EditorButton command="clear" show-label />
                        </EditorToolbarGroup>
                    </EditorToolbar>
                </template>
            </Editor>
        </div>
    </DemoSection>

    <DemoSection title="Bubble toolbar" description="`bubble-menu` shows a toolbar over selected text; with `:toolbar=&quot;false&quot;` it is the only one.">
        <Editor v-model="bubble" :toolbar="false" bubble-menu aria-label="Bubble toolbar example" style="width: 100%" />
    </DemoSection>

    <DemoSection title="Read only">
        <Editor v-model="readonlyText" readonly :toolbar="false" aria-label="Terms" style="width: 100%" />
    </DemoSection>

    <DemoSection title="With count and limit" description="`max-length` stops typing and pasting at the limit; the count describes the text.">
        <div class="demo-field" style="width: 100%">
            <label for="ed-bio">Bio</label>
            <Editor id="ed-bio" v-model="bio" :max-length="140" :toolbar="[['bold', 'italic', 'link']]" />
        </div>
    </DemoSection>

    <DemoSection title="HTML and JSON output" class="stack">
        <Editor v-model="output" v-model:json="outputJson" aria-label="Output example" :toolbar="[['blockType'], ['bold', 'italic', 'color', 'highlight'], ['bulletList', 'link']]" style="width: 100%" />
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1rem; width: 100%">
            <pre class="demo-output" aria-label="HTML" tabindex="0" style="margin: 0; max-height: 16rem; overflow: auto; white-space: pre-wrap; font-size: 0.75rem">{{ output }}</pre>
            <pre class="demo-output" aria-label="JSON" tabindex="0" style="margin: 0; max-height: 16rem; overflow: auto; font-size: 0.75rem">{{ JSON.stringify(outputJson, null, 2) }}</pre>
        </div>
    </DemoSection>

    <DemoSection title="Composed from parts" description="`Editor.Root`, `Editor.Toolbar`, `Editor.Button`, `Editor.Content`, `Editor.BubbleMenu`, `Editor.Footer` and `Editor.Count` — also exported as `EditorRoot`, `EditorToolbar`… — share one editor; `useEditor()` reaches it from your own components.">
        <Editor.Root v-model="composed" placeholder="Parts…" aria-label="Composed editor" style="width: 100%" @text-change="words = $event.textValue.split(/\s+/).filter(Boolean).length">
            <Editor.Toolbar>
                <Editor.ToolbarGroup>
                    <Editor.BlockSelect :options="['paragraph', 'heading1', 'heading2']" />
                </Editor.ToolbarGroup>
                <Editor.ToolbarGroup>
                    <Editor.Button command="bold" />
                    <Editor.Button command="italic" />
                    <Editor.ColorPicker kind="highlight" />
                    <Editor.Button command="link" />
                </Editor.ToolbarGroup>
                <Editor.ToolbarGroup>
                    <Editor.Button command="taskList" />
                    <Editor.ImageButton />
                    <Editor.TableMenu />
                </Editor.ToolbarGroup>
            </Editor.Toolbar>
            <Editor.Content />
            <Editor.BubbleMenu :items="['bold', 'italic', 'link']" />
            <Editor.Footer>
                <span style="margin-inline-end: auto">Edited words: {{ words }}</span>
                <Editor.Count :words="false" />
            </Editor.Footer>
        </Editor.Root>
    </DemoSection>
</template>
