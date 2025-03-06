import { htmlToJsx } from "../../util/jsx"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

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

export default (() => Content) satisfies QuartzComponentConstructor
