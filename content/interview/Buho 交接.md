
参考：

1. [next.js文档](https://nextjs.org/) 需要看 page router 这一块
2. [next-i18next](https://github.com/i18next/next-i18next) 翻译
3. [strapi 文档](https://docs.strapi.io/cms/intro) 需要看 v4 版本
4. [unified](https://github.com/unifiedjs/unified) 还要看 remark rehype 等插件
5. [react-markdown](https://github.com/remarkjs/react-markdown)

## 一些全局组件

### Header - components/layout/Header/Header.jsx

1. header 虽然不会吸附在顶部，但是因为要保证 header 到页面的背景颜色过渡（比如 summer-sale 中 hero 的背景图），所以 header 不能占据高度；所以 header 是 absolute 定位；然后使用 `_common.scss` 中的 `--height-header` 为 header 预留出高度。
2. 因为网站不同页面背景颜色不同，并且需要根据背景颜色设置：header 字体颜色；body 背景颜色（影响到滚动条的颜色）。所以在 locale.config.js 中定义了每个页面是浅色还是深色，然后在 ClassComponent 中为 `isWhiteBg` 这个全局变量赋值。可以使用 `const { isWhiteBg } = useTrackedStore();` 获取当前页面是深色还是浅色。
3. header 在移动端会缩小
4. 如果需要 header-tag 可以打开 promotion 片段的注释。具体实现请见 components/Promotion/HeaderTag/HeaderTag

### Footer - components/layout/Footer/Footer.jsx

#### 语言展示

因为不同的页面有不同的语言支持，所以在 locale.config.js 中静态维护了页面支持的语言。静态页面支持的语言基本是确定的，Footer 直接拿到支持的语言数组即可；

有些动态页面，比如博客页面支持的语言应该随着后台的变化而变化，此时只有从后端请求回来再传递给 Footer。但是因为 Footer 是在顶层（后续或许可以重构到页面之中，而不是 layout 中）所以由页面支持的语言传递到很麻烦，还是使用了一个全局变量 langList 进行存储。可以使用 `const { langList } = useTrackedStore();` 进行获取。

注意 langList 需要在动态语言的页面使用 `setLangList` 进行设置，尽量在 useEffect 中进行。

目前使用自定义的 Select 组件进行展示，该组件的实现可能不太好。

### _app.jsx - pages/_app.jsx

重点在于使用 DefaultSeo 设置页面默认的 seo 标签。

```jsx
// useLanguageAlternate 位于 util/hooks/useLanguageAlternate.js
// 用于生成网站主要网址和其他语言网址。
// 可以接受一个参数，langList 也就是指定 哪些语言。对于静态页面，直接返回 locale.config.js 中的配置。
// 对于由后端指定多语言的页面，返回的多语言为空数组，这是为了避免出现 404 的情况。再由页面自己传入 langList 可以参考 博客页面。
// 对于 404 页面不会有其他语言的 link 因为 404 页面进去还是 404 。。。 所以没加。具体的可以看代码
const [canonical, languageAlternates] = useLanguageAlternate();

// DefaultSeo 为页面设置默认的 SEO 标签，源于 https://github.com/garmeeh/next-seo
<DefaultSeo  
  canonical={canonical}  // 是一个链接，将会在 head 中添加  <link rel="canonical" href="https://www.drbuho.com">
  languageAlternates={languageAlternates}  // 是一个数组，就将会添加 <link rel="alternate" hreflang="zh-TW" href="https://www.drbuho.com/zh-tw"> 这样的多语言标签
  additionalLinkTags={[{ rel: 'icon', href: '/icon.png' }]}  
  additionalMetaTags={[  
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },  
    { name: 'dmca-site-verification', content: 'VWtmbzNpU20xQ1lJcjc1ZStZVXdnZz090' },  
  ]}  
  openGraph={{  
    type: 'website',  
    siteName: 'Dr.Buho',  
    url: canonical,  
  }}  
  norobots  
/>
```

注意：动态语言的页面必须使用 NextSeo 进行覆盖，参考博客页面。不然的话就不会有其他语言的 link 标签。

### ClassComponent - components/ClassComponent.jsx

因为 class 组件有着很明确的生命周期，用于设置一些全局变量非常合适，比如设置了前面提到的 isWhiteBg(页面背景是否是浅色)，因为这个变量只需要页面的 pathname 所以可以直接在 getDerivedStateFromProps 中进行设置，而不会出现水合错误的问题。

又因为在 getDerivedStateFromProps 进行了设置，并且 ClassComponent 更先执行，所以后续的所有组件都可以拿到正确的 isWhiteBg。

### Layout - components/layout/Layout.jsx

布局组件，其实可以考虑把 Layout 放到页面中进行渲染，这样传递参数更简单。

### ImageBanner - components/Promotion/ImageBanner/ImageBanner.jsx

底部 banner 组件，目前实现非常简单：

1. 背景图，需要 pc 端和 sp 端两张图片。目前在小于 640px 时切换为 sp 端图片
2. 按钮，是一个 svg
3. close svg
4. 按钮可能的背景特效

#### 如何设置背景图

在 common.json 中进行设置。可以根据产品进行设置。

```json
"topBanner": {  
  "default": {  
    "pc": "/images/promotion/2025/summer/banner-60-en@2x.png",  
    "sp": "/images/promotion/2025/summer/banner-60-en-sp@2x.png"  
  },  
  "default_info": {  
    "pc": {  
      "width": 2880,  
      "height": 180  
    },  
    "sp": {  
      "width": 750,  
      "height": 100  
    }  
  },  
  "BuhoUnlocker": {  
    "pc": "/images/promotion/2025/summer/banner-60-en@2x.png",  
    "sp": "/images/promotion/2025/summer/banner-60-en-sp@2x.png"  
  },  
  "BuhoRepair": {  
    "pc": "/images/promotion/2025/summer/banner-60-en@2x.png",  
    "sp": "/images/promotion/2025/summer/banner-60-en-sp@2x.png"  
  },  
  "BuhoNTFS": {  
    "pc": "/images/promotion/2025/summer/banner-60-en@2x.png",  
    "sp": "/images/promotion/2025/summer/banner-60-en-sp@2x.png"  
  }  
},
```


#### 为什么按钮也使用图片

为了让 按钮 随着图片的变小一起变小，使用元素无法做到这么好，主要是字体这一块。

#### 如何设置按钮的位置

我在 components/Promotion/ImageBanner/ImageBanner.module.scss 中对按钮使用 calc 对 width 进行了计算。

然后使用 padding-top 保证宽高比正常。

然后在使用 absolute 定位和 right 保证定位正常。

所以需要提供 width, height, right 这三个变量，然后 css 会进行计算。

```scss
.btn {  
  // 其实就是计算百分比
  width: calc(var(--btn-width) / 1440 * 100%); // 1440 是因为图片都是按照 1440 进行设计的
  right: calc(var(--btn-right) / 1440 * 100%);  
  
  &::after {  
    content: "";  
    display: block;  
    width: 100%;  
    position: relative;  
    // 计算宽高比，aspect-ratio 的兼容性还没那么好
    padding-top: calc(var(--btn-height) / var(--btn-width) * 100%);  
    z-index: 10;  
  }  
  
  @media (max-width: $sm) {  
    width: calc(var(--btn-width) / 375 * 100%);  // sp 端都是按照 375 进行设计的
    right: calc(var(--btn-right) / 375 * 100%);  
  }  
}
```

#### 如何设置 button 图片

同样在  components/Promotion/ImageBanner/ImageBanner.module.scss 中设置。

```scss
$background-image-list: zh-tw tw,  
jp jp,  
de de,  
fr fr,  
es es,  
it it,  
ko ko;  
// 默认使用的 button svg
.btn-inner {  
  background-image: url('/images/promotion/2025/summer/btn-en.svg');  
  background-size: auto 100%;  
  background-repeat: no-repeat;  
  display: block;  
  
  @media (max-width: $sm) {  
    background-image: url('/images/promotion/2025/summer/btn-en-sp.svg');  
  }  
}  
// 不同语言使用不同的 button 图片
@each $lang, $path in $background-image-list {  
  :lang(#{$lang}) {  
    .btn-inner {  
      background-image: url('/images/promotion/2025/summer/btn-#{$path}.svg');  
      background-size: auto 100%;  
      background-repeat: no-repeat;  
      display: block;  
  
      @media (max-width: $sm) {  
        background-image: url('/images/promotion/2025/summer/btn-#{$path}-sp.svg');  
      }  
    }  
  }  
}
```

### _middleware.js

用于重定向，比如说 buhorepair 页面仅仅支持 en, zh-tw, jp, de 当用户访问 /es/buhorepair 的时候，就会进入 middleware 进行判断，是否需要重定向，应该重定向到哪个语言。

#### 大概的逻辑

使用了 util/link.js 中的 getHrefSupportLocale

大概逻辑就是：

将会有 linkLocale, cookieLocale, routerLocale 三个 locale 有不同的优先级

linkLocale 就是 `<Link locale={"zh-tw"}></Link>` 这样的 locale; 但是一般不会在 Link 中指定 locale 。还有就是 `<Link href="/zh-tw/buhorepair"></Link>` 这样的话 linkLocale 也是 zh-tw

cookieLocale 就是当前 Cookie 中存储的 locale 值

routerLocale 就是当前路由的 locale 比如 /zh-tw/bnuhorepair 那么 routerLocale 就是 zh-tw

优先级最高自然是， linkLocale 一般都是手动指定的。

优先级第二高是 cookieLocale 因为之前有一个需求就是，将会记住用户的语言选择，后续用户再次进入时，将会重定向到之前的语言；将 locale 存储在 cookie 中是因为 cookie 将会自动携带，那么服务器就可以直接重定向。而不是在客户端执行 js 后获取 locale 再重定向。

最后就是 routerlocale 使用的最多的就是这个。主要是页面中的链接跳转，一般都是希望跳转到同语言的。比如 在 /de/buhorepair 中点击下载页，自然是希望跳转到 /de/buhorepair/buy 的所以用的最多。

根据上面三个 locale 获取到最后的 locale；然后去检查当前页面是否支持这个 locale；如果支持就不重定向。如果不支持，那么就拿出支持的 langList 返回第一个语言。

### subheader

没啥特别的，但是代码有点丑陋，有些地方需要重构。

### BuyProvider - components/buy/BuyProvider.jsx

重点！

这个组件，主要是为了简化计算购买信息这一块；

```jsx
export default function BuyProvider({  
  children,  
  currency: currencyProps,  
  symbol,  
  planInfo,  
  platform,  
  promotion,  
  product,  
  supportedCurrency,  
  callback,  
}) {
  // 获取当前货币
  const defaultCurrency = useCurrency(supportedCurrency);  
  const currency = currencyProps || defaultCurrency;  
  // 获取平台相关信息
  const platformInfo = usePlatformInfo({  
    platform,  
    promotion,  
    currency,  
  });  
  // 获取价格信息；使用 currency 筛选出需要用到的价格。为价格添加 $ 等货币符号。格式化价格，比如日元添加逗号
  const priceInfo = usePriceInfo({ planInfo, symbol, currency });  
  
  // TODO 在这里加载购买平台  
  // 传递给 children 这样就可以直接使用准备好的内容。
  return <>{children({ ...priceInfo, ...platformInfo, currency, product })}</>;  
}
```

然后根据不同的产品，新增了

1. CleanerBuyProvider
2. UnlockerBuyProvider
3. RepairBuyProvider
4. UnlockerAndRepairBuyProvider

等，简化操作。

#### 如何设置价格

在 config 文件夹中，找到对应的配置文件；例如 config/buy.buhontfs.config.js 直接修改静态价格即可。

config/buy.buhontfs.config.js 目前是最新的配置的内容。后续可以按照这个进行配置，和对其他文件的修改。

不再需要其他配置文件中的  currencyAsKey 这个函数。统一使用 processInfo 和 上面的 BuyProvider 即可。


### ScrollReveal

滚动时，其他元素慢慢浮现。可以使用 intersectionObserver 重构。还可以使用 useRef 优化 useEffect 每次都执行这一块，优化性能。

使用示例：

```jsx
<ScrollReveal ref={revealRef}>
	<div data-parallax-container="Hero">
		<div data-parallax="Hero" data-parallax-duration={1500} data-parallax-delay={400}></div>
	</div>
</ScrollReveal>
```

data-parallax="Hero" 可以没有值，没有值的话，滚动到当前元素，就触发。

如果有值，比如这里的 data-parallax="Hero" 滚动到 `div[data-parallax-container="Hero"]` 这一块就触发。

data-parallax-duration={1500} 这是浮现的时长

data-parallax-delay={400} 设置 delay

## 其他页面

### 产品页面

没什么特别的，大多都是样式方面的内容

### 下载页面

需要注意 /buhocleaner/download 下载页面中的 DownloadSwiper 组件（这个组件在其他地方也用到过）逻辑比较混乱，还用了 swiper 依赖，有一些小 bug。

### 购买页面

购买相关的尽量使用上面说到的 BuyProvider 及其衍生组件。

#### 加载平台

使用 LoadPaymentPlatform 组件，该组件可以重构优化一下。主要作用是使用 script 加载平台的 js 然后注册对应的回调，用于记录事件。

#### 购买 banner

使用 BuyBanner 组件，使用 buy_common.json 设置 banner 与 ImageBanner 类似。

### guide 页面

没什么特殊的，详细查看博客页面。

### 促销页面

可以参考 golden-week-sale 的做法。

### 其他信息页面 (terms, about...)

没有特殊的

### 博客首页 - pages/[category]/index.jsx

#### 服务器端部分

首先会进入  getServerSideProps

然后获取 categoryList 获取所有的，没有被隐藏的 category

然后通过 category 这个参数，找到现在页面的 category 赋值为 currentCategory

如果 currentCategory 不存在，比如 /xx 页面 category 就是 xx ，后端肯定不存在这个 category 所以直接返回 notFound

然后使用 getLangList 获取当前 category 支持的语言。因为 /[category] 页面是动态语言页面，所以需要在服务器端获取。

如果 category 是 blog 那么应该获取所有 category 下的 topic 和最新的文章。并进行返回，再由前端进行展示。

如果不是 blog 那么应该一边组装面包屑，一边获取 topic 和文章（文章需要进行分页）

#### 前端部分

渲染没有什么特别的。但是因为 /[category] 是后端设置语言的页面。

所以需要拿出 props 中的 langList，做两件事情，在上面也都提过

1. 设置 langList，保证 footer 可以正确渲染切换语言
2. 使用 useLanguageAlternate 并设置 NextSeo 保证渲染 head 中正确的 link 标签

### 博客详情部分 - /[category]/[slug].jsx

这个 jsx 文件将会根据 props 渲染两种页面

#### 博客文章页面

最常见的情况

首先根据 slug 参数去获取文章详情，如果文章存在，那么就认为就应该渲染博客文章，不考虑出现 topic 和 文章 slug 一样的情况。

然后根据 category 获取所有 topic 下所有的文章。这样就可以通过文章的 slug 找到对应的 topic，有两个作用 

1. 组装 面包屑
2. 在文章页面展示 topic 侧边栏

可能会出现一个文章被两个 topic 所有的情况，以第一个 topic 为准。

然后开始获取文章的相关信息，比如 langList, author, 更新时间等等，可以看 util/article.js 中的 getArticleInfo 函数，这是一个管道。

此时文章还是 markdown 的内容，所以还需要进行处理可以看 util/article.js 中的 processArticleUsingUnified函数。主要的内容就是通过 unified 的插件进行一系列的转化。经过转化后，会变成 html 内容。

最后在吧内容传递给前端。

#### topic 页面

如果没有获取到文章内容，那么就认为这是一个 topic 所以需要渲染 topic 页面

那么就通过 slug 获取 topic 的信息，比如分页，topic 下的文章等。当然也有 langList

然后传递给前端。

#### 前端部分

首先根据 type 判断是渲染 topic 页面还是 文章页面，两者样式，布局都不同，所以需要判断进行渲染。

---

文章页面

首先依然根据 langList 执行 `setLangList` 和 `useLanguageAlternate` 

文章页面设置了 ArticleJsonLd 这个，将会渲染出

```html
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","datePublished":"2022-03-09 04:07:53","description":"¿Buscas cómo desinstalar Microsoft Office en Mac? No busques más. En este artículo aprenderás a eliminar completamente Office 2011, 2016, 2019 y 365 de tu Mac.","mainEntityOfPage":{"@type":"WebPage","@id":"https://www.drbuho.com/es/how-to/uninstall-microsoft-office-on-mac"},"headline":"Cómo desinstalar Microsoft Office completo en Mac: paso a paso","image":["https://www.drbuho.com/str-apiv4/uploads/uninstall_microsoft_office_cover_053a13df17.jpg"],"dateModified":"2024-07-09 04:00:20","author":{"@type":"Person","name":"Sofia"},"publisher":{"@type":"Organization","name":"Dr.Buho","logo":{"@type":"ImageObject","url":"https://www.drbuho.com/images/logo.png"}}}</script>
```

这样的东西，表明这是一片文章。

渲染各项组件的话，没有什么特别的。

主要是渲染文章内容那一块，使用了 react-markdown 用于将 html 中的自定义组件渲染为 React 组件。自定义组件也就是博客中用到的组件在 config/blog/component.js 这一块。内容比较杂，而且有些逻辑也比较混乱，麻烦了🙏。

还有博客的样式都在 blog.scss 中也比较杂乱。然后博客还添加了 localeClass

```js
const localeClass = useMemo(() => {  
  switch (router.locale) {  
    case 'zh-tw':  
    case 'jp':  
      return router.locale;  
    default:  
      return 'en';  
  }  
}, [router.locale]);
```

这一块目前是需要的，每个需要用到 markdown 渲染的可能都是需要的，不同的语言下，将会用到不同的字体，字体大小，行间距等。后面可能使用 :lang 会好一点。

---

topic 页面渲染没啥特别的，就是普通渲染逻辑。