<script setup lang="ts">
import { bath, bed, calendarCheck, phone, ruler, share } from '@vitral/icons';
import {
    Avatar,
    Breadcrumb,
    Button,
    Chip,
    Dialog,
    Galleria,
    Icon,
    InputNumber,
    InputText,
    Message,
    Schedule,
    Slider,
    Tag,
    type ScheduleEvent,
    type ScheduleSelection
} from '@vitral/vue';
import { computed, ref, useId, watch } from 'vue';
import { useTemplate } from '../kit/context';
import { photo } from '../kit/format';
import { agent, listingOf, price, search } from './data';

const { go } = useTemplate();
const id = useId();
const field = (name: string) => `${id}-${name}`;

const home = computed(() => listingOf(search.listingId));
const active = ref(0);
watch(home, () => (active.value = 0));

const trail = computed(() => [
    { label: 'Buy', command: () => go('search') },
    {
        label: home.value.area,
        command: () => {
            search.area = home.value.area;
            go('listings');
        }
    },
    { label: home.value.address }
]);

// ---- the mortgage estimate
const down = ref(20);
const years = ref(25);
const rate = ref(4.2);
const monthly = computed(() => {
    const principal = home.value.price * (1 - down.value / 100);
    const r = rate.value / 100 / 12;
    const n = years.value * 12;
    return r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
});

// ---- booking a visit: the agent's week, with the busy slots already in it
const today = new Date();
const at = (day: number, hour: number, minute = 0) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + day, hour, minute);
const visits = ref<ScheduleEvent[]>([
    { id: 'b1', title: 'Booked', start: at(0, 10), end: at(0, 11), editable: false, color: 'var(--vt-text-muted-color)' },
    { id: 'b2', title: 'Booked', start: at(1, 14), end: at(1, 15, 30), editable: false, color: 'var(--vt-text-muted-color)' },
    { id: 'b3', title: 'Open house', start: at(2, 11), end: at(2, 13), editable: false, color: 'var(--vt-chart-3)' },
    { id: 'b4', title: 'Booked', start: at(3, 16), end: at(3, 17), editable: false, color: 'var(--vt-text-muted-color)' }
]);
const pending = ref<ScheduleSelection | null>(null);
const dialog = ref(false);
const visitor = ref({ name: '', email: '' });
const confirmed = ref<string | null>(null);

function pick(selection: ScheduleSelection) {
    pending.value = selection;
    dialog.value = true;
}

function book() {
    if (!pending.value) return;
    visits.value = [...visits.value, { id: `v${visits.value.length}`, title: 'Your visit', start: pending.value.start, end: pending.value.end, color: 'var(--vt-primary-color)' }];
    confirmed.value = pending.value.start.toLocaleString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' });
    dialog.value = false;
}

