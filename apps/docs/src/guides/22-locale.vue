<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Locale',
    section: 'Customisation',
    description: 'Every string a component says comes from one object, and numbers and dates are parsed with it too.'
};
</script>

<script setup lang="ts">
import { T, t } from '../lib/i18n';
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
    <T k="intro">
        A component never holds a string. Everything it says (“Clear”, “No results”, the month names, the page report, the name of the close button) comes from the locale in
        the configuration, and the configuration is reactive, so changing it changes the page.
    </T>

    <T k="setting.title" as="h2">Setting one</T>
    <CodeBlock :code="setup" label="main.ts" lang="ts" />
    <p>
        <T k="setting.ship" as="span"><code>en</code> and <code>ptBR</code> ship.</T> <Button :label="t('Try pt-BR here')" size="small" severity="secondary" @click="localeId = 'pt-BR'" />
        <Button :label="t('Back to English')" size="small" variant="text" severity="secondary" @click="localeId = 'en'" /> <T k="setting.then" as="span">then open a <a :href="href('/components/datepicker')">DatePicker</a> or a <a :href="href('/components/datagrid')">DataGrid</a>.</T>
    </p>

    <T k="runtime" as="h2">At runtime</T>
    <CodeBlock :code="runtime" label="Bar.vue" lang="ts" />

    <T k="own.title" as="h2">A locale of your own</T>
    <T k="own.text">A locale is a plain object, so a third one is a literal: spread <code>en</code> and write the differences.</T>
    <CodeBlock :code="custom" label="fr.ts" lang="ts" />

    <T k="more.title" as="h2">More than strings</T>
    <ul>
        <T k="more.numbers" as="li"><strong>Numbers</strong> are formatted <em>and parsed</em> by locale: an <code>InputNumber</code> in pt-BR reads “1.234,56” as 1234.56.</T>
        <T k="more.dates" as="li"><strong>Dates</strong> use the locale's day and month names, its first day of the week and its date format, in both directions.</T>
        <T k="more.filtering" as="li"><strong>Filtering</strong> ignores accents and case, so “São” finds “sao” and “Sao” finds “São”.</T>
        <T k="more.messages" as="li"><strong>Messages</strong> with placeholders go through <code>formatMessage</code>, as in <code>'{first} to {last} of {total}'</code>.</T>
    </ul>
</template>
