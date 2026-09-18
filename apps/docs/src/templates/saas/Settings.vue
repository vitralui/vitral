<script setup lang="ts">
import { Avatar, Button, Card, InputText, Message, MeterGroup, Select, Tab, TabList, TabPanel, TabPanels, Tabs, Tag, Textarea, ToggleSwitch } from '@vitral/vue';
import { reactive, ref, useId } from 'vue';

const id = useId();
const field = (name: string) => `${id}-${name}`;
const tab = ref('profile');
const saved = ref(false);

const profile = reactive({
    name: 'Priya Raman',
    email: 'priya@lumenmetrics.example',
    role: 'Head of Growth',
    timezone: 'Europe/Lisbon',
    bio: 'I look after trials, pricing and the numbers in between.'
});
const timezones = ['Europe/Lisbon', 'America/New_York', 'America/Sao_Paulo', 'Asia/Tokyo'].map((zone) => ({ label: zone.replace('_', ' '), value: zone }));

const notifications = reactive([
    { key: 'digest', label: 'Weekly digest', hint: 'A summary of revenue and churn, every Monday.', on: true },
    { key: 'risk', label: 'Accounts at risk', hint: 'When a customer’s health drops.', on: true },
    { key: 'billing', label: 'Failed payments', hint: 'As they happen.', on: false },
    { key: 'product', label: 'Product news', hint: 'New features, about once a month.', on: false }
]);

const usage = [
    { label: 'Events', value: 62 },
    { label: 'Dashboards', value: 14 },
    { label: 'Exports', value: 6 }
];

const plans = [
    { name: 'Growth', price: '$99', note: 'Up to 25 seats and 5M events', current: false },
    { name: 'Scale', price: '$299', note: 'Up to 100 seats, 50M events, SSO', current: true },
    { name: 'Enterprise', price: 'Custom', note: 'Unlimited, with a named engineer', current: false }
];

function save() {
    saved.value = true;
}
</script>

<template>
    <div class="tp-head">
        <h1 class="tp-h1">Settings</h1>
    </div>

    <Tabs v-model:value="tab" class="tp-tabs">
        <TabList aria-label="Settings sections">
            <Tab value="profile">Profile</Tab>
            <Tab value="notifications">Notifications</Tab>
            <Tab value="billing">Billing</Tab>
        </TabList>
        <TabPanels>
            <TabPanel value="profile">
                <div class="tp-split tp-split-wide">
                    <form class="tp-form" @submit.prevent="save">
                        <div class="tp-field">
                            <label :for="field('name')" class="tp-label">Name</label>
                            <InputText :id="field('name')" v-model="profile.name" fluid />
                        </div>
                        <div class="tp-field">
                            <label :for="field('role')" class="tp-label">Role</label>
                            <InputText :id="field('role')" v-model="profile.role" fluid />
                        </div>
                        <div class="tp-field tp-span">
                            <label :for="field('email')" class="tp-label">Email</label>
                            <InputText :id="field('email')" v-model="profile.email" type="email" fluid />
                        </div>
                        <div class="tp-field tp-span">
                            <span :id="field('zone')" class="tp-label">Time zone</span>
                            <Select v-model="profile.timezone" :options="timezones" option-label="label" option-value="value" :aria-labelledby="field('zone')" fluid />
                        </div>
                        <div class="tp-field tp-span">
                            <label :for="field('bio')" class="tp-label">Bio</label>
                            <Textarea :id="field('bio')" v-model="profile.bio" :rows="3" auto-resize fluid />
                        </div>
                        <div class="tp-span tp-row">
                            <Button type="submit" label="Save changes" />
                            <Message v-if="saved" severity="success" variant="simple">Saved.</Message>
                        </div>
                    </form>
                    <div class="tp-card tp-stack tp-profile-card">
                        <Avatar label="PR" size="xlarge" shape="circle" />
                        <div>
                            <b>{{ profile.name }}</b>
                            <p class="tp-muted">{{ profile.role }}</p>
                        </div>
                        <Button label="Change photo" severity="secondary" variant="outlined" size="small" />
                    </div>
                </div>
            </TabPanel>

            <TabPanel value="notifications">
                <div class="tp-card">
                    <ul class="tp-switches">
                        <li v-for="item in notifications" :key="item.key">
                            <span>
                                <b :id="field(item.key)">{{ item.label }}</b>
                                <small class="tp-muted">{{ item.hint }}</small>
                            </span>
                            <ToggleSwitch v-model="item.on" :aria-labelledby="field(item.key)" />
                        </li>
                    </ul>
                </div>
            </TabPanel>

            <TabPanel value="billing">
                <div class="tp-stack">
                    <Card title="Usage this month" subtitle="Resets on October 1">
                        <MeterGroup :value="usage" aria-label="Usage of the Scale plan" />
                    </Card>
                    <ul class="tp-grid tp-plans">
                        <li v-for="plan in plans" :key="plan.name" class="tp-card tp-stack" :class="{ 'tp-plan-current': plan.current }">
                            <div class="tp-row tp-row-between">
                                <h2 class="tp-h3">{{ plan.name }}</h2>
                                <Tag v-if="plan.current" value="Current plan" severity="info" />
                            </div>
                            <p class="tp-price tp-price-lg">{{ plan.price }}<small v-if="plan.price !== 'Custom'" class="tp-muted"> / month</small></p>
                            <p class="tp-muted">{{ plan.note }}</p>
                            <Button
                                :label="plan.current ? 'Manage' : plan.name === 'Enterprise' ? 'Contact sales' : 'Switch'"
                                :severity="plan.current ? 'primary' : 'secondary'"
                                :variant="plan.current ? undefined : 'outlined'"
                            />
                        </li>
                    </ul>
                </div>
            </TabPanel>
        </TabPanels>
    </Tabs>
</template>
