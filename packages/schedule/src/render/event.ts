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
export type ResizerEdge = 'top' | 'bottom' | 'start' | 'end';

export interface EventOptions {
    variant: EventVariant;
    continuesBefore?: boolean;
    continuesAfter?: boolean;
    /** Which edges resize it, if any. */
    resizers?: ResizerEdge[];
    /** @deprecated */
    resize?: ResizerEdge | null;
    short?: boolean;
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
            occurrence: infoOf(occurrence, context.settings.timeZone),
            timeText: time,
            view: context.models.view
        })
    );
    const resizerList: ResizerEdge[] = options.resizers ?? (options.resize ? [options.resize] : []);
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
                continuesAfter: options.continuesAfter,
                short: options.short
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
        editable && resizerList.length
            ? resizerList.map((edge) =>
                  h(
                      'span',
                      mergeAttrs({ key: `resizer-${edge}`, 'aria-hidden': 'true' }, part('resizer', { edge }), {
                          onPointerdown: (event: PointerEvent) => context.on.eventPointerdown(event, occurrence, 'resize', edge)
                      })
                  )
              )
            : null
    );
}
