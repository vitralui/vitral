import { deepMerge, type Dict } from '@vitral/core';
import { severityDark, severityLight } from '../presets/base/semantic';
import { palette, type Palette } from './palette';
import type { Preset } from './types';

/** A preset built on another: later arguments override earlier ones, key by key. */
export function definePreset(base: Preset, ...overrides: Preset[]): Preset {
    return deepMerge<Preset & Dict>(base as Dict, ...(overrides as Dict[]));
}

/**
 * Replaces the primary palette — with a colour, a `{palette}` reference, or
 * eleven explicit shades — and re-derives the scheme's primary fills from it.
 * The second half matters: a preset such as Avalonia pins `primary.color` to an
 * exact accent, and swapping only the palette would leave that pin in place.
 */
export function updatePrimaryPalette(preset: Preset, primary: string | Palette): Preset {
    return definePreset(preset, {
        semantic: {
            primary: typeof primary === 'string' ? palette(primary) : primary,
            colorScheme: { light: { primary: severityLight('primary') }, dark: { primary: severityDark('primary') } }
        }
    });
}

/** Replaces the neutral surface palette for either scheme, or both. */
export function updateSurfacePalette(preset: Preset, surface: { light?: string | Palette; dark?: string | Palette }): Preset {
    const resolve = (value: string | Palette | undefined) => (value === undefined ? undefined : typeof value === 'string' ? palette(value) : value);
    return definePreset(preset, {
        semantic: {
            colorScheme: {
                light: surface.light ? { surface: resolve(surface.light) } : undefined,
                dark: surface.dark ? { surface: resolve(surface.dark) } : undefined
            }
        }
    });
}
