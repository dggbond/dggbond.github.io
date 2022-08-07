---
title: "React Theme Manager"
date: 2022-08-07T01:48:59+08:00
draft: false
language: cn
type: page
---
如何用 React 实现一套完整的主题切换方案
<!--more-->

## 设计

像这种全局配置的场景，用 `context` 来实现基本上是再适合不过了，所以大致思路就是：

- 生产端：使用 `context provider` 实现 `ThemeManagerProvider`
- 配置端：用户可以基于提供的基本配置类型 `ThemeConfig` 来配置自己的主题类型
- 消费端：使用 `useContext` 实现 `useTheme`

接下来考虑的就是 `ThemeConfig` 需要支持哪些内容，在我看来至少需要支持下面这些内容：

- 最基本的需要支持 `colors` 的配置，提供不同主题下的颜色使用
- 动态的 css 导入，在某些场景下使用第三方 cdn css 的时候，可能需要提供不同的 css 地址
- 其他各种自定义字段的配置，比如 icon，图片这些内容，这些内容用户自己配置即可


## 代码实现

### ThemeProvider

根据我们的基本思路，使用 `React.createContext()` 构建一个 context 对象，然后将其 `Provider` 包装一下即可，
大致的代码如下：

```tsx
export interface ThemeManagerProps {
  theme: ThemeConfig
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>
}

const ctx = React.createContext<ThemeManagerProps>({} as ThemeManagerProps)

interface ThemeManagerProviderProps {
  defaultTheme: ThemeConfig
  children: React.ReactNode | React.ReactNode[]
}

export const ThemeManagerProvider: React.FC<ThemeManagerProviderProps> = ({ defaultTheme, children }) => {
  const [theme, setTheme] = React.useState<ThemeConfig>(defaultTheme)

  React.useEffect(() => {
    // TODO：这里待会需要实现对于主题的渲染操作
    // 比如设置 css 变量，获取 css 链接 等
    renderTheme(theme)
  }, [theme])

  return <ctx.Provider value={{
    theme,
    setTheme,
  }}>
    {children}
  </ctx.Provider>
}

export default ctx
```

### Render Theme

Theme 的渲染最主要的就是将设置好的 colors 设置到浏览器中，在这个过程中我们需要做几件事情：
1. 将变量名从驼峰转换成 css variable 使用的格式，eg: `primaryColor -> --primary-color`
2. 让 css 变量生效

转驼峰的逻辑比较简单，使用 `replace` 方法 + 正则即可完成:
```tsx
// convert camel-style variable to css variable style
// eg: primaryColor --> --primary-color
const convertCamelToCssVar = (camelName: string) => {
  return '--' + camelName.replace(/([A-Z])/, ($) => '-' + $.toLowerCase())
}
```

接下来就是让变量生效，这里可以使用 [`CSSStyleSheet.insertRule`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule) 来实现插入 css 的操作，为了不在每次切换主题的时候都会重复的插入 style，这里需要使用
一个固定的 `id`，当发生切换的时候，需要将之前的 style 移除，保证只有新的 style 生效。

```tsx
export interface ThemeConfig {
  colors: Record<string, string>
}

const THEME_STYLE_ID = 'theme-style'

export const renderTheme = (theme: ThemeConfig) => {
  /// check if there exist theme style or not
  /// if there is, delete first
  const existStyle = document.querySelector(`style#${THEME_STYLE_ID}`)

  if (existStyle) {
    existStyle.remove()
  }

  const style = document.createElement('style')
  style.id = THEME_STYLE_ID

  document.head.appendChild(style)

  style.sheet?.insertRule(`:root {
    ${Object.entries(theme.colors).map(([k, v])=> `${convertCamelToCssVar(k)}:${v};`).join('\n')}
  }`, 0);
}
```

### useTheme

`useTheme` 的实现也非常简单，直接返回 ctx 的内容即可

```tsx
export const useTheme = (): ThemeManagerProps => useContext(ctx)
```

## 实践优化

接下来就是在实际的项目中使用我们写的主题管理了，下面是我简单定义的两个主题：
```tsx
interface MyThemeConfig extends ThemeConfig {
  name: string;
}

const ThemeLight: MyThemeConfig = {
  name: 'light',
  colors: {
    fontColor: 'black',
    backgroundColor: 'white',
  },
}

const ThemeDark: MyThemeConfig = ...

export const themes: Record<string, MyThemeConfig> = {
  light: ThemeLight,
  dark: ThemeDark,
}
```

生产端使用 `ThemeManagerProvider`，并没有什么问题
```tsx
  <ThemeManagerProvider defaultTheme={themes.light}>
    <App />
  </ThemeManagerProvider>
