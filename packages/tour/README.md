# @vitral/tour

A guided tour with no framework in it: a highlight and a popover a step,
driven by its buttons, the keyboard, or the methods of the handle. The Vitral
components wrap it.

```ts
import { createTour } from '@vitral/tour';

const tour = createTour({
    showProgress: true,
    steps: [
        { element: '#new', popover: { title: 'Create', description: 'Starts a new document.', side: 'bottom', align: 'start' } },
        { element: '#search', popover: { title: 'Search', description: 'Finds anything.' } },
        { popover: { title: 'That is all', description: 'Press Done to start working.' } }
    ]
});

tour.drive();
```

The page is dimmed by one SVG path with the element's box cut out of it; the
hole is not painted, so a press on the element reaches it. The popover is a
dialog named by its title and described by its text, and it takes the keyboard
when a step is shown, so a screen reader reads each step as it arrives. Escape
and the arrow keys drive the tour — the arrows the right way round on a
right-to-left page.

## Options, hooks and methods

`steps`, `animate`, `overlayColor`, `overlayOpacity`, `smoothScroll`,
`allowClose`, `overlayClickBehavior`, `stagePadding`, `stageRadius`,
`disableActiveInteraction`, `allowKeyboardControl`, `popoverClass`,
`popoverOffset`, `showButtons`, `disableButtons`, `showProgress`,
`progressText`, `nextBtnText`, `prevBtnText`, `doneBtnText`; the hooks
`onPopoverRender`, `onHighlightStarted`, `onHighlighted`, `onDeselected`,
`onDestroyStarted`, `onDestroyed`, `onNextClick`, `onPrevClick`,
`onCloseClick`; and the methods `drive`, `moveNext`, `movePrevious`, `moveTo`,
`hasNextStep`, `hasPreviousStep`, `isFirstStep`, `isLastStep`,
`getActiveIndex`, `getActiveStep`, `getActiveElement`, `getPreviousStep`,
`getPreviousElement`, `isActive`, `refresh`, `getConfig`, `setConfig`,
`setSteps`, `getState`, `highlight` and `destroy`.

`stagePadding` defaults to 2, so the highlight hugs the element, and its
corner follows the element's own.

## Steps that do more

| | |
| --- | --- |
| `step.id`, `moveTo('billing')`, `drive('billing')` | steps by name |
| `step.when(context)` | a step shown only when it applies; the progress counts only the shown ones |
| `step.beforeShow(context)` | waited for before the step shows — open the menu it points into; `false` stays put |
| `step.waitFor`, `elementTimeout` | wait for an element that is not there yet |
| `missingElement: 'skip'` | pass over a step whose element never came, rather than centring it |
| `step.advanceOn: { event, selector? }` | move on when the reader does what the step asks |
| `progressStyle: 'text' \| 'dots' \| 'bar'` | how progress is drawn |
| `popover.image` | a picture above the title |
| `storageKey`, `isCompleted()`, `reset()` | pick up where the reader left off; know whether they finished |
| `dismissableMask: false` | a press on the overlay does not end the tour, as on a dialog's mask |
| `arrow` | a pointer from the popover to the element — off by default, as Vitral's popovers have none |
| `allowHtml` | titles and descriptions are text unless this says otherwise |
| `locale`, `dir` | the words and the direction, from the app |
| `on: { start, 'step-change', end }` | what happened, with why it ended |
| `unstyled`, `pt`, `classes` | the look is `@vitral/styles`' `tourStyle`, and the theme's tokens |

`@vitral/tour/engine` is the arithmetic on its own — placements, progress, the
overlay's shape, which step comes next. No DOM, no timers.

In Vue, `<Tour>` and `useTour()` belong to the component that made them;
`useGlobalTour()` is the application's one tour, which carries on across route
changes, and `app.use(Vitral, { tour: { … } })` sets what every tour starts from.

**[Documentation](https://vitralui.github.io/vitral/components/tour/)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.
