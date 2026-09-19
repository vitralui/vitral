import { h, mergeAttrs, type Child } from '@vitral/dom';
import { colorOf, infoOf, isEditable, timeTextOf, titleTextOf } from '../engine/state';
import type { Occurrence } from '../engine/types';
import { content, type ViewContext } from './context';

/**
 * One event: a button named by its title and full time. It carries its colour
 * as a custom property, so the look stays in the stylesheet, and an end edge
 * to drag when it can be resized.
 */

export type EventVariant = 'timed' | 'span' | 'list' | 'lane';

export interface EventOptions {
    variant: EventVariant;
    continuesBefore?: boolean;
    continuesAfter?: boolean;
    /** Which edge resizes it, if any. */
    resize?: 'bottom' | 'end' | null;
    style?: Record<string, string>;
    key?: string;
}

export function eventView(context: ViewContext, occurrence: Occurrence, options: EventOptions): Child {
    const { part, locale, settings } = context;
    const editable = isEditable(occurrence, settings);
    const time = timeTextOf(occurrence, locale, context.config.hour12);
    const own = content(
        context.config.content?.event?.({
            event: occurrence.event,
            occurrence: infoOf(occurrence),
            timeText: time,
            view: context.models.view
        })
    );
    return h(
        'button',
        mergeAttrs(
            { key: options.key ?? occurrence.key, type: 'button' },
            part('event', {
                variant: options.variant,
                editable,
                dragging: context.dragging === occurrence.key,
                allDay: occurrence.allDay,
                continuesBefore: options.continuesBefore,
                continuesAfter: options.continuesAfter
            }),
            {
                'data-vt-event': occurrence.key,
                'aria-label': context.labelOf(occurrence),
                'aria-describedby': editable && options.variant !== 'list' ? context.ids.eventHelp : undefined,
                style: { '--vt-schedule-event-accent': colorOf(occurrence, context.resources), ...options.style },
                onClick: (event: MouseEvent) => context.on.eventClick(event, occurrence),
                onKeydown: (event: KeyboardEvent) => context.on.eventKeydown(event, occurrence),
                onPointerdown: (event: PointerEvent) => options.variant !== 'list' && context.on.eventPointerdown(event, occurrence, 'move')
            }
        ),
        own ??
            [
                time && options.variant !== 'timed' ? h('span', part('eventTime'), options.variant === 'list' ? time : context.formatTime(occurrence.start)) : null,
                h('span', part('eventTitle'), titleTextOf(occurrence, locale)),
                time && options.variant === 'timed' ? h('span', part('eventTime'), time) : null
            ],
        options.resize && editable
            ? h(
                  'span',
                  mergeAttrs({ key: 'resizer', 'aria-hidden': 'true' }, part('resizer', { edge: options.resize }), {
                      onPointerdown: (event: PointerEvent) => context.on.eventPointerdown(event, occurrence, 'resize')
                  })
              )
            : null
    );
}
