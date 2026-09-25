<script setup lang="ts">
import { href } from '../lib/router';
import { iconList } from '@vitral/icons/registry';
import { Avatar, AvatarGroup, Button, Chart, Divider, Icon, InputText, Tag, ToggleSwitch, type ChartOptions } from '@vitral/vue';
import { computed, ref, useId } from 'vue';
import { entries, entryText, sections } from '../lib/catalog';
import { categoryName } from '../demo';
import { t, T } from '../lib/i18n';
import { primary, setPrimary, swatches } from '../lib/theme';
import CodeBlock from '../parts/CodeBlock.vue';
import TemplateThumb from '../parts/TemplateThumb.vue';
import { templates, templateText } from '../templates';

// The landing page, in bands: what it is, what it is made of, what is in it,
// how the look changes, and where to start. Everything in the hero is the
// library itself, running in whichever theme the reader picked.
const ids = { name: useId(), email: useId() };

const install = 'pnpm add @vitral/vue';
const copied = ref(false);
async function copyInstall() {
    try {
        await navigator.clipboard?.writeText(install);
        copied.value = true;
        setTimeout(() => (copied.value = false), 1600);
    } catch {
        // Clipboard access can be refused. The command is on screen anyway.
    }
}

// ---- the hero's showcase ------------------------------------------------------------

// The cards in the hero are the library itself, in whichever theme the reader
// picked.
const profile = ref({ name: 'Ada Lovelace', email: 'ada@example.com' });
const settings = ref({ updates: true, digest: false, mentions: true });
const alerts = ref(true);
const reviewers = ['A', 'G', 'K'];
const trend = computed(() => [{ name: t('Revenue'), data: [18, 22, 21, 26, 29, 27, 33, 36, 34, 41, 44, 48] }]);
// The card is the library in the reader's own theme, so the line follows the
// primary colour they picked rather than the first colour of the chart palette.
const sparkline: ChartOptions = {
    chart: { sparkline: { enabled: true }, height: 56 },
    colors: ['var(--vt-primary-color)'],
    stroke: { width: 2, curve: 'smooth' },
    tooltip: { x: { show: false } }
};

// ---- the bands ----------------------------------------------------------------------

const stats = computed(() => [
    { value: String(entries.length), label: t('components') },
    { value: String(iconList.length), label: t('icons') },
    { value: String(templates.length), label: t('templates') },
    { value: 'WAI-ARIA', label: t('on every component') }
]);

const features = computed(() => [
    { icon: 'sliders', title: t('Design tokens'), body: t('Primitive, semantic and component layers, compiled to CSS variables. Change the primary colour and everything follows.') },
    {
        icon: 'check',
        title: t('Built to the ARIA patterns'),
        body: t('Each component follows its WAI-ARIA pattern and ships with a spec that runs axe and drives the keyboard. Text contrast is measured across every preset and both schemes, so a theme cannot quietly become unreadable.')
    },
    { icon: 'pencil', title: t('Yours to override'), body: t('Reach any element with pass-through, retoken one instance, or go unstyled and bring your own CSS.') },
    { icon: 'star', title: t('A predictable API'), body: t('The same props, slots and events everywhere: size, variant, invalid, fluid. Learning one component covers most of the next.') },
    { icon: 'moon', title: t('Light and dark'), body: t('Both schemes come out of the same preset, and follow the operating system unless the reader says otherwise.') },
    { icon: 'image', title: t('Icons included'), body: t('An outline set drawn for the library, tree-shaken per icon. Any other icon library works too.') },
    { icon: 'calendar', title: t('Application pieces'), body: t('Charts, a scheduler and a task board sit next to the form controls, themed by the same tokens.') },
    { icon: 'listChecks', title: t('Forms and validation'), body: t('Field state, rules and async checks with no dependency, plus resolvers for Zod, Yup, Valibot and Superstruct.') },
    { icon: 'server', title: t('Server rendering'), body: t('Styles are collected during the render and go into the head, so nothing arrives unstyled. Nuxt takes one line in nuxt.config.') }
]);

const categories = computed(() =>
    sections.map((section) => ({
        key: section.category,
        name: categoryName(section.category),
        count: section.items.length,
        sample: section.items.slice(0, 4).map((item) => entryText(item).title),
        href: href(`/components/${section.items[0]!.id}`)
    }))
);

const themingSnippet = `import { definePreset, palette, Prism } from '@vitral/vue';

export const Brand = definePreset(Prism, {
    semantic: { primary: palette('#2563eb') },
    components: {
        button: { root: { borderRadius: '999px' } }
    }
});`;

const shownSwatches = swatches.slice(0, 6);
const shownTemplates = templates.slice(0, 6);
</script>

