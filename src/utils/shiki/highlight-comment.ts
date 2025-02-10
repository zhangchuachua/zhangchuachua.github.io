import type { ShikiTransformer } from '@shikijs/types';

const supportedLang = new Set(['js', 'ts', 'jsx', 'tsx', 'cjs', 'mjs', 'rs', 'javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'rust']);
export const highlightComment: ShikiTransformer = {
    name: 'highlight-comment',
    tokens(tokens) {
        for (let i = 0; i < tokens.length; i++) {
            if (!this) return;
            if (!supportedLang.has(this.options.lang)) return;
            const token = tokens[i];
            token.forEach((line) => {
                const str = line.content.toLowerCase().trim();
                switch (true) {
                    case str.startsWith('// *'): {
                        line.color = '#98C379';
                        break;
                    }
                    case str.startsWith('// ?'): {
                        line.color = '#3498DB';
                        break;
                    }
                    case str.startsWith('// todo'): {
                        line.color = '#FF8C00';
                        break;
                    }
                    case str.startsWith('// !'): {
                        line.color = '#FF2D00';
                        break;
                    }
                    default: {
                        break;
                    }
                }
            });
        }
    }
};
