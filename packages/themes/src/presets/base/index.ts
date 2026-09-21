import type { Preset } from '../../engine/types';
import { components } from './components';
import { primitive } from './primitive';
import { semantic } from './semantic';
import { strongBorders } from './strong-borders';

/**
 * Every token every component needs, with neutral values. The named presets
 * are this plus overrides; start from it to build one of your own.
 */
export const Base: Preset = { primitive, semantic, components, strongBorders };

export { severityDark, severityLight } from './semantic';
