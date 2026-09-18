# @vitral/icons

The icon set drawn for [Vitral](https://www.npmjs.com/package/@vitral/vue): an
outline set on a 24×24 grid, as data.

Every icon is a named export, so a bundler keeps only the ones you import.

```ts
import { check, graduationCap, renderSvg } from '@vitral/icons';

renderSvg(check, { width: '20', height: '20' });
```

In a Vue application, register the extra ones you want to name in an `icon`
prop:

```ts
app.use(Vitral, { icons: [graduationCap] });
```

`@vitral/icons/registry` has the whole catalogue by name and by category, for
an icon picker or a page that lists them all.

**[Every icon](https://vitralui.github.io/vitral/#/icons)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.
