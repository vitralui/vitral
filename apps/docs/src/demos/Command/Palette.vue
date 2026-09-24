<script setup lang="ts">
import { Button, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, Icon } from '@vitral/vue';
import { ref } from 'vue';

const palette = ref(false);
</script>

<template>
    <Button label="Open palette" icon="search" severity="secondary" @click="palette = true" />
    <small style="color: var(--vt-text-muted-color)">…or press Ctrl+J (⌘J).</small>
    <CommandDialog v-model:visible="palette" hotkey="j">
        <CommandInput placeholder="Search…" />
        <CommandList>
            <CommandEmpty />
            <CommandGroup heading="Navigation">
                <CommandItem value="home"><Icon icon="home" /> Home</CommandItem>
                <CommandItem value="docs"><Icon icon="file" /> Documentation</CommandItem>
                <CommandItem value="themes"><Icon icon="sun" /> Themes</CommandItem>
            </CommandGroup>
        </CommandList>
    </CommandDialog>
</template>
