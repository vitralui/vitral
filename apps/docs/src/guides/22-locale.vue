<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Locale',
    section: 'Customisation',
    description: 'Every string a component says comes from one object, and numbers and dates are parsed with it too.'
};
</script>

<script setup lang="ts">
import { href } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';
import { localeId } from '../lib/theme';
import { Button } from '@vitral/vue';

const setup = `import { Vitral, ptBR } from '@vitral/vue';

createApp(App).use(Vitral, { locale: ptBR });`;

const runtime = `const { locale, setLocale } = useLocale();

setLocale(ptBR);           // every component follows, reactively`;

const custom = `import { en } from '@vitral/vue';

const frFR = {
    ...en,
    firstDayOfWeek: 1,
    dayNames: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
    clear: 'Effacer',
    emptyMessage: 'Aucun résultat'
};`;
</script>

<template>
    <p>
        A component never holds a string. Everything it says (“Clear”, “No results”, the month names, the page report, the name of the close button) comes from the locale in
        the configuration, and the configuration is reactive, so changing it changes the page.
    </p>

    <h2>Setting one</h2>
    <CodeBlock :code="setup" label="main.ts" lang="ts" />
    <p>
        <code>en</code> and <code>ptBR</code> ship. <Button label="Try pt-BR here" size="small" severity="secondary" @click="localeId = 'pt-BR'" />
        <Button label="Back to English" size="small" variant="text" severity="secondary" @click="localeId = 'en'" /> then open a <a :href="href('/components/datepicker')">DatePicker</a>
        or a <a :href="href('/components/datatable')">DataTable</a>.
    </p>

    <h2>At runtime</h2>
    <CodeBlock :code="runtime" label="Bar.vue" lang="ts" />

    <h2>A locale of your own</h2>
    <p>A locale is a plain object, so a third one is a literal: spread <code>en</code> and write the differences.</p>
    <CodeBlock :code="custom" label="fr.ts" lang="ts" />

    <h2>More than strings</h2>
    <ul>
        <li><strong>Numbers</strong> are formatted <em>and parsed</em> by locale: an <code>InputNumber</code> in pt-BR reads “1.234,56” as 1234.56.</li>
        <li><strong>Dates</strong> use the locale's day and month names, its first day of the week and its date format, in both directions.</li>
        <li><strong>Filtering</strong> ignores accents and case, so “São” finds “sao” and “Sao” finds “São”.</li>
        <li><strong>Messages</strong> with placeholders go through <code>formatMessage</code>, as in <code>'{first} to {last} of {total}'</code>.</li>
    </ul>
</template>
