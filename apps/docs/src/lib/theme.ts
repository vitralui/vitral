import { en, ptBR, useDirection, useLocale, useTheme, useVitral, type BorderStrength, type Direction, type Preset } from '@vitral/vue';
import { computed, ref, watch } from 'vue';
import { track } from './analytics';
import { lang } from './i18n';
import { themes, themeText } from './presets';

/**
 * The site's theme switcher, as module state rather than a component's: the
 * top bar, the home page and the presets guide drive the same choice,
 * so a reader who picks Ink on one page keeps it on the next.
 */
export const builtInPresets: Record<string, Preset> = Object.fromEntries(themes.map((theme) => [theme.id, theme.preset]));

/** The theme menu's choices, in the page's language. */
export const presetOptions = computed(() => themes.map((theme) => ({ label: `${theme.name} — ${themeText(theme).origin}`, value: theme.id })));

export const swatches = [
    { name: 'Blue', value: '{blue}', color: '#3b82f6' },
    { name: 'Indigo', value: '{indigo}', color: '#6366f1' },
    { name: 'Violet', value: '{violet}', color: '#8b5cf6' },
    { name: 'Emerald', value: '{emerald}', color: '#10b981' },
    { name: 'Teal', value: '{teal}', color: '#14b8a6' },
    { name: 'Sky', value: '{sky}', color: '#0ea5e9' },
    { name: 'Amber', value: '{amber}', color: '#f59e0b' },
    { name: 'Rose', value: '{rose}', color: '#f43f5e' }
];

export const directionOptions = [
    { label: 'Left to right', value: 'ltr' },
    { label: 'Right to left', value: 'rtl' }
];

const params = new URLSearchParams(location.search);

/**
 * The preset, the direction and the colour scheme are all remembered the same
 * way: localStorage, a key of the same shape, and `?preset=` or `?dir=` to pin
 * one for a single load without writing it down — which is what a shared link
 * and a screenshot need, and what keeps the prerender, which has no storage,
 * from baking a choice into the published HTML.
 *
 * The scheme and the direction are also applied by the script in the head of
 * the page, before anything is painted. The preset cannot be: its custom
 * properties are generated at runtime, and there is nothing to apply until the
 * bundle is there. It is read here instead, so the theme mounts once with the
 * right preset rather than mounting the default and replacing it.
 */
const PRESET_KEY = 'vitral-docs-preset';
const known = new Set(themes.map((theme) => theme.id));
const pinnedPreset = known.has(params.get('preset') ?? '') ? params.get('preset')! : null;

function remembered(key: string, valid: (value: string) => boolean, fallback: string): string {
    try {
        const value = localStorage.getItem(key);
        return value && valid(value) ? value : fallback;
    } catch {
        // Private windows and blocked storage: the default, not a crash.
        return fallback;
    }
}

function remember(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* blocked: the choice lasts as long as the tab does */
    }
}

export const presetId = ref(pinnedPreset ?? remembered(PRESET_KEY, (value) => known.has(value), themes[0]!.id));
export const localeId = ref('en');
export const primary = ref<string | null>(null);

/** The preset the plugin is installed with, so the theme is not mounted twice. */
export const initialPreset = (): Preset => builtInPresets[presetId.value] ?? themes[0]!.preset;
/** The script in the head of the page has already applied this one; here it is where the application can see it. */
const DIRECTION_KEY = 'vitral-docs-direction';
const pinnedDirection = params.get('dir') === 'rtl' ? 'rtl' : params.get('dir') === 'ltr' ? 'ltr' : null;

export const direction = ref<Direction>(
    (pinnedDirection ?? remembered(DIRECTION_KEY, (value) => value === 'ltr' || value === 'rtl', 'ltr')) as Direction
);

/**
 * Whether the site is drawing the stronger edges. Remembered like the rest, and
 * pinnable with `?borders=strong` so a screenshot of the difference can be
 * linked to. It is a setting and not the default because the presets were drawn
 * with quieter borders; an application that has to meet WCAG 1.4.11 turns it on.
 */
const BORDERS_KEY = 'vitral-docs-borders';
const pinnedBorders = params.get('borders') === 'strong' ? 'strong' : params.get('borders') === 'soft' ? 'soft' : null;

export const borders = ref<BorderStrength>((pinnedBorders ?? remembered(BORDERS_KEY, (value) => value === 'soft' || value === 'strong', 'soft')) as BorderStrength);

let controls: ReturnType<typeof useTheme> | null = null;

/** Called once, from the shell, where an injection context exists. */
export function installThemeSwitcher() {
    controls = useTheme();
    const { setLocale } = useLocale();
    const { config } = useVitral();

    // Not immediate: the plugin was installed with `initialPreset()`, so the
    // theme already wears it. This is for the changes that come after.
    watch(presetId, (id) => {
        primary.value = null;
        controls!.setPreset(builtInPresets[id] ?? themes[0]!.preset);
        if (!pinnedPreset) remember(PRESET_KEY, id);
        track('change_theme', { setting: 'preset', choice: id });
    });

    watch(localeId, (id) => setLocale(id === 'pt-BR' ? ptBR : en));
    // The components speak the page's language: a calendar on a Portuguese page
    // names its months in Portuguese. The locale guide can still flip it by hand.
    watch(lang, (which) => (localeId.value = which === 'pt-br' ? 'pt-BR' : 'en'), { immediate: true });

    watch(
        borders,
        (value) => {
            controls!.setBorders(value);
            if (!pinnedBorders) remember(BORDERS_KEY, value);
        },
        { immediate: true }
    );

    // The layout follows the `dir` attribute, so that is what is set; the
    // configuration follows it for the popups teleported out of the page and
    // for anything that has to branch on the direction itself.
    const { setDirection } = useDirection();
    watch(
        direction,
        (value) => {
            document.documentElement.dir = value;
            setDirection(value);
            // A pinned direction is for this load only, so it is not written back.
            if (!pinnedDirection) remember(DIRECTION_KEY, value);
        },
        { immediate: true }
    );
    watch(direction, (value) => track('change_theme', { setting: 'direction', choice: value }));

    return { controls, config };
}

export function setPrimary(value: string) {
    primary.value = value;
    controls?.setPrimary(value);
}
