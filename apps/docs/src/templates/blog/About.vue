<script setup lang="ts">
import { atSign, camera, mail, mapPin } from '@vitral/icons';
import { Avatar, Button, Card, Icon, InputText, Message, Textarea, Timeline } from '@vitral/vue';
import { reactive, ref, useId } from 'vue';
import { photo } from '../kit/format';
import { author } from './data';

const id = useId();
const field = (name: string) => `${id}-${name}`;
const form = reactive({ name: '', email: '', message: '' });
const sent = ref(false);

const history = [
    { year: '2026', title: 'Design lead, Tessellate', text: 'A small team building tools for civic data.' },
    { year: '2022', title: 'Product designer, Harbor & Pine', text: 'Booking flows for independent hotels.' },
    { year: '2019', title: 'First exhibition', text: 'Twenty prints from a year of film, in a borrowed gallery.' },
    { year: '2016', title: 'Started Field Notes', text: 'One post a month, give or take.' }
];

const facts = [
    { icon: mapPin, text: 'Porto, Portugal' },
    { icon: camera, text: 'Shoots on 35mm film' },
    { icon: atSign, text: 'noor@fieldnotes.example' }
];
</script>

<template>
    <div class="tp-wrap tp-page">
        <section class="tp-split tp-split-even tp-about" aria-labelledby="about-title">
            <div class="tp-stack">
                <span class="tp-eyebrow">About</span>
                <h1 id="about-title" class="tp-h1 tp-headline-lg">Hi, I’m {{ author.name }}.</h1>
                <p class="tp-lead">{{ author.bio }}</p>
                <p class="tp-prose">
                    I have spent ten years designing software for people who would rather not think about software. I write here about the parts of that job that do not fit in a
                    portfolio: the drafts, the arguments, the things that turned out to be wrong.
                </p>
                <ul class="tp-facts">
                    <li v-for="fact in facts" :key="fact.text"><Icon :icon="fact.icon" /> {{ fact.text }}</li>
                </ul>
            </div>
            <img class="tp-hero-media" :src="photo(author.photo, 800, 800)" :alt="`Portrait of ${author.name}`" />
        </section>

        <div class="tp-split">
            <section aria-labelledby="about-history">
                <h2 id="about-history" class="tp-h2">Along the way</h2>
                <Timeline :value="history" aria-label="Career" class="tp-timeline">
                    <template #opposite="{ item }">
                        <b class="tp-num">{{ (item as (typeof history)[number]).year }}</b>
                    </template>
                    <template #content="{ item }">
                        <div class="tp-timeline-item">
                            <b>{{ (item as (typeof history)[number]).title }}</b>
                            <p class="tp-muted">{{ (item as (typeof history)[number]).text }}</p>
                        </div>
                    </template>
                </Timeline>
            </section>

            <Card>
                <template #title>
                    <span class="tp-row"><Icon :icon="mail" /> Say hello</span>
                </template>
                <Message v-if="sent" severity="success" variant="subtle">Thanks, {{ form.name || 'friend' }} — I reply within a week.</Message>
                <form v-else class="tp-stack" @submit.prevent="sent = true">
                    <div class="tp-field">
                        <label :for="field('name')" class="tp-label">Name</label>
                        <InputText :id="field('name')" v-model="form.name" autocomplete="name" fluid />
                    </div>
                    <div class="tp-field">
                        <label :for="field('email')" class="tp-label">Email</label>
                        <InputText :id="field('email')" v-model="form.email" type="email" autocomplete="email" fluid />
                    </div>
                    <div class="tp-field">
                        <label :for="field('message')" class="tp-label">Message</label>
                        <Textarea :id="field('message')" v-model="form.message" :rows="4" fluid />
                    </div>
                    <Button type="submit" label="Send" icon="arrowRight" icon-pos="right" :disabled="!form.email.includes('@')" />
                </form>
                <template #footer>
                    <div class="tp-row">
                        <Avatar :label="author.initials" shape="circle" />
                        <small class="tp-muted">Usually replies on Fridays.</small>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>
