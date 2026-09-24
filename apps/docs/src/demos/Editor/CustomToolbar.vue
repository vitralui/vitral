<script setup lang="ts">
import { Editor, EditorButton, EditorToolbar, EditorToolbarGroup, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const note = ref('<p>Only the basics here.</p>');
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
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
    </StackPanel>
</template>
