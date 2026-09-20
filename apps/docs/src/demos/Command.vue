<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Command',
    category: 'Menu',
    description:
        'A search box over a list of commands: an always-expanded WAI-ARIA combobox. Up and Down move, Enter runs, typing filters (accents and case ignored) and says how many match. CommandDialog puts it in a modal palette, opened with a hotkey.'
};
</script>

<script setup lang="ts">
import { Button, Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, Icon } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const last = ref('—');
const palette = ref(false);
</script>

<template>
    <DemoSection title="Inline" class="stack">
        <Command style="max-width: 26rem" @select="last = $event">
            <CommandInput placeholder="Type a command or search…" />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                    <CommandItem><Icon icon="calendar" /> Calendar</CommandItem>
                    <CommandItem :keywords="['emoji', 'smile']"><Icon icon="star" /> Search emoji</CommandItem>
                    <CommandItem disabled><Icon icon="sliders" /> Calculator</CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Settings">
                    <CommandItem shortcut="⌘P"><Icon icon="user" /> Profile</CommandItem>
                    <CommandItem shortcut="⌘B"><Icon icon="bell" /> Notifications</CommandItem>
                    <CommandItem shortcut="⌘S"><Icon icon="sliders" /> Preferences</CommandItem>
                </CommandGroup>
            </CommandList>
        </Command>
        <span class="demo-hint">Last command: {{ last }}</span>
    </DemoSection>
    <DemoSection title="Palette">
        <Button label="Open palette" icon="search" severity="secondary" @click="palette = true" />
        <span class="demo-hint">…or press Ctrl+J (⌘J).</span>
        <CommandDialog v-model:visible="palette" hotkey="j" @select="last = $event">
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
    </DemoSection>
</template>
