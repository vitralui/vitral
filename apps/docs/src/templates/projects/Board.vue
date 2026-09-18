<script setup lang="ts">
import { messageSquare, plus } from '@vitral/icons';
import { Avatar, Button, Dialog, Icon, InputText, Select, SelectButton, Tag, Taskboard, type TaskboardCardMoveEvent, type TaskboardKey } from '@vitral/vue';
import { computed, reactive, ref, useId } from 'vue';
import { photo } from '../kit/format';
import { columns, memberOf, prioritySeverity, tagSeverity, tasks, team, type Task } from './data';

const id = useId();
const field = (name: string) => `${id}-${name}`;

const owner = ref<string | null>(null);
const view = ref('All');
const visible = computed<unknown[]>({
    get: () =>
        tasks.value.filter(
            (task) => (!owner.value || task.owner === owner.value) && (view.value === 'All' || (view.value === 'High priority' ? task.priority === 'High' : task.owner === 'ana'))
        ),
    set: (next) => {
        // The board hands back the visible cards in their new order; hidden ones keep their place.
        const moved = next as Task[];
        const shown = new Set(moved.map((task) => task.id));
        tasks.value = [...moved, ...tasks.value.filter((task) => !shown.has(task.id))];
    }
});

const log = ref('Drag a card, or focus one and press Space to pick it up.');
function onMove(event: TaskboardCardMoveEvent) {
    const task = event.item as Task;
    const to = columns.value.find((column) => column.key === event.to.column)?.title;
    log.value = `Moved “${task.title}” to ${to}.`;
}

const dialog = ref(false);
const draft = reactive({ title: '', owner: 'ana', tag: 'Frontend' as Task['tag'], priority: 'Medium' as Task['priority'], status: 'todo' as TaskboardKey });
const ownerOptions = team.map((member) => ({ label: member.name, value: member.id }));
const tagOptions: Task['tag'][] = ['Design', 'Frontend', 'Backend', 'QA', 'Launch'];

function openNew(column: TaskboardKey) {
    draft.status = column;
    draft.title = '';
    dialog.value = true;
}

function create() {
    tasks.value = [
        ...tasks.value,
        {
            id: Date.now(),
            title: draft.title,
            status: String(draft.status),
            owner: draft.owner,
            tag: draft.tag,
            priority: draft.priority,
            due: 'Oct 10',
            points: 3,
            comments: 0,
            start: 5,
            length: 3
        }
    ];
    dialog.value = false;
}
</script>

<template>
    <div class="tp-head">
        <div>
            <h1 class="tp-h1">Launch · Sprint 14</h1>
            <p class="tp-muted">{{ tasks.filter((task) => task.status === 'done').length }} of {{ tasks.length }} tasks done · ends in 6 days</p>
        </div>
        <div class="tp-toolbar">
            <SelectButton v-model="view" :options="['All', 'High priority', 'Mine']" :allow-empty="false" label="Show" size="small" />
            <Button label="New task" :icon="plus" size="small" @click="openNew('todo')" />
        </div>
    </div>

    <div class="tp-row" role="group" aria-label="Filter by person">
        <button
            v-for="member in team"
            :key="member.id"
            type="button"
            class="tp-person-filter"
            :aria-pressed="owner === member.id"
            :aria-label="member.name"
            @click="owner = owner === member.id ? null : member.id"
        >
            <Avatar :image="member.photo ? photo(member.photo, 80, 80) : undefined" :label="member.photo ? undefined : member.initials" alt="" shape="circle" />
        </button>
        <Button v-if="owner" label="Clear" variant="text" size="small" @click="owner = null" />
        <span class="tp-muted tp-small tp-board-log" aria-live="polite">{{ log }}</span>
    </div>

    <div class="tp-board">
        <Taskboard v-model:columns="columns" v-model:items="visible" column-field="status" data-key="id" scroll-height="34rem" @card-move="onMove">
            <template #card="{ item }">
                <div class="tp-task">
                    <div class="tp-row">
                        <Tag :value="(item as Task).tag" :severity="tagSeverity((item as Task).tag)" />
                        <Tag v-if="(item as Task).priority === 'High'" value="High" :severity="prioritySeverity((item as Task).priority)" />
                    </div>
                    <b>{{ (item as Task).title }}</b>
                    <div class="tp-row tp-row-between tp-task-foot">
                        <span class="tp-row">
                            <span>{{ (item as Task).due }}</span>
                            <span v-if="(item as Task).comments" class="tp-row"><Icon :icon="messageSquare" /> {{ (item as Task).comments }}</span>
                        </span>
                        <Avatar
                            :image="memberOf((item as Task).owner).photo ? photo(memberOf((item as Task).owner).photo!, 64, 64) : undefined"
                            :label="memberOf((item as Task).owner).photo ? undefined : memberOf((item as Task).owner).initials"
                            :alt="memberOf((item as Task).owner).name"
                            shape="circle"
                        />
                    </div>
                </div>
            </template>
            <template #add-card="{ column }">
                <Button label="Add task" :icon="plus" variant="text" size="small" severity="secondary" fluid @click="openNew(column.key)" />
            </template>
        </Taskboard>
    </div>

    <Dialog v-model:visible="dialog" header="New task" modal :pt="{ root: { style: 'width: 28rem; max-width: calc(100vw - 2rem)' } }">
        <form class="tp-stack" @submit.prevent="create">
            <div class="tp-field">
                <label :for="field('title')" class="tp-label">Title</label>
                <InputText :id="field('title')" v-model="draft.title" fluid />
            </div>
            <div class="tp-form">
                <div class="tp-field">
                    <span :id="field('owner')" class="tp-label">Owner</span>
                    <Select v-model="draft.owner" :options="ownerOptions" option-label="label" option-value="value" :aria-labelledby="field('owner')" fluid />
                </div>
                <div class="tp-field">
                    <span :id="field('tag')" class="tp-label">Area</span>
                    <Select v-model="draft.tag" :options="tagOptions" :aria-labelledby="field('tag')" fluid />
                </div>
                <div class="tp-field tp-span">
                    <span :id="field('priority')" class="tp-label">Priority</span>
                    <SelectButton v-model="draft.priority" :options="['Low', 'Medium', 'High']" :allow-empty="false" :aria-labelledby="field('priority')" fluid />
                </div>
            </div>
            <div class="tp-row tp-row-end">
                <Button label="Cancel" variant="text" severity="secondary" @click="dialog = false" />
                <Button type="submit" label="Create task" :disabled="!draft.title.trim()" />
            </div>
        </form>
    </Dialog>
</template>