<template>
    <main class="home">
        <!-- ---------------------------------------------------------------- hero -->
        <section class="home-hero" aria-labelledby="home-title">
            <div class="home-wrap home-hero-grid">
                <div class="home-hero-copy">
                    <a class="home-pill" :href="href('/docs/introduction')"><b>v0.2</b> {{ t('Vue 3 and Nuxt today, React and Angular next') }} <Icon icon="arrowRight" /></a>
                    <h1 id="home-title">{{ t('Components that take the shape of your brand') }}</h1>
                    <p class="home-lead">
                        {{ t('Vitral is a Vue component library with a theme engine underneath: change a few tokens and every control follows.') }}
                    </p>
                    <div class="home-actions">
                        <Button as="a" :href="href('/docs/installation')" :label="t('Get started')" icon="arrowRight" icon-pos="right" size="large" />
                        <Button as="a" :href="href('/components')" :label="t('Browse components')" severity="secondary" variant="outlined" size="large" />
                    </div>
                    <div class="home-install">
                        <code><span aria-hidden="true">$</span> {{ install }}</code>
                        <Button
                            :icon="copied ? 'check' : 'copy'"
                            :aria-label="copied ? t('Copied') : t('Copy the install command')"
                            variant="text"
                            severity="secondary"
                            size="small"
                            @click="copyInstall"
                        />
                    </div>
                </div>

                <div class="home-showcase" :aria-label="t('Components in the current theme')" role="group">
                    <form class="home-card home-profile" @submit.prevent>
                        <div class="home-profile-head">
                            <div>
                                <h2 class="home-card-title">{{ t('Edit profile') }}</h2>
                                <p class="home-card-hint">{{ t('Update your account details.') }}</p>
                            </div>
                            <Avatar icon="user" shape="circle" />
                        </div>
                        <Divider />
                        <label :for="ids.name" class="home-label">{{ t('Name') }}</label>
                        <InputText :id="ids.name" v-model="profile.name" autocomplete="off" fluid />
                        <label :for="ids.email" class="home-label">{{ t('Email') }}</label>
                        <InputText :id="ids.email" v-model="profile.email" type="email" autocomplete="off" fluid class="home-profile-email" />
                        <div class="home-card-row home-profile-actions">
                            <Button :label="t('Save changes')" class="home-profile-save" />
                            <Button :label="t('Cancel')" severity="secondary" variant="outlined" />
                        </div>
                    </form>
                    <div class="home-card home-card-stat">
                        <div class="home-stat-head">
                            <span class="home-label">{{ t('Revenue') }}</span>
                            <Tag value="+12.4%" severity="success" rounded />
                        </div>
                        <strong class="home-stat-value">$48.2K</strong>
                        <Chart type="area" :series="trend" :options="sparkline" />
                    </div>
                    <div class="home-card home-card-team">
                        <div>
                            <span class="home-label">{{ t('Reviewers') }}</span>
                            <AvatarGroup :label="t('Reviewers')">
                                <Avatar v-for="(person, i) in reviewers" :key="person" :label="person" shape="circle" :style="{ background: `var(--vt-chart-${i + 1})`, color: '#fff' }" />
                                <Avatar label="+3" shape="circle" />
                            </AvatarGroup>
                        </div>
                        <ToggleSwitch v-model="alerts" :label="t('Alerts')" />
                    </div>
                </div>
            </div>
        </section>

        <!-- --------------------------------------------------------------- stats -->
        <section class="home-stats" :aria-label="t('At a glance')">
            <dl class="home-wrap home-stats-row">
                <div v-for="stat in stats" :key="stat.label">
                    <dt>{{ stat.label }}</dt>
                    <dd>{{ stat.value }}</dd>
                </div>
            </dl>
        </section>

        <!-- ------------------------------------------------------------ features -->
        <section class="home-band" aria-labelledby="home-features">
            <div class="home-wrap">
                <header class="home-head">
                    <h2 id="home-features">{{ t('Everything an interface needs, in one set') }}</h2>
                    <p>{{ t('Built to be re-dressed rather than restyled, and tested the way people actually use it: with a keyboard and a screen reader.') }}</p>
                </header>
                <ul class="home-features">
                    <li v-for="feature in features" :key="feature.title">
                        <span class="home-feature-icon"><Icon :icon="feature.icon" /></span>
                        <h3>{{ feature.title }}</h3>
                        <p>{{ feature.body }}</p>
                    </li>
                </ul>
            </div>
        </section>

        <!-- ---------------------------------------------------------- categories -->
        <section class="home-band home-band-muted" aria-labelledby="home-catalog">
            <div class="home-wrap">
                <header class="home-head home-head-row">
                    <div>
                        <h2 id="home-catalog">{{ t('{count} components, grouped the way you look for them', { count: entries.length }) }}</h2>
                        <p>{{ t('From a text box to a scheduler, each with live examples and its API.') }}</p>
                    </div>
                    <Button as="a" :href="href('/components')" :label="t('Browse components')" variant="text" icon="arrowRight" icon-pos="right" />
                </header>
                <ul class="home-categories">
                    <li v-for="category in categories" :key="category.key">
                        <a :href="category.href" class="home-category">
                            <span class="home-category-head">
                                <strong>{{ category.name }}</strong>
                                <span class="home-count">{{ category.count }}</span>
                            </span>
                            <span class="home-category-sample">{{ category.sample.join(' · ') }}</span>
                        </a>
                    </li>
                </ul>
            </div>
        </section>

        <!-- ------------------------------------------------------------- theming -->
        <section class="home-band" aria-labelledby="home-theming">
            <div class="home-wrap home-split">
                <div>
                    <h2 id="home-theming">{{ t('Your brand in a few lines') }}</h2>
                    <p class="home-muted">
                        {{ t('A preset is a tree of tokens over another preset. Pick a colour below and the whole site, this page included, changes with it.') }}
                    </p>
                    <div class="home-swatches" role="group" :aria-label="t('Primary colour')">
                        <button
                            v-for="swatch in shownSwatches"
                            :key="swatch.name"
                            type="button"
                            class="home-swatch"
                            :style="{ '--swatch': swatch.color }"
                            :aria-label="t(swatch.name)"
                            :aria-pressed="primary === swatch.value || (!primary && swatch.name === 'Blue') ? 'true' : 'false'"
                            @click="setPrimary(swatch.value)"
                        />
                    </div>
                    <CodeBlock :code="themingSnippet" label="theme.ts" lang="ts" />
                    <Button as="a" :href="href('/docs/theming')" :label="t('Read the theming guide')" variant="outlined" severity="secondary" icon="arrowRight" icon-pos="right" />
                </div>
                <div class="home-card home-settings">
                    <div>
                        <h3 class="home-card-title">{{ t('Notifications') }}</h3>
                        <p class="home-card-hint">{{ t('Choose what reaches your inbox.') }}</p>
                    </div>
                    <div class="home-settings-list">
                        <ToggleSwitch v-model="settings.updates" :label="t('Product updates')" />
                        <ToggleSwitch v-model="settings.digest" :label="t('Weekly digest')" />
                        <ToggleSwitch v-model="settings.mentions" :label="t('Mentions')" />
                    </div>
                    <div class="home-card-row">
                        <Tag :value="t('3 channels')" severity="info" />
                        <Tag :value="t('Synced')" severity="success" icon="check" />
                    </div>
                    <Button :label="t('Save preferences')" class="home-settings-save" fluid />
                </div>
            </div>
        </section>

        <!-- ----------------------------------------------------------- templates -->
        <section class="home-band home-band-muted" aria-labelledby="home-templates">
            <div class="home-wrap">
                <header class="home-head home-head-row">
                    <div>
                        <h2 id="home-templates">{{ t('Templates to start from') }}</h2>
                        <p>{{ t('Whole applications made of these components: responsive, themed, and a click away from a live demo.') }}</p>
                    </div>
                    <Button as="a" :href="href('/templates')" :label="t('All {count} templates', { count: templates.length })" variant="text" icon="arrowRight" icon-pos="right" />
                </header>
                <ul class="home-templates">
                    <li v-for="entry in shownTemplates" :key="entry.id">
                        <a :href="href(`/templates/${entry.id}`)" class="home-template">
                            <TemplateThumb :template="entry" />
                            <span class="home-template-body">
                                <strong>{{ entry.name }}</strong>
                                <span>{{ templateText(entry).category }} · {{ t('{count} screens', { count: entry.screens.length }) }}</span>
                            </span>
                        </a>
                    </li>
                </ul>
            </div>
        </section>

        <!-- ----------------------------------------------------------------- end -->
        <section class="home-band" aria-labelledby="home-start">
            <div class="home-wrap">
                <div class="home-end">
                    <div>
                        <h2 id="home-start">{{ t('Start with one package') }}</h2>
                        <T k="homePage.start">One plugin call, or one line in <code>nuxt.config</code>, and a theme that answers to <code>useTheme()</code>.</T>
                    </div>
                    <div class="home-actions">
                        <Button as="a" :href="href('/docs/introduction')" :label="t('Read the docs')" />
                        <Button as="a" :href="href('/icons')" :label="t('Browse icons')" severity="secondary" variant="outlined" />
                    </div>
                </div>
            </div>
        </section>
    </main>
</template>
