<script setup lang="ts">
import { bookmark, clock, link, share } from '@vitral/icons';
import { Avatar, Breadcrumb, Button, Chip, Divider, Icon, ProgressBar } from '@vitral/vue';
import { computed, ref } from 'vue';
import { useTemplate } from '../kit/context';
import { photo } from '../kit/format';
import { authors, mostRead, paper, sectionName, stories, storyOf, type Story } from './data';

const { go } = useTemplate();
const story = computed(() => storyOf(paper.storyId));
const author = computed(() => authors[story.value.author]!);
const related = computed(() => stories.filter((entry) => entry.section === story.value.section && entry.id !== story.value.id).slice(0, 3));
const saved = ref(false);

const trail = computed(() => [
    { label: 'Today', command: () => go('front') },
    {
        label: sectionName(story.value.section),
        command: () => {
            paper.section = story.value.section;
            go('section');
        }
    }
]);

function read(next: Story) {
    paper.storyId = next.id;
}
</script>

<template>
    <div class="tp-wrap tp-page">
        <div class="tp-split tp-split-wide">
            <article class="tp-article" aria-labelledby="article-title">
                <Breadcrumb :model="trail" aria-label="Section" />
                <header class="tp-stack">
                    <h1 id="article-title" class="tp-h1 tp-headline-lg">{{ story.title }}</h1>
                    <p class="tp-lead">{{ story.dek }}</p>
                    <div class="tp-row tp-row-between">
                        <div class="tp-byline">
                            <Avatar :label="author.initials" shape="circle" size="large" />
                            <span>
                                <b>{{ story.author }}</b>
                                <span class="tp-meta">
                                    <span>{{ author.role }}</span>
                                    <span>{{ story.published }}</span>
                                    <span><Icon :icon="clock" /> {{ story.minutes }} min read</span>
                                </span>
                            </span>
                        </div>
                        <div class="tp-row">
                            <Button :icon="share" variant="text" severity="secondary" aria-label="Share" />
                            <Button :icon="link" variant="text" severity="secondary" aria-label="Copy link" />
                            <Button
                                :icon="bookmark"
                                :variant="saved ? 'outlined' : 'text'"
                                severity="secondary"
                                :aria-label="saved ? 'Saved' : 'Save for later'"
                                :aria-pressed="saved"
                                @click="saved = !saved"
                            />
                        </div>
                    </div>
                </header>

                <figure class="tp-figure">
                    <img :src="photo(story.photo, 1200, 675)" alt="" />
                    <figcaption>Photograph: Lantern archive. The scene is illustrative.</figcaption>
                </figure>

                <div class="tp-prose">
                    <p>
                        <b>{{ story.dek }}</b> It is the kind of change that happens slowly and then all at once, and the people closest to it describe it in the same careful
                        words: nobody planned for this, and everybody is adjusting.
                    </p>
                    <p>
                        For most of the last decade the numbers moved in the other direction. Local officials say the turn came last autumn, when a handful of small decisions — a
                        timetable here, a budget line there — began to add up.
                    </p>
                    <blockquote class="tp-quote">“We didn’t set out to change anything. We set out to fix one thing, and the rest followed.”</blockquote>
                    <p>
                        Not everyone is convinced. Critics point to the cost, and to the communities that were not asked. Supporters answer that the alternative was to wait, and
                        that waiting had its own price.
                    </p>
                    <h2 class="tp-h2">What happens next</h2>
                    <p>
                        A review is due in the spring. Until then, the people who live with the change will keep doing what they have done all year: trying it, complaining about
                        it, and — mostly — getting used to it.
                    </p>
                </div>

                <div class="tp-row">
                    <Chip v-for="tag in story.tags" :key="tag" :label="tag" />
                </div>
                <Divider />

                <section aria-labelledby="article-related">
                    <h2 id="article-related" class="tp-h2">More in {{ sectionName(story.section) }}</h2>
                    <ul class="tp-grid tp-grid-3">
                        <li v-for="item in related" :key="item.id">
                            <article class="tp-story">
                                <img :src="photo(item.photo, 480, 300)" alt="" />
                                <h3 class="tp-h3">
                                    <button type="button" class="tp-stretch" @click="read(item)">{{ item.title }}</button>
                                </h3>
                            </article>
                        </li>
                    </ul>
                </section>
            </article>

            <aside class="tp-stack tp-sticky" aria-label="Reading">
                <section class="tp-card tp-stack" aria-labelledby="article-progress">
                    <h2 id="article-progress" class="tp-kicker">Your reading this month</h2>
                    <ProgressBar :value="60" :show-value="false" aria-label="6 of 10 free articles read" />
                    <p class="tp-muted tp-small">6 of 10 free articles. Subscribe for unlimited reading.</p>
                    <Button label="Subscribe from $4/month" size="small" />
                </section>
                <section class="tp-card" aria-labelledby="article-most-read">
                    <h2 id="article-most-read" class="tp-kicker">Most read</h2>
                    <ol class="tp-ranked">
                        <li v-for="item in mostRead" :key="item.id">
                            <button type="button" class="tp-link" @click="read(item)">
                                <span class="tp-h3">{{ item.title }}</span>
                            </button>
                        </li>
                    </ol>
                </section>
            </aside>
        </div>
    </div>
</template>
