<script setup lang="ts">
import { Editor, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const article = ref(
    '<h2>Release notes</h2><p>This editor writes <strong>semantic HTML</strong>, keeps <em>undo</em> history and understands <code>Markdown</code> as you type. Try <code>## </code>, <code>- </code> or <code>**bold**</code>.</p>' +
        '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Paste from Word or Google Docs</p></li><li data-type="taskItem" data-checked="false"><p>Select text and press Ctrl+K for a link</p></li></ul>' +
        '<blockquote><p>Nothing pasted can run a script: only what the schema knows survives.</p></blockquote>'
);
</script>

<template>
    <StackPanel spacing="0.375rem" style="width: 100%">
        <Label for="ed-article">Article</Label>
        <Editor id="ed-article" v-model="article" placeholder="Write something…" />
    </StackPanel>
</template>
