// Remark plugins
import remarkDirective from 'remark-directive'
import remarkMarkmap from 'remark-markmap'
import remarkCallout from '@r4ai/remark-callout'
import { remarkSetCodeCollapse } from './remark-set-code-collapse'
import remarkDirectiveWidgets from './remark-directive-widgets'
export const remarkPlugins = [
  remarkDirective,
  remarkDirectiveWidgets,
  remarkCallout,
  remarkMarkmap,
  remarkSetCodeCollapse
]

// Rehype plugins
export const rehypePlugins = [

]
