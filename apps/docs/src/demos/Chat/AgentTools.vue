<script setup lang="ts">
import { Chat, type ChatMessage } from '@vitral/vue';

const agent: ChatMessage[] = [
    { id: 1, role: 'user', content: 'How many customers churned last month?' },
    {
        id: 2,
        role: 'assistant',
        author: 'Analyst',
        content: 'Fourteen, down from twenty-two in July. The fall is almost all in the Starter plan.',
        toolCalls: [
            { name: 'run_query', input: 'SELECT count(*) FROM churn WHERE month = 8', output: '14', status: 'done' },
            { name: 'compare_period', input: 'month = 7', output: '22', status: 'done' }
        ],
        citations: [{ title: 'churn.sql', url: '#' }]
    },
    { id: 3, role: 'assistant', author: 'Analyst', content: '', toolCalls: [{ name: 'draw_chart', input: 'churn by plan', status: 'running' }] }
];
</script>

<template>
    <Chat :messages="agent" variant="agent" readonly aria-label="Analyst" height="20rem" style="width: 100%" />
</template>
