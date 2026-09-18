<script setup lang="ts">
import { href } from '../lib/router';
import { iconList } from '@vitral/icons/registry';
import { Avatar, AvatarGroup, Button, Chart, Divider, Icon, InputText, Tag, ToggleSwitch, type ChartOptions } from '@vitral/vue';
import { computed, ref, useId } from 'vue';
import { entries, sections } from '../lib/catalog';
import { primary, setPrimary, swatches } from '../lib/theme';
import CodeBlock from '../parts/CodeBlock.vue';
import TemplateThumb from '../parts/TemplateThumb.vue';
import { templates } from '../templates';

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
const trend = [{ name: 'Revenue', data: [18, 22, 21, 26, 29, 27, 33, 36, 34, 41, 44, 48] }];
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
    { value: String(entries.length), label: 'components' },
    { value: String(iconList.length), label: 'icons' },
    { value: String(templates.length), label: 'templates' },
    { value: 'WAI-ARIA', label: 'on every component' }
]);

const features = [
    { icon: 'sliders', title: 'Design tokens', body: 'Primitive, semantic and component layers, compiled to CSS variables. Change the primary colour and everything follows.' },
    { icon: 'check', title: 'Accessible by default', body: 'Each component follows its WAI-ARIA pattern and ships with a spec that runs axe and drives the keyboard.' },
    { icon: 'pencil', title: 'Yours to override', body: 'Reach any element with pass-through, retoken one instance, or go unstyled and bring your own CSS.' },
    { icon: 'star', title: 'A predictable API', body: 'The same props, slots and events everywhere: size, variant, invalid, fluid. Learning one component covers most of the next.' },
    { icon: 'moon', title: 'Light and dark', body: 'Both schemes come out of the same preset, and follow the operating system unless the reader says otherwise.' },
    { icon: 'image', title: 'Icons included', body: 'An outline set drawn for the library, tree-shaken per icon. Any other icon library works too.' },
    { icon: 'calendar', title: 'Application pieces', body: 'Charts, a scheduler and a task board sit next to the form controls, themed by the same tokens.' },
    { icon: 'listChecks', title: 'Forms and validation', body: 'Field state, rules and async checks with no dependency, plus resolvers for Zod, Yup, Valibot and Superstruct.' },
    { icon: 'server', title: 'Server rendering', body: 'Styles are collected during the render and go into the head, so nothing arrives unstyled. Nuxt takes one line in nuxt.config.' }
];

