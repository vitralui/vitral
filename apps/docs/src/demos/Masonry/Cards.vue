<script setup lang="ts">
import { Card, Masonry } from '@vitral/vue';
import { ref } from 'vue';

const notes = [
    { title: 'Groceries', text: 'Rice, beans, coffee, lemons.' },
    { title: 'Ideas for the talk', text: 'Open with the stained-glass metaphor. Show tokens before components. End on the theme designer, live, with the audience picking the primary colour.' },
    { title: 'Call Ana', text: 'About the release.' },
    { title: 'Reading', text: 'Chapters 4 to 6, and the notes on accessibility of drag and drop — the keyboard part especially.' },
    { title: 'Gym', text: 'Tuesday and Thursday.' },
    { title: 'Trip', text: 'Book the train to Lisboa. Check the museum hours. Ask Bruno about the restaurant near the river he mentioned.' },
    { title: 'Plants', text: 'Water on Sundays.' },
    { title: 'Budget', text: 'Rent, internet, the course, and something put aside every month however small.' }
];
const open = ref<number | null>(null);
</script>

<template>
    <Masonry min-column-width="12rem">
        <Card v-for="(note, i) in notes" :key="note.title">
            <template #title>{{ note.title }}</template>
            <template #default>
                <p style="margin: 0">{{ note.text }}</p>
                <p v-if="open === i" style="margin: 0.5rem 0 0">More lines, shown on demand, push the cards below down.</p>
                <button type="button" class="vt-button vt-button-text vt-button-sm" style="margin-top: 0.5rem" @click="open = open === i ? null : i">{{ open === i ? 'Less' : 'More' }}</button>
            </template>
        </Card>
    </Masonry>
</template>
