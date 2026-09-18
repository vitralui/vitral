<script setup lang="ts">
import { clock } from '@vitral/icons';
import { DataView, Icon, SelectButton, Tag } from '@vitral/vue';
import { computed, ref } from 'vue';
import { useTemplate } from '../kit/context';
import { photo } from '../kit/format';
import { paper, sectionName, sections, stories, type Story } from './data';

const { go } = useTemplate();
const order = ref('Latest');

const items = computed(() => {
    // A section shows its own stories first, then the rest of the paper, so a
    // short section still fills a page.
    const own = stories.filter((story) => story.section === paper.section);
    const rest = stories.filter((story) => story.section !== paper.section);
    const list = [...own, ...rest];
    return order.value === 'Latest' ? list : [...list].sort((a, b) => b.minutes - a.minutes);
});
const lead = computed(() => items.value[0]!);

function read(story: Story) {
    paper.storyId = story.id;
    go('article');
}
</script>

<template>
    <div class="tp-wrap tp-page">
        <header class="tp-section-header">
            <span class="tp-eyebrow">Section</span>
            <h1 class="tp-h1 tp-headline-lg">{{ sectionName(paper.section) }}</h1>
            <div class="tp-row">
                <button v-for="entry in sections" :key="entry.id" type="button" class="tp-pill" :aria-pressed="paper.section === entry.id" @click="paper.section = entry.id">
                    {{ entry.name }}
                </button>
            </div>
        </header>

        <article class="tp-story tp-section-lead">
            <img :src="photo(lead.photo, 1000, 560)" alt="" />
            <div class="tp-stack">
                <Tag :value="sectionName(lead.section)" severity="secondary" />
                <h2 class="tp-h1">
                    <button type="button" class="tp-stretch" @click="read(lead)">{{ lead.title }}</button>
                </h2>
                <p>{{ lead.dek }}</p>
                <span class="tp-meta">{{ lead.author }} · {{ lead.published }}</span>
            </div>
        </article>

        <DataView :value="items.slice(1)" layout="list" paginator :rows="5" data-key="id">
            <template #header>
                <div class="tp-row tp-row-between">
                    <h2 class="tp-h3">All stories</h2>
                    <SelectButton v-model="order" :options="['Latest', 'Long reads']" :allow-empty="false" label="Order" size="small" />
                </div>
            </template>
            <template #list="{ items: page }">
                <ul class="tp-rule-list tp-section-list">
                    <li v-for="story in page as Story[]" :key="story.id">
                        <article class="tp-story tp-story-row">
                            <img :src="photo(story.photo, 320, 220)" alt="" />
                            <div>
                                <span class="tp-eyebrow">{{ sectionName(story.section) }}</span>
                                <h3 class="tp-h3">
                                    <button type="button" class="tp-stretch" @click="read(story)">{{ story.title }}</button>
                                </h3>
                                <p>{{ story.dek }}</p>
                                <span class="tp-meta">
                                    <span>{{ story.author }}</span>
                                    <span><Icon :icon="clock" /> {{ story.minutes }} min</span>
                                </span>
                            </div>
                        </article>
                    </li>
                </ul>
            </template>
        </DataView>
    </div>
</template>
