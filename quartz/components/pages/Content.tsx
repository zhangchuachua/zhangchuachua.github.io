import { htmlToJsx } from "../../util/jsx"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import script from '../scripts/img-zoom.inline'

const Content: QuartzComponent = ({ fileData, tree }: QuartzComponentProps) => {
  const content = htmlToJsx(fileData.filePath!, tree)
  const classes: string[] = fileData.frontmatter?.cssclasses ?? []
  const classString = ["popover-hint", ...classes].join(" ")
  return <article data-article class={classString}>{content}</article>
}

Content.css = `
  .medium-zoom-image--opened {
    z-index: 999;
  }
`

Content.afterDOMLoaded = script;

export default (() => Content) satisfies QuartzComponentConstructor
