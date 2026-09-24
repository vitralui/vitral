<script setup lang="ts">
import { Editor } from '@vitral/vue';
import { ref } from 'vue';

const composed = ref('<p>This one is built from parts, with a toolbar of its own and a word count.</p>');
const words = ref(0);
</script>

<template>
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
</template>
