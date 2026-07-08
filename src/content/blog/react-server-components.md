---
title: 'React Server Components 深入理解'
pubDate: 2024-02-20
description: '深入理解 React Server Components 的工作原理，以及它如何改变前端开发的方式。'
author: 'wxc'
tags: ["react", "前端", "架构"]
category: 'tech'
heroImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=630&fit=crop'
featured: true
---

# React Server Components 深入理解

React Server Components（RSC）是 React 架构的一次重大变革。

## 什么是 Server Components？

Server Components 是在服务端渲染且不会发送到客户端的组件。它们可以：

- 直接访问数据库和文件系统
- 使用大型依赖而不增加客户端包体积
- 零客户端 JavaScript 开销

## 与 SSR 的区别

传统的 SSR 是在服务端渲染 HTML，然后在水合（hydrate）时发送所有 JavaScript。

RSC 则是：

1. 组件永远不在客户端执行
2. 不需要水合
3. 可以与 Client Components 混合使用

## 最佳实践

- 数据获取放在 Server Components
- 交互逻辑放在 Client Components
- 使用 `use client` 指令明确边界

理解 RSC 是掌握现代 React 全栈开发的关键。
