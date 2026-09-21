import { updatePrimaryPalette, updateSurfacePalette, type BorderStrength, type ColorScheme, type Palette, type Preset, type ThemeState } from '@vitral/themes';
import { computed, getCurrentScope, onScopeDispose, shallowRef } from 'vue';
import { useVitral } from '../config/config';

/**
 * The theme at runtime: which preset, which scheme, and the switches to change
 * either. Nothing here re-renders: it rewrites CSS variables, and
 * the browser repaints.
 */
export function useTheme() {
    const { theme: manager } = useVitral();
    const state = shallowRef<ThemeState | null>(manager?.getState() ?? null);
    if (manager) {
        const stop = manager.subscribe((next) => (state.value = next));
        if (getCurrentScope()) onScopeDispose(stop);
    }

    const colorScheme = computed<ColorScheme>({
        get: () => state.value?.colorScheme ?? 'light',
        set: (scheme) => manager?.setColorScheme(scheme)
    });

    const borders = computed<BorderStrength>({
        get: () => state.value?.borders ?? 'soft',
        set: (strength) => manager?.setBorders(strength)
    });

    return {
        manager,
        preset: computed(() => state.value?.preset ?? null),
        colorScheme,
        isDark: computed(() => state.value?.dark ?? false),
        setPreset: (preset: Preset) => manager?.setPreset(preset),
        extendPreset: (partial: Preset) => manager?.extendPreset(partial),
        setColorScheme: (scheme: ColorScheme) => manager?.setColorScheme(scheme),
        toggleDark: () => manager?.toggleDark(),
        /** `'strong'` for the borders that meet WCAG 1.4.11, `'soft'` for the preset's own look. */
        borders,
        setBorders: (strength: BorderStrength) => manager?.setBorders(strength),
        /** A new primary colour, as a hex value, a `{palette}` reference or eleven shades. */
        setPrimary: (primary: string | Palette) => manager && manager.setPreset(updatePrimaryPalette(manager.getState().preset, primary)),
        setSurface: (surface: { light?: string | Palette; dark?: string | Palette }) => manager && manager.setPreset(updateSurfacePalette(manager.getState().preset, surface))
    };
}
