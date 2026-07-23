---
title: "Flutter入门到精通（三十三）：玩转Flutter Theme"
pubDate: 2024-02-03
description: "Flutter主题系统详解，深色模式、自定义主题、动态切换。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: '/images/flutter-cover.png'
---

> 本文是Flutter系统学习系列的第三十三篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

> 🐶 有三个月没更这个专栏了，**懒** 是其次，主要是觉得 **投入产出比太低**，写了也没啥人看。特别是在 **AI横行** 的时代，😶 有啥问题直接问 **AI** 就好了，谁还大费周折一篇篇文章地看啊，🤣 毕竟我也是这样。😐 AI在 **信息聚合检索 + 自动化生成** 确实是吊打，写博客剩下剩下的意义可能就是 **自驱式学习** + **记录自己的实践过程** 了，特别是遇到写了十几次 **Prompt(提示词)AI** 都改不好的 **BUG**，有些 **坑** 还是得 **自己踩过** 才知道，"**实践出真知**"...

## 1. 引言

😄 **公司APP** 没有「**深色模式**」的需求，就一直没去了解 **Flutter Theme**，都是直接手写 **Color**，最近想给自己写的 **开源APP-惜命** 加个 **APP主题切换**，看AI生成的代码有点 **别扭** (完全不了解，觉得心里没底)，索性自己花点时间系统学习下，本节主要内容如下：

## 2. API详解

**Theme (主题)** 是Flutter中用来 **统一管理应用视觉风格** 的系统，即：**让整个App的颜色、字体、按钮样式保持一致**。好处是：**便于维护** (一处修改，全局生效)、**轻松实现全局主题切换**。

### 2.1. Theme - 主题继承组件

🤔 继承 **StatelessWidget**，通过内部的 **_InheritedTheme** 实现 **data** 与 **child** 的关联，本质上是基于 **InheritedWidget** 在 **Widget** 中 **传递主题数据**，使用 **Theme.of(context)** 向上遍历Widget树查找 **最近ThemeData**，当 **主题数据** 发生变化时 **自动通知所有依赖组件进行更新**。相关核心代码：

```dart
class Theme extends StatelessWidget {
  /// 📝 构造函数
  const Theme({
    Key? key,
    required this.data,      // 主题数据
    required this.child,     // 子组件
  });

  final ThemeData data;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    // 🔥 关键：Theme内部创建了_InheritedTheme来传递数据
    return _InheritedTheme(
      theme: this,
      child: child,  // 👈 这里就是data和child的关联点！
    );
  }

  /// 🌟 静态方法：获取最近的主题数据
  static ThemeData of(BuildContext context) => ...;

  /// 🎨 创建主题的副本并应用到子组件
  static Theme copyWith({
    BuildContext? context,
    ThemeData? data,
    required Widget child,
  }) => ...;
}

/// 🧬 内部的InheritedWidget实现（Flutter框架内部）
class _InheritedTheme extends InheritedWidget {
  const _InheritedTheme({
    Key? key,
    required this.theme,     // 🎨 保存Theme实例
    required Widget child,   // 🏠 子组件
  }) : super(key: key, child: child);

  final Theme theme;

  @override
  bool updateShouldNotify(_InheritedTheme old) {
    // 🔄 当主题数据发生变化时，通知子组件更新
    return theme.data != old.theme.data;
  }
}

// 📱 使用示例
Theme(
  data: ThemeData.dark(),
  child: MyWidget(),
)

/// 📊 展示Theme在Widget树中的传递过程
MaterialApp(
  theme: ThemeData(...)  // 🎨 在这里设置主题
  home: MyHomePage(),    // 👇 主题数据会传递给所有子组件
)

// 📐 Widget树结构（简化版）
MaterialApp
├── Theme (data: ThemeData(...))          // 🎨 MaterialApp内部创建的Theme
│   └── _InheritedTheme                   // 🧬 内部的继承组件
│       └── MyHomePage                    // 🏠 你的页面
│           └── Scaffold
│               ├── AppBar
│               │   └── Text              // 👈 可以通过Theme.of(context)获取主题
│               └── Body
│                   └── Text              // 👈 同样可以获取主题

/// 🔍 Theme.of(context)的详细工作过程
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // 🎯 1. 调用Theme.of(context)
    final theme = Theme.of(context);

    // 🔍 2. Flutter内部的查找过程：
    // context.dependOnInheritedWidgetOfExactType<_InheritedTheme>()
    //
    // 📡 3. Flutter向上遍历Widget树，寻找最近的_InheritedTheme
    // MyWidget -> Scaffold -> _InheritedTheme ✅ 找到了！
    //
    // 📦 4. 返回_InheritedTheme中保存的ThemeData

    return Container(
      color: theme.colorScheme.primary,  // 🎨 使用主题颜色
      child: Text(
        'Hello',
        style: theme.textTheme.bodyLarge, // 📝 使用主题文字样式
      ),
    );
  }
}
```

