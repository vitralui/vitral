<script setup lang="ts">
import { clock, mail } from '@vitral/icons';
import { Button, Icon, InputText, Message, Tag } from '@vitral/vue';
import { ref, useId } from 'vue';
import { useTemplate } from '../kit/context';
import { photo } from '../kit/format';
import { mostRead, paper, sectionName, sections, stories, type Story } from './data';

const { go } = useTemplate();
const emailId = useId();
const email = ref('');
const subscribed = ref(false);

const lead = stories[8]!;
const top = [stories[0]!, stories[4]!, stories[12]!, stories[15]!];
const rows = sections.slice(0, 3).map((entry) => ({ ...entry, items: stories.filter((story) => story.section === entry.id && story.id !== lead.id).slice(0, 3) }));

function read(story: Story) {
    paper.storyId = story.id;
    go('article');
}

function openSection(id: string) {
    paper.section = id;
    go('section');
}

const today = new Date(2026, 8, 16).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
</script>

<template>
    <div class="tp-wrap tp-page">
        <div class="tp-dateline">
            <span>{{ today }}</span>
            <Message severity="info" variant="simple" class="tp-dateline-alert"> <b>Live:</b> Northern ferry routes reopen — updates through the day </Message>
        </div>

        <section class="tp-front" aria-labelledby="front-lead">
            <article class="tp-story tp-front-lead">
                <img :src="photo(lead.photo, 1200, 750)" alt="Green and violet auroras over a dark forest" />
                <Tag :value="sectionName(lead.section)" severity="contrast" />
                <h1 id="front-lead" class="tp-h1 tp-headline">
                    <button type="button" class="tp-stretch" @click="read(lead)">{{ lead.title }}</button>
                </h1>
                <p>{{ lead.dek }}</p>
                <span class="tp-meta">
                    <span>{{ lead.author }}</span>
                    <span><Icon :icon="clock" /> {{ lead.minutes }} min read</span>
                </span>
            </article>

            <div class="tp-front-side">
                <h2 class="tp-kicker">Top stories</h2>
                <ul class="tp-rule-list">
                    <li v-for="story in top" :key="story.id">
                        <article class="tp-story tp-story-row">
                            <div>
                                <span class="tp-eyebrow">{{ sectionName(story.section) }}</span>
                                <h3 class="tp-h3">
                                    <button type="button" class="tp-stretch" @click="read(story)">{{ story.title }}</button>
                                </h3>
                                <span class="tp-meta">{{ story.published }}</span>
                            </div>
                            <img :src="photo(story.photo, 240, 240)" alt="" />
                        </article>
                    </li>
                </ul>
            </div>
        </section>

        <div class="tp-split tp-split-wide">
            <div class="tp-stack tp-sections">
                <section v-for="row in rows" :key="row.id" :aria-labelledby="`front-${row.id}`">
                    <div class="tp-section-rule">
                        <h2 :id="`front-${row.id}`" class="tp-h2">{{ row.name }}</h2>
                        <Button :label="`More ${row.name}`" icon="arrowRight" icon-pos="right" variant="text" size="small" @click="openSection(row.id)" />
                    </div>
                    <ul class="tp-grid tp-grid-3">
                        <li v-for="story in row.items" :key="story.id">
                            <article class="tp-story">
                                <img :src="photo(story.photo, 480, 300)" alt="" />
                                <h3 class="tp-h3">
                                    <button type="button" class="tp-stretch" @click="read(story)">{{ story.title }}</button>
                                </h3>
                                <span class="tp-meta">{{ story.author }} · {{ story.minutes }} min</span>
                            </article>
                        </li>
                    </ul>
                </section>
            </div>

            <aside class="tp-stack" aria-label="More from The Lantern">
                <section class="tp-card" aria-labelledby="front-most-read">
                    <h2 id="front-most-read" class="tp-kicker">Most read</h2>
                    <ol class="tp-ranked">
                        <li v-for="story in mostRead" :key="story.id">
                            <button type="button" class="tp-link" @click="read(story)">
                                <span class="tp-h3">{{ story.title }}</span>
                            </button>
                        </li>
                    </ol>
                </section>
                <section class="tp-card tp-stack" aria-labelledby="front-newsletter">
                    <span class="tp-icon-badge"><Icon :icon="mail" /></span>
                    <h2 id="front-newsletter" class="tp-h3">The Morning Lantern</h2>
                    <p class="tp-muted">Five stories worth your coffee, before 7am.</p>
                    <Message v-if="subscribed" severity="success" variant="subtle">You're in. See you tomorrow.</Message>
                    <form v-else class="tp-stack" @submit.prevent="subscribed = !!email">
                        <label :for="emailId" class="vt-sr-only">Email address</label>
                        <InputText :id="emailId" v-model="email" type="email" placeholder="you@example.com" fluid />
                        <Button type="submit" label="Sign up" fluid />
                    </form>
                </section>
            </aside>
        </div>
    </div>
</template>
