<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Kbd',
    category: 'Misc',
    description: 'A key or a shortcut as it looks on the reader’s own keyboard: ⌘ on a Mac, Ctrl everywhere else, each symbol still named for a screen reader.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Shortcuts from './Kbd/Shortcuts.vue';
import Platforms from './Kbd/Platforms.vue';
import Sizes from './Kbd/Sizes.vue';
</script>

<template>
    <DemoSection title="Shortcuts" description="`mod` is the platform's command key. The page asks the browser which platform it is on once it is mounted, so a server render and the first paint agree."><Shortcuts /></DemoSection>
    <DemoSection title="Platforms" description="`platform` pins the names, for documentation written about one platform."><Platforms /></DemoSection>
    <DemoSection title="Sizes and single keys"><Sizes /></DemoSection>
</template>
