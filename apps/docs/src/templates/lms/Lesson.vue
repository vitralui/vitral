<script setup lang="ts">
import { checkCheck, download, fileText, messageSquare } from '@vitral/icons';
import {
    Accordion,
    AccordionContent,
    AccordionHeader,
    AccordionPanel,
    Avatar,
    Breadcrumb,
    Button,
    Icon,
    Knob,
    Message,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Textarea
} from '@vitral/vue';
import { computed, ref, useId } from 'vue';
import { useTemplate } from '../kit/context';
import { photo } from '../kit/format';
import { courseOf, initials, school, syllabus } from './data';

const { go } = useTemplate();
const notesId = useId();

const course = computed(() => courseOf(school.courseId));
const modules = ref(syllabus.map((module) => ({ ...module, lessons: module.lessons.map((lesson) => ({ ...lesson })) })));
const all = computed(() => modules.value.flatMap((module) => module.lessons));
const lesson = computed(() => all.value.find((entry) => entry.key === school.lessonKey) ?? all.value[0]!);
const done = computed(() => Math.round((all.value.filter((entry) => entry.done).length / all.value.length) * 100));
const openModules = ref<string[]>(['m2']);

const playing = ref(false);
const tab = ref('overview');
const notes = ref('States: default, hover, focus, filled, invalid, disabled. Ask about read-only.');

const trail = computed(() => [{ label: 'Courses', command: () => go('courses') }, { label: course.value.title }]);

function complete() {
    lesson.value.done = true;
    const index = all.value.indexOf(lesson.value);
    const next = all.value[index + 1];
    if (next) {
        school.lessonKey = next.key;
        openModules.value = [modules.value.find((module) => module.lessons.includes(next))!.key];
    }
    playing.value = false;
}

const resources = [
    { name: 'Field states checklist.pdf', size: '240 KB' },
    { name: 'Exercise files.zip', size: '3.1 MB' }
];

const posts = [
    { name: 'Kwame Asante', text: 'Is “read-only” a state of the field, or a different component?', replies: 4 },
    { name: 'Lucía Romero', text: 'The bit about placeholder text as a label finally clicked for me.', replies: 1 }
];
</script>

<template>
    <Breadcrumb :model="trail" aria-label="Course" />

    <div class="tp-split tp-split-lesson">
        <div class="tp-stack">
            <div class="tp-video">
                <img :src="photo(course.photo, 1280, 720)" alt="" />
                <div class="tp-video-overlay" :class="{ playing }">
                    <Button :icon="playing ? 'pause' : 'play'" rounded size="large" :aria-label="playing ? 'Pause lesson' : 'Play lesson'" @click="playing = !playing" />
                </div>
                <span class="tp-video-time">{{ playing ? '03:12' : '00:00' }} / {{ lesson.minutes }}:00</span>
            </div>

            <div class="tp-head">
                <div>
                    <span class="tp-eyebrow">Lesson {{ all.indexOf(lesson) + 1 }} of {{ all.length }}</span>
                    <h1 class="tp-h1">{{ lesson.title }}</h1>
                </div>
                <Button
                    :label="lesson.done ? 'Completed' : 'Mark complete'"
                    :icon="lesson.done ? 'check' : checkCheck"
                    :variant="lesson.done ? 'outlined' : undefined"
                    :disabled="lesson.done"
                    @click="complete"
                />
            </div>

            <Tabs v-model:value="tab" class="tp-tabs">
                <TabList aria-label="Lesson">
                    <Tab value="overview">Overview</Tab>
                    <Tab value="notes">My notes</Tab>
                    <Tab value="discussion">Discussion</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel value="overview">
                        <div class="tp-stack">
                            <p class="tp-prose">
                                A field is never in one state. In this lesson we list every state a text field can be in, design each one, and check that they read as a family. You
                                will leave with a checklist you can use on any form.
                            </p>
                            <div class="tp-person">
                                <Avatar :label="initials(course.teacher)" shape="circle" size="large" />
                                <span>
                                    <b>{{ course.teacher }}</b>
                                    <small>Instructor · {{ course.subject }}</small>
                                </span>
                            </div>
                            <ul class="tp-rule-list">
                                <li v-for="file in resources" :key="file.name" class="tp-row tp-row-between">
                                    <span class="tp-row"
                                        ><Icon :icon="fileText" /> {{ file.name }} <small class="tp-muted">{{ file.size }}</small></span
                                    >
                                    <Button :icon="download" variant="text" severity="secondary" size="small" :aria-label="`Download ${file.name}`" />
                                </li>
                            </ul>
                        </div>
                    </TabPanel>
                    <TabPanel value="notes">
                        <div class="tp-stack">
                            <label :for="notesId" class="tp-label">Notes for this lesson</label>
                            <Textarea :id="notesId" v-model="notes" :rows="5" auto-resize fluid />
                            <Message severity="secondary" variant="simple">Saved to your notebook automatically.</Message>
                        </div>
                    </TabPanel>
                    <TabPanel value="discussion">
                        <ul class="tp-reviews">
                            <li v-for="post in posts" :key="post.name">
                                <Avatar :label="initials(post.name)" shape="circle" />
                                <div>
                                    <b>{{ post.name }}</b>
                                    <p>{{ post.text }}</p>
                                    <small class="tp-muted tp-row"><Icon :icon="messageSquare" /> {{ post.replies }} replies</small>
                                </div>
                            </li>
                        </ul>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>

        <aside class="tp-stack tp-sticky" aria-label="Course contents">
            <section class="tp-card tp-course-progress" aria-labelledby="lesson-progress">
                <Knob :model-value="done" readonly :size="88" value-template="{value}%" aria-label="Course completion" />
                <div>
                    <h2 id="lesson-progress" class="tp-h3">{{ course.title }}</h2>
                    <p class="tp-muted tp-small">{{ all.filter((entry) => entry.done).length }} of {{ all.length }} lessons done</p>
                </div>
            </section>
            <Accordion v-model:value="openModules" multiple :heading-level="3" class="tp-syllabus">
                <AccordionPanel v-for="module in modules" :key="module.key" :value="module.key">
                    <AccordionHeader>{{ module.title }}</AccordionHeader>
                    <AccordionContent>
                        <ul class="tp-lessons">
                            <li v-for="item in module.lessons" :key="item.key">
                                <button type="button" :aria-current="item.key === lesson.key ? 'step' : undefined" @click="school.lessonKey = item.key">
                                    <Icon :icon="item.done ? 'success' : item.key === lesson.key ? 'play' : 'circle'" :class="{ 'tp-done': item.done }" />
                                    <span>{{ item.title }}</span>
                                    <small>{{ item.minutes }} min</small>
                                </button>
                            </li>
                        </ul>
                    </AccordionContent>
                </AccordionPanel>
            </Accordion>
        </aside>
    </div>
</template>