### 2.2. ThemeData - 主题数据核心

😁 包含 **App** 的 **完整主题配置**，具体哪些配置，可以从源码中窥见一斑：

```dart
class ThemeData {
  ThemeData({
    // 🌈 配色方案
    ColorScheme? colorScheme,

    // 🎯 基础颜色（已废弃，推荐使用colorScheme）
    Color? primarySwatch,
    Color? primaryColor,
    Color? accentColor,

    // 📝 文本主题
    TextTheme? textTheme,
    TextTheme? primaryTextTheme,

    // 🏗️ 组件主题
    AppBarTheme? appBarTheme,
    ElevatedButtonThemeData? elevatedButtonTheme,
    TextButtonThemeData? textButtonTheme,
    OutlinedButtonThemeData? outlinedButtonTheme,
    FloatingActionButtonThemeData? floatingActionButtonTheme,
    BottomNavigationBarThemeData? bottomNavigationBarTheme,
    TabBarTheme? tabBarTheme,
    CardTheme? cardTheme,
    ChipTheme? chipTheme,
    DialogTheme? dialogTheme,
    SnackBarThemeData? snackBarTheme,

    // ⚙️ 其他配置
    bool useMaterial3 = false,
    Brightness? brightness,
    MaterialTapTargetSize? materialTapTargetSize,
    PageTransitionsTheme? pageTransitionsTheme,
    InteractiveInkFeatureFactory? splashFactory,

    // 🎭 视觉密度
    VisualDensity? visualDensity,
  });

  /// 🏭 工厂构造函数

  /// 🌞 创建浅色主题
  factory ThemeData.light() => ...;

  /// 🌙 创建深色主题
  factory ThemeData.dark() => ...;

  /// 🎨 从ColorScheme创建主题
  factory ThemeData.from({
    required ColorScheme colorScheme,
    bool useMaterial3 = false,
  }) => ...;

  /// 🔧 常用方法

  /// 📝 复制并修改主题
  ThemeData copyWith({
    ColorScheme? colorScheme,
    TextTheme? textTheme,
    // ... 其他参数
  }) => ...;

  /// 🎨 获取扩展主题
  T? extension<T>() => ...;
}

// 📱 使用示例
ThemeData(
  // 💡 Flutter Material Design 3 中的一个重要方法，根据一个种子颜色，
  // 自动生成一套完整的符合 Material Design 3 规范的颜色方案。
  colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
  textTheme: const TextTheme(
    headlineLarge: TextStyle(fontSize: 32),
  ),
  useMaterial3: true,
)
```

#### 2.2.1. ColorScheme - 配色

