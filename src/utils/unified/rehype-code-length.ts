import type { Plugin } from 'unified';
import type { Root } from 'hast';
import { visitParents } from 'unist-util-visit-parents';

export const rehypeCodeLength: Plugin<[], Root> = () => {
    return (tree) => {
        visitParents(tree, { type: 'element', tagName: 'code' }, (node, ancestors) => {
            const parent = ancestors.at(-1);
            if (parent?.type !== 'element' || parent.tagName !== 'pre') {
                return;
            }
            if (parent.children.length !== 1) {
                return;
            }
            let length = 0;
            node.children.forEach((child) => {
                if (child.type === 'element' && child.tagName === 'span') {
                    length += 1;
                }
            });
            parent.properties.dataCodeLength = length;
        });
    };
};
