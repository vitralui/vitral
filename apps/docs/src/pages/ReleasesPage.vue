<script setup lang="ts">
import { releases } from 'virtual:vitral-releases';
import type { Release, ReleaseEntry } from '../../../../scripts/changes';
import { entryOf, entryText } from '../lib/catalog';
import { lang, languages, t } from '../lib/i18n';
import { href } from '../lib/router';
import ChangeBadge from '../parts/ChangeBadge.vue';

/**
 * Every release, newest first, with what it added and changed. Nothing on the
 * page is written for it: the releases are the tags, a release's line is what
 * its commit says it brings, and the components and members under it are what
 * differs between its `types.ts` and the release before's (see
 * `scripts/changes.ts`). The line is the commit's own, so it is in English in
 * every language.
 */
const kinds = [
    ['props', 'Props'],
    ['emits', 'Emits'],
    ['slots', 'Slots']
] as const;

/** `2026-11-11`, as the page's language writes a date. Built from its parts, so the day is not moved by a time zone. */
function dateOf(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Intl.DateTimeFormat(languages[lang.value].tag, { dateStyle: 'long' }).format(new Date(year!, month! - 1, day!));
}

const titleOf = (release: Release) => (release.version === 'next' ? t('Next release') : release.version);
const added = (release: Release) => release.components.filter((entry) => entry.status === 'new');
const changed = (release: Release) => release.components.filter((entry) => entry.status === 'changed');

/** A component that has a page today: one a later release renamed or removed is named without a link. */
function pageOf(entry: ReleaseEntry) {
    const page = entryOf(entry.name.toLowerCase());
    return page ? { to: `/components/${page.id}`, title: entryText(page).title } : undefined;
}

const members = (entry: ReleaseEntry) =>
    kinds.flatMap(([kind, label]) => Object.entries(entry[kind] ?? {}).map(([name, status]) => ({ key: `${kind}.${name}`, label, name, status })));
</script>

<template>
    <main class="releases-page">
        <div class="doc-head">
            <span class="eyebrow">{{ t('Releases') }}</span>
            <h1>{{ t("What's new") }}</h1>
            <p>{{ t('Every release, newest first: the components it added, the ones it changed, and the props, events and slots that came with them. Read from the release tags and the components\' own types, not written by hand.') }}</p>
        </div>

        <p v-if="!releases.length" class="components-empty">{{ t('This build has no release history to read.') }}</p>

        <section v-for="release in releases" :id="`v${release.version}`" :key="release.version" class="release" :aria-labelledby="`release-${release.version}`">
            <header>
                <h2 :id="`release-${release.version}`">{{ titleOf(release) }}</h2>
                <time v-if="release.date" :datetime="release.date">{{ dateOf(release.date) }}</time>
            </header>
            <p v-if="release.summary" class="release-summary" lang="en">{{ release.summary }}</p>

            <template v-if="added(release).length">
                <h3>{{ t('New components') }}</h3>
                <ul class="release-new">
                    <li v-for="entry in added(release)" :key="entry.name">
                        <a v-if="pageOf(entry)" :href="href(pageOf(entry)!.to)">{{ pageOf(entry)!.title }}</a>
                        <span v-else>{{ entry.name }}</span>
                    </li>
                </ul>
            </template>

            <template v-if="changed(release).length">
                <h3>{{ t('Updated components') }}</h3>
                <ul class="release-changed">
                    <li v-for="entry in changed(release)" :key="entry.name">
                        <a v-if="pageOf(entry)" :href="href(pageOf(entry)!.to)">{{ pageOf(entry)!.title }}</a>
                        <span v-else>{{ entry.name }}</span>
                        <span v-for="member in members(entry)" :key="member.key" class="release-member">
                            <small>{{ member.label }}</small>
                            <code>{{ member.name }}</code>
                            <ChangeBadge :change="{ status: member.status, version: release.version }" />
                        </span>
                    </li>
                </ul>
            </template>

            <p v-if="!release.components.length && !release.summary" class="release-quiet">{{ t('Nothing changed in the components themselves.') }}</p>
        </section>
    </main>
</template>