```dart
class ColorScheme {
  const ColorScheme({
    required this.brightness,     // 明亮度
    required this.primary,        // 主要颜色
    required this.onPrimary,      // 主要颜色上的文字颜色
    required this.secondary,      // 次要颜色
    required this.onSecondary,    // 次要颜色上的文字颜色
    required this.error,          // 错误颜色
    required this.onError,        // 错误颜色上的文字颜色
    required this.surface,        // 表面颜色
    required this.onSurface,      // 表面上的文字颜色

    // 🆕 Material 3 新增颜色
    this.primaryContainer,        // 主要容器颜色
    this.onPrimaryContainer,      // 主要容器上的文字颜色
    this.secondaryContainer,      // 次要容器颜色
    this.onSecondaryContainer,    // 次要容器上的文字颜色
    this.tertiary,               // 第三颜色
    this.onTertiary,             // 第三颜色上的文字颜色
    this.tertiaryContainer,      // 第三容器颜色
    this.onTertiaryContainer,    // 第三容器上的文字颜色
    this.inversePrimary,         // 反转主要颜色
    this.inverseSurface,         // 反转表面颜色
    this.onInverseSurface,       // 反转表面上的文字颜色
    this.outline,                // 轮廓颜色
    this.outlineVariant,         // 轮廓变体颜色
    this.shadow,                 // 阴影颜色
    this.scrim,                  // 遮罩颜色
    this.surfaceTint,            // 表面着色
  });

  /// 🏭 工厂构造函数

  /// 🌱 从种子颜色生成配色方案
  factory ColorScheme.fromSeed({
    required Color seedColor,
    Brightness brightness = Brightness.light,
  }) => ...;

  /// 🎨 从主要颜色生成配色方案
  factory ColorScheme.fromSwatch({
    MaterialColor primarySwatch = Colors.blue,
    Color? accentColor,
    Brightness brightness = Brightness.light,
  }) => ...;

  /// 🌞 浅色配色方案
  factory ColorScheme.light({
    Color primary = const Color(0xff6750a4),
    Color onPrimary = const Color(0xffffffff),
    // ... 其他颜色
  }) => ...;

  /// 🌙 深色配色方案
  factory ColorScheme.dark({
    Color primary = const Color(0xffd0bcff),
    Color onPrimary = const Color(0xff381e72),
    // ... 其他颜色
  }) => ...;

  /// 🔧 方法

  /// 📝 复制并修改配色方案
  ColorScheme copyWith({
    Brightness? brightness,
    Color? primary,
    Color? onPrimary,
    // ... 其他参数
  }) => ...;
}

// 📱 使用示例
ColorScheme.fromSeed(
  seedColor: Colors.deepPurple,
  brightness: Brightness.light,
)
```

#### 2.2.2. TextTheme - 文本样式

```dart
class TextTheme {
  const TextTheme({
    // 🔤 显示样式（大标题）
    this.displayLarge,        // 57sp - 最大显示文字
    this.displayMedium,       // 45sp - 中等显示文字
    this.displaySmall,        // 36sp - 小显示文字

    // 📰 标题样式
    this.headlineLarge,       // 32sp - 大标题
    this.headlineMedium,      // 28sp - 中标题
    this.headlineSmall,       // 24sp - 小标题

    // 🏷️ 副标题样式
    this.titleLarge,          // 22sp - 大副标题
    this.titleMedium,         // 16sp - 中副标题
    this.titleSmall,          // 14sp - 小副标题

    // 📖 正文样式
    this.bodyLarge,           // 16sp - 大正文
    this.bodyMedium,          // 14sp - 中正文
    this.bodySmall,           // 12sp - 小正文

    // 🏷️ 标签样式
    this.labelLarge,          // 14sp - 大标签（按钮文字等）
    this.labelMedium,         // 12sp - 中标签
    this.labelSmall,          // 11sp - 小标签
  });

  /// 🔧 方法

  /// 📝 复制并修改文本主题
  TextTheme copyWith({
    TextStyle? displayLarge,
    TextStyle? displayMedium,
    // ... 其他参数
  }) => ...;

  /// 🎨 应用颜色到所有文本样式
  TextTheme apply({
    Color? color,
    Color? displayColor,
    Color? bodyColor,
    String? fontFamily,
    double fontSizeFactor = 1.0,
    double fontSizeDelta = 0.0,
  }) => ...;

  /// 🔀 合并文本主题
  TextTheme merge(TextTheme? other) => ...;
}

// 📱 使用示例
const TextTheme(
  headlineLarge: TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.black,
  ),
  bodyLarge: TextStyle(
    fontSize: 16,
    color: Colors.grey,
  ),
)
```