const when = computed(() =>
    pending.value ? `${pending.value.start.toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''
);
</script>

<template>
    <div class="tp-wrap tp-page">
        <Breadcrumb :model="trail" aria-label="Location" />

        <header class="tp-head tp-property-head">
            <div>
                <div class="tp-row">
                    <Tag :value="home.type" severity="secondary" />
                    <Tag v-if="home.badge" :value="home.badge" :severity="home.badge === 'Price cut' ? 'danger' : 'contrast'" />
                </div>
                <h1 class="tp-h1">{{ home.title }}</h1>
                <p class="tp-muted">{{ home.address }}, {{ home.area }}</p>
            </div>
            <div class="tp-property-price">
                <span class="tp-price tp-price-lg">{{ price.format(home.price) }}</span>
                <span class="tp-muted tp-small">Est. {{ price.format(monthly) }}/month</span>
            </div>
        </header>

        <Galleria v-model:active-index="active" :value="home.photos" :num-visible="5" show-item-navigators circular :aria-label="`Photos of ${home.title}`" class="tp-gallery">
            <template #item="{ item, index }">
                <img :src="photo(item as number, 1200, 675)" :alt="index === 0 ? `Outside ${home.title}` : `Inside, room ${index}`" class="tp-estate-photo" />
            </template>
            <template #thumbnail="{ item }">
                <img :src="photo(item as number, 200, 130)" alt="" class="tp-gallery-thumb tp-estate-thumb" />
            </template>
        </Galleria>

        <div class="tp-split">
            <div class="tp-stack tp-gap-lg">
                <ul class="tp-facts tp-facts-lg">
                    <li>
                        <Icon :icon="bed" /> <b>{{ home.beds }}</b> bedrooms
                    </li>
                    <li>
                        <Icon :icon="bath" /> <b>{{ home.baths }}</b> bathrooms
                    </li>
                    <li>
                        <Icon :icon="ruler" /> <b>{{ home.size }}</b> m²
                    </li>
                    <li>
                        <Icon :icon="calendarCheck" /> Built <b>{{ home.year }}</b>
                    </li>
                </ul>

                <section aria-labelledby="home-about">
                    <h2 id="home-about" class="tp-h2">About this home</h2>
                    <p class="tp-prose">
                        Light comes in from both sides of the house for most of the day. The layout keeps the living spaces together on one level and the bedrooms apart, with
                        storage where you would want it. Recent work includes new windows, insulation and a rewired kitchen.
                    </p>
                    <div class="tp-row tp-amenities">
                        <Chip v-for="amenity in home.amenities" :key="amenity" :label="amenity" />
                    </div>
                </section>

                <section aria-labelledby="home-visit">
                    <div class="tp-head">
                        <div>
                            <h2 id="home-visit" class="tp-h2">Schedule a visit</h2>
                            <p class="tp-muted">Drag across a free slot in {{ agent.name.split(' ')[0] }}'s week to request it.</p>
                        </div>
                    </div>
                    <Message v-if="confirmed" severity="success" variant="subtle" class="tp-visit-note"
                        >Requested for {{ confirmed }}. {{ agent.name }} will confirm by email.</Message
                    >
                    <Schedule
                        :events="visits"
                        :views="['week', 'day']"
                        min-time="09:00"
                        max-time="19:00"
                        scroll-height="24rem"
                        :slot-duration="30"
                        selectable
                        :now-indicator="false"
                        :first-day-of-week="1"
                        class="tp-schedule"
                        @select="pick"
                    />
                </section>
            </div>

            <aside class="tp-stack tp-sticky" aria-label="Contact and costs">
                <section class="tp-card tp-stack" aria-labelledby="home-agent">
                    <div class="tp-person">
                        <Avatar :image="photo(agent.photo, 96, 96)" :alt="agent.name" shape="circle" size="large" />
                        <span>
                            <b id="home-agent">{{ agent.name }}</b>
                            <small>Listing agent · replies in about an hour</small>
                        </span>
                    </div>
                    <Button label="Request a visit" :icon="calendarCheck" fluid @click="pick({ start: at(1, 10), end: at(1, 10, 30), allDay: false, via: 'keyboard' })" />
                    <div class="tp-row">
                        <Button :label="agent.phone" :icon="phone" severity="secondary" variant="outlined" size="small" class="tp-grow" />
                        <Button :icon="share" severity="secondary" variant="outlined" size="small" aria-label="Share this home" />
                    </div>
                </section>

                <section class="tp-card tp-stack" aria-labelledby="home-mortgage">
                    <h2 id="home-mortgage" class="tp-h3">Monthly estimate</h2>
                    <strong class="tp-price tp-price-lg">{{ price.format(monthly) }}</strong>
                    <div class="tp-field">
                        <span :id="field('down')" class="tp-label">Down payment: {{ down }}% · {{ price.format((home.price * down) / 100) }}</span>
                        <Slider v-model="down" :min="5" :max="60" :step="5" :aria-labelledby="field('down')" />
                    </div>
                    <div class="tp-field">
                        <span :id="field('years')" class="tp-label">Term: {{ years }} years</span>
                        <Slider v-model="years" :min="10" :max="35" :step="5" :aria-labelledby="field('years')" />
                    </div>
                    <div class="tp-field">
                        <label :for="field('rate')" class="tp-label">Interest rate</label>
                        <InputNumber :id="field('rate')" v-model="rate" :min="0" :max="15" :step="0.1" :min-fraction-digits="1" suffix=" %" show-buttons fluid />
                    </div>
                    <small class="tp-muted">An illustration, not an offer.</small>
                </section>
            </aside>
        </div>

        <Dialog v-model:visible="dialog" header="Request a visit" modal :pt="{ root: { style: 'width: 26rem; max-width: calc(100vw - 2rem)' } }">
            <form class="tp-stack" @submit.prevent="book">
                <p class="tp-muted">{{ home.title }} · {{ when }}</p>
                <div class="tp-field">
                    <label :for="field('name')" class="tp-label">Your name</label>
                    <InputText :id="field('name')" v-model="visitor.name" autocomplete="name" fluid />
                </div>
                <div class="tp-field">
                    <label :for="field('email')" class="tp-label">Email</label>
                    <InputText :id="field('email')" v-model="visitor.email" type="email" autocomplete="email" fluid />
                </div>
                <div class="tp-row tp-row-end">
                    <Button label="Cancel" severity="secondary" variant="text" @click="dialog = false" />
                    <Button type="submit" label="Send request" :disabled="!visitor.email.includes('@')" />
                </div>
            </form>
        </Dialog>
    </div>
</template>
