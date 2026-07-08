---
title: '用 Astro 搭建个人博客的完整指南'
pubDate: 2024-01-15
description: '从零开始使用 Astro 搭建一个高性能的个人博客，涵盖项目结构、内容集合、组件设计等核心概念。'
author: 'wxc'
tags: ["astro", "前端", "blogging", "教程"]
category: 'tech'
heroImage: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d1?w=1200&h=630&fit=crop'
featured: true
---

# 用 Astro 搭建个人博客

在这篇文章中，我将分享如何从零开始使用 Astro 搭建一个高性能的个人博客。

## 为什么选择 Astro？

Astro 是一个现代化的静态站点生成器，它有以下几个核心优势：

1. **零 JS 默认**：Astro 默认不发送任何 JavaScript 到客户端，页面加载速度极快。
2. **群岛架构**：你可以只在需要交互的组件上加载 JavaScript，其余部分保持纯静态。
3. **多框架支持**：可以在同一个项目中混用 React、Vue、Svelte 等框架。
4. **内容集合**：内置的类型安全内容管理方案，非常适合博客。

## 项目结构

```
src/
├── components/    # 可复用组件
├── layouts/       # 布局模板
├── pages/         # 路由页面
├── content/       # 内容集合
├── styles/        # 全局样式
└── scripts/       # 客户端脚本
```

## 内容集合配置

使用 `content.config.ts` 定义内容的 schema，确保所有文章都有正确的 frontmatter：

```ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
```

## 总结

Astro 是搭建博客的绝佳选择，它既有静态站点的速度，又有现代框架的开发体验。