const categories = computed(() =>
    sections.map((section) => ({
        name: section.category,
        count: section.items.length,
        sample: section.items.slice(0, 4).map((item) => item.meta.title),
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
                    <a class="home-pill" :href="href('/docs/introduction')"><b>v0.1</b> Vue 3 and Nuxt today, React and Angular next <Icon icon="arrowRight" /></a>
                    <h1 id="home-title">Components that take the shape of your brand</h1>
                    <p class="home-lead">
                        Vitral is a Vue component library with a theme engine underneath: change a few tokens and every control follows.
                    </p>
                    <div class="home-actions">
                        <Button as="a" :href="href('/docs/installation')" label="Get started" icon="arrowRight" icon-pos="right" size="large" />
                        <Button as="a" :href="href('/components/button')" label="Browse components" severity="secondary" variant="outlined" size="large" />
                    </div>
                    <div class="home-install">
                        <code><span aria-hidden="true">$</span> {{ install }}</code>
                        <Button
                            :icon="copied ? 'check' : 'copy'"
                            :aria-label="copied ? 'Copied' : 'Copy the install command'"
                            variant="text"
                            severity="secondary"
                            size="small"
                            @click="copyInstall"
                        />
                    </div>
                </div>

                <div class="home-showcase" aria-label="Components in the current theme" role="group">
                    <form class="home-card home-profile" @submit.prevent>
                        <div class="home-profile-head">
                            <div>
                                <h2 class="home-card-title">Edit profile</h2>
                                <p class="home-card-hint">Update your account details.</p>
                            </div>
                            <Avatar icon="user" shape="circle" />
                        </div>
                        <Divider />
                        <label :for="ids.name" class="home-label">Name</label>
                        <InputText :id="ids.name" v-model="profile.name" autocomplete="off" fluid />
                        <label :for="ids.email" class="home-label">Email</label>
                        <InputText :id="ids.email" v-model="profile.email" type="email" autocomplete="off" fluid class="home-profile-email" />
                        <div class="home-card-row home-profile-actions">
                            <Button label="Save changes" class="home-profile-save" />
                            <Button label="Cancel" severity="secondary" variant="outlined" />
                        </div>
                    </form>
                    <div class="home-card home-card-stat">
                        <div class="home-stat-head">
                            <span class="home-label">Revenue</span>
                            <Tag value="+12.4%" severity="success" rounded />
                        </div>
                        <strong class="home-stat-value">$48.2K</strong>
                        <Chart type="area" :series="trend" :options="sparkline" />
                    </div>
                    <div class="home-card home-card-team">
                        <div>
                            <span class="home-label">Reviewers</span>
                            <AvatarGroup label="Reviewers">
                                <Avatar v-for="(person, i) in reviewers" :key="person" :label="person" shape="circle" :style="{ background: `var(--vt-chart-${i + 1})`, color: '#fff' }" />
                                <Avatar label="+3" shape="circle" />
                            </AvatarGroup>
                        </div>
                        <ToggleSwitch v-model="alerts" label="Alerts" />
                    </div>
                </div>
            </div>
        </section>

        <!-- --------------------------------------------------------------- stats -->
        <section class="home-stats" aria-label="At a glance">
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
                    <h2 id="home-features">Everything an interface needs, in one set</h2>
                    <p>Built to be re-dressed rather than restyled, and tested the way people actually use it: with a keyboard and a screen reader.</p>
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
                        <h2 id="home-catalog">{{ entries.length }} components, grouped the way you look for them</h2>
                        <p>From a text box to a scheduler, each with live examples and its API.</p>
                    </div>
                    <Button as="a" :href="href('/components/button')" label="Browse components" variant="text" icon="arrowRight" icon-pos="right" />
                </header>
                <ul class="home-categories">
                    <li v-for="category in categories" :key="category.name">
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
                    <h2 id="home-theming">Your brand in a few lines</h2>
                    <p class="home-muted">
                        A preset is a tree of tokens over another preset. Pick a colour below and the whole site, this page included, changes with it.
                    </p>
                    <div class="home-swatches" role="group" aria-label="Primary colour">
                        <button
                            v-for="swatch in shownSwatches"
                            :key="swatch.name"
                            type="button"
                            class="home-swatch"
                            :style="{ '--swatch': swatch.color }"
                            :aria-label="swatch.name"
                            :aria-pressed="primary === swatch.value || (!primary && swatch.name === 'Blue') ? 'true' : 'false'"
                            @click="setPrimary(swatch.value)"
                        />
                    </div>
                    <CodeBlock :code="themingSnippet" label="theme.ts" lang="ts" />
                    <Button as="a" :href="href('/docs/theming')" label="Read the theming guide" variant="outlined" severity="secondary" icon="arrowRight" icon-pos="right" />
                </div>
                <div class="home-card home-settings">
                    <div>
                        <h3 class="home-card-title">Notifications</h3>
                        <p class="home-card-hint">Choose what reaches your inbox.</p>
                    </div>
                    <div class="home-settings-list">
                        <ToggleSwitch v-model="settings.updates" label="Product updates" />
                        <ToggleSwitch v-model="settings.digest" label="Weekly digest" />
                        <ToggleSwitch v-model="settings.mentions" label="Mentions" />
                    </div>
                    <div class="home-card-row">
                        <Tag value="3 channels" severity="info" />
                        <Tag value="Synced" severity="success" icon="check" />
                    </div>
                    <Button label="Save preferences" class="home-settings-save" fluid />
                </div>
            </div>
        </section>

        <!-- ----------------------------------------------------------- templates -->
        <section class="home-band home-band-muted" aria-labelledby="home-templates">
            <div class="home-wrap">
                <header class="home-head home-head-row">
                    <div>
                        <h2 id="home-templates">Templates to start from</h2>
                        <p>Whole applications made of these components: responsive, themed, and a click away from a live demo.</p>
                    </div>
                    <Button as="a" :href="href('/templates')" :label="`All ${templates.length} templates`" variant="text" icon="arrowRight" icon-pos="right" />
                </header>
                <ul class="home-templates">
                    <li v-for="entry in shownTemplates" :key="entry.id">
                        <a :href="href(`/templates/${entry.id}`)" class="home-template">
                            <TemplateThumb :template="entry" />
                            <span class="home-template-body">
                                <strong>{{ entry.name }}</strong>
                                <span>{{ entry.category }} · {{ entry.screens.length }} screens</span>
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
                        <h2 id="home-start">Start with one package</h2>
                        <p>One plugin call, or one line in <code>nuxt.config</code>, and a theme that answers to <code>useTheme()</code>.</p>
                    </div>
                    <div class="home-actions">
                        <Button as="a" :href="href('/docs/introduction')" label="Read the docs" />
                        <Button as="a" :href="href('/icons')" label="Browse icons" severity="secondary" variant="outlined" />
                    </div>
                </div>
            </div>
        </section>
    </main>
</template>
