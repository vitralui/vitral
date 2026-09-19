import { iconNode, type Child, type Props } from '@vitral/dom';
import { getIcon } from '@vitral/icons';

/** An icon by name, drawn the way the icon component draws it. */
export const iconView = (name: string, props?: Props): Child => iconNode(getIcon(name), props);
