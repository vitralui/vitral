import { isClient } from '@vitral/core';
import { compileTheme } from './compile';
import { definePreset } from './preset';
import { applyDarkModeTo, type ColorScheme } from './scheme';
import { defaultThemeOptions, type Preset, type ThemeOptions } from './types';

export interface ThemeState {
    preset: Preset;
    colorScheme: ColorScheme;
    /** The scheme actually showing: `colorScheme` with `'system'` resolved. */
    dark: boolean;
}

export interface ThemeManagerOptions extends ThemeOptions {
    preset: Preset;
    colorScheme?: ColorScheme;
    /** Nonce for the injected `<style>`, under a strict Content-Security-Policy. */
    nonce?: string;
    /** Remember the chosen scheme in localStorage under this key. Off by default. */
    storageKey?: string | false;
}

export interface ThemeManager {
    readonly options: Required<ThemeOptions>;
    /** The localStorage key the scheme is remembered under, or false. `colorSchemeScript` has to agree with it. */
    readonly storageKey: string | false;
    getState(): ThemeState;
    setPreset(preset: Preset): void;
    /** Merges a partial preset over the current one: a new primary colour, a rounder radius. */
    extendPreset(partial: Preset): void;
    setColorScheme(scheme: ColorScheme): void;
    toggleDark(): void;
    subscribe(listener: (state: ThemeState) => void): () => void;
    /** Injects the stylesheet and starts following the system scheme. Safe to call on the server, where it does nothing. */
    mount(): void;
    destroy(): void;
    css(): string;
}

const STYLE_ATTR = 'data-vitral-theme';

/**
 * Owns the theme at runtime: compiles the preset into one `<style>` element,
 * applies the dark selector to `<html>`, and tells subscribers when anything
 * changes. It knows nothing about any framework: the Vue plugin wraps it, and a
 * React or Angular adapter would wrap the same object.
 */
export function createThemeManager(init: ThemeManagerOptions): ThemeManager {
    const options: Required<ThemeOptions> = {
        prefix: init.prefix ?? defaultThemeOptions.prefix,
        darkModeSelector: init.darkModeSelector ?? defaultThemeOptions.darkModeSelector,
        cssLayer: init.cssLayer ?? defaultThemeOptions.cssLayer
    };
    let preset = init.preset;
    let colorScheme: ColorScheme = readStored(init.storageKey) ?? init.colorScheme ?? 'system';
    const listeners = new Set<(state: ThemeState) => void>();
    let styleEl: HTMLStyleElement | null = null;
    let media: MediaQueryList | null = null;

    const systemDark = () => (isClient && typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)').matches : false);
    const isDark = () => colorScheme === 'dark' || (colorScheme === 'system' && systemDark());
    const state = (): ThemeState => ({ preset, colorScheme, dark: isDark() });
    const css = () => compileTheme(preset, options).css;

    const notify = () => {
        const s = state();
        listeners.forEach((l) => l(s));
    };

    const applyScheme = () => {
        if (!isClient) return;
        applyDarkModeTo(document.documentElement, isDark(), options.darkModeSelector);
    };

    const writeStyle = () => {
        if (styleEl) styleEl.textContent = css();
    };

    const onSystemChange = () => {
        if (colorScheme !== 'system') return;
        applyScheme();
        notify();
    };

    return {
        options,
        storageKey: init.storageKey ?? false,
        getState: state,
        css,
        setPreset(next) {
            preset = next;
            writeStyle();
            notify();
        },
        extendPreset(partial) {
            preset = definePreset(preset, partial);
            writeStyle();
            notify();
        },
        setColorScheme(scheme) {
            colorScheme = scheme;
            store(init.storageKey, scheme);
            applyScheme();
            notify();
        },
        toggleDark() {
            this.setColorScheme(isDark() ? 'light' : 'dark');
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        mount() {
            if (!isClient || styleEl) return;
            styleEl = document.head.querySelector<HTMLStyleElement>(`style[${STYLE_ATTR}]`);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.setAttribute(STYLE_ATTR, '');
                if (init.nonce) styleEl.nonce = init.nonce;
                document.head.prepend(styleEl);
            }
            writeStyle();
            applyScheme();
            if (typeof matchMedia === 'function') {
                media = matchMedia('(prefers-color-scheme: dark)');
                media.addEventListener?.('change', onSystemChange);
            }
        },
        destroy() {
            media?.removeEventListener?.('change', onSystemChange);
            media = null;
            styleEl?.remove();
            styleEl = null;
            listeners.clear();
        }
    };
}

function readStored(key: string | false | undefined): ColorScheme | null {
    if (!key || !isClient) return null;
    try {
        const value = localStorage.getItem(key);
        return value === 'light' || value === 'dark' || value === 'system' ? value : null;
    } catch {
        return null;
    }
}

function store(key: string | false | undefined, scheme: ColorScheme): void {
    if (!key || !isClient) return;
    try {
        localStorage.setItem(key, scheme);
    } catch {
        /* storage blocked: the choice simply is not remembered */
    }
}
