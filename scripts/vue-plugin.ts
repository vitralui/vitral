// The Vue plugin with TypeScript registered on the SFC compiler. The compiler
// reads prop types — including ones imported from a sibling file — to generate
// runtime props, and follows those imports through TypeScript's file system.
// Left to itself it requires whichever `typescript` pnpm happened to hoist,
// which need not be the one this repository pins; so register ours, on the
// CommonJS instance of the compiler, which is the one @vitejs/plugin-vue uses.
import vue from '@vitejs/plugin-vue';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('vue/compiler-sfc').registerTS(() => require('typescript'));

export const vitralVue = () => vue();
