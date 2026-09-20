// Every workspace package resolves to its source during development and tests,
// so the playground and the specs never wait on a build and never read a stale
// dist. Only `pnpm build` produces the published entry points. A subpath entry
// comes before its package: the first alias whose name prefixes the import wins.
import { fileURLToPath } from 'node:url';

const pkg = (name: string, entry = 'index') => fileURLToPath(new URL(`./packages/${name}/src/${entry}.ts`, import.meta.url));

export const aliases = {
    '@vitral/core': pkg('core'),
    '@vitral/themes': pkg('themes'),
    '@vitral/styles': pkg('styles'),
    '@vitral/dom': pkg('dom'),
    '@vitral/controls': pkg('controls'),
    '@vitral/editor/buttons': pkg('editor', 'buttons'),
    '@vitral/editor': pkg('editor'),
    '@vitral/datagrid/engine': pkg('datagrid', 'engine/index'),
    '@vitral/datagrid': pkg('datagrid'),
    '@vitral/chat/engine': pkg('chat', 'engine/index'),
    '@vitral/chat': pkg('chat'),
    '@vitral/schedule/engine': pkg('schedule', 'engine/index'),
    '@vitral/schedule': pkg('schedule'),
    '@vitral/taskboard/engine': pkg('taskboard', 'engine/index'),
    '@vitral/taskboard': pkg('taskboard'),
    '@vitral/spreadsheet/buttons': pkg('spreadsheet', 'buttons'),
    '@vitral/spreadsheet/engine': pkg('spreadsheet', 'engine/index'),
    '@vitral/spreadsheet': pkg('spreadsheet'),
    '@vitral/forms': pkg('forms'),
    '@vitral/chart/engine': pkg('chart', 'engine/index'),
    '@vitral/chart/style': pkg('chart', 'style/index'),
    '@vitral/chart': pkg('chart'),
    '@vitral/icons/registry': pkg('icons', 'registry'),
    '@vitral/icons': pkg('icons'),
    '@vitral/vue/manifest': pkg('vue', 'components/manifest'),
    '@vitral/vue/resolver': pkg('vue', 'resolver'),
    '@vitral/vue': pkg('vue')
};
