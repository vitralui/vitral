// Generated at build time by `optionsTemplate()` in `../options.ts`, and read
// by the plugin.
declare module '#build/vitral-options.mjs' {
    import type { Directive } from 'vue';
    import type { Locale, Preset } from '@vitral/vue';
    import type { VitralModuleOptions } from '../options';

    export const preset: Preset | null;
    export const locale: Locale | null;
    export const directives: Record<string, Directive>;
    export const options: Pick<VitralModuleOptions, 'colorScheme' | 'cookie' | 'darkModeSelector' | 'cssLayer' | 'inputVariant' | 'unstyled'>;
}
