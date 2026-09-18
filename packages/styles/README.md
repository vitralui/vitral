# @vitral/styles

Every Vitral component's CSS and class map, written against theme tokens.

A style is plain data: the stylesheet, and which class each part carries in
which state. The Vue components read it, and a React or Angular adapter reads
the same object, so the markup contract is written once.

```ts
import { buttonStyle, classOf } from '@vitral/styles';

classOf(buttonStyle, 'root', { severity: 'primary', variant: 'filled' });
```

The whole thing is also shipped as one stylesheet, for a page that wants the
look without the JavaScript:

```html
<link rel="stylesheet" href="/node_modules/@vitral/styles/dist/vitral.css" />
```

**[Documentation](https://vitralui.github.io/vitral/)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.