#### 2.2.3. AppBarTheme - 应用栏

```dart
class AppBarTheme {
  const AppBarTheme({
    this.backgroundColor,         // 背景颜色
    this.foregroundColor,        // 前景颜色（图标、文字）
    this.elevation,              // 阴影高度
    this.scrolledUnderElevation, // 滚动时的阴影高度
    this.shadowColor,            // 阴影颜色
    this.surfaceTintColor,       // 表面着色
    this.shape,                  // 形状
    this.iconTheme,              // 图标主题
    this.actionsIconTheme,       // 操作图标主题
    this.titleTextStyle,         // 标题文字样式
    this.toolbarTextStyle,       // 工具栏文字样式
    this.centerTitle,            // 标题是否居中
    this.titleSpacing,           // 标题间距
    this.toolbarHeight,          // 工具栏高度
    this.systemOverlayStyle,     // 系统覆盖样式
  });

  /// 🔧 方法

  /// 📝 复制并修改应用栏主题
  AppBarTheme copyWith({
    Color? backgroundColor,
    Color? foregroundColor,
    // ... 其他参数
  }) => ...;
}

// 📱 使用示例
const AppBarTheme(
  backgroundColor: Colors.blue,
  foregroundColor: Colors.white,
  elevation: 4,
  centerTitle: true,
  titleTextStyle: TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.bold,
  ),
)
```

#### 2.2.4. ElevatedButtonThemeData - 凸起按钮

```dart
class ElevatedButtonThemeData {
  const ElevatedButtonThemeData({
    this.style,  // 按钮样式
  });

  /// 🔧 方法

  /// 📝 复制并修改按钮主题
  ElevatedButtonThemeData copyWith({
    ButtonStyle? style,
  }) => ...;
}

/// 🎨 ButtonStyle：按钮样式配置
class ButtonStyle {
  /// 📝 构造函数
  const ButtonStyle({
    this.textStyle,              // 文字样式
    this.backgroundColor,        // 背景颜色
    this.foregroundColor,        // 前景颜色
    this.overlayColor,           // 覆盖颜色（按下效果）
    this.shadowColor,            // 阴影颜色
    this.surfaceTintColor,       // 表面着色
    this.elevation,              // 阴影高度
    this.padding,                // 内边距
    this.minimumSize,            // 最小尺寸
    this.fixedSize,              // 固定尺寸
    this.maximumSize,            // 最大尺寸
    this.side,                   // 边框
    this.shape,                  // 形状
    this.mouseCursor,            // 鼠标指针
    this.visualDensity,          // 视觉密度
    this.tapTargetSize,          // 点击目标尺寸
    this.animationDuration,      // 动画时长
    this.enableFeedback,         // 启用反馈
    this.alignment,              // 对齐方式
    this.splashFactory,          // 水波纹工厂
  });

  /// 🏭 工厂构造函数

  /// 🎨 从其他按钮样式创建
  factory ButtonStyle.styleFrom({
    Color? backgroundColor,
    Color? foregroundColor,
    Color? shadowColor,
    double? elevation,
    TextStyle? textStyle,
    EdgeInsetsGeometry? padding,
    Size? minimumSize,
    Size? fixedSize,
    Size? maximumSize,
    BorderSide? side,
    OutlinedBorder? shape,
    // ... 其他参数
  }) => ...;

  /// 🔧 方法

  /// 📝 复制并修改按钮样式
  ButtonStyle copyWith({
    MaterialStateProperty<TextStyle?>? textStyle,
    MaterialStateProperty<Color?>? backgroundColor,
    // ... 其他参数
  }) => ...;

  /// 🔀 合并按钮样式
  ButtonStyle merge(ButtonStyle? style) => ...;
}

// 📱 使用示例
ElevatedButtonThemeData(
  style: ElevatedButton.styleFrom(
    backgroundColor: Colors.blue,
    foregroundColor: Colors.white,
    elevation: 8,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    padding: const EdgeInsets.symmetric(
      horizontal: 24,
      vertical: 12,
    ),
  ),
)
```

