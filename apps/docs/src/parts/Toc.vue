<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

/** "On this page": the headings a page declares, with the one in view marked. */
const props = defineProps<{ items: { id: string; label: string }[] }>();

const current = ref(props.items[0]?.id ?? '');
let observer: IntersectionObserver | null = null;

function observe() {
    observer?.disconnect();
    // No observer, in a test environment or a renderer without one, leaves the
    // list as plain links, which is all it has to be.
    if (!props.items.length || typeof IntersectionObserver === 'undefined') return;
    observer = new IntersectionObserver(
        (records) => {
            const visible = records.filter((record) => record.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            if (visible[0]) current.value = visible[0].target.id;
        },
        { rootMargin: '-72px 0px -70% 0px' }
    );
    for (const item of props.items) {
        const element = document.getElementById(item.id);
        if (element) observer.observe(element);
    }
}

onMounted(observe);

watch(
    () => props.items,
    () => {
        /*
         * A new page starts at its first heading. The observer only speaks when
         * something crosses the viewport, so on its own the list arrives with
         * nothing marked — the headings are read off the page after mount, and
         * by then the reader is already at the top and nothing is going to
         * cross anything. Worse, after a move it went on marking the heading of
         * the page before, an id that is not even in the new list.
         */
        current.value = props.items[0]?.id ?? '';
        requestAnimationFrame(observe);
    },
    { deep: true }
);

onBeforeUnmount(() => observer?.disconnect());

function go(event: MouseEvent, id: string) {
    event.preventDefault();
    current.value = id;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
    <aside v-if="items.length" class="toc">
        <h2>On this page</h2>
        <nav aria-label="On this page">
            <a v-for="item in items" :key="item.id" :href="`#${item.id}`" :class="{ 'is-active': current === item.id }" @click="go($event, item.id)">{{ item.label }}</a>
        </nav>
    </aside>
</template>
