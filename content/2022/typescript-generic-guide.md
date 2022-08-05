---
title: "TypeScript 范型指北"
date: 2022-06-15T14:16:39+08:00
draft: false
language: cn
type: page
---
先看下面这个场景，`Order` 和 `Article` 中都有属性 `id`：
```typescript
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
<!--more-->
