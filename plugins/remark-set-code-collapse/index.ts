import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { Plugin } from 'unified';

export const remarkSetCodeCollapse: Plugin<[], Root> = () => {
    return (tree) => {
        visit(tree, 'code', (node) => {
            const length = node.value.split('\n').length;
            if (length > 20) {
                node.meta = (node.meta || '')
                    .split(' ')
                    .filter((item) => {
                        return !item.startsWith('collapse=');
                    })
                    .concat([`collapse={16-${length}}`])
                    .join(' ');
            }
        });
    };
};
