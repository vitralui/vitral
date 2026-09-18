<script setup lang="ts">
import { bookOpen, clock, users } from '@vitral/icons';
import { Avatar, Button, DataView, Icon, InputText, ProgressBar, Rating, SelectButton, Tag } from '@vitral/vue';
import { computed, ref } from 'vue';
import { useTemplate } from '../kit/context';
import { compact, photo } from '../kit/format';
import { courseOf, courses, initials, school, subjects, type Course } from './data';

const { go } = useTemplate();
const subject = ref('All');
const query = ref('');

const current = computed(() => courseOf(school.courseId));
const inProgress = courses.filter((course) => course.progress > 0 && course.progress < 100);
const catalogue = computed(() =>
    courses.filter((course) => (subject.value === 'All' || course.subject === subject.value) && course.title.toLowerCase().includes(query.value.trim().toLowerCase()))
);

function open(course: Course) {
    school.courseId = course.id;
    go('lesson');
}
</script>

<template>
    <div class="tp-head">
        <div>
            <h1 class="tp-h1">Welcome back, Sofia</h1>
            <p class="tp-muted">You have studied 4 days in a row. Keep it going.</p>
        </div>
    </div>

    <section class="tp-card tp-continue" aria-labelledby="lms-continue">
        <img :src="photo(current.photo, 640, 400)" alt="" />
        <div class="tp-stack">
            <span class="tp-eyebrow">Continue learning</span>
            <h2 id="lms-continue" class="tp-h2">{{ current.title }}</h2>
            <p class="tp-muted">Next: Designing every state of a field · 14 min</p>
            <div class="tp-progress-row">
                <div>
                    <span>{{ current.progress }}% complete</span
                    ><span class="tp-muted">{{ Math.round((current.lessons * current.progress) / 100) }} of {{ current.lessons }} lessons</span>
                </div>
                <ProgressBar :value="current.progress" :show-value="false" :aria-label="`${current.title} progress`" />
            </div>
            <div><Button label="Resume lesson" icon="play" @click="open(current)" /></div>
        </div>
    </section>

    <section aria-labelledby="lms-progress">
        <h2 id="lms-progress" class="tp-h2">In progress</h2>
        <ul class="tp-grid tp-grid-courses-small">
            <li v-for="course in inProgress" :key="course.id" class="tp-card tp-stack tp-mini-course">
                <div class="tp-person">
                    <Avatar :image="photo(course.photo, 96, 96)" :alt="''" shape="square" />
                    <span>
                        <b>{{ course.title }}</b>
                        <small>{{ course.teacher }}</small>
                    </span>
                </div>
                <ProgressBar :value="course.progress" :aria-label="`${course.title} progress`" />
            </li>
        </ul>
    </section>

    <section aria-labelledby="lms-catalogue">
        <div class="tp-head">
            <h2 id="lms-catalogue" class="tp-h2">Explore courses</h2>
            <InputText v-model="query" placeholder="Search courses" aria-label="Search courses" size="small" clearable class="tp-table-search">
                <template #prefix><Icon icon="search" /></template>
            </InputText>
        </div>
        <div class="tp-scroll tp-subjects">
            <SelectButton v-model="subject" :options="subjects" :allow-empty="false" label="Subject" size="small" />
        </div>
        <DataView :value="catalogue" layout="grid" data-key="id" empty-message="No course matches that search.">
            <template #grid="{ items }">
                <article v-for="course in items as Course[]" :key="course.id" class="tp-listing tp-story">
                    <div class="tp-listing-media">
                        <img :src="photo(course.photo, 600, 400)" alt="" />
                        <Tag v-if="course.progress === 100" value="Completed" severity="success" />
                    </div>
                    <div class="tp-listing-body">
                        <span class="tp-row tp-row-between">
                            <span class="tp-eyebrow">{{ course.subject }}</span>
                            <Tag :value="course.level" severity="secondary" />
                        </span>
                        <h3 class="tp-h3">
                            <button type="button" class="tp-stretch" @click="open(course)">{{ course.title }}</button>
                        </h3>
                        <span class="tp-person tp-small">
                            <Avatar :label="initials(course.teacher)" shape="circle" />
                            <span>{{ course.teacher }}</span>
                        </span>
                        <div class="tp-rating">
                            <Rating :model-value="Math.round(course.rating)" readonly :aria-label="`Rated ${course.rating} out of 5`" />
                            <small>{{ course.rating }}</small>
                        </div>
                        <ul class="tp-facts">
                            <li><Icon :icon="bookOpen" /> {{ course.lessons }} lessons</li>
                            <li><Icon :icon="clock" /> {{ course.hours }} h</li>
                            <li><Icon :icon="users" /> {{ compact.format(course.students) }}</li>
                        </ul>
                    </div>
                </article>
            </template>
        </DataView>
    </section>
</template>
