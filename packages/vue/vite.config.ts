import { libConfig } from '../../scripts/vite.lib.ts';

export default libConfig(import.meta.dirname, { vue: true, entries: ['components/manifest', 'resolver'] });
