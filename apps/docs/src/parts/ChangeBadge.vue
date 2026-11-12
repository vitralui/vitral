<script setup lang="ts">
import { Tag } from '@vitral/vue';
import { computed } from 'vue';
import type { Change } from '../lib/changes';
import { t } from '../lib/i18n';

/**
 * "New" or "Updated", beside a component or one of its props. In a list it is
 * the word alone; `detail` adds the release, where there is room to say it.
 */
const props = defineProps<{ change?: Change; detail?: boolean }>();

const released = computed(() => props.change?.version !== 'next');
const full = computed(() => {
    if (!props.change) return '';
    const version = props.change.version;
    if (props.change.status === 'new') return released.value ? t('New in {version}', { version }) : t('New in the next release');
    return released.value ? t('Updated in {version}', { version }) : t('Updated in the next release');
});
const short = computed(() => (props.change?.status === 'new' ? t('New') : t('Updated')));
</script>

<template>
    <Tag
        v-if="change"
        class="change-badge"
        :value="detail && released ? full : short"
        :severity="change.status === 'new' ? 'success' : 'info'"
        :title="detail && released ? undefined : full"
    />
</template>
