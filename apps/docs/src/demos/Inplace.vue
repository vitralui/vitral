<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Inplace',
    category: 'Misc',
    description:
        'A display that becomes its editor when activated. The display is a button (Enter and Space activate it); activation moves focus into the editor, and Escape or the close button go back to the display.'
};
</script>

<script setup lang="ts">
import { Inplace, InputText } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const name = ref('Ada Lovelace');
</script>

<template>
    <DemoSection title="Editable text">
        <Inplace closable>
            <template #display>{{ name || 'Click to add a name' }}</template>
            <template #content>
                <InputText v-model="name" aria-label="Name" />
            </template>
        </Inplace>
    </DemoSection>
    <DemoSection title="Lazy content">
        <Inplace closable>
            <template #display>View photo</template>
            <template #content="{ closeCallback }">
                <img src="https://picsum.photos/id/1015/320/200" alt="A river running through a valley" style="display: block; border-radius: 6px; cursor: zoom-out" @click="closeCallback()" />
            </template>
        </Inplace>
    </DemoSection>
    <DemoSection title="Disabled">
        <Inplace disabled>
            <template #display>Read-only value</template>
        </Inplace>
    </DemoSection>
</template>
