<script setup lang="ts">
import { computed, inject } from 'vue';
import { scheduleKey, type Occurrence } from './context';

// One event: a button named by its title and full time. It carries its colour
// as a custom property, so the look stays in the stylesheet, and an end edge
// to drag when it can be resized.

defineOptions({ name: 'VtScheduleEvent' });

const props = defineProps<{
    occ: Occurrence;
    variant: 'timed' | 'span' | 'list' | 'lane';
    continuesBefore?: boolean;
    continuesAfter?: boolean;
    /** Which edge resizes it, if any. */
    resize?: 'bottom' | 'end' | null;
}>();

const ctx = inject(scheduleKey)!;
const editable = computed(() => ctx.isEditable(props.occ));
const time = computed(() => ctx.timeText(props.occ));
const slotProps = computed(() => ({
    event: props.occ.event,
    occurrence: { event: props.occ.event, start: props.occ.start, end: props.occ.end, allDay: props.occ.allDay, resourceId: props.occ.resourceId, recurring: props.occ.recurring, key: props.occ.key },
    timeText: time.value,
    view: ctx.view.value
}));
const Content = () => ctx.slots.event!(slotProps.value);
const state = computed(() => ({
    variant: props.variant,
    editable: editable.value,
    dragging: ctx.isDragging(props.occ),
    allDay: props.occ.allDay,
    continuesBefore: props.continuesBefore,
    continuesAfter: props.continuesAfter
}));
</script>

<template>
    <button
        type="button"
        :data-vt-event="occ.key"
        :aria-label="ctx.labelOf(occ)"
        :aria-describedby="editable && variant !== 'list' ? ctx.eventInstructionsId : undefined"
        v-bind="ctx.part('event', state)"
        :style="{ '--vt-schedule-event-accent': ctx.colorOf(occ) }"
        @click="ctx.onEventClick($event, occ)"
        @keydown="ctx.onEventKeydown($event, occ)"
        @pointerdown="variant !== 'list' && ctx.onEventPointerdown($event, occ, 'move')"
    >
        <Content v-if="ctx.slots.event" />
        <template v-else>
            <span v-if="time && variant !== 'timed'" v-bind="ctx.part('eventTime')">{{ variant === 'list' ? time : ctx.formatTime(occ.start) }}</span>
            <span v-bind="ctx.part('eventTitle')">{{ ctx.titleOf(occ) }}</span>
            <span v-if="time && variant === 'timed'" v-bind="ctx.part('eventTime')">{{ time }}</span>
        </template>
        <span v-if="resize && editable" aria-hidden="true" v-bind="ctx.part('resizer', { edge: resize })" @pointerdown="ctx.onEventPointerdown($event, occ, 'resize')" />
    </button>
</template>
