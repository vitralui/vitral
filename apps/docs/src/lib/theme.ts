import { en, ptBR, useDirection, useLocale, useTheme, useVitral, type Direction, type Preset } from '@vitral/vue';
import { ref, watch } from 'vue';
import { themes } from './presets';

/**
 * The site's theme switcher, as module state rather than a component's: the
 * top bar, the home page and the presets guide drive the same choice,
 * so a reader who picks Ink on one page keeps it on the next.
 */
export const builtInPresets: Record<string, Preset> = Object.fromEntries(themes.map((theme) => [theme.id, theme.preset]));

export const presetOptions = themes.map((theme) => ({ label: `${theme.name} — ${theme.origin}`, value: theme.id }));

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

export const schemeOptions = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' }
];

export const variantOptions = [
    { label: 'Outlined', value: 'outlined' },
    { label: 'Filled', value: 'filled' }
];

export const directionOptions = [
    { label: 'Left to right', value: 'ltr' },
    { label: 'Right to left', value: 'rtl' }
];

// `?preset=ink` and `?scheme=dark` open the site in that look without
// remembering it, which is what a screenshot or a shared link needs.
const params = new URLSearchParams(location.search);

export const presetId = ref(params.get('preset') ?? themes[0]!.id);
export const localeId = ref('en');
export const primary = ref<string | null>(null);
export const direction = ref<Direction>(params.get('dir') === 'rtl' ? 'rtl' : 'ltr');

let controls: ReturnType<typeof useTheme> | null = null;

/** Called once, from the shell, where an injection context exists. */
export function installThemeSwitcher() {
    controls = useTheme();
    const { setLocale } = useLocale();
    const { config } = useVitral();

    watch(
        presetId,
        (id) => {
            primary.value = null;
            controls!.setPreset(builtInPresets[id] ?? themes[0]!.preset);
        },
        { immediate: true }
    );

    watch(localeId, (id) => setLocale(id === 'pt-BR' ? ptBR : en));

    // The layout follows the `dir` attribute, so that is what is set; the
    // configuration follows it for the popups teleported out of the page and
    // for anything that has to branch on the direction itself.
    const { setDirection } = useDirection();
    watch(
        direction,
        (value) => {
            document.documentElement.dir = value;
            setDirection(value);
        },
        { immediate: true }
    );

    return { controls, config };
}

export function setPrimary(value: string) {
    primary.value = value;
    controls?.setPrimary(value);
}