```

### useTheme 类型补全

消费端使用 `useTheme`，这里我马上就遇到了第一个问题，由于我们的代码中全部都是使用 `ThemeConfig` 来作为 Theme 的
类型，在 `useTheme` 中拿到的 `theme` 并不是我们自己定义的 `MyThemeConfig`，所以就无法访问里面的 `name` 属性

![ThemeConfig no property](/images/theme-config-no-property.jpg)

如何解决这个问题？因为我们没办法强制定义用户要使用的 Theme 类型，这个时候 [`范型`](https://www.typescriptlang.org/docs/handbook/2/generics.html)就派上用场了

```tsx
// Provider
export interface ThemeManagerProps<T extends ThemeConfig> {
  theme: T
  setTheme: React.Dispatch<React.SetStateAction<T>>
}

// 由于这里并没有什么方式可以让用户把类型给传进来，所以这里就写 any 即可
const ctx = React.createContext<ThemeManagerProps<any>>({} as ThemeManagerProps<any>)

// useTheme
export const useTheme = <T extends ThemeConfig>(): ThemeManagerProps<T> => useContext(ctx)
```
使用范型改写后，再使用 `useTheme<MyThemeConfig>()` 就可以完美支持自定义的主题类型了。

目前咱们的主题切换效果：

![ThemeManager Sample](/images/theme-manager-sample1.gif)

截止目前，整个主题管理已经可以正常的运行了:tada::tada::tada:

### inline style 支持

在某些时候，我们在写样式为了图方便会直接写在 `style` 中，整个时候再去写 `var(--font-color)` 这种写法就显得不是很友好了，
所以我们需要提供一种方式能够直接读到对应的变量，比较简单粗暴的方式就是直接增加一个转换方法即可，实现如下

```tsx
export const v = (colorName: string) => `var(${convertCamelToCssVar(colorName)})`
```

这样在写 style 的时候，就可以直接使用 `v(theme.colors.xxx)` 即可

### colors 类型提示

使用的过程中会发现，我们在使用 `colors` 的时候，ts 并不会告诉我们其中有哪些字段，这样我们需要经常去查，
所以这里我们也需要使用范型对其进行改造

第一步：改造 `ThemeConfig`

```tsx
export interface ThemeConfig<T = {}> {
  colors: T
}
```

第二步：改造 `MyThemeConfig`

```tsx
interface ThemeColors {
  fontColor: string,
  backgroundColor: string,
}

export interface MyThemeConfig extends ThemeConfig<ThemeColors> {
  name: string
}
```
经过这两步改造之后，在读取 theme 中的 `colors` 就可以完美的享受类型提示了

![Theme Colors Fix](/images/theme-colors-fix.jpg)

## 细节打磨

### 渐变转换

目前的主题切换，颜色的过渡会非常生硬，所以可以加上一定的过渡动画来让其变得舒服些。

思路其实非常简单，直接给所有的元素都加上 `transition` 即可，和插入 Theme Style 不同的是，这里
只需要插入一次就可以了

```tsx
export const insertTransitionStyle = () => {
  /// check if there exist theme style or not
  /// if there is, return
  const existStyle = document.querySelector(`style#${TRANSITION_STYLE_ID}`)

  if (existStyle) return

  const style = document.createElement('style')
  style.id = TRANSITION_STYLE_ID

  document.head.appendChild(style)

  style.sheet?.insertRule(`* {
    transition-property: color, background-color, border;
    transition-duration: 0.15s;
    transition-timing-function: ease-out;
  }`, 0);
}
```

改造后的效果：
![ThemeManager Transition](/images/theme-manager-transition.gif)

### 存储上次主题

当然，在用户切换主题之后，最好是可以记录一下用户上一次存储的主题，很明显这里直接使用 `localStorage` 记录下
上次切换的主题，并在初始化的时候读取即可

```tsx
import { ThemeConfig } from "./theme-render"

const THEME_STORAGE_KEY = 'theme'

export const load = (): ThemeConfig | null => {
  const themeJson = localStorage.getItem(THEME_STORAGE_KEY)

  if (themeJson) {
    return JSON.parse(themeJson) as ThemeConfig
  }

  return null
}

export const save = (theme: ThemeConfig) => localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme))

```

Provider 改动：

```tsx
export const ThemeManagerProvider = (props) => {
  const [theme, setTheme] = React.useState(load() ?? props.defaultTheme)

  React.useEffect(() => {
    save(theme)
    renderTheme(theme)
  }, [theme])

  return ...
}

```

完整的项目地址：[react-theme-manager](https://github.com/tilemoon/react-theme-manager)
