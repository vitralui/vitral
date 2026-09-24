<script setup lang="ts">
import { Terminal, type TerminalCommandEvent } from '@vitral/vue';

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
    <Terminal welcome-message="Welcome to Vitral. Type &quot;help&quot; to begin." prompt="vitral $" aria-label="Console output" @command="run" />
</template>
