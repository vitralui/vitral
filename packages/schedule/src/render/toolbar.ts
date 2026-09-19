import { visuallyHidden } from '@vitral/core';
import { h, mergeAttrs, type Child } from '@vitral/dom';
import { iconView } from './icon';
import { content, type ViewContext } from './context';

/**
 * The bar over the grid: back, forward, today, the period on show, and the
 * views on offer. A host that wants its own draws it through `content.toolbar`
 * and gets the same four actions.
 */
export function toolbarView(context: ViewContext): Child {
    const { part, locale } = context;
    const own = content(
        context.config.content?.toolbar?.({
            title: context.title,
            view: context.models.view,
            views: context.views,
            date: context.models.date,
            prev: context.on.prev,
            next: context.on.next,
            today: context.on.today,
            setView: context.on.setView
        })
    );
    // The title names the grid, so it is there either way: on show in the
    // toolbar, or for a reader alone when the host drew its own.
    if (own !== null) return [own, titleOnly(context)];
    if (context.config.toolbar === false) return titleOnly(context);

    const button = (options: { key: string; label: string; icon?: string; text?: string; state: Record<string, unknown>; pressed?: boolean; onClick: () => void }) =>
        h(
            'button',
            mergeAttrs({ key: options.key, type: 'button' }, context.buttonPart('root', options.state), {
                'aria-label': options.text ? undefined : options.label,
                'aria-pressed': options.pressed === undefined ? undefined : options.pressed ? 'true' : 'false',
                onClick: options.onClick
            }),
            options.icon ? iconView(options.icon, context.buttonPart('icon')) : null,
            options.text ? h('span', context.buttonPart('label'), options.text) : null
        );

    return h(
        'div',
        mergeAttrs({ key: 'toolbar' }, part('toolbar')),
        h(
            'div',
            mergeAttrs({ key: 'nav' }, part('nav')),
            button({
                key: 'prev',
                label: locale.schedule.previous,
                icon: 'chevronLeft',
                state: { variant: 'text', severity: 'secondary', iconOnly: true },
                onClick: context.on.prev
            }),
            button({
                key: 'next',
                label: locale.schedule.next,
                icon: 'chevronRight',
                state: { variant: 'text', severity: 'secondary', iconOnly: true },
                onClick: context.on.next
            }),
            button({ key: 'today', label: locale.today, text: locale.today, state: { variant: 'outlined', severity: 'secondary', size: 'small' }, onClick: context.on.today })
        ),
        h('div', mergeAttrs({ key: 'title', id: context.ids.title, 'aria-live': 'polite' }, part('title')), context.title),
        context.views.length > 1
            ? h(
                  'div',
                  mergeAttrs({ key: 'views', role: 'group' }, part('views'), { 'aria-label': locale.schedule.views }),
                  context.views.map((view) =>
                      button({
                          key: view,
                          label: locale.schedule[view],
                          text: locale.schedule[view],
                          state: { size: 'small', variant: view === context.models.view ? 'filled' : 'text', severity: view === context.models.view ? 'primary' : 'secondary' },
                          pressed: view === context.models.view,
                          onClick: () => context.on.setView(view)
                      })
                  )
              )
            : null
    );
}

/** The period on show, where only a reader who cannot see the toolbar needs it. */
const titleOnly = (context: ViewContext): Child => h('div', { key: 'title-only', id: context.ids.title, style: visuallyHidden }, context.title);
