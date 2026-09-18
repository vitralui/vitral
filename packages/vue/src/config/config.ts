import {
    createEventBus,
    createStyleRegistry,
    defaultBaseConfig,
    defaultZIndex,
    type BaseConfig,
    type Direction,
    type EventBus,
    type Locale,
    type StyleRegistry,
    type ZIndexConfig
} from '@vitral/core';
import { registerIcons, type IconDef } from '@vitral/icons';
import { createThemeManager, Ink, type ColorScheme, type Preset, type ThemeManager, type ThemeOptions } from '@vitral/themes';
import { inject, reactive, type InjectionKey } from 'vue';
import type { GlobalPassThrough, InputVariant } from '../base/types';
import type { ConfirmEvents, DialogEvents, ToastEvents } from './services';

export interface VitralThemeConfig {
    /** Defaults to Ink, the quiet high-contrast look. */
    preset?: Preset;
    options?: ThemeOptions;
    /** The starting scheme; `'system'` follows the OS. */
    colorScheme?: ColorScheme;
    /** Remember the user's scheme across visits under this localStorage key. */
    storageKey?: string | false;
}

export interface VitralConfig extends BaseConfig {
    pt: GlobalPassThrough;
    inputVariant: InputVariant;
    /** Wrap component styles in `@layer <name>`, so application CSS wins without `!important`. */
    cssLayer: string | false;
}

export interface VitralOptions {
    /** `'none'` injects no theme: bring your own CSS variables, or go unstyled. */
    theme?: VitralThemeConfig | 'none';
    unstyled?: boolean;
    pt?: GlobalPassThrough;
    locale?: Locale;
    /**
     * The reading direction, `'ltr'` unless you say otherwise. Set the matching
     * `dir` on the element you mount in: this is what the library assumes where
     * there is no layout to measure — a popup teleported to `<body>`, and the
     * server.
     */
    direction?: Direction;
    zIndex?: Partial<ZIndexConfig>;
    inputVariant?: InputVariant;
    cssLayer?: string | false;
    csp?: { nonce?: string };
    /**
     * Icons to resolve by name in every `icon` prop, beside the ones the
     * components use: `icons: [graduationCap, shoppingCart]`, or
     * `icons` from `@vitral/icons/registry` for the whole set.
     */
    icons?: readonly IconDef[] | Readonly<Record<string, IconDef>>;
}

export interface VitralContext {
    /** Reactive: change `config.locale` or `config.inputVariant` at runtime and every component follows. */
    config: VitralConfig;
    /** Null when the plugin was installed with `theme: 'none'`. */
    theme: ThemeManager | null;
    /**
     * The stylesheets this application asked for while rendering on the server,
     * which `collectStyles()` turns into the head of the page. Empty in the
     * browser, where a stylesheet goes straight into the document.
     */
    styles: StyleRegistry;
    toast: EventBus<ToastEvents>;
    confirm: EventBus<ConfirmEvents>;
    /** The channel `useDialog()` opens `<DynamicDialog>` through. */
    dialog: EventBus<DialogEvents>;
}

export const VitralKey: InjectionKey<VitralContext> = Symbol('vitral');

export function createVitralContext(options: VitralOptions = {}): VitralContext {
    const config = reactive<VitralConfig>({
        ...defaultBaseConfig,
        unstyled: options.unstyled ?? false,
        pt: options.pt ?? {},
        locale: options.locale ?? defaultBaseConfig.locale,
        direction: options.direction ?? defaultBaseConfig.direction,
        zIndex: { ...defaultZIndex, ...options.zIndex },
        inputVariant: options.inputVariant ?? 'outlined',
        cssLayer: options.cssLayer ?? false,
        csp: options.csp ?? {}
    }) as VitralConfig;

    if (options.icons) registerIcons(options.icons);

    const themeConfig = options.theme === 'none' ? null : (options.theme ?? {});
    const theme = themeConfig
        ? createThemeManager({
              preset: themeConfig.preset ?? Ink,
              ...themeConfig.options,
              cssLayer: themeConfig.options?.cssLayer ?? config.cssLayer,
              colorScheme: themeConfig.colorScheme,
              storageKey: themeConfig.storageKey,
              nonce: config.csp.nonce
          })
        : null;

    const styles = createStyleRegistry({ nonce: config.csp.nonce, cssLayer: config.cssLayer });

    return { config, theme, styles, toast: createEventBus<ToastEvents>(), confirm: createEventBus<ConfirmEvents>(), dialog: createEventBus<DialogEvents>() };
}

let fallback: VitralContext | null = null;

/**
 * The context the plugin provided. Components also work without the plugin,
 * falling back to a default context with no theme, so a component library test
 * or a one-off embed does not have to install anything.
 */
export function useVitral(): VitralContext {
    const provided = inject(VitralKey, null);
    if (provided) return provided;
    return (fallback ??= createVitralContext({ theme: 'none' }));
}
