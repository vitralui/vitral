/**
 * The components that have a playground, known up front so the page can list
 * it in its contents before the playground itself (and the components it
 * draws) has been fetched. Kept in step with `./playgrounds` by its test.
 */
export const playgroundNames = new Set([
    'Button',
    'Tag',
    'Badge',
    'Avatar',
    'Chip',
    'Message',
    'InputText',
    'Textarea',
    'InputNumber',
    'Select',
    'ToggleSwitch',
    'Checkbox',
    'Slider',
    'Rating',
    'ProgressBar',
    'Skeleton',
    'DataGrid',
    'Taskboard'
]);
