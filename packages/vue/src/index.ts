export { Vitral } from './plugin';
export * from './config/config';
export * from './config/services';
export * from './base/types';
export { useComponent, useSplitAttrs } from './base/useComponent';

export { loadStyle } from './composables/useStyle';
// The named transitions a Galleria or a Carousel can be given.
export { transitionPresets, type TransitionPreset } from '@vitral/styles';
export { collectStyles, colorSchemeTag, type CollectedStyles } from './ssr';
export { useTheme } from './composables/useTheme';
export { useLocale } from './composables/useLocale';
export { useOverlay, type UseOverlayOptions } from './composables/useOverlay';
export { useFocusTrap } from './composables/useFocusTrap';
export * from './composables';

export * from './components';
export * from './directives';

// The theme and locale APIs an application reaches for, so one import is enough.
export { Base, Prism, Ink, Avalonia, Simple, Astra, definePreset, palette, dt, updatePrimaryPalette, updateSurfacePalette } from '@vitral/themes';
// The scheme, for a server that renders it: what `<html>` must carry, and the script that decides before the first paint.
export { colorSchemeAttrs, colorSchemeScript, parseDarkModeSelector, applyDarkModeTo } from '@vitral/themes';
export type { ColorSchemeScriptOptions, DarkModeTarget } from '@vitral/themes';
export type { ColorScheme, Palette, Preset, ThemeOptions } from '@vitral/themes';
export { en, ptBR, FilterMatchMode, FilterService, createDataSource, formatMessage } from '@vitral/core';
export type { DataSource, Direction, LoadOptions, LoadResult, Locale, SortMeta, TreeNode } from '@vitral/core';
// Validation: the rules and the schema adapters the Form parts take.
export { createForm, rules, functionResolver, zodResolver, yupResolver, valibotResolver, superstructResolver, standardSchemaResolver } from '@vitral/forms';
export type { FieldArrayApi, FieldOptions, FormApi, FormErrors, FormMessages, FormOptions, FormState, Resolver, ResolverResult, Rule, RuleContext, ValidateOn, ValidationResult } from '@vitral/forms';
