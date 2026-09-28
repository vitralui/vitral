import { formatMessage, type Locale } from '@vitral/core';
import { h, iconNode, mergeAttrs, s, type Child, type Props, type VElement } from '@vitral/dom';
import { close as closeIcon } from '@vitral/icons';
import { formatProgress, type TourRect } from '../engine/state';
import type { TourButton, TourProgressStyle, TourStep } from '../engine/types';

/** Everything the tour's layer is drawn from, worked out by the handle. */
export interface TourView {
    id: string;
    locale: Locale;
    part: (name: string, state?: unknown) => Props;
    step: TourStep;
    index: number;
    /** Where this step stands among the ones that are shown. */
    current: number;
    total: number;
    centered: boolean;
    animate: boolean;
    dir: 'ltr' | 'rtl';
    allowHtml: boolean;
    showProgress: boolean;
    progressStyle: TourProgressStyle;
    progressText: string;
    buttons: { shown: Set<TourButton>; disabled: Set<TourButton> };
    nextText: string;
    previousText: string;
    popoverClass?: string;
    /** Draw the pointer to the element. */
    arrow: boolean;
    ariaLabel?: string;
    /** The overlay's size and the stage cut out of it. */
    viewport: { width: number; height: number };
    path: string;
    overlayStyle: Record<string, string>;
    content?: Node | null;
    refs: {
        path: (el: Element | null) => void;
        popover: (el: Element | null) => void;
        arrow: (el: Element | null) => void;
        title: (el: Element | null) => void;
        description: (el: Element | null) => void;
        footer: (el: Element | null) => void;
        progress: (el: Element | null) => void;
        footerButtons: (el: Element | null) => void;
        previous: (el: Element | null) => void;
        next: (el: Element | null) => void;
        close: (el: Element | null) => void;
    };
    on: {
        overlay: (event: MouseEvent) => void;
        next: () => void;
        previous: () => void;
        close: () => void;
    };
}

export type { TourRect };

/** The overlay and the popover of one step. */
export function tourView(v: TourView): Child[] {
    const { part, locale } = v;
    const titleId = `${v.id}-title`;
    const descriptionId = `${v.id}-description`;
    const popover = v.step.popover ?? {};
    const title = popover.title ?? '';
    const description = popover.description ?? '';
    const stepName = formatMessage(locale.tour.step, { current: v.current, total: v.total });
    const progressText = formatProgress(v.progressText, v.current, v.total);
    const shown = (b: TourButton) => v.buttons.shown.has(b);
    const disabled = (b: TourButton) => v.buttons.disabled.has(b);

    const text = (value: string): Props | null => (v.allowHtml ? { innerHTML: value } : null);

    const overlay = s(
        'svg',
        mergeAttrs(part('overlay'), {
            key: 'overlay',
            viewBox: `0 0 ${v.viewport.width} ${v.viewport.height}`,
            preserveAspectRatio: 'none',
            'aria-hidden': 'true'
        }),
        s('path', mergeAttrs(part('overlayPath'), { d: v.path, style: v.overlayStyle, ref: v.refs.path, onClick: v.on.overlay }))
    );

    const progress = (): Child => {
        if (!v.showProgress) return h('span', mergeAttrs(part('progress'), { key: 'progress', hidden: true, ref: v.refs.progress }));
        if (v.progressStyle === 'dots') {
            return h(
                'span',
                mergeAttrs(part('dots'), { key: 'dots', ref: v.refs.progress }),
                Array.from({ length: v.total }, (_, i) => h('span', mergeAttrs(part('dot', { active: i + 1 === v.current, done: i + 1 < v.current }), { key: i, 'aria-hidden': 'true' }))),
                h('span', { class: 'vt-sr-only' }, progressText)
            );
        }
        if (v.progressStyle === 'bar') {
            return h(
                'span',
                mergeAttrs(part('bar'), { key: 'bar', ref: v.refs.progress }),
                h('span', mergeAttrs(part('barFill'), { 'aria-hidden': 'true', style: { width: `${(v.current / v.total) * 100}%` } })),
                h('span', { class: 'vt-sr-only' }, progressText)
            );
        }
        return h('span', mergeAttrs(part('progress'), { key: 'progress', ref: v.refs.progress }), progressText);
    };

    const image = popover.image;
    const popoverEl = h(
        'div',
        mergeAttrs(part('popover', { centered: v.centered }), {
            // A popover a step: moving on draws a new one, which replays its entrance.
            key: `popover-${v.index}`,
            id: `${v.id}-popover`,
            class: v.popoverClass || popover.popoverClass ? [v.popoverClass, popover.popoverClass].filter(Boolean).join(' ') : undefined,
            role: 'dialog',
            dir: v.dir,
            tabindex: '-1',
            'aria-labelledby': title ? titleId : undefined,
            'aria-label': title ? undefined : (v.ariaLabel ?? stepName),
            'aria-describedby': description ? descriptionId : undefined,
            ref: v.refs.popover
        }),
        // Always in the popover, for `onPopoverRender` to find, but drawn only when asked for.
        h('div', mergeAttrs(part('arrow'), { key: 'arrow', hidden: !v.arrow, ref: v.refs.arrow })),
        h(
            'button',
            mergeAttrs(part('closeButton'), {
                key: 'close',
                type: 'button',
                hidden: !shown('close'),
                disabled: disabled('close'),
                'aria-label': locale.tour.close,
                ref: v.refs.close,
                onClick: v.on.close
            }),
            iconNode(closeIcon)
        ),
        image ? h('img', mergeAttrs(part('image'), { key: 'image', src: image.src, alt: image.alt ?? '' })) : null,
        h('div', mergeAttrs(part('title'), { key: 'title', id: titleId, hidden: !title, ref: v.refs.title }, text(title)), v.allowHtml ? null : title),
        h('div', mergeAttrs(part('description'), { key: 'description', id: descriptionId, hidden: !description, ref: v.refs.description }, text(description)), v.allowHtml ? null : description),
        v.content ? h('div', mergeAttrs(part('content'), { key: 'content' }), v.content) : null,
        h(
            'div',
            mergeAttrs(part('footer'), { key: 'footer', ref: v.refs.footer, hidden: !v.showProgress && !shown('next') && !shown('previous') }),
            progress(),
            h(
                'span',
                mergeAttrs(part('footerButtons'), { key: 'buttons', ref: v.refs.footerButtons }),
                h(
                    'button',
                    mergeAttrs(part('previousButton'), {
                        key: 'previous',
                        type: 'button',
                        hidden: !shown('previous'),
                        disabled: disabled('previous'),
                        ref: v.refs.previous,
                        onClick: v.on.previous
                    }),
                    v.previousText
                ),
                h(
                    'button',
                    mergeAttrs(part('nextButton'), {
                        key: 'next',
                        type: 'button',
                        hidden: !shown('next'),
                        disabled: disabled('next'),
                        ref: v.refs.next,
                        onClick: v.on.next
                    }),
                    v.nextText
                )
            )
        )
    ) as VElement;

    return [overlay, popoverEl];
}
