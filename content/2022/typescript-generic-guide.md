---
title: "TypeScript 范型使用场景"
date: 2022-06-15T14:16:39+08:00
draft: false
language: cn
type: page
cover: images/typescript-generics.png
---
作为一个使用了两年 ts 的人，从来没有深入了解过其中的范型系统，大多数时候都是 any 一把梭（AnyScript emmm...）。

<!--more-->
在写 ts 的大部分时候，都没有主动的想过使用范型去解决某些问题，所以这里主要列出一下我们需要在什么场景下使用范型
以及在这些场景下使用范型的好处
## 场景一
```typescript
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
```typescript
const search = (list: (Order[] | Article[]), id: string): Order | Article => {...}
```

虽然在很多场景下可以正常工作，但是这么做 `search` 方法输出的结果就丢失了想要的类型，有时候就很容易直接写 `any` 或者是 `as Order`，这个时候使用范型就可以完美的解决问题

```typescript
const search = <T extends { id: string }>(list: T[], id: string): T => {...}
```

这样 `search` 函数就可以完美的识别入参并返回正确的类型

## 场景二
