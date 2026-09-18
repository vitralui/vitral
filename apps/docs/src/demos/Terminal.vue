<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Terminal',
    category: 'Misc',
    description:
        'A prompt and a log, for a console in an application. The command line is a labelled text box, answers are announced as they arrive, and Up and Down walk through earlier commands. Try `date`, `greet` or `random`.'
};
</script>

<script setup lang="ts">
import { Terminal, type TerminalCommandEvent } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';

function run({ command, respond }: TerminalCommandEvent) {
    const [name, ...args] = command.trim().split(/\s+/);
    switch (name) {
        case 'date':
            respond(new Date().toLocaleString());
            break;
        case 'greet':
            respond(`Hello, ${args.join(' ') || 'world'}!`);
            break;
        case 'random':
            respond(String(Math.floor(Math.random() * 100)));
            break;
        case 'help':
            respond('Commands: date, greet <name>, random');
            break;
        default:
            respond(`Unknown command: ${name}. Type "help".`);
    }
}
</script>

<template>
    <DemoSection title="Basic" class="stack">
        <Terminal welcome-message="Welcome to Vitral. Type &quot;help&quot; to begin." prompt="vitral $" aria-label="Console output" @command="run" />
    </DemoSection>
</template>
