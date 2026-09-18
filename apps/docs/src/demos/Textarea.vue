<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Textarea',
    category: 'Form',
    description:
        'A multi-line text box on the same field chrome as InputText. Every attribute lands on the native textarea, so a <label for>, maxlength and aria-describedby just work. `autoResize` grows it with its content.'
};
</script>

<script setup lang="ts">
import { Textarea } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const notes = ref('');
const letter = ref('Dear reader,\n\nThis box grows as you type, and shrinks again when you delete.');
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <label for="ta-notes">Notes</label>
            <Textarea id="ta-notes" v-model="notes" placeholder="Write something…" aria-describedby="ta-notes-hint" maxlength="280" />
            <span id="ta-notes-hint" class="demo-hint">{{ notes.length }} / 280</span>
        </div>
    </DemoSection>
    <DemoSection title="Auto resize" description="No scrollbar and no handle: the height follows the text.">
        <div class="demo-field" style="width: 24rem">
            <label for="ta-letter">Letter</label>
            <Textarea id="ta-letter" v-model="letter" auto-resize :rows="2" fluid />
        </div>
    </DemoSection>
    <DemoSection title="Sizes, variants and states">
        <Textarea placeholder="Small" size="small" :rows="2" aria-label="Small" />
        <Textarea placeholder="Filled" variant="filled" :rows="2" aria-label="Filled" />
        <Textarea placeholder="Invalid" invalid :rows="2" aria-label="Invalid" />
        <Textarea placeholder="Disabled" disabled :rows="2" aria-label="Disabled" />
        <Textarea model-value="Read only" readonly :rows="2" aria-label="Read only" />
    </DemoSection>
    <DemoSection title="Fluid" class="stack">
        <Textarea placeholder="Fills its container" fluid aria-label="Fluid" />
    </DemoSection>
</template>
