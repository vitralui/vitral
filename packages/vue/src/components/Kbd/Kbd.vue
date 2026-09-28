<script setup lang="ts">
import { isMacPlatform, keyCaps } from '@vitral/core';
import { kbdStyle } from '@vitral/styles';
import { computed, onMounted, ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { KbdProps, KbdSlots } from './types';

defineOptions({ name: 'VtKbd' });

const props = withDefaults(defineProps<KbdProps>(), { unstyled: undefined, platform: 'auto' });
defineSlots<KbdSlots>();

const { part } = useComponent(kbdStyle, props);

// The server cannot know the reader's platform, so the first render names the
// keys the way most keyboards do and a Mac swaps them in once mounted —
// the same markup on both sides, then the right one.
const detectedMac = ref(false);
onMounted(() => (detectedMac.value = isMacPlatform()));
const mac = computed(() => (props.platform === 'auto' ? detectedMac.value : props.platform === 'mac'));

const caps = computed(() => (props.keys === undefined ? [] : keyCaps(props.keys, mac.value)));
// Each key is a <kbd> nested in the outer one: the HTML way to say "these keys together".
const separator = computed(() => props.separator ?? (mac.value ? '' : '+'));
</script>

<template>
    <kbd v-bind="part('root', { size })">
        <kbd v-if="$slots.default" v-bind="part('key')"><slot /></kbd>
        <template v-for="(cap, i) in caps" v-else :key="i">
            <span v-if="i > 0 && separator" aria-hidden="true" v-bind="part('separator')">{{ separator }}</span>
            <kbd v-bind="part('key')">
                <template v-if="cap.spoken">
                    <span aria-hidden="true">{{ cap.label }}</span>
                    <span class="vt-sr-only">{{ cap.spoken }}</span>
                </template>
                <template v-else>{{ cap.label }}</template>
            </kbd>
        </template>
    </kbd>
</template>
