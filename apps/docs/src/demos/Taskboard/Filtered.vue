<script setup lang="ts">
import { IconField, InputIcon, InputText, SelectButton, Tag, Taskboard, type TaskboardColumn } from '@vitral/vue';
import { computed, ref } from 'vue';

interface Task {
    id: number;
    title: string;
    status: string;
    team: string;
}

const columns: TaskboardColumn[] = [
    { key: 'todo', title: 'To do' },
    { key: 'doing', title: 'In progress' },
    { key: 'done', title: 'Done' }
];

const tasks = ref<Task[]>([
    { id: 1, title: 'Audit colour contrast', status: 'todo', team: 'Design' },
    { id: 2, title: 'Virtual scrolling in Select', status: 'todo', team: 'Web' },
    { id: 3, title: 'Revisão da documentação', status: 'todo', team: 'Docs' },
    { id: 4, title: 'Keyboard grid for DataGrid', status: 'doing', team: 'Web' },
    { id: 5, title: 'Theme editor prototype', status: 'doing', team: 'Design' },
    { id: 6, title: 'Release notes for 0.3', status: 'done', team: 'Docs' }
]);

const search = ref('');
const team = ref('All');
// Words, or a function: here the team is a function and the words are added to it.
const filter = computed(() => {
    const words = search.value.trim();
    if (team.value === 'All') return words;
    return (item: Task) => item.team === team.value && (!words || item.title.toLowerCase().includes(words.toLowerCase()));
});
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem">
        <IconField>
            <InputIcon icon="search" />
            <InputText v-model="search" placeholder="Search cards" aria-label="Search cards" />
        </IconField>
        <SelectButton v-model="team" :options="['All', 'Web', 'Design', 'Docs']" :allow-empty="false" aria-label="Team" />
    </div>
    <Taskboard v-model:items="tasks" :columns="columns" column-field="status" :filter="filter" style="width: 100%">
        <template #card="{ item }">
            <div style="display: flex; flex-direction: column; gap: 0.5rem">
                <span>{{ (item as Task).title }}</span>
                <Tag :value="(item as Task).team" severity="secondary" style="align-self: start" />
            </div>
        </template>
    </Taskboard>
</template>
