<script setup lang="ts">
import { Column, DataGrid } from '@vitral/vue';

interface Slot {
    id: number;
    day: string;
    time: string;
    talk: string;
    room?: string;
}

const programme: Slot[] = [
    { id: 1, day: 'Monday', time: '09:00', talk: 'Opening keynote', room: 'Main hall' },
    { id: 2, day: 'Monday', time: '10:30', talk: 'Grids that stay fast', room: 'Room 2' },
    { id: 3, day: 'Monday', time: '12:00', talk: 'Lunch on the terrace' },
    { id: 4, day: 'Monday', time: '13:30', talk: 'Accessible tables', room: 'Room 1' },
    { id: 5, day: 'Tuesday', time: '09:00', talk: 'Design tokens in practice', room: 'Main hall' },
    { id: 6, day: 'Tuesday', time: '10:30', talk: 'Charts a cell tall', room: 'Room 2' },
    { id: 7, day: 'Tuesday', time: '12:00', talk: 'Lunch on the terrace' },
    { id: 8, day: 'Wednesday', time: '09:00', talk: 'Closing panel', room: 'Main hall' }
];

// A slot with no room is a break: its name runs across the room's column.
const across = ({ row }: { row: Slot }) => (row.room ? 1 : 2);
</script>

<template>
    <DataGrid :value="programme" data-key="id" aria-label="Programme" row-numbers class="demo-table">
        <Column field="day" header="Day" span-rows :width="120" />
        <Column field="time" header="Time" :width="90" />
        <Column field="talk" header="Talk" :col-span="across" />
        <Column field="room" header="Room" />
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>
