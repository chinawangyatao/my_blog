# wxc.dev — 个人博客

一个记录技术探索、生活感悟与兴趣热爱的个人空间。手机端优先，暗色主题，交互趣味与专业感并存。

## 技术栈

- **[Astro v7](https://astro.build)** — 静态站点生成，Content Collections 管理文章
- **[React 19](https://react.dev)** — 交互组件岛屿（Lightfall WebGL、BorderGlow、Masonry、CountUp）
- **[GSAP](https://gsap.com)** — Masonry 瀑布流动画
- **[Motion](https://motion.dev)** — CountUp 数字滚动动画
- **[OGL](https://github.com/sasmitha/ogl)** — Lightfall WebGL 光带背景
- **[medium-zoom](https://github.com/francoischalifour/medium-zoom)** — 文章图片灯箱放大

## 功能特性

- **五大页面** — 首页、技术分享、生活、兴趣、关于我（简历页）
- **暗色优先** — 默认暗色主题，支持手动切换亮/暗
- **WebGL 首屏** — Lightfall 光带粒子背景，鼠标交互
- **瀑布流精选** — GSAP 驱动的 Masonry 布局，入场模糊渐显
- **卡片发光边框** — BorderGlow 鼠标跟随光效
- **数字滚动** — 首页统计数据 CountUp 弹簧动画
- **视图过渡** — ClientRouter 页面间平滑切换，Header/Footer 持久化
- **标签筛选** — 分类页客户端标签过滤，无需跳转
- **移动端底部导航** — 手机端固定底栏，桌面端顶部玻璃药丸导航
- **滚动揭示** — IntersectionObserver 渐入动画
- **阅读进度条** — 文章页顶部进度指示

## 色彩系统

基于 Tailwind 设计系统，高饱和亮色配暗色背景：

| 板块 | 色值 | Tailwind |
|------|------|----------|
| 技术 | `#38BDF8` | sky-400 |
| 生活 | `#FB923C` | orange-400 |
| 兴趣 | `#C084FC` | purple-400 |

## 项目结构

```text
src/
├── components/
│   ├── react/           # React 交互组件
│   │   ├── Lightfall.tsx    # WebGL 光带背景
│   │   ├── BorderGlow.tsx   # 卡片发光边框
│   │   ├── Masonry.tsx      # GSAP 瀑布流
│   │   └── CountUp.tsx      # 数字滚动
│   ├── Header.astro     # 顶部导航（玻璃药丸）
│   ├── BottomNav.astro  # 移动端底部导航
│   ├── Hero.astro       # 首屏 WebGL Hero
│   ├── PostCard.astro   # 文章卡片
│   ├── Footer.astro     # 页脚
│   └── ...
├── content/
│   └── blog/            # Markdown 文章
├── layouts/
│   ├── Layout.astro     # 全局布局
│   └── PostLayout.astro # 文章页布局
├── pages/
│   ├── index.astro      # 首页
│   ├── tech.astro       # 技术分享
│   ├── life.astro       # 生活
│   ├── interests.astro  # 兴趣
│   ├── about.astro      # 关于我
│   └── posts/[...slug].astro  # 文章详情
└── styles/
    └── global.css       # 全局设计系统
```

## 命令

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 启动开发服务器 `localhost:4321` |
| `pnpm build` | 构建生产版本到 `./dist/` |
| `pnpm preview` | 本地预览构建结果 |

> 需要 Node.js >= 22.12.0

## License

MIT
