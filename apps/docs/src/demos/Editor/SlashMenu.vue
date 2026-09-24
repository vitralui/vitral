<script setup lang="ts">
import { Editor, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const blocks = ref('<p>Type a slash on the empty line under this one.</p><p></p>');
const custom = ref('<p>This one offers three commands of its own.</p><p></p>');

// A slash command is data: a name, a line about it, and either a command the
// editor knows or a `run` of your own.
const slashCommands = [
    { id: 'heading2', label: 'Section', description: 'A heading for a section', icon: 'heading2', command: ['toggleHeading', 2] as const },
    { id: 'taskList', label: 'Checklist', description: 'Things to tick off', icon: 'listChecks', command: ['toggleTaskList'] as const },
    {
        id: 'today',
        label: "Today's date",
        description: 'Puts the date in, as text',
        icon: 'calendar',
        keywords: ['date', 'now'],
        run: (editor: { run: (name: string, ...args: unknown[]) => boolean }) => editor.run('insertText', new Date().toLocaleDateString())
    }
];
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <Editor v-model="blocks" aria-label="Slash menu example" :toolbar="[['blockType'], ['bold', 'italic']]" />
        <Editor
            v-model="custom"
            aria-label="Own slash commands"
            :toolbar="false"
            :slash-menu="slashCommands"
            :block-menu="[{ id: 'delete', label: 'Delete', icon: 'trash', run: (editor) => editor.run('deleteBlock') }]"
        />
    </StackPanel>
</template>