#### 2.2.5. 其它重要主题类

```dart
/// 🚢 BottomNavigationBarThemeData：底部导航栏主题
class BottomNavigationBarThemeData {
  const BottomNavigationBarThemeData({
    this.backgroundColor,        // 背景颜色
    this.elevation,             // 阴影高度
    this.selectedIconTheme,     // 选中图标主题
    this.unselectedIconTheme,   // 未选中图标主题
    this.selectedItemColor,     // 选中项颜色
    this.unselectedItemColor,   // 未选中项颜色
    this.selectedLabelStyle,    // 选中标签样式
    this.unselectedLabelStyle,  // 未选中标签样式
    this.showSelectedLabels,    // 显示选中标签
    this.showUnselectedLabels,  // 显示未选中标签
    this.type,                  // 类型
    this.enableFeedback,        // 启用反馈
    this.landscapeLayout,       // 横屏布局
  });
}

/// 📇 CardTheme：卡片主题
class CardTheme {
  const CardTheme({
    this.clipBehavior,          // 裁剪行为
    this.color,                 // 颜色
    this.shadowColor,           // 阴影颜色
    this.surfaceTintColor,      // 表面着色
    this.elevation,             // 阴影高度
    this.margin,                // 外边距
    this.shape,                 // 形状
  });
}

/// 💬 DialogTheme：对话框主题
class DialogTheme {
  const DialogTheme({
    this.backgroundColor,       // 背景颜色
    this.elevation,            // 阴影高度
    this.shadowColor,          // 阴影颜色
    this.surfaceTintColor,     // 表面着色
    this.shape,                // 形状
    this.alignment,            // 对齐方式
    this.titleTextStyle,       // 标题文字样式
    this.contentTextStyle,     // 内容文字样式
    this.actionsPadding,       // 操作按钮内边距
  });
}

/// 🏷️ TabBarTheme：标签栏主题
class TabBarTheme {
  const TabBarTheme({
    this.indicator,             // 指示器
    this.indicatorColor,        // 指示器颜色
    this.indicatorSize,         // 指示器尺寸
    this.labelColor,            // 标签颜色
    this.labelStyle,            // 标签样式
    this.labelPadding,          // 标签内边距
    this.unselectedLabelColor,  // 未选中标签颜色
    this.unselectedLabelStyle,  // 未选中标签样式
    this.overlayColor,          // 覆盖颜色
    this.splashFactory,         // 水波纹工厂
    this.mouseCursor,           // 鼠标指针
  });
}
```

#### 2.2.6. ThemeExtension - 自定义主题扩展

```dart
// 😄 用于在标准的ThemeData之外，添加自己的自定义主题属性
abstract class ThemeExtension<T extends ThemeExtension<T>> {
  /// 📝 抽象方法：复制并修改扩展
  T copyWith();

  /// 📝 抽象方法：线性插值（用于动画）
  T lerp(T? other, double t);
}

// 📱 自定义主题扩展示例
class CustomThemeExtension extends ThemeExtension<CustomThemeExtension> {
  /// 🎨 自定义颜色
  final Color successColor;
  final Color warningColor;
  final Color infoColor;

  /// 📝 自定义文字样式
  final TextStyle customTextStyle;

  const CustomThemeExtension({
    required this.successColor,
    required this.warningColor,
    required this.infoColor,
    required this.customTextStyle,
  });

  @override
  CustomThemeExtension copyWith({
    Color? successColor,
    Color? warningColor,
    Color? infoColor,
    TextStyle? customTextStyle,
  }) => CustomThemeExtension(
    successColor: successColor ?? this.successColor,
    warningColor: warningColor ?? this.warningColor,
    infoColor: infoColor ?? this.infoColor,
    customTextStyle: customTextStyle ?? this.customTextStyle,
  );

  @override
  CustomThemeExtension lerp(CustomThemeExtension? other, double t) {
    if (other is! CustomThemeExtension) return this;

    return CustomThemeExtension(
      successColor: Color.lerp(successColor, other.successColor, t)!,
      warningColor: Color.lerp(warningColor, other.warningColor, t)!,
      infoColor: Color.lerp(infoColor, other.infoColor, t)!,
      customTextStyle: TextStyle.lerp(customTextStyle, other.customTextStyle, t)!,
    );
  }
}

// 📱 使用自定义主题扩展
ThemeData(
  extensions: [
    CustomThemeExtension(
      successColor: Colors.green,
      warningColor: Colors.orange,
      infoColor: Colors.blue,
      customTextStyle: const TextStyle(fontSize: 16),
    ),
  ],
)

// 🎯 获取自定义主题扩展
final customTheme = Theme.of(context).extension<CustomThemeExtension>();
final successColor = customTheme?.successColor;
```

