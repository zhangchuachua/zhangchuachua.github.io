import type { Plugin } from 'unified';
import type { Root } from 'hast';
import { selectAll } from 'hast-util-select';

export const rehypeSetCodeClass: Plugin<[], Root> = () => {
    return (tree) => {
        console.log('rehype-set-');
        selectAll('div.expressive-code', tree).forEach((node) => {
            console.log(node);
        });
    };
};
