import type { ShikiTransformer } from '@shikijs/types';
import type { Element } from 'hast';

export const setCodeLength: ShikiTransformer = {
    name: 'set-code-length',
    // 使用 transformers 为 code 添加代码行数，并且指定为代码块，以便在 CodeBlock 组件中处理
    code(ctx) {
        ctx.properties['data-line-length'] = ctx.children.length;
    },
    pre(ctx) {
        console.log(this.options.structure);
        const isInline = this.options.structure === 'inline';
        if (isInline) return;
        ctx.children.forEach((child) => {
            (child as Element).properties['data-code-block'] = true;
        });
    }
};