## 3. 应用示例

😄 其实API就上面这些，接着写一个常规的 "**自定义多个主题切换**" 的例子，关于 **主题的创建方式**，有这三种：

### 3.1. 方式一：直接创建ThemeData

* **优势**：完全控制、不依赖系统。
* **劣势**：代码量巨大 - 需要配置所有组件、容易出错 - 遗漏组件样式、 维护困难 - 每个组件都要手动维护、样式不一致 - 容易出现视觉不统一。

```dart
return ThemeData(
  primarySwatch: Colors.blue,
  brightness: Brightness.light,
  // 需要手动配置所有属性
);
```

### 3.2. 方式二：基于系统主题扩展

* **优势**：**继承完整的系统样式** - 所有组件都有合理的默认样式、**代码量少** - 只需要定义差异部分、样式一致性好 - 未自定义的组件会保持系统风格、兼容性强 - 适配不同Flutter版本、维护简单 - 系统更新会自动受益。
* **劣势**：依赖系统主题结构、深度自定义可能受限。

```dart
/// 构建浅色主题
ThemeData _buildLightTheme(CustomThemeStyle customThemeStyle) {
  final baseTheme = ThemeData.light();
  return _customizeTheme(baseTheme, false, customThemeStyle);
}

/// 构建深色主题
ThemeData _buildDarkTheme(CustomThemeStyle customThemeStyle) {
  final baseTheme = ThemeData.dark();
  return _customizeTheme(baseTheme, true, customThemeStyle);
}

/// 自定义主题
ThemeData _customizeTheme(ThemeData baseTheme, bool isDark, CustomThemeStyle customThemeStyle) {
  final colorScheme = _getCustomColorScheme(isDark, customThemeStyle);

  return baseTheme.copyWith(
    // 自定义颜色方案
    colorScheme: colorScheme,

    // 自定义 AppBar 主题
    appBarTheme: AppBarTheme(
      backgroundColor: colorScheme.primary,
      foregroundColor: colorScheme.onPrimary,
      elevation: 4,
      shadowColor: colorScheme.shadow,
      titleTextStyle: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: colorScheme.onPrimary,
      ),
    ),
    // 其它配置
}
```

### 3.3. 方式三：基于Material Design 3 的 ColorScheme

* **优势**：现代化设计 - 符合最新Material Design 3规范、**自动色彩协调** - 从种子色自动生成完整色彩系统、代码最简洁 - 一行代码生成完整主题、组件自动适配 - 所有组件自动使用新样式。
* **劣势**：需要较新Flutter版本 ( **建议≥3.10.0** )、自定义相对受限。

```dart
ThemeData _buildMaterial3Theme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
  );
}
```

### 3.4. 🌰 主题切换代码示例

