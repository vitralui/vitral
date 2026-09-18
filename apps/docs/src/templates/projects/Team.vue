<script setup lang="ts">
import { mail, userPlus } from '@vitral/icons';
import { Avatar, Button, Card, Icon, InputText, Message, ProgressBar, Select, Tag } from '@vitral/vue';
import { computed, ref, useId } from 'vue';
import { photo } from '../kit/format';
import { tasks, team } from './data';

const id = useId();
const email = ref('');
const role = ref('Engineer');
const invited = ref<string[]>([]);

const members = computed(() =>
    team.map((member) => {
        const open = tasks.value.filter((task) => task.owner === member.id && task.status !== 'done');
        const hours = open.reduce((sum, task) => sum + task.points * 2, 0);
        return { ...member, open: open.length, hours, load: Math.min(100, Math.round((hours / member.capacity) * 100)) };
    })
);

function invite() {
    if (!email.value.includes('@')) return;
    invited.value = [...invited.value, email.value];
    email.value = '';
}
</script>

<template>
    <div class="tp-head">
        <div>
            <h1 class="tp-h1">Team</h1>
            <p class="tp-muted">{{ team.length }} people on Launch · capacity this sprint</p>
        </div>
    </div>

    <ul class="tp-grid tp-team">
        <li v-for="member in members" :key="member.id" class="tp-card tp-stack tp-member">
            <div class="tp-person">
                <Avatar
                    :image="member.photo ? photo(member.photo, 120, 120) : undefined"
                    :label="member.photo ? undefined : member.initials"
                    :alt="member.name"
                    shape="circle"
                    size="large"
                />
                <span>
                    <b>{{ member.name }}</b>
                    <small>{{ member.role }}</small>
                </span>
            </div>
            <div class="tp-progress-row">
                <div>
                    <span>Workload</span>
                    <span class="tp-muted">{{ member.hours }} of {{ member.capacity }} h</span>
                </div>
                <ProgressBar :value="member.load" :show-value="false" :aria-label="`${member.name} workload`" :class="{ 'tp-over': member.load >= 90 }" />
            </div>
            <div class="tp-row tp-row-between">
                <Tag :value="`${member.open} open tasks`" severity="secondary" />
                <Button :icon="mail" variant="text" severity="secondary" size="small" :aria-label="`Email ${member.name}`" />
            </div>
        </li>
    </ul>

    <Card>
        <template #title>
            <span class="tp-row"><Icon :icon="userPlus" /> Invite people</span>
        </template>
        <form class="tp-invite" @submit.prevent="invite">
            <div class="tp-field">
                <label :for="`${id}-email`" class="tp-label">Email</label>
                <InputText :id="`${id}-email`" v-model="email" type="email" placeholder="name@company.example" fluid />
            </div>
            <div class="tp-field">
                <span :id="`${id}-role`" class="tp-label">Role</span>
                <Select v-model="role" :options="['Engineer', 'Designer', 'QA', 'Viewer']" :aria-labelledby="`${id}-role`" fluid />
            </div>
            <Button type="submit" label="Send invite" :disabled="!email.includes('@')" />
        </form>
        <Message v-for="address in invited" :key="address" severity="success" variant="simple">Invited {{ address }} as {{ role }}.</Message>
    </Card>
</template>
