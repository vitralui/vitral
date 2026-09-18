# @vitral/vue

Vitral for Vue 3: the components, the composables, the directives and the
plugin that themes them.

Vitral is a component library built around a token engine, so the whole look
comes from one object you can swap. Design tokens, presets, light and dark, per
instance overrides, pass-through attributes and a fully unstyled mode.

**[Documentation and live examples](https://vitralui.github.io/vitral/)**

```sh
pnpm add @vitral/vue
```

```ts
import { createApp } from 'vue';
import { Vitral, Prism } from '@vitral/vue';
import App from './App.vue';

createApp(App).use(Vitral, { theme: { preset: Prism, colorScheme: 'system' } }).mount('#app');
```

```vue
<script setup lang="ts">
import { Button, InputText } from '@vitral/vue';
import { ref } from 'vue';

const name = ref('');
</script>

<template>
    <InputText v-model="name" clearable />
    <Button label="Save" icon="check" />
</template>
```

There is no stylesheet to import. The plugin injects the theme as CSS
variables, and each component injects its own CSS the first time it renders.

Vue 3.5 or newer is the only peer dependency. On Nuxt, use
[@vitral/nuxt](https://www.npmjs.com/package/@vitral/nuxt) instead of calling
the plugin by hand.

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.
