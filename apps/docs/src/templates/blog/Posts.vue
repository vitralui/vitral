<script setup lang="ts">
import { calendar, clock } from '@vitral/icons';
import { Avatar, Icon, Tag } from '@vitral/vue';
import { computed } from 'vue';
import { useTemplate } from '../kit/context';
import { photo } from '../kit/format';
import { author, journal, posts, tags, type Post } from './data';

const { go } = useTemplate();
const featured = posts.find((post) => post.featured)!;
const list = computed(() => posts.filter((post) => !post.featured && (!journal.tag || post.tags.includes(journal.tag))));

function read(post: Post) {
    journal.postId = post.id;
    go('post');
}
</script>

<template>
    <div class="tp-wrap tp-page tp-blog">
        <header class="tp-blog-intro">
            <Avatar :image="photo(author.photo, 160, 160)" :alt="author.name" shape="circle" size="xlarge" />
            <div>
                <h1 class="tp-h1">Field Notes</h1>
                <p class="tp-lead">{{ author.bio }}</p>
            </div>
        </header>

        <article class="tp-story tp-blog-featured">
            <img :src="photo(featured.photo, 1100, 620)" alt="" />
            <div class="tp-stack">
                <Tag value="Latest" severity="contrast" />
                <h2 class="tp-h1">
                    <button type="button" class="tp-stretch" @click="read(featured)">{{ featured.title }}</button>
                </h2>
                <p>{{ featured.excerpt }}</p>
                <span class="tp-meta">
                    <span><Icon :icon="calendar" /> {{ featured.date }}</span>
                    <span><Icon :icon="clock" /> {{ featured.minutes }} min read</span>
                </span>
            </div>
        </article>

        <section class="tp-split tp-split-wide" aria-labelledby="blog-all">
            <div>
                <div class="tp-head">
                    <h2 id="blog-all" class="tp-h2">{{ journal.tag ? `Tagged “${journal.tag}”` : 'All writing' }}</h2>
                    <span class="tp-muted tp-small">{{ list.length }} posts</span>
                </div>
                <ul class="tp-rule-list tp-post-list">
                    <li v-for="post in list" :key="post.id">
                        <article class="tp-story tp-story-row">
                            <div>
                                <span class="tp-meta">{{ post.date }} · {{ post.minutes }} min</span>
                                <h3 class="tp-h2">
                                    <button type="button" class="tp-stretch" @click="read(post)">{{ post.title }}</button>
                                </h3>
                                <p>{{ post.excerpt }}</p>
                                <div class="tp-row tp-tags">
                                    <Tag v-for="tag in post.tags" :key="tag" :value="tag" severity="secondary" />
                                </div>
                            </div>
                            <img :src="photo(post.photo, 320, 320)" alt="" />
                        </article>
                    </li>
                </ul>
                <p v-if="!list.length" class="tp-muted">Nothing tagged that yet.</p>
            </div>

            <aside class="tp-stack tp-sticky" aria-label="Browse">
                <section class="tp-card">
                    <h2 class="tp-kicker">Tags</h2>
                    <div class="tp-row">
                        <button type="button" class="tp-pill" :aria-pressed="journal.tag === null" @click="journal.tag = null">All</button>
                        <button v-for="tag in tags" :key="tag" type="button" class="tp-pill" :aria-pressed="journal.tag === tag" @click="journal.tag = tag">{{ tag }}</button>
                    </div>
                </section>
            </aside>
        </section>
    </div>
</template>
