<script setup lang="ts">
import { Button, Countdown } from '@vitral/vue';
import { ref } from 'vue';

const to = ref(Date.now() + 90 * 60 * 1000);
const quick = ref(Date.now() + 15 * 1000);
const paused = ref(false);
const done = ref(false);

function restart() {
    quick.value = Date.now() + 15 * 1000;
    done.value = false;
}
</script>

<template>
    <div style="display: grid; gap: 1rem">
        <p style="margin: 0">The session ends in <Countdown :to="to" variant="text" :units="['minutes', 'seconds']" :paused="paused" />.</p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center">
            <Countdown :to="quick" :units="['seconds']" @end="done = true" />
            <span role="status">{{ done ? 'Time is up.' : '' }}</span>
        </div>
        <div style="display: flex; gap: 0.5rem">
            <Button :label="paused ? 'Resume' : 'Pause'" severity="secondary" size="small" @click="paused = !paused" />
            <Button label="Fifteen seconds again" severity="secondary" size="small" @click="restart" />
        </div>
    </div>
</template>