🤔 个人倾向于第二种方法创建 **ThemeData**，只需关注差异化的部分进行自定义，这里只截图关键代码，完整源码可见【--->[c33/theme_use_demo.dart](https://github.com/配套示例源码/blob/master/lib/c33/theme_use_demo.dart)<---】：

```dart
/// 自定义主题风格枚举
enum CustomThemeStyle { blue, purple, green, orange }

/// 获取颜色方案
ColorScheme _getColorScheme(bool isDark, CustomThemeStyle customThemeStyle) {
  final themeColors = _getThemeColors(customThemeStyle);

  return isDark
      ? ColorScheme.dark(
          primary: themeColors.primary,
          onPrimary: themeColors.onPrimary,
          secondary: themeColors.secondary,
          onSecondary: Colors.black,
          surface: const Color(0xFF121212),
          onSurface: Colors.white,
        )
      : ColorScheme.light(
          primary: themeColors.primary,
          onPrimary: themeColors.onPrimary,
          secondary: themeColors.secondary,
          onSecondary: Colors.black,
          surface: Colors.white,
          onSurface: Colors.black,
        );
}

/// 获取主题颜色
_ThemeColors _getThemeColors(CustomThemeStyle customThemeStyle) {
  switch (customThemeStyle) {
    case CustomThemeStyle.blue:
      return const _ThemeColors(
        primary: Color(0xFF1976D2),
        onPrimary: Colors.white,
        secondary: Color(0xFF03DAC6),
      );
    case CustomThemeStyle.purple:
      return const _ThemeColors(
        primary: Color(0xFF7B1FA2),
        onPrimary: Colors.white,
        secondary: Color(0xFFE1BEE7),
      );
    case CustomThemeStyle.green:
      return const _ThemeColors(
        primary: Color(0xFF388E3C),
        onPrimary: Colors.white,
        secondary: Color(0xFFC8E6C9),
      );
    case CustomThemeStyle.orange:
      return const _ThemeColors(
        primary: Color(0xFFFF9800),
        onPrimary: Colors.black,
        secondary: Color(0xFFFFE0B2),
      );
  }
}

  /// 构建主题
  ThemeData _buildTheme(bool isDark, CustomThemeStyle customThemeStyle) {
    // 基础主题
    final baseTheme = isDark ? ThemeData.dark() : ThemeData.light();
    // 获取颜色方案
    final colorScheme = _getColorScheme(isDark, customThemeStyle);

    return baseTheme.copyWith(
      // 颜色方案配置
      colorScheme: colorScheme,
      // AppBar样式主题
      appBarTheme: _buildAppBarTheme(colorScheme),
      // 悬浮按钮样式主题
      elevatedButtonTheme: _buildElevatedButtonTheme(colorScheme),
      // 卡片样式主题
      cardTheme: _buildCardTheme(colorScheme),
      // 输入框装饰主题
      inputDecorationTheme: _buildInputDecorationTheme(colorScheme),
      // 文本样式主题
      textTheme: _buildTextTheme(baseTheme.textTheme, colorScheme),
      // 自定义主题扩展
      extensions: [_buildCustomThemeExtension(customThemeStyle, colorScheme)],
    );
  }

@override
Widget build(BuildContext context) {
  return MaterialApp(
    // 应用标题
    title: 'Flutter Theme Demo',
    // 主题模式：跟随系统/强制浅色/强制深色
    themeMode: _themeMode,
    // 浅色模式主题配置
    theme: _buildTheme(false, _customThemeStyle),
    // 深色模式主题配置
    darkTheme: _buildTheme(true, _customThemeStyle),
    // 应用主页面
    home: _ThemeHomePage(
      // 主题模式变化回调
      onThemeModeChanged: (themeMode) => setState(() => _themeMode = themeMode),
      // 自定义主题风格变化回调
      onCustomThemeStyleChanged: (style) => setState(() => _customThemeStyle = style),
      // 当前主题模式
      themeMode: _themeMode,
      // 当前自定义主题风格
      customThemeStyle: _customThemeStyle,
    ),
  );
}
```

**运行效果**：

> 💡 **Tips**：上面在点击主题切换时，传递了一个 **onThemeModeChanged()** 的回调，里面调用了 **setState()** 更新主题状态变量，触发 **MaterialApp重建**，然后把新主题传播给子组件。如果不想用 setState()，可以考虑使用 **响应式更新** (ValueNotifier + ValueListenableBuilder) 或 **状态管理库** (如Provider、Riverpod、Bloc 等)。

本节配套源码：**配套示例源码_study_flutter_demo**