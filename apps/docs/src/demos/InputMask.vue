<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputMask',
    category: 'Form',
    description:
        'A text box that types into a pattern: `9` takes a digit, `a` a letter, `*` either, and what follows `?` is optional. Literals are typed for the reader, a paste is spread across the slots, and an unfinished value is cleared on blur unless `auto-clear` is off.'
};
</script>

<script setup lang="ts">
import { InputMask } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const phone = ref('');
const cpf = ref('');
const date = ref('');
const serial = ref('');
const done = ref(false);
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <label for="mask-phone">Phone</label>
            <InputMask id="mask-phone" v-model="phone" mask="(999) 999-9999" placeholder="(999) 999-9999" autocomplete="tel-national" @complete="done = true" />
            <span class="demo-hint">Value: {{ phone || '—' }} {{ done ? '· complete' : '' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Unmasked value">
        <div class="demo-field">
            <label for="mask-cpf">CPF</label>
            <InputMask id="mask-cpf" v-model="cpf" mask="999.999.999-99" unmask />
            <span class="demo-hint">v-model: {{ cpf || '—' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Slot characters and optional parts">
        <div class="demo-field">
            <label for="mask-date">Date</label>
            <InputMask id="mask-date" v-model="date" mask="99/99/9999" slot-char="mm/dd/yyyy" />
        </div>
        <div class="demo-field">
            <label for="mask-serial">Serial (last two optional)</label>
            <InputMask id="mask-serial" v-model="serial" mask="aa-9999?-**" :auto-clear="false" />
        </div>
    </DemoSection>
    <DemoSection title="Sizes and states">
        <InputMask mask="999" size="small" aria-label="Small" />
        <InputMask mask="999" variant="filled" aria-label="Filled" />
        <InputMask mask="999" invalid aria-label="Invalid" />
        <InputMask mask="999" disabled model-value="123" aria-label="Disabled" />
    </DemoSection>
</template>
