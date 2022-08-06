---
title: "TypeScript 范型使用场景指北"
date: 2022-06-15T14:16:39+08:00
draft: false
language: cn
type: page
cover: images/typescript-generics.png
---
作为一个使用了很长时间 ts 的人，从来没有深入了解过其中的范型系统，大多数时候都是 any 一把梭（AnyScript emmm...）。

<!--more-->
在写 ts 的大部分时候，都没有主动的想过使用范型去解决某些问题，所以这里主要列出一下我们需要在什么场景下使用范型
以及在这些场景下使用范型的好处
## 场景一 代码复用

```ts
interface Order {
  id: string,
  ...
}

interface Aticle {
  id: string,
  ...
}

const searchOrder = (list: Order[], id: string): Order => {...}
const searchArtice = (list: Artice[], id: string): Article => {...}
```

这里有两个函数 `searchOrder` 和 `searchArtice`，它们的作用很简单，都是从一个数组中筛选出来某一个元素，但是相同的功能
需却需要写两遍，首先可能会想到下面这种解法
```ts
const search = (list: (Order[] | Article[]), id: string): Order | Article => {...}
```

虽然在很多场景下可以正常工作，但是这么做有以下问题:
-  输出结果就丢失类型（无法自动检查），有时候就很容易直接写 `any` 或者是 `as TargetType`
-  当需要支持另一种新类型时还需要继续修改代码

这个时候范型就发挥作用了
```ts
const search = <T extends { id: string }>(list: T[], id: string): T => {...}
```

在这种模式下，可以完美解决掉上面的方案带来的问题
## 场景二 React Table

假设现在有个 `List` 组件，该组件接收一个 `data` 参数作为数据源，接收一个 `renderRow` 作为渲染函数
```tsx
interface Item {
  id: string
}

interface ListProps {
  data: Item[]
  renderRow: (item: Item) => React.ReactNode
}

const List = (props: ListProps) => {
  return ...
}

const Page = () => {
  return <List
    data={[{ id: '1' }]}
    renderRow={(item) => Row}
  ></List>
}
```
这样写有以下几个问题：
- 如果 List 需要支持另外一种类型，则又会陷入场景一中的情形
- 在某些时候（比如测试），我们想要直接通过字面量去传入 data 数据，这个时候就会发现，我们必须构造出和 Item 一致的数据类型
否则就会出现类型不匹配

使用范型改写
```tsx
interface Item {
  ...
  id: string
}

interface ListProps<T> {
  data: T[]
  renderRow: (item: T) => React.ReactNode
}

const List = <T,>(props: ListProps<T>) => {
  return ...
}

const Page = () => {
  return <div>
    <List
      data={[{ id: '1', foo: 'xxx' }]}
      renderRow={(item) => Row}
    ></List>
    <List
      data={[{ id: '1', bar: 'xxx' }]}
      renderRow={(item) => Row}
    ></List>
  </div>
}
```
改写之后 `List` 组件可以接受任意的 `data` 参数，非常灵活，并可以将准确的类型回传给 `renderRow`

## 场景三 getValue

假设现在需要实现这样一个方法 `getValue`，它的作用是可以从传入的对象中获取某一个字段

非范型实现
```ts
const getValue = (
  obj: any,
  key: string,
) => obj[key]

// 这里会丢失类型，拿到的是 any
const val = getValue({ a: "1", b: 1 }, "a")
```

使用范型改写

首先，需要将传入的类型“命名”为 `T`，其次需要使用到 `keyof T`，意思就是 `T` 中的任何一个 key
```ts
const getValue = <T,>(
  obj: T,
  key: keyof T,
) => obj[key]

const val = getValue({ a: "1", b: 1 }, "a")
```

从图中可以看到 ts 会返回传入 obj 中所有 value 的类型，造成这个问题的原因是，`getValue` 并没有声明第二个范型参数，
所以对于 ts 来说，参数 `key` 只能够确定是 `T` 中的一个 key，但是并不能做正确的类型推导

![keyof](/images/getValue-keyof.jpg)

要解决这个问题，则是需要让 ts 能够正确的使用 `key` 来推导类型，这个时候需要使用到 **`extends`**
```ts
// 这里的 extends 有点带有赋值的意味
const getValue = <T, FT extends keyof T>(
  obj: T,
  firstKey: FT,
) => obj[firstKey][secondKey]

const val = getValue({ a: "1", b: 1 }, "a")
```
这里的 `extends` 有点类似于「等于」的意思，因为我们希望将 `keyof T`，放在第二个范型参数上，但是为了能狗将这个类型传递
给参数 `key` ，所以需要将它 “赋值”给 `FT`。
## 场景四 Pick

相信大家或多或少都使用过 `Pick` 这个类型，这个方法的作用就是从传入的类型中，选择其中一个 key 的类型并输出，
这个也是面试中经常会考到的问题，如何实现这个 `Pick`，结合上面的场景，可以很容易写出
```ts
type Pick<T, FT extends keyof T> = {
  [FT]: T[FT]
}
```
不过马上就会发现有下面的报错
![keyof](/images/Pick-error.jpg)

因为类型本身在定义的时候是不能用作 key 来使用的，所以这个时候就需要使用到 `in` 了
```ts
type Pick<T, FT extends keyof T> = {
  [K in FT]: T[K]
}
```
