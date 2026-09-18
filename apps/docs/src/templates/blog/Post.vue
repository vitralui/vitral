<script setup lang="ts">
import { calendar, clock, heart, share } from '@vitral/icons';
import { Avatar, Button, Divider, Icon, Message, Tag, Textarea } from '@vitral/vue';
import { computed, ref, useId, watch } from 'vue';
import { useTemplate } from '../kit/context';
import { photo } from '../kit/format';
import { author, comments, journal, postOf, posts, type Post } from './data';

const { go } = useTemplate();
const commentId = useId();
const post = computed(() => postOf(journal.postId));
const index = computed(() => posts.findIndex((entry) => entry.id === post.value.id));
const newer = computed(() => posts[index.value - 1]);
const older = computed(() => posts[index.value + 1]);

const likes = ref(128);
const liked = ref(false);
const draft = ref('');
const thread = ref([...comments]);
watch(post, () => {
    liked.value = false;
    draft.value = '';
});

function toggleLike() {
    liked.value = !liked.value;
    likes.value += liked.value ? 1 : -1;
}

function send() {
    if (!draft.value.trim()) return;
    thread.value = [{ name: 'You', initials: 'YO', when: 'just now', text: draft.value.trim() }, ...thread.value];
    draft.value = '';
}

function read(next: Post) {
    journal.postId = next.id;
}

function byTag(tag: string) {
    journal.tag = tag;
    go('posts');
}

const contents = ['The paragraph comes first', 'What it catches', 'When to stop writing'];
</script>

<template>
    <div class="tp-wrap tp-page">
        <article class="tp-article" aria-labelledby="post-title">
            <Button label="All writing" icon="arrowLeft" variant="text" size="small" class="tp-back" @click="go('posts')" />
            <header class="tp-stack">
                <div class="tp-row">
                    <button v-for="tag in post.tags" :key="tag" type="button" class="tp-pill" @click="byTag(tag)">{{ tag }}</button>
                </div>
                <h1 id="post-title" class="tp-h1 tp-headline-lg">{{ post.title }}</h1>
                <p class="tp-lead">{{ post.excerpt }}</p>
                <div class="tp-byline">
                    <Avatar :image="photo(author.photo, 96, 96)" :alt="author.name" shape="circle" size="large" />
                    <span>
                        <b>{{ author.name }}</b>
                        <span class="tp-meta">
                            <span><Icon :icon="calendar" /> {{ post.date }}</span>
                            <span><Icon :icon="clock" /> {{ post.minutes }} min read</span>
                        </span>
                    </span>
                </div>
            </header>

            <figure class="tp-figure">
                <img :src="photo(post.photo, 1200, 675)" alt="" />
            </figure>

            <nav class="tp-card tp-toc" aria-label="In this post">
                <b>In this post</b>
                <ol>
                    <li v-for="item in contents" :key="item">{{ item }}</li>
                </ol>
            </nav>

            <div class="tp-prose">
                <h2 class="tp-h2">The paragraph comes first</h2>
                <p>
                    Before I draw anything, I write what the screen is for in a few sentences: who opens it, what they already know, and what they should be able to do when they
                    leave. It takes ten minutes, and it changes what I draw.
                </p>
                <h2 class="tp-h2">What it catches</h2>
                <p>
                    Words are bad at layout and very good at logic. A paragraph notices the missing empty state, the error nobody named, the button that means two things. A
                    wireframe happily draws all three without complaint.
                </p>
                <blockquote class="tp-quote">If I can’t describe the screen, I’m not ready to draw it.</blockquote>
                <h2 class="tp-h2">When to stop writing</h2>
                <p>When the paragraph stops changing. Then it goes into the ticket, and the drawing starts — usually faster than it would have.</p>
            </div>

            <div class="tp-row tp-row-between">
                <div class="tp-row">
                    <Tag v-for="tag in post.tags" :key="tag" :value="tag" severity="secondary" />
                </div>
                <div class="tp-row">
                    <Button
                        :icon="heart"
                        :label="String(likes)"
                        :variant="liked ? undefined : 'outlined'"
                        severity="secondary"
                        size="small"
                        :aria-pressed="liked"
                        aria-label="Like this post"
                        @click="toggleLike"
                    />
                    <Button :icon="share" label="Share" variant="outlined" severity="secondary" size="small" />
                </div>
            </div>

            <div class="tp-card tp-author-card">
                <Avatar :image="photo(author.photo, 160, 160)" :alt="author.name" shape="circle" size="xlarge" />
                <div>
                    <b>Written by {{ author.name }}</b>
                    <p class="tp-muted">{{ author.bio }}</p>
                    <Button label="More about me" variant="text" size="small" icon="arrowRight" icon-pos="right" @click="go('about')" />
                </div>
            </div>

            <nav class="tp-post-pager" aria-label="More posts">
                <button v-if="older" type="button" class="tp-card tp-link" @click="read(older)">
                    <small class="tp-muted">Previous</small>
                    <span class="tp-h3">{{ older.title }}</span>
                </button>
                <button v-if="newer" type="button" class="tp-card tp-link tp-post-next" @click="read(newer)">
                    <small class="tp-muted">Next</small>
                    <span class="tp-h3">{{ newer.title }}</span>
                </button>
            </nav>

            <Divider />

            <section class="tp-stack" aria-labelledby="post-comments">
                <h2 id="post-comments" class="tp-h2">{{ thread.length }} comments</h2>
                <form class="tp-stack" @submit.prevent="send">
                    <label :for="commentId" class="tp-label">Add a comment</label>
                    <Textarea :id="commentId" v-model="draft" :rows="3" auto-resize fluid placeholder="Be kind, be specific." />
                    <div><Button type="submit" label="Post comment" :disabled="!draft.trim()" /></div>
                </form>
                <Message severity="secondary" variant="simple">Comments are moderated and appear within a day.</Message>
                <ul class="tp-reviews">
                    <li v-for="comment in thread" :key="comment.name + comment.when">
                        <Avatar :label="comment.initials" shape="circle" />
                        <div>
                            <div class="tp-review-head">
                                <b>{{ comment.name }}</b>
                                <small class="tp-muted">{{ comment.when }}</small>
                            </div>
                            <p>{{ comment.text }}</p>
                        </div>
                    </li>
                </ul>
            </section>
        </article>
    </div>
</template>
