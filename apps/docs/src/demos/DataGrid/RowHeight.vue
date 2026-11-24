<script setup lang="ts">
import { Column, DataGrid, SelectButton, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const tickets = [
    { id: 101, title: 'Export drops the last row', note: 'Happens only when the filter matches exactly a page of rows; the page after it comes out empty and the file stops one row short.' },
    { id: 102, title: 'Dark mode on the login page', note: 'The logo has no light version.' },
    { id: 103, title: 'Slow search on large accounts', note: 'Accounts with more than fifty thousand contacts wait several seconds for each keystroke, because every keystroke asks the server again and the answers arrive out of order.' },
    { id: 104, title: 'Typo in the invoice footer', note: 'Says "Thank your".' },
    { id: 105, title: 'Calendar invites in the wrong time zone', note: 'Invites sent from the mobile app use the device time zone rather than the account one, so a meeting at nine arrives at noon for people abroad.' },
    { id: 106, title: 'Avatar upload rejects PNG', note: 'Only for files over 2 MB.' }
];

const modes = [
    { label: 'Their content’s height', value: 'auto' },
    { label: 'One height', value: 'fixed' }
];
const mode = ref<'auto' | 'fixed'>('auto');
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <SelectButton v-model="mode" :options="modes" option-label="label" option-value="value" :allow-empty="false" size="small" aria-label="Row height" />
        <DataGrid :value="tickets" data-key="id" aria-label="Tickets" :row-height="mode === 'fixed' ? 40 : undefined" resizable-columns striped-rows class="demo-table">
            <Column field="id" header="#" :width="70" align="right" />
            <Column field="title" header="Title" :width="240" />
            <Column field="note" header="Note" :width="420" />
        </DataGrid>
    </StackPanel>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>
