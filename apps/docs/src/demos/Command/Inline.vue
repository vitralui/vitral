<script setup lang="ts">
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, Icon } from '@vitral/vue';
import { ref } from 'vue';

const last = ref('—');
</script>

<template>
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
    <small style="color: var(--vt-text-muted-color)">Last command: {{ last }}</small>
</template>
