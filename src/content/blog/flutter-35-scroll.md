---
title: "Flutter入门到精通（三十五）：玩转Flutter滑动机制"
pubDate: 2024-02-05
description: "Flutter滑动机制深度解析，Viewport、Sliver、自定义滚动等。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第三十五篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

上节**《三十四、玩转Flutter手势机制✋》**扒完 **Flutter** 的 "**手势机制**"，有些意犹未尽，索性趁热打铁，本节来把 "**滑动机制**" 也冲了 🔥

> ✨"**滑动机制**" 的出现是为了解决 "**有限区域**" 显示 "**超量/无限内容**" 的问题。

🤔 打个比方：

> 想象下你面前有一幅延绵百米的巨型壁画，你的眼睛一次只能看到壁画的一部分 (如正前方2米宽的区域)，这个"**眼睛能看到的区域**" 可以称作你的 "**视野窗口** (Viewport)"，当你左右移动身体，"**视口**" 也会随之移动，让你看到壁画的其它部分。

😄 有点 "**管中窥豹**" 那味了，贴近现实，**现代数字内容的丰富性** (如长文本、图片列表、网页、数据表格等) 远超 **屏幕的物理显示范围**，此时，用户也需要一种 "**移动视口**" 的方式，以访问被屏幕边缘遮挡的内容。

**💁‍♂️"滑动机制**" 应运而生，其本质是通过 **用户交互** (如手指拖动、鼠标滚轮、触控板手势) 改变内容在屏幕上的显示位置 (**视口偏移**)，从而让用户逐步 "**扫过**" 超量内容。技术实现通常包括这三个部分：

* **内容容器与视口分离**：将内容渲染在一个更大的 "**虚拟画布**" 中，屏幕仅显示其中一部分。
* **输入事件驱动偏移**：用户通过 **滑动手势** 触发系统 **计算偏移量**，调整内容容器的位置 (如向上偏移100像素)，使得原本被遮挡的内容进入视口。
* **边界反馈**：当内容已完全显示 (到达顶部/底部) 时，通过阻力反馈或动画提示用户"无更多内容"。

😄 而在 **Flutter** 中，**视口 (Viewport)** 的概念不在局限于屏幕级别的显示区域，而是扩展到任意一个 **可滚动组件**的 "**可视区域范围**"。为此，**Flutter** 设计了一套 "**滑动处理机制**"，其中三个最重要的参与者：

> **Scrollable**-专注交互，监听手势并驱动滚动、**Viewport**-管理并提供可见视口，**Slivers**-提供内容，在Viewport按需渲染自己的一部分。

这种清晰的职责划分 (**分层设计**) 使得 **Flutter** 在实现无限列表、复杂联动特效时，仍能够保持出色的性能与强大的灵活性。

😏 本节就来系统学习下 Flutter 的这套 "**滑动机制**"，依旧是 "**概念名词+API详解+源码剖析**" 的讲解套路~

## 2. 三大核心构件

💡 这部分涉及非常多的API，读者可以选择性阅读 (跳着看)，大概知道是干嘛的，协作的链路是咋样的，具体属性啥的，等用到再查也可以。🤔对 "**Sliver协议的工作流程**" 建立一个基础认知，对后面分析各种具体的 "**可滚动组件**" 时会更加得心应手。

**三个核心构建协作流程图**：

### 2.1. Scrollable - 滑动控制器

所有 **可滚动组件** 的 "**基石**"，其作用是将 "**用户的输入 (手势) 转化为滚动的视觉变化**"，具体功能：

* **手势识别**：通过内置的 **RawGestureDetector**，识别垂直或水平方向的拖拽手势。
* **滚动物理模拟**：通过 **ScrollPhysics**，定义了滚动的 "**感觉**"，比如：滚动到边缘时的效果 (Android-蓝色辉光-ClampingScrollPhysics、iOS-回弹-BouncingScrollPhysics)、滑动停止时的惯性动画 (Fling) 等。
* **状态管理**：管理滚动的核心状态，如：当前滚动位置 (pixel)、滚动范围 (min/max scroll extent) 等。这个状态由一个叫做 **ScrollPosition** 的对象维护。
* **外部控制接口**：通过 **ScrollController**，允许开发者从外部读取滚动位置、监听滚动事件或命令式地控制滚动 (如跳转到指定位置、执行动画)。
* **构建视口**：**Scrollable** 本身不渲染任何可滚动的内容。它通过一个名为 **viewportBuilder** 的回调函数，将滚动的能力 (**ViewportOffset**) "嫁接" 给一个负责渲染部分内容的 **Viewport** 组件。

#### 2.1.1. 属性/方法

构造方法：

```dart
class Scrollable extends StatefulWidget {
  const Scrollable({
    super.key,
    this.axisDirection = AxisDirection.down,        // 滚动方向
    this.controller,                                // 滚动控制器
    this.physics,                                   // 滚动物理效果
    required this.viewportBuilder,                  // 视口构建器（必需）
    this.incrementCalculator,                       // 增量计算器，
    this.excludeFromSemantics = false,             // 是否在语义树 (用于辅助功能，如屏幕阅读器) 中可见。
    this.semanticChildCount,                        // 向辅助功能提供一个提示，告知总共有多少个子项。
    this.dragStartBehavior = DragStartBehavior.start, // 拖拽开始行为
    this.restorationId,                            // 恢复ID
    this.scrollBehavior,                           // 滚动行为
    this.clipBehavior = Clip.hardEdge,             // 裁剪行为
  })
}
```dart

参数详解：

① **axisDirection**：**AxisDirection**

定义了【**滚动轴的方向**】& ScrollPosition 的 pixel 为 0 时，内容所处的位置，可选值：

* **down**：垂直方向，内容从上到下排列 (0.0在顶部)
* **up**：垂直方向，内容从下到上排列 (0.0在底部)
* **right**:：水平方向，内容从左到右排列 (0.0在左侧)
* **left**：水平方向，内容从右到左排列 (0.0在右侧)

② **physics**：**ScrollPhysics?**

定义了【**组件滚动时的物理特性**】，决定了滚动时的"手感"，如果为null，**Scrollable** 会通过 **ScrollConfiguration.of(context)** 获取一个平台默认的 **ScrollPhysics**。Android 上是**ClampingScrollPhysics** (边界钳制，有辉光)，在 iOS 上是 **BouncingScrollPhysics** (边界回弹)。常见的还有：**NeverScrollableScrollPhysics** (禁止滚动)、**AlwaysScrollableScrollPhysics** (内容不足一屏也可滚动)。

③ **incrementCalculator**：**ScrollIncrementCalculator?**

用于计算非指针（如键盘箭头、鼠标滚轮）滚动事件的滚动增量。通常无需关注此参数，框架有默认实现，在需要自定义键盘/滚轮滚动行为时才使用。

④ **dragStartBehavior**：**DragStartBehavior**

定义了【**拖拽开始行为**】决定滚动操作何时开始被识别。

* **start**：默认值，用户的手指按下并移动了一段微小的距离后才会被识别为滚动开始。
* **down**：用户手指按下并开始移动的瞬间就被立即识别为滚动，除非有极致及时反馈的交互时才设置，否则建议还是保持默认，以保证最佳和最符合预期的用户体验。

⑤ **clipBehavior**：**Clip**

定义了【**如何对超出边界的内容进行裁剪**】，可选值：

* **hardEdge**：默认，以最快的方式裁剪掉超出边界的内容。裁剪的边缘是硬的，可能会有锯齿，但GPU负载最低，性能最好，特别适合滚动视图是矩形且没特殊视觉效果的场景。
* **antiAlias**：裁剪内容，并对裁剪的边缘进行抗锯齿处理，使其看起来更平滑。视觉效果更好，特别是当滚动视图有圆角时，可以避免边缘的锯齿感。性能开销比 hardEdge 稍高。
* **antiAliasWithSaveLayer**：使用最高质量的抗锯齿裁剪，但也是性能开销最大的。它会创建一个临时的离屏缓冲区 (save layer) 来执行裁剪操作。能处理复杂的裁剪场景，提供最平滑、最准确的视觉效果。但严重影响性能。只有当Clip.antiAlias 仍然出现视觉问题 (如复杂的透明度和变换组合下) 时，才作为最后的手段使用。
* **none**: 完全不裁剪，内容可以绘制到滚动视图的边界之外。 性能最差，因为它可能需要绘制更多内容，而且，溢出的内容可以会覆盖页面上其它UI元素，导致混乱的视觉布局。

⑥ **restorationId**：**String?**

用于【**为滚动视图提供一个唯一的ID**】以便在应用被系统杀死并恢复后，能够自动恢复其滚动位置。属于 Flutter **状态恢复** (State Restoration) 框架的一部分。应用场景：包含长内容页面 (如文章)，当应用被挂起时 **RestorationManager** 会找到所有带 **restorationId** 的 Widget，并向它们请求需要保存的数据，(对于滚动视图，就是当前的 **scrollOffset**)。这些数据被保存到系统中，当应用恢复时，**RestorationManager** 会找到具体相同 restorationId 的Widget，并将保存的数据交还给它，使其能够恢复到之前的状态 (**即滚动到之前的位置**)。

⑦ **viewportBuilder**：**ViewportBuilder**

```dart
// 类型定义代码
typedef ViewportBuilder = Widget Function(BuildContext context, ViewportOffset position);
```dart

这个参数是【**构建Viewport的回调**】，**Scrollable.build()** 时会创建一个 **ViewportOffset** 对象 (实际上是 **ScrollPosition** 的实例)，并将其作为 **参数** 传递到这个回调中，回调执行后返回 **Viewport** 或其它自定义组件，需要通过这个 **position** 参数来决定其它子组件 (通常是 **Sliver**) 的布局偏移。

⑧ **controller**：**ScrollController?**

可选的【**外部滚动控制器**】，可通过它来监听滚动位置、驱动滚动。多个 **Scrollable** 还可以共享 **同一个controller** 来实现同步滚动效果。不传这个参数 (**null**)，**Scrollable** 会在内部自动创建一个 **ScrollController**，如果自己创建了 **ScrollController**，记得在 **State** 的 **dispose()** 中销毁它。它的构造函数：

```dart
class ScrollController extends ChangeNotifier {
    ScrollController({
      double initialScrollOffset = 0.0,	// 初始滚动偏移量，默认为 0.0
      this.keepScrollOffset = true,
      this.debugLabel,
      this.onAttach,
      this.onDetach,
  })
}

typedef ScrollControllerCallback = void Function(ScrollPosition position);
```dart

参数详解：

* **keepScrollOffset**：是否使用 **PageStorage** 保存滚动位置，默认true, 当 **ScrollController** 被附加到多个滚动视图时非常有用，它决定了控制器是否应该在切换附加对象时，尝试保持当前的 **scrollOffset**。
* **onAttach**：**ScrollControllerCallback?** ，当一个 **ScrollPosition** 被附加到 **ScrollController** 时会触发这个回调，可在回调中可以获得刚附加的 ScrollPosition对象，进行一些初始化操作或记录。
* **onDetach：ScrollControllerCallback?** ，当一个 ScrollPosition 从 ScrollController 中分离时会触发这个回调。可在回调中可以获得即将被分离的 ScrollPosition对象，进行一些清理或记录。

**属性/方法**：

```dart
// 当前附加的所有 ScrollPosition 对象
Iterable<ScrollPosition> get positions => _positions;

// 是否有附加的滚动视图
bool get hasClients => _positions.isNotEmpty;

// 获取唯一的 ScrollPosition（仅在单个视图时使用）
ScrollPosition get position {return _positions.single}

// 当前滚动偏移量 (滚了多少像素)
double get offset => position.pixels;

// ✨ 滚动控制方法
// 动画滚动到指定位置，参数：偏移量、动画时长和曲线
// 顶部 (position为0)，底部 (最大滚动距离-_scrollController.position.maxScrollExtent)
Future<void> animateTo(double offset, {
  required Duration duration,
  required Curve curve,
});

// 立即跳转到指定位置 (没有动画效果)
void jumpTo(double value);

// ✨ 添加滚动监听
_scrollController.addListener(() {
  print('offset: ${_scrollController.position.pixels}');
});
```dart

💡 注：要精确地判断滑动状态，推荐使用 **NotificationListener** ，它比 **ScrollController** 的 **addListener** 提供了更丰富、更具体的事件信息，如滚动停止。另外，上拉加载更多 (滑动到底部，用户还往上拉)，常见的错误做法：在 addListener 里判断 **position.pixels == position.maxScrollExtent**，这只在到达底部时触发一次，而不是在到达底部后继续拉动时触发。正确的做法是：监听 **OverscrollNotification**，当用户试图滚动超过 **maxScrollExtent** 时，就会触发这个通知。

**ScrollController** 内部维护了一个 **ScrollPosition** 列表 **_positions**，**ScrollPosition** 存储了 "**单个滚动视图**" 的 "**状态信息 & 控制逻辑**"。

```dart
abstract class ScrollPosition extends ViewportOffset with ScrollMetrics {
  required this.physics,         // 滚动的物理模拟效果
  required this.context,         // 滚动上下文
  this.keepScrollOffset = true,  // 是否通过 PageStorage 保存和恢复滚动位置
  ScrollPosition? oldPosition,   // 用于在 Widget 重建时迁移状态
  String? debugLabel,            // 调试标签
}
```dart

参数详解：

* **context**：**ScrollContext**，充当 **Scrollable** 和 **ScrollPosition** 间的桥梁，为滚动操作提供必要的 **上下文信息**。包括：**分发ScrollNotification**-notificationContext、**搜索PageStorage**-storageContext、**动画支持**-vsync、**滚动方向**-axisDirection、**设备像素比**-devicePixelRatio。除此之外，还提供了交互控制相关的方法：**是否忽略指针事件**-setIgnorePointer()、**是否可以拖拽**-setCanDrag()、**setPixels**(double offset)-当 **ScrollPosition** 内部的 **pixels** 值改变时，用它来通知 **Viewport** 更新其偏移量，从而真正移动视图。
* **oldPosition**：**ScrollPosition?** ，当 **Scrollable** 的配置发生变化 (如ScrollController 或 ScrollPhysics 被替换) 时，ScrollableState 会创建一个新的 ScrollPosition，oldPosition 参数允许新 Position 从 旧 Position "**吸收(absorb)** " 状态，如当前的 pixels值，从而实现平滑过渡。

属性/方法：

```dart
// ================ 🔔 存储滚动核心数据 ================
double pixels: 最核心的属性。表示当前滚动位置距离滚动起点的偏移量（逻辑像素）。
double minScrollExtent: 最小滚动范围。通常是 0.0。
double maxScrollExtent: 最大滚动范围。它由 (内容总高度 - 视口高度) 计算得出。
double viewportDimension: 视口（可见区域）在滚动轴上的尺寸。例如，对于一个垂直滚动的 ListView，这就是它的高度。
double extentBefore: 在视口之前（上方或左方）的不可见区域的长度。等于 pixels - minScrollExtent。
double extentInside: 在视口内部的区域长度，就是 viewportDimension。
double extentAfter: 在视口之后（下方或右方）的不可见区域的长度。
bool outOfRange: 当前 pixels 是否超出了 minScrollExtent 和 maxScrollExtent 的范围。
bool atEdge: 当前 pixels 是否正好等于 minScrollExtent 或 maxScrollExtent。

Axis axis: 滚动的轴（Axis.vertical 或 Axis.horizontal）。
- ScrollDirection userScrollDirection: 用户最近一次的滚动方向。有四个值：
- ScrollDirection.idle: 静止。
- ScrollDirection.forward: 正向滚动（滑动手势向上，内容向下移动，滚动偏移增加，显示更多底部内容）。
- ScrollDirection.reverse: 反向滚动（滑动手势向下，内容向上移动，滚动偏移减少，显示更多顶部内容）。
- 这个属性对于实现"滚动时隐藏/显示AppBar或FAB"等效果至关重要。

ScrollActivity activity: 内部状态机。表示当前滚动正在进行的"活动"。它是一个抽象类，常见的实现有：
- IdleScrollActivity: 静止状态。
- DragScrollActivity: 用户手指按住并拖动时的活动。
- BallisticScrollActivity: 用户手指抬起后，列表根据速度进行惯性滚动的活动。

// ================ 🎪 核心滚动操作 ================
jumpTo(double value): 瞬间将滚动位置改变到指定值，不带动画。
animateTo(double to, ...): 以动画方式将滚动位置平滑移动到指定值。
moveTo(double to, ...): jumpTo 和 animateTo 的内部实现，负责应用新的像素值。
correctBy(double correction): 当滚动位置不正确时（例如，子元素增删导致 maxScrollExtent 变化），用于修正 pixels。
applyNewDimensions(): 当视口或内容尺寸变化时，被调用来更新 min/maxScrollExtent 等维度信息，并可能修正 pixels。

// ================ 🎪 驱动滚动物理和动画 ================
它内部持有一个 ScrollPhysics 对象，用于决定滚动的物理行为（如在滚动到边缘时是阻尼效果还是回弹效果）。
它使用 Ticker 来驱动滚动动画，如用户手指离开屏幕后的惯性滚动（Fling/Ballistic）。
它定义了如 goIdle()、goBallistic(double velocity) 等方法来控制滚动的动态行为。

// ================ 🎪 通知机制 ================
// 它继承自 ChangeNotifier，当 pixels 发生变化时，
// 会调用 notifyListeners()。ScrollController 就是通过监听这个通知来得知滚动位置的变化。
// 它负责向上冒泡派发 ScrollNotification
// (如 ScrollStartNotification, ScrollUpdateNotification, ScrollEndNotification 等)，
// 让父组件（如 NotificationListener）可以监听到滚动事件。

// 💡 可以调用 controller.positions 属性来访问这个ScrollPosition列表
// 当控制器只附加到一个滚动视图上时，你可以直接调用 controller.offset 来获取ScrollPosition对象
// 实际上返回的：controller.position.pixels。
```dart

**Scrollable** 里还有一个 **scrollBehavior** 属性，也顺带提一嘴。**ScrollBehavior** 用于【**统一整个App或子树中所有滚动组件的默认行为**】。当一个 可滚动的Widget 被创建时，它会调用 **ScrollConfiguration.of()** 向上查找离它最近的 **ScrollConfiguration**，并返回其 **behavior** 对象，**Scrollable** 根据它来配置自己的滚动物理效果、滚动条演示、越界指示器、指针设备交互等。构造方法：

```dart
// 构造方法，没有任何参数，创建的是一个不可变(immutable)的对象。
ScrollBehavior copyWith({
  bool? scrollbars,           // 是否显示滚动条
  bool? overscroll,          // 是否显示过度滚动效果
  Set<PointerDeviceKind>? dragDevices,        // 支持拖拽的设备类型
  MultitouchDragStrategy? multitouchDragStrategy,  // 多点触控策略
  Set<LogicalKeyboardKey>? pointerAxisModifiers,   // 滚动轴修饰键
  ScrollPhysics? physics,     // 滚动物理特性
  TargetPlatform? platform,   // 目标平台
})
```dart

#### 2.1.2. ScrollableState

**Scrollable** 的核心逻辑都在 **ScrollableState** 中，内部维护一个 **ScrollPosition** 类型的 **_position** 属性，所有对滚动的操作，最终都作用于这个属性。**ScrollPosition** 是抽象类，在 **ScrollableState** 里的具体实现是 **ScrollPositionWithSingleContext**，核心实现：

* **与 Scrollable 建立连接**："**Single Context**" 指的是它持有一个 "**ScrollableState**" 引用，通过它可以获取到：ScrollPhysics、BuildContext、TickerProvider 及 axisDirection。
* **与 Viewport 通信**：applyNewDimensions() 的具体实现就是通过 **ScrollableState** 找到对应的 **Viewport**，并从 **Viewport** 获取 minScrollExtent/maxScrollExtent，这是 **ScrollPosition** 获得滚动范围信息的关键。
* **处理用户输入**：实现了 beginActivity() 和 applyUserOffset() 等方法，当用户在 **Scrollable** 上拖动时，**Scrollable** 会将 **拖动偏移量(delta)** 传递给 **applyUserOffset**，然后 **ScrollPositionWithSingleContext** 会根据 **ScrollPhysics** 的规则更新 **pixels**。并且在用户开始拖动时会创建一个 **DragScrollActivity** 来响应用手操作。当用户松开手指时，调用 **goBallistic()** 来启动一个 **BallisticScrollActivity**，实现惯性滚动。
* **管理生命周期**：当一个 ScrollController 被附加到 **Scrollable** 上时，**ScrollableState** 会调用 **attach()** ，将自己作为参数传递给 ScrollPosition，从而完成绑定，解绑时则调用 death()。

**ScrollPositionWithSingleContext** 是实际工作的 **滚动引擎**，连接 **ScrollController意图** 和 **Scrollable视图表现** 的桥梁与执行者。**ScrollableState** 的核心方法如下：

```dart
class ScrollableState extends State<Scrollable> with , RestorationMixin
    implements ScrollContext {

      // 类似于 Theme.of(context)。它允许子组件沿着组件树向上查找到最近的 ScrollableState 实例
      static ScrollableState? of(BuildContext context):

      // 手势识别器 (DragGestureRecognizer) 的回调，当手势发生时，这些方法被调用，然后它们会调用
      // position.drag() 和 position.dragEnd()，将手势的细节传递给 ScrollPosition。
      _handleDragStart, _handleDragUpdate, _handleDragEnd

      // 用户如果没提供controller，创建一个备用的ScrollController实例
      initState()

      // 调 _updatePosition() → controller.createScrollPosition() 创建
      // ScrollPositionWithSingleContext 实例。controller.attach(position)。
      didChangeDependencies()

      // 构建Viewport
      Widget build(BuildContext context){
        // 套_ScrollableScope (继承InheritedWidget，便于实现 Scrollable.of() 查找 ScrollableState)
        Widget result = _ScrollableScope(
          scrollable: this,
          position: position,
          // 套Listener-监听指针信号、套 RawGestureDetector-手势识别
          child: Listener(
            onPointerSignal: _receivedPointerSignal,
            child: RawGestureDetector(
              gestures: _gestureRecognizers,
              child: Semantics(
                // 套IgnorePointer-忽略指针事件让其直接穿透到下层
                child: IgnorePointer(
                  ignoring: _shouldIgnorePointer,
                  child: widget.viewportBuilder(context, position), // ✨ 实际内容视口
                ),
              ),
            ),
          ),
        );
        result = _buildChrome(context, result);  // 添加滚动条、过度滚动指示器等
        ...
      }
}
```dart

😄 在 **ScrollableState.build()** 中调用了 **Scrollable** 构造方法中传入的 **viewportBuilder** 回调，在创建 **Viewport Widget** 的同时传入了 **position**，使得 **Viewport** 可以根据 **position.pixels** 来计算子元素的偏移量，从而实现滚动效果。梳理下方法调用的流程，先是 **初始化** (选择 ScrollController → 配置 Physics → 处理 ScrollPostion)：

```dart
Widget 创建
    ↓
ScrollableState.initState()
    ↓
检查 widget.controller
    ├─ 如果为 null → 创建 _fallbackScrollController = ScrollController()  // 第629行
    └─ 如果不为 null → 使用提供的 controller
    ↓
super.initState()
    ↓
didChangeDependencies()
    ↓
获取 MediaQuery 设置和设备像素比
    ↓
_updatePosition()
    ↓
获取 ScrollConfiguration 和基础 ScrollPhysics
    ↓
检查自定义 physics
    ├─ 有 widget.physics → _physics = widget.physics!.applyTo(_physics)
    ├─ 有 widget.scrollBehavior → 应用 scrollBehavior 的 physics
    └─ 都没有 → 使用默认 physics
    ↓
检查旧的 _position
    ├─ 存在旧 position → detach 旧 position → scheduleMicrotask 销毁
    └─ 不存在 → 直接进入下一步
    ↓
_effectiveScrollController.createScrollPosition(_physics!, this, oldPosition)
    ↓
_effectiveScrollController.attach(position)
    ↓
初始化完成 ✅
```dart

**用户手指拖动事件** (状态转换：空闲→Hold→Drag→结束，正常结束-可能惯性滚动、取消操作-立即停止)

```dart
用户手指按下屏幕
    ↓
GestureDetector 识别触摸事件
    ↓
_handleDragDown()
    ↓
状态检查 assert(_drag == null && _hold == null)
    ↓
_hold = position.hold(_disposeHold)  // 创建保持控制器
    ↓
停止当前滚动动画
    ↓
用户开始移动手指
    ↓
_handleDragStart()
    ↓
状态检查
    ├─ _hold 可能为 null（用户代码触发了其他活动）→ 直接返回
    └─ _hold 存在 → 继续处理
    ↓
_drag = position.drag(details, _disposeDrag)
    ↓
_hold 自动变为 null（转换为拖拽状态）
    ↓
用户继续拖拽移动
    ↓
_handleDragUpdate() (持续调用)
    ↓
状态检查
    ├─ _drag 为 null（拖拽已结束）→ 不处理
    └─ _drag 存在 → _drag.update(details)
    ↓
ScrollPosition.setPixels()
    ↓
应用 ScrollPhysics 约束
    ↓
更新滚动位置 + 发送 ScrollNotification
    ↓
触发 UI 重建
    ↓
检查用户操作
    ├─ 继续拖拽 → 回到 _handleDragUpdate()
    ├─ 松开手指 → _handleDragEnd()
    └─ 取消操作 → _handleDragCancel()

松开手指分支：
_handleDragEnd()
    ↓
状态检查
    ├─ _drag 为 null → 不处理
    └─ _drag 存在 → _drag.end(details)
    ↓
根据结束速度判断
    ├─ 速度足够大 → 开始惯性滚动 (BallisticScrollActivity)
    └─ 速度不够 → 停止滚动 (IdleScrollActivity)
    ↓
_drag 变为 null
    ↓
拖拽流程完成 ✅

取消操作分支：
_handleDragCancel()
    ↓
检查 _gestureDetectorKey.currentContext
    ├─ 为 null（组件被销毁）→ 直接返回
    └─ 存在 → 继续处理
    ↓
清理状态
    ├─ _hold?.cancel() → _hold = null
    └─ _drag?.cancel() → _drag = null
    ↓
取消流程完成 ✅
```dart

**数据流向**：

```dart
用户手指拖动
    ↓
DragUpdateDetails.delta (比如: Offset(0, -10))
    ↓
ScrollDragController.update()
    ↓
ScrollPosition.setPixels(oldPixels + delta)
    ↓
position.pixels 变化 (100.0 → 90.0)
    ↓
didUpdateScrollPositionBy(-10.0)
    ↓
dispatchScrollStartedNotification 发送通知
    ↓
notifyListeners 通知监听器，ViewportOffset 继承自 ChangeNotifier
    ↓
┌─────────────────────┬─────────────────────┬─────────────────────┐
│   Viewport重新布局  	│   Scrollbar更新位置 	│   子组件可见性变化   │
└─────────────────────┴─────────────────────┴─────────────────────┘
    ↓                     ↓                     ↓
RenderSliver计算可见范围   滚动条thumb位置更新     Widget build/dispose
    ↓                     ↓                     ↓
子组件的renderObject更新   滚动条重绘             新的UI呈现给用户
```dart

### 2.2. Sliver - 滑动片段

"**Sliver"** 不是具体的类，而是一个协议/概念，**RenderSliver** 与 **它的容器** (通常是 **RenderViewport**) 间的沟通方式，这个协议主要由 **两个核心数据结构** + **performLayout()** 构成。

#### 2.2.1. 输入-SliverConstraints

**RenderViewport** (滚动视口) 传递给 **RenderSliver** 的 "**布局约束信息**"。它告诉 Sliver："这是你当前所处的环境，请根据这些信息结算你的布局"。**SliverConstraints** 的关键属性：

```dart
// ================ 🔄 滚动相关 ================

// 当前滚动偏移量，Sliver 根据它来判断自己哪一部分是可见的。
final double scrollOffset;

// 前面所有 Sliver 消耗的滚动距离总和。用于计算当前 Sliver 在整个可滚动区域中的起始位置。
final double precedingScrollExtent;

// 剩余可绘制的像素数量。Sliver 应该根据这个值来决定绘制多少内容，不应该超过这个限制
final double remainingPaintExtent;

// 前一个 Sliver 重叠的像素数量，当前一个 Sliver 的 paintExtent > layoutExtent 时
// 会产生重叠，通常用于固定头部等效果。如：SliverAppBar 收起时会与列表重叠
final double overlap;

// ================ 🎯 视口和缓存相关 ================

// 视口在主轴方向上的像素数量，对垂直列表来说，就是视口的高度。
final double viewportMainAxisExtent;

// 缓存区域的起始位置，相对于 scrollOffset。总是负数或零，
// 表示需要在当前可见区域之前预渲染多少内容。
final double cacheOrigin;

// 剩余缓存区域的大小。Sliver 应该从 cacheOrigin 开始，
// 尽可能提供 remainingCacheExtent 范围内的内容以优化滚动性能。
final double remainingCacheExtent;

// ================ 🧭 坐标系统信息 ================

// 滚动方向，决定了 scrollOffset 和 remainingPaintExtent 的增长方向
final AxisDirection axisDirection;

// Sliver 内容的排列方向，相对于 axisDirection 而言，forward-相同，reverse反向
final GrowthDirection growthDirection;

// 用户滚动的方向，用于判断用户是在向前滚动还是向后滚动，某些Sliver(如浮动头部)会根据此信息调整行为
final ScrollDirection userScrollDirection;

// 交叉轴的可用空间。对于垂直列表来说就是宽度，对于水平列表来说就是高度。
final double crossAxisExtent;

// 交叉轴的方向。通常用于垂直列表中描述文字方向是从左到右还是从右到左。
final AxisDirection crossAxisDirection;
```dart

#### 2.2.2. 输出-SliverGeometry

当 **RenderSliver** 的 **performLayout()** 被调用后，它必须计算并设置自己的 **geometry** 属性，这是它返回给 **RenderViewport** 的 "**布局结果**"。**SliverGeometry** 的关键属性：

```dart
class SliverGeometry {
  // ================ 🎨 核心尺寸信息 ================

  // Sliver 总的可滚动范围，表示用户需要滚动多少距离才能从这个 Sliver 的开始滚动到结束。
  final double scrollExtent;

  // 当前实际绘制的像素范围，表示这个 Sliver 在当前滚动位置下实际占用的可见区域大小。
  final double paintExtent;

  // 布局占用的空间大小，决定下一个 Sliver 的布局位置，默认等于 paintExtent。
  // 当需要 "挤压"后续 Sliver 时会小于 paintExtent。
  final double layoutExtent;

  // 该 Sliver 能够绘制的最大范围。用于支持收缩包装的视口，
  表示如果有无限空间时这个 Sliver 最多能绘制多大。
  final double maxPaintExtent;

  // 当 Sliver 被固定在边缘时，能够阻挡内容滚动的最大范围，应用栏就是最典型的例子。
  final double maxScrollObstructionExtent;

  // ================ 📦 位置和交互信息 ================

  // 交叉轴占用的空间大小，如果为null，则使用约束中的 crossAxisExtent。
  // 用于某些需要自定义交叉轴大小的 Sliver。
  final double crossAxisExtent;

  // 绘制起始位置的偏移量，如果 Sliver 想要在其布局位置之前开始绘制
  // (如阴影效果)，这个值就是负数
  final double paintOrigin;

  // 可以响应点击事件的范围，默认等于 paintExtent，但某些情况下
  // 可能需要扩大或缩小点击区域。
  final double hitTestExtent;

  // 缓存区域消耗的大小。表示这个 Sliver 从剩余缓存区域中消耗了多少空间，用于优化滚动性能。
  final double cacheExtent;

  // ================ 🔧 状态信息 ================

  // 该 Sliver 是否应该被绘制。默认情况下，paintExtent > 0 时为 true，否则为 false。
  final bool visible;

  // 是否有视觉溢出。如果为 true，视口需要对子组件进行裁剪以避免内容溢出到视口边界之外。
  final bool hasVisualOverflow;

  // 滚动偏移修正值。如果不为 null，父组件会调整滚动位置并重新布局。
  // 用于处理滚动位置需要修正的特殊情况。
  final double? scrollOffsetCorrection;
}
```dart

#### 2.2.3. 协议流程总结

* **RenderViewport** 调 **子RenderSliver.layout()** ，并传入 **SliverConstraints** (输入)。
* **RenderSliver.performLayout()** 被触发，**RenderSliver** 的具体子类 (如RenderSliverList) 会根据 **SliverConstraints** 计算出自己需要展示哪些子元素、它们的位置，并最终计算出一个 **SliverGeometry** (输出)。
* **RenderSliver** 将计算好的 **SliverGeometry** 赋值给自己的 **geometry** 属性。
* **RenderViewport** 读取 **geometry**，从而知道这个 Sliver 占了多少空间、下一个 Sliver 应该从哪里开始布局等信息，然后继续布局下一个 Sliver。

**RenderSliver子类.performLayout()** 中进行 **布局计算** 的示例代码：

```dart
void performLayout() {
  // 1. 接收约束
  final SliverConstraints constraints = this.constraints;

  // 2. 分析滚动状态
  final double scrollOffset = constraints.scrollOffset;
  final double remainingExtent = constraints.remainingPaintExtent;

  // 3. 计算内容布局
  // ... 具体的布局逻辑 ...

  // 4. 生成几何信息
  geometry = SliverGeometry(
    scrollExtent: totalContentHeight,      // 总内容高度
    paintExtent: visibleContentHeight,     // 可见内容高度
    layoutExtent: layoutContentHeight,     // 布局影响高度
    maxPaintExtent: maxContentHeight,      // 最大绘制高度
    hasVisualOverflow: hasOverflow,        // 是否溢出
  );
}
```dart

梳理下 **RenderSliver** 的子类们：

> **Tips**：**Sliver Widget 们**：ListView → **SliverList**、GridView → **SliverGrid**、**SliverToBoxAdapter** (用于将一个普通Box组件进行Sliver适配)、**SliverAppBar**、**SliverPersistentHeader**(吸顶头部)、**SliverFillRemaining** (填充视口剩余空间)、**SliverPadding** (为Sliver添加内边距)、**SliverLayoutBuilder** (可以根据 Sliver 的几何信息来构建其子组件) 等。

### 2.3. Viewport - 视口管理器

继承 **MultiChildRenderObjectWidget** (多子Widget)，实现 "**懒加载/按需渲染**" 滚动视图的基石，主要职责：

* **管理可见区域显示**：根据自身尺寸和给定的偏移量显示子组件的子集，只渲染在视口范围内可见的 **Sliver子组件**，而不是全部内容。
* **协调滚动偏移**：接收并处理 **ViewportOffset** 传递的滚动偏移量信息，随着偏移量的变化，动态调整哪些子组件在视口中可见。
* **实现高效的布局算法**：采用视口感知的布局协议，向 **Sliver子组件** 传递约束信息，包含可见空间剩余量等视口相关信息，使子组件能够智能地决定渲染内容。
* **支持无限滚动机制**：通过按需构建机制，只创建当前可见的 Widget，在布局阶段与构建阶段交错进行，实现高性能的无限列表。
* **处理不同类型的 Sliver 组合**：统一管理线性列表、网格、可折叠头部等不同类型的 Sliver，通过 **Sliver布局协议** 协调各种滚动效果，如视差滚动、折叠头部等。
* **维护渲染边界和裁剪**：定义内容的可视边界，对超出视口的内容进行裁剪，管理重绘边界，优化渲染性能。

**构造函数**：

```dart
Viewport({
  super.key,
  this.axisDirection = AxisDirection.down,	// 主轴方向，决定了滚动的方向和布局的起点。
  this.crossAxisDirection,	// 交叉轴方向，它会影响子项在交叉轴上的布局顺序。
  this.anchor = 0.0,	// 锚点
  required this.offset,	// 滚动偏移控制器，通常由ScrollPosition实现。
  this.center,	// 中心子项的Key
  this.cacheExtent,	// 缓存区域大小
  this.cacheExtentStyle = CacheExtentStyle.pixel,	// 缓存区域计算方式
  this.clipBehavior = Clip.hardEdge,	// 超出Viewport边界内容的裁剪行为
  List<Widget> slivers = const <Widget>[],	// 子组件列表
})
```dart

**属性详解**：

* **anchor**: double，表示视口中的"**零点**" (scrollOffset为0.0的点) 在视口自身中的位置比例。0.0-视口的顶部(或左侧) 是滚动偏移的零点，当 scrollOffset 为 0 时，内容的开头对齐视口的开头。1.0-视口的底部 (或右侧) 是滚动偏移的零点。0.5-视口的中心是滚动偏移的零点。anchor 的改变会影响内容如何从 center key 开始向两侧填充。对于反向列表(reverse:true)，ListView会将其设置为1.0。
* **center**：Key?， **中心子项的Key**，这是一个优化参数。当 Viewport 首次布局时，它会尝试找到这个 Key 对应的 Sliver，并假定它位于 scrollOffset 为 0.0 的位置。这主要有两个用途：**快速定位**-在拥有大量数据时，可以快速定位到初始显示位置，而无需从头开始构建。**布局稳定性**-当 Viewport 的尺寸变化时 (如屏幕旋转) 通过 center key 可以保持同一个子项在视口中的相对位置，防止列表"跳动"。
* **cacheExtent**：doube?，指定在视口可见区域之外，上下(或左右) 应该预先构建和布局的区域大小。如：如果视口高度为 600px，cacheExtent 为 200px，那么系统会渲染从 -200px 到 800px 这个范围内的列表项。
* **cacheExtentStyle**：**CacheExtentStyle**，缓存单位，**pixel**-默认，逻辑像素，**viewport**-视口大小的倍数，如：cacheExtent 为 1.0 意味着在视口上方和下方各缓存一个视口高度的区域。
* **slivers**：List，只能放 **Sliver** 类型的 **Widget**， 如：SliverList、SliverGrid、SliverAppBar, SliverToBoxAdapter 等。

**核心方法**：

```dart
// Widget 层和 RenderObject 层的连接点。Viewport Widget
// 调用此方法来创建一个 RenderViewport 实例，并将构造函数中的所有参数传递给它。
createRenderObject(BuildContext context)

// 当 Viewport Widget 的配置发生变化时（例如 axisDirection 改变），此方法会被调用，
// 用新的配置去更新已存在的 RenderViewport 对象。
updateRenderObject(BuildContext context, RenderViewport renderObject)

// 创建 MultiChildRenderObjectElement，这是 Widget 在元素树中的表示。
createElement()
```dart

**Viewport** 在 **渲染树** 中有两个主要实现：

* **RenderViewport**：标准视口 **RenderObject**，会扩展填充整个主轴空间。
* **RenderShrinkWrappingViewport**：收缩包装视口 **RenderObject**，会根据其子组件在主轴上的大小来调整自身大小。

```dart
// 主轴上占据所有空间
RenderViewport extends RenderViewportBase<SliverPhysicalContainerParentData>{}

abstract class RenderViewportBase<ParentDataClass extends ContainerParentDataMixin<RenderSliver>>
    extends RenderBox with ContainerRenderObjectMixin<RenderSliver, ParentDataClass>
    implements RenderAbstractViewport { ... }

// 主轴上所有以包裹其内容 (shrinkWrap: true)
class RenderShrinkWrappingViewport extends RenderViewportBase<SliverLogicalContainerParentData> { ... }
```dart

父类 **RenderViewportBase** 继承了 **RenderBox**，这表明 **RenderViewport** 自身遵循 **盒子模型** (父节点会给他一个 **BoxConstraints**，它必须在此约束下确定自己的size)，而管理的子节点列表则必须是 **RenderSliver** 类型，😄 由此，可把 **RenderViewport** 看作 **盒子协议** & **Sliver协议** 间的 "**桥梁**"。方法调用链路：

```dart
// ================ 🚀 初始化 ================

RenderViewport 构造函数
    ↓
调用父类 RenderViewportBase 构造
    ├─ 设置 axisDirection 和 crossAxisDirection // 设置主轴和交叉轴方向
    ├─ 绑定 ViewportOffset // 绑定滚动偏移控制器
    └─ 初始化 cacheExtent 和 clipBehavior // 设置缓存范围和裁剪行为
    ↓
设置 RenderViewport 特有属性
    ├─ _anchor = anchor // 设置锚点位置（0.0-1.0）
    └─ _center = center // 设置中心sliver
    ↓
addAll(children) // 批量添加子元素
    └─ adoptChild() // 为每个子元素建立父子关系
        ├─ setupParentData() // 设置 SliverPhysicalContainerParentData
        ├─ attach() // 将子元素附加到渲染管道
        └─ markNeedsLayout() // 标记需要重新布局
    ↓
设置默认center
    ├─ center == null && firstChild != null → _center = firstChild
    └─ 否则 → 保持原有center设置

attach() // 将视口附加到渲染管道
├─ super.attach(owner) // 调用父类attach方法
├─ _offset.addListener(markNeedsLayout) // 监听滚动偏移变化
└─ 递归调用子元素attach() // 确保所有子元素都正确附加

// ================ 📦 布局 ================

performLayout() // 布局入口
    ↓
应用视口尺寸到偏移控制器
    ├─ axis == Axis.vertical → offset.applyViewportDimension(size.height)
    └─ axis == Axis.horizontal → offset.applyViewportDimension(size.width)
    ↓
检查是否有子元素
    ├─ center == null → 设置滚动范围为0并返回
    │   ├─ _minScrollExtent = 0.0
    │   ├─ _maxScrollExtent = 0.0
    │   ├─ _hasVisualOverflow = false
    │   └─ offset.applyContentDimensions(0.0, 0.0)
    └─ 有子元素 → 继续布局流程
    ↓
计算布局参数
    ├─ (mainAxisExtent, crossAxisExtent) = switch (axis) // 计算主轴和交叉轴尺寸
    ├─ centerOffsetAdjustment = center!.centerOffsetAdjustment // 获取中心偏移调整
    └─ maxLayoutCycles = _maxLayoutCyclesPerChild * childCount // 设置最大布局循环次数
    ↓
执行布局循环
    ├─ _attemptLayout() // 尝试布局所有子元素
    │   ├─ 重置布局数据
    │   │   ├─ _minScrollExtent = 0.0
    │   │   ├─ _maxScrollExtent = 0.0
    │   │   └─ _hasVisualOverflow = false
    │   ├─ 计算中心偏移和绘制范围
    │   │   ├─ centerOffset = mainAxisExtent * anchor - correctedOffset
    │   │   ├─ reverseDirectionRemainingPaintExtent = clampDouble(centerOffset, 0.0, mainAxisExtent)
    │   │   └─ forwardDirectionRemainingPaintExtent = clampDouble(mainAxisExtent - centerOffset, 0.0, mainAxisExtent)
    │   ├─ 计算缓存范围
    │   │   ├─ _calculatedCacheExtent = switch (cacheExtentStyle) // 根据缓存样式计算实际缓存大小
    │   │   └─ 计算各方向的缓存范围
    │   ├─ layoutChildSequence(反向子元素) // 布局center之前的子元素
    │   │   ├─ child.layout(SliverConstraints) // 为每个子sliver执行布局
    │   │   ├─ updateChildLayoutOffset() // 更新子元素的布局偏移
    │   │   │   └─ childParentData.paintOffset = computeAbsolutePaintOffset()
    │   │   └─ updateOutOfBandData() // 更新滚动范围等额外数据
    │   │       ├─ GrowthDirection.reverse → _minScrollExtent -= scrollExtent
    │   │       └─ hasVisualOverflow → _hasVisualOverflow = true
    │   └─ layoutChildSequence (正向子元素) // 布局center及之后的子元素
    │       ├─ child.layout(SliverConstraints)	// ✨ 给每个子 Sliver下发约束，执行布局
    │       ├─ SliverGeometry childLayoutGeometry = child.geometry! // ✨ 获得Sliver 返回的几何信息
    │       ├─ updateChildLayoutOffset() // 记录每个 Sliver 的绘制位置
    │       └─ updateOutOfBandData() // 基于每个 Sliver 的反馈更新全局信息
    │           ├─ GrowthDirection.forward → _maxScrollExtent += scrollExtent	// 累计最大滚动范围
    │           └─ hasVisualOverflow → _hasVisualOverflow = true	// 判断是否有溢出
    ├─ correction != 0.0 → offset.correctBy(correction) // 修正滚动偏移量
    └─ correction == 0.0 → offset.applyContentDimensions() // 应用最终的内容尺寸范围

// ================ 🎨 绘制 ================

paint() // 绘制入口
    ↓
检查是否有子元素
    ├─ firstChild == null → 直接返回
    └─ 有子元素 → 继续绘制流程
    ↓
检查是否需要内容裁剪
    ├─ hasVisualOverflow && clipBehavior != Clip.none → 创建裁剪区域
    │   └─ _clipRectLayer.layer = context.pushClipRect() // 创建裁剪图层
    │       ├─ needsCompositing // 检查是否需要合成
    │       ├─ Offset.zero & size // 设置裁剪矩形
    │       ├─ _paintContents // 绘制内容回调
    │       └─ oldLayer: _clipRectLayer.layer // 复用旧图层
    └─ 无溢出或不裁剪 → 直接绘制内容
        ├─ _clipRectLayer.layer = null // 清理裁剪图层
        └─ _paintContents(context, offset) // 直接绘制内容
    ↓
_paintContents() // 绘制所有可见内容
    └─ 遍历 childrenInPaintOrder // 按绘制顺序处理子元素
        ├─ child.geometry!.visible → 检查子元素是否可见
        └─ context.paintChild(child, offset + paintOffsetOf(child)) // 绘制每个可见的子元素
            ├─ paintOffsetOf(child) // 获取子元素绘制偏移
            │   └─ return childParentData.paintOffset
            └─ 应用变换矩阵并绘制
```dart

### 2.4. 几行代码轻松实现滚动效果

😏 原理学完，动手缝合下三个构件，实现一个 **最简单** 的滑动效果【--->[c35/simple_scroll_demo.dart](https://github.com/配套示例源码/blob/master/lib/c35/simple_scroll_demo.dart)<---】：

**运行效果**：

😄 是的，就是这么简单，关于Flutter滑动之基的 "**三个核心构件**" 就了解到这，接着开始学习具体的滑动组件~

## 3. 常用滑动组件

### 3.1. SingleChildScrollView

**简介**：

一个用于解决 "**内容溢出**" 问题的简单 **滚动容器Widget**，可以让 **单个子Widget** 在空间不足时进行滚动。

#### 3.1.1. API 详解

继承 **StatelessWidget**，大部分属性在 **Scrollable** 那里已经详细讲了，不再赘述，挑几个没讲到的：

* **padding**：**EdgeInsetsGeometry?** ，在滚动区域内部添加内边距 (child外边)，边距会随着内容一起滚动。
* **keyboardDismissBehavior**：**ScrollViewKeyboardDismissBehavior**，用户与滚动区域交互时，如何 & 何时自动收起弹出的键盘。【**manual**-默认】滚动视图本身不会做任何事情来收起键盘，键盘的收起完全依赖于其他方式，如：回退键、FocusScope.of(context).unfocus() 等。【**onDrag**】当键盘弹出时，用户在滚动视图上开始拖动 (**滚动**) 的那一刻，键盘就会自动收起 ✨。
* **primary**：**bool?** ，是否使用主滚动控制器，默认null，由系统自动根据上下文自动选择最合适的控制器。为 **true** 时，使用 **主滚动控制器-PrimaryScrollController** (不能同时设置自定义controller)，🤔 用于页面级别的滚动，需要与其它组件共享滚动状态，在移动平台上它会自动处理一些系统级的交互。如：Android 从屏幕边缘拖动可以触发返回操作，主滚动视图会优先响应滚动。在 iOS 上，点击状态栏可以快速滚动到顶部。在Scaffold中，如果body是一个可滚动组件，当键盘弹出时，会调整滚动区域以保证焦点输入框可见。为 **false** 时，当一个页面有多个滚动视图时，只能有一个可以是primary，其它都应该显示设置为false。一般用于独立的滚动区域：如对话框、侧边栏。

简单使用示例【--->[c35/single_child_scroll_view_demo.dart](https://github.com/配套示例源码/blob/master/lib/c35/single_child_scroll_view_demo.dart)<---】运行效果：

😄 非常简单，就切滚动物理效果、设置键盘随列表滚动消失、以及快速滑动到底部、中部和顶部。接着提下使用 **SingleChildScrollView** 的 **两个注意事项**：

① **与Column 配合使用的冲突Column** 试图占用尽可能多的空间，而 **SingleChildScrollView** 提供无限空间，这会导致冲突，需要对**Column** 进行高度约束。可以使用 **LayoutBuilder + ConstrainedBox** 设置最小高度，或者使用**IntrinsicHeight** 强制 **Column** 适应内容大小。

② **加载机制SingleChildScrollView** 会一次性将它的 child **全部渲染到内存中**，而不管这个 child 有多大，它只是在 "**视口**" 中移动显示。它更适合处理 **内容相对固定且不太多** 的场景，对于 **大量动态内容**，还是得选择具有 "**懒加载**" 特性的滚动组件 (如 **Listview**)，混合布局可以考虑用 **CustomScrollView**。

#### 3.1.2. 源码剖析

关于第一个注意事项 "**SingleChildScrollView 提供无限空间**"，在源码中的体现 (移除了滚动方向的尺寸约束)：

接着是第二个 "**一次性将child全部渲染到内存中**"，跟下代码调用：**SingleChildScrollView** → **build()SingleChildScrollView** 的 **Viewport** 具体实现 **Widget** 是 **_SingleChildViewport**，对应的 **RenderObject** → **_RenderSingleChildViewport绘制方法**：

上面通过 **pushClipRect()** 来显示显示区域 (视觉裁剪) 实现 "**窗口效果**"：

🤔 那 "**滚动效果**" 呢？通过改变 **paintOffset** 来移动 **子组件的绘制位置**：

😁 视觉效果 (滑动) 与实际移动反向是 "**相反**" 的 ❗️ 向下滚动时，子组件是向上移动的，Y轴负值表示向上移动。

```dart
初始状态 (position = 0):
┌─────────────────┐ ← 视口顶部
│  子组件内容A     │
│  子组件内容B     │
│  子组件内容C     │
└─────────────────┘ ← 视口底部
│  子组件内容D     │ ← 不可见
│  子组件内容E     │ ← 不可见

向下滚动 (position = 100):
                   ← 子组件内容A (不可见)
┌─────────────────┐ ← 视口顶部
│  子组件内容B     │
│  子组件内容C     │
│  子组件内容D     │
└─────────────────┘ ← 视口底部
│  子组件内容E     │ ← 不可见
```dart

😊 可以将 **clipBehavior** 属性 **Clip.none** 来验证是否 **child** 是否真的是 **全部渲染**【--->[c35/single_child_scroll_none_clip_demo.dart](https://github.com/配套示例源码/blob/master/lib/c35/single_child_scroll_none_clip_demo.dart)<---】运行效果：

### 3.2. ScrollView

**抽象类**，Flutter中绝大部分 "**可滚动视图**" 的 **顶层父类**，核心作用：实现 "**滚动机制 & 内容布局**" 解耦，定义了一个 **可滚动区域的通用配置框架**，具体如何排列子元素 (列表、网格或是其它形式) 则交由子类实现。它的使命：

> 将用户的 **滚动意图** (由Scrollable捕获) 转化为 **视口内内容的平移** (由Viewport 和 Slivers 实现)。

**核心方法**：

```dart
// ❗️ 子类都必须实现，用于返回 Widget列表 (必须是Sliver类型，
// 如：SliverList, SliverGrid, SliverToBoxAdapter),
// ScrollView 会把这个 Sliver 列表交给 Viewport 去渲染.
@protected
List<Widget> buildSlivers(BuildContext context);

// 构建Viewport，根据 shrinkWrap 决定使用哪种 Viewport
@protected
Widget buildViewport(
  BuildContext context,
  ViewportOffset offset,
  AxisDirection axisDirection,
  List<Widget> slivers,
){
  if (shrinkWrap) {
      return ShrinkWrappingViewport(...);
  }
  return Viewport();
}

// 结合 scrollDirection 和 reverse，用于获取滚动方向。
@protected
AxisDirection getDirection(BuildContext context) {
  return getAxisDirectionFromAxisReverseAndDirectionality(context, scrollDirection, reverse);
}

// 实现了 StatelessWidget.build()
@override
Widget build(BuildContext context) {
  // 第1步：构建 slivers 列表
  final List<Widget> slivers = buildSlivers(context);

  // 第2步：确定滚动方向
  final AxisDirection axisDirection = getDirection(context);

  // 第3步：确定有效的 primary 属性
  final bool effectivePrimary = primary
      ?? controller == null && PrimaryScrollController.shouldInherit(context, scrollDirection);

  // 第4步：获取滚动控制器
  final ScrollController? scrollController = effectivePrimary
      ? PrimaryScrollController.maybeOf(context)
      : controller;

  // 第5步：创建 Scrollable 组件
  final Scrollable scrollable = Scrollable(
    dragStartBehavior: dragStartBehavior,
    axisDirection: axisDirection,
    controller: scrollController,
    physics: physics,
    scrollBehavior: scrollBehavior,
    semanticChildCount: semanticChildCount,
    restorationId: restorationId,
    // 💡 将 Slivers 喂给 Viewport
    viewportBuilder: (BuildContext context, ViewportOffset offset) {
      return buildViewport(context, offset, axisDirection, slivers);
    },
    clipBehavior: clipBehavior,
  );

  // 第6步：处理 PrimaryScrollController 继承
  final Widget scrollableResult = effectivePrimary && scrollController != null
      ? PrimaryScrollController.none(child: scrollable)
      : scrollable;

  // 第7步：处理键盘消失行为
  if (keyboardDismissBehavior == ScrollViewKeyboardDismissBehavior.onDrag) {
    return NotificationListener<ScrollUpdateNotification>(
      child: scrollableResult,
      onNotification: (ScrollUpdateNotification notification) {
        final FocusScopeNode focusScope = FocusScope.of(context);
        if (notification.dragDetails != null && focusScope.hasFocus) {
          focusScope.unfocus();
        }
        return false;
      },
    );
  } else {
    return scrollableResult;
  }
}
```dart

😄 将通用的滚动逻辑 (视口、控制器、物理效果) 都进行了封装，子类只需实现 **buildSlivers()** 塞 **Slivers**。

### 3.3. ListView

**简介**：

用于创建 **可滚动的线性列表布局** 的高级滑动组件。

#### 3.3.1. API 详解

继承 **BoxScrollView**，同样挑几个属性讲讲：

* **shrinkWrap**：**bool**，默认false，尽可能占据父组件在滚动方向上提供的所有空间，如果父组件没限制 (如Column)，就会导致无限高度/宽度错误。为true时，尺寸会收缩以包裹其内容的总高度/宽度，但这样会牺牲性能，因为它需要计算所有子项的尺寸 (即便不可见) 来确定自身的总尺寸。故仅在必要时使用，如：在Column 中嵌套一个 ListView 时。
* **itemExtent**：**double?** ，**子项固定固定高度**，如果所有子项都有相同的高度/宽度，设置此属性能极大地提高性能。因为 Listview不再需要动态计算每个子项的尺寸，可以直接算出滚动偏移，从而简化布局过程。
* **itemExtentBuilder**：**ItemExtentBuilder?** ，**子项高度构建器**，其实就一方法回调，有两个参数：**index**-当前子项索引 和 **dimensions**-当前滚动视口的尺寸信息，返回值double-子项高度。适用于：当你的列表项目高度是可预知的、有规律的，但又不完全相同的场景，如：奇数index，高度50，偶数index，高度100。
* **prototypeItem**：**Widget?** ，列表项高度/宽度基本一致但又不想写死 itemExtent，可以提供一个 **原型Widget**，ListView 会测量这个原型一次，然后假设所有其他项都具有相同的尺寸。
* **cacheExtent**：**double?** ，**缓存范围**，Viewport 的预加载区域大小 (默认250.0) 增加此值可以减少快速滚动时的空白，但因为会提前构建更多项，所以会增加内存消耗。
* **addAutomaticKeepAlives**：**bool**，默认true，当列表项滚动出视口时，**是否自动使用 AutomaticKeepAlive** 来保存它们的状态。列表项 的 State 也需要混入 **AutomaticKeepAliveClientMixin** 重写 **wantKeepAlive** 返回 true 才会有效，对列表项包含复杂状态 (如输入框内容、动画状态) 时很有用。更复杂的和状态，应使用外部状态管理方案 (如Provider、BLoC、Riverpod等)，将状态与 UI 分离。
* **addRepaintBoundaries**：bool，默认true，是否为每个列表项自动包裹一个 **RepaintBoundary**，用于隔离每个列表项的重绘，防止一个项的动画或变化导致整个列表重绘，从而优化性能。

提供了 **四种构造方式**：

```dart
// ✨ 默认构造函数，接收一个 List<Widget> 作为 children。
// 内部使用 SliverChildListDelegate，它会一次性构建所有的子 Widget，
// 所以仅适用于【少量、固定的子项】的场景
ListView(children: <Widget>[ Container(), ...])

// ✨ ListView.builder()，最常用、最高性能
// 内部使用 SliverChildBuilderDelegate，它不会立即创建所有列表项，而是通过
// itemBuilder 回调函数，在列表项即将进入视口时才进行构建。适用于【大量或无限子项】的场景
final List<String> entries = List<String>.generate(1000, (i) => 'Item $i');
ListView.builder(
  itemCount: entries.length,	// 列表项总数，如果为 null，则表示一个无限列表。
  itemBuilder: (BuildContext context, int index) {
    // 根据索引 index 返回对应的 Widget
    return ListTile(
      title: Text(entries[index]),
    );
  },
)

// ✨ ListView.separated()，builder() 变种，可以方便地在每个列表项之间插入一个分割线 Widget
ListView.separated(
  itemCount: 100,
  itemBuilder: (BuildContext context, int index) {
    return ListTile(title: Text('Item $index'));
  },
  // 根据索引 index 构建位于 item[index] 和 item[index + 1] 间的分割线。
  separatorBuilder: (BuildContext context, int index) {
    return const Divider(color: Colors.grey);
  },
)

// ✨ ListView.custom() 完全自定义，允许你提供一个自定义的 SliverChildDelegate
// 通过「childrenDelegate」参数传入，前三种构造方法其实都是这个构造方法的语法糖。
// 这种构造方式很少直接使用，适用场景：需对子项的创建、销毁、保活等行为进行更精细控制
```dart

#### 3.3.2. 源码剖析

默认构造函数，内部使用 **SliverChildListDelegate**：

```dart
SliverChildListDelegate extends SliverChildDelegate {
  SliverChildListDelegate(
    this.children, // 这里是 List<Widget>
    {
    this.addAutomaticKeepAlives = true,
    this.addRepaintBoundaries = true,
    this.addSemanticIndexes = true,
    this.semanticIndexCallback = _kDefaultSemanticIndexCallback,
    this.semanticIndexOffset = 0,
  }) : _keyToIndex = <Key?, int>{null: 0};
}
```dart

看下 **build()** 方法：

"**盐值(Salt)** " 这个概念来自密码学，指的是在 **加密过程中添加的额外随机数据**。在这里是给原有Key **添加额外信息**，如：原始Key("item_1") 包装成 _SaltedValueKey(Key('item_1'))，目的是让这个Key在delegate内部是 **唯一的**，以避免Flutter混乱这些Key，导致状态错乱。

"**KeyedSubtree**" 是一个特殊的 **Widget**，它的作用是：为整个子树提供一个稳定的身份标识，帮助Flutter的渲染系统正确追踪Widget，确保当Widget位置变化时，状态能正确保持。"**Element复用机制**"：当Widget第一次显示时，Flutter创建对应的 **Element** 和 **RenderObject**，当Widget重新构建时，Flutter会尝试 **复用已有的Element**，复用条件是：**Widget的runtimeType和key都相同**。

😶 用的 **children**，传入时就是已经创建的Widget，所以是一次性构建所有的 **子Widget**，接着看下 **builder()** 构建的方式，用的 **SliverChildBuilderDelegate**：

```dart
class SliverChildBuilderDelegate extends SliverChildDelegate {
  const SliverChildBuilderDelegate(
    this.builder, // 这里是 NullableIndexedWidgetBuilder
    {
    this.findChildIndexCallback,
    this.childCount,
    this.addAutomaticKeepAlives = true,
    this.addRepaintBoundaries = true,
    this.addSemanticIndexes = true,
    this.semanticIndexCallback = _kDefaultSemanticIndexCallback,
    this.semanticIndexOffset = 0,
  });
}

typedef NullableIndexedWidgetBuilder = Widget? Function(BuildContext context, int index);
```dart

看下 **build()** 方法：

💁‍♂️ **separated()** 也是用的 **SliverChildBuilderDelegate**，**custom()** 则需要通过 **childrenDelegate** 参数传入自定义的 **SliverChildDelegate**。继承关系：**ListView** → **BoxScrollView** → **ScrollView**，**BoxScrollView** 在 **ScrollView** 的基础上增加了 "**自动填充padding**" (避免状态栏遮挡-垂直滚动自动添加顶部填充、避免底部导航栏-自动添加底部填充、刘海屏适配-自动处理异形屏幕的安全区域)。另外，还对布局构建进行了抽象，子类只需实现 **buildChildLayout(BuildContext context)** 方法。构建调用链路：

```dart
ScrollView.build()
  ↓
BoxScrollView.buildSlivers()
  ↓
ListView.buildChildLayout()	// 生成 SliverMultiBoxAdaptorWidget 对象
  ↓
BoxScrollView.buildSlivers() // 包装ListView生成的Sliver (如SliverPadding)，返回[sliver]
  ↓
ScrollView.build() // 总装配
  ↓
@override
Widget build(BuildContext context) {
  final List<Widget> slivers = buildSlivers(context);  // ② 获取slivers
  final Scrollable scrollable = Scrollable(  // ① 创建Scrollable
    viewportBuilder: (context, offset) => buildViewport(context, offset, axisDirection, slivers),
  );
}
```dart

清楚明了，看下 **ListView.buildChildLayout()** ，根据不同情况，创建了四种类型的 **Sliver Widget**：

👀 跟下这四个 Sliver 到类的具体实现~

#### 3.3.3. SliverList - 动态列表

每个子项都要调用 **layout()** 方法，需要缓存已测量子项的信息，核心源码：

```dart
class SliverList extends SliverMultiBoxAdaptorWidget {
  const SliverList({
    super.key,
    required super.delegate,
  });

  @override
  RenderSliverList createRenderObject(BuildContext context) {
    final SliverMultiBoxAdaptorElement element = context as SliverMultiBoxAdaptorElement;
    return RenderSliverList(childManager: element);
  }
}

// 底层 RenderObject 核心逻辑
class RenderSliverList extends RenderSliverMultiBoxAdaptor {
  // 🔥 关键：每个子项都需要单独进行布局计算
  @override
  void performLayout() {
    // 1. 遍历每个可见的子项
    // 2. 调用 child.layout() 计算每个子项的实际尺寸
    // 3. 累积计算总的滚动范围
    // 4. 确定每个子项的位置

    double scrollOffset = constraints.scrollOffset;
    double remainingExtent = constraints.remainingPaintExtent;

    // 💡 关键性能瓶颈：需要逐个测量每个子项的高度
    while (remainingExtent > 0) {
      RenderBox child = getChildAtIndex(index);
      child.layout(constraints.asBoxConstraints(), parentUsesSize: true);

      // 📏 每次都要获取子项的实际高度
      double childExtent = getMainAxisExtent(child);
      // ... 位置计算和缓存逻辑
    }
  }
}
```dart

#### 3.3.4. SliverFixedExtentList - 固定高度高性能列表

直接通过数学计算确定位置，跳过子项的layout过程，可以精确预测滚动范围，核心源码：

```dart
class SliverFixedExtentList extends SliverMultiBoxAdaptorWidget {
  const SliverFixedExtentList({
    super.key,
    required super.delegate,
    required this.itemExtent, // 👈 关键：固定高度
  });

  final double itemExtent; // 🔥 核心：所有子项的固定高度

  @override
  RenderSliverFixedExtentList createRenderObject(BuildContext context) {
    final SliverMultiBoxAdaptorElement element = context as SliverMultiBoxAdaptorElement;
    return RenderSliverFixedExtentList(
      childManager: element,
      itemExtent: itemExtent, // 传递固定高度
    );
  }
}

// 底层 RenderObject 核心逻辑
class RenderSliverFixedExtentList extends RenderSliverMultiBoxAdaptor {
  final double itemExtent;

  @override
  void performLayout() {
    // 🚀 性能优势：可以直接计算而不需要测量

    // 1. 🔥 直接计算可见区域内的项目数量
    double scrollOffset = constraints.scrollOffset;
    int firstVisibleIndex = (scrollOffset / itemExtent).floor();
    int lastVisibleIndex = ((scrollOffset + constraints.viewportMainAxisExtent) / itemExtent).ceil();

    // 2. 🚀 直接计算每个子项的位置（无需layout测量）
    for (int index = firstVisibleIndex; index <= lastVisibleIndex; index++) {
      RenderBox child = getChildAtIndex(index);

      // 💎 关键优化：强制设置子项高度，跳过子项自己的layout计算
      child.layout(
        constraints.asBoxConstraints(
          minHeight: itemExtent,
          maxHeight: itemExtent, // 强制固定高度
        ),
        parentUsesSize: false, // 💡 不需要获取子项尺寸
      );

      // 🎯 直接计算位置：索引 * 固定高度
      double childMainAxisPosition = index * itemExtent - scrollOffset;
      // 设置子项位置...
    }

    // 3. 🚀 直接计算总的滚动范围
    geometry = SliverGeometry(
      scrollExtent: childCount * itemExtent, // 直接计算总高度
      paintExtent: math.min(constraints.remainingPaintExtent, maxPaintExtent),
      maxPaintExtent: childCount * itemExtent,
    );
  }
}
```dart

#### 3.3.5. SliverPrototypeExtentList - 原型高度列表

支持复杂的Widget作为原型，只需测量原型一次，后续使用固定高度算法，核心源码：

```dart
class SliverPrototypeExtentList extends SliverMultiBoxAdaptorWidget {
  const SliverPrototypeExtentList({
    super.key,
    required super.delegate,
    required this.prototypeItem, // 👈 关键：原型Widget
  });

  final Widget prototypeItem; // 🔥 核心：用于测量的原型Widget

  @override
  RenderSliverPrototypeExtentList createRenderObject(BuildContext context) {
    final SliverMultiBoxAdaptorElement element = context as SliverMultiBoxAdaptorElement;
    return RenderSliverPrototypeExtentList(
      childManager: element,
      prototypeItem: prototypeItem,
    );
  }
}

// 底层 RenderObject 核心逻辑：
class RenderSliverPrototypeExtentList extends RenderSliverMultiBoxAdaptor {
  Widget _prototypeItem;
  double? _prototypeExtent; // 缓存原型的高度

  @override
  void performLayout() {
    // 🎨 首次计算：测量原型Widget的高度
    if (_prototypeExtent == null) {
      _prototypeExtent = _measurePrototype();
    }

    // 💎 后续逻辑与SliverFixedExtentList类似
    double itemExtent = _prototypeExtent!;

    // 🚀 使用固定高度的高性能算法
    int firstVisibleIndex = (constraints.scrollOffset / itemExtent).floor();
    int lastVisibleIndex = ((constraints.scrollOffset + constraints.viewportMainAxisExtent) / itemExtent).ceil();

    for (int index = firstVisibleIndex; index <= lastVisibleIndex; index++) {
      RenderBox child = getChildAtIndex(index);

      // 🔥 强制使用原型高度
      child.layout(
        constraints.asBoxConstraints(
          minHeight: itemExtent,
          maxHeight: itemExtent,
        ),
        parentUsesSize: false,
      );
    }
  }

  // 🎨 原型测量方法
  double _measurePrototype() {
    // 1. 创建原型Widget的RenderObject
    RenderBox prototypeRenderBox = _createPrototypeRenderBox();

    // 2. 对原型进行layout测量
    prototypeRenderBox.layout(constraints.asBoxConstraints(), parentUsesSize: true);

    // 3. 获取原型的主轴高度
    double extent = getMainAxisExtent(prototypeRenderBox);

    // 4. 清理原型RenderObject
    prototypeRenderBox.dispose();

    return extent;
  }
}
```dart

#### 3.3.6. SliverVariedExtentList - 预定义不同高度列表

适用于高度已知，无需子项自己测量，itemExtentBuilder会被多次调用，计算过的高度会被缓存，核心源码：

```dart
class SliverVariedExtentList extends SliverMultiBoxAdaptorWidget {
  const SliverVariedExtentList({
    super.key,
    required super.delegate,
    required this.itemExtentBuilder, // 👈 关键：高度构建器
  });

  // 🔥 核心：根据索引和维度信息返回高度的回调
  final ItemExtentBuilder itemExtentBuilder;

  @override
  RenderSliverVariedExtentList createRenderObject(BuildContext context) {
    final SliverMultiBoxAdaptorElement element = context as SliverMultiBoxAdaptorElement;
    return RenderSliverVariedExtentList(
      childManager: element,
      itemExtentBuilder: itemExtentBuilder,
    );
  }
}

// 底层 RenderObject 核心逻辑：
class RenderSliverVariedExtentList extends RenderSliverMultiBoxAdaptor {
  final ItemExtentBuilder itemExtentBuilder;

  // 🔧 高度缓存机制
  final Map<int, double> _cachedExtents = <int, double>{};

  @override
  void performLayout() {
    double scrollOffset = constraints.scrollOffset;
    double remainingExtent = constraints.remainingPaintExtent;

    // 📊 混合策略：预计算 + 按需计算
    int currentIndex = 0;
    double currentOffset = 0;

    // 1. 🔍 找到第一个可见的子项（通过累积高度）
    while (currentOffset < scrollOffset) {
      double itemHeight = _getItemExtent(currentIndex);
      currentOffset += itemHeight;
      currentIndex++;
    }

    // 2. 🎯 渲染可见区域内的子项
    while (remainingExtent > 0 && currentIndex < childCount) {
      double itemHeight = _getItemExtent(currentIndex);

      RenderBox child = getChildAtIndex(currentIndex);
      // 💡 性能优化：使用预定义的高度约束子项
      child.layout(
        constraints.asBoxConstraints(
          minHeight: itemHeight,
          maxHeight: itemHeight,
        ),
        parentUsesSize: false,
      );

      remainingExtent -= itemHeight;
      currentIndex++;
    }
  }

  // 🔥 核心方法：获取指定索引的高度
  double _getItemExtent(int index) {
    // 缓存机制避免重复计算
    return _cachedExtents[index] ??= itemExtentBuilder(index, constraints);
  }
}
```dart

#### 3.3.7. Listview.builder 从静止到滚动

① **初始状态**

* **ListView** 被渲染，创建了 **RenderViewport** 和 **RenderSliverList**。
* **RenderViewport** 调用自己的 **performLayout()** ，计算出视口的尺寸，并生成一个 **SliverConstraints** 对象 (包含当前滚动偏移-scrollOffset-初始为0、剩余可绘制区域-remainingPaintExtent 等信息)。
* **RenderViewport** 将 **SliverConstraints** 传递给它的子 **RenderSliverList**，调用其 **layout()** 。
* **RenderSliverList** 接收到约束后，知道自己需要填充多大的空间，通过它的 "经理" (**RenderSliverMultiBoxAdaptor**) 开始向 **SliverChildBuilderDelegate** 索要子项。
* 它会从 index = 0 开始，调用 **builder(context, 0)** 创建第一个 Widget，然后测量它，再创建第二个、第三个... 直到所有子项的总高度填满了 **remainingPaintExtent** (视口高度)。此时，停止创建。
* 结果：只有屏幕上可见的 (如1-7号) item 被创建了 Widget、Element 和 RenderObject。8号及以后的item根本不在于内存中。

② **用户向上滑动**

* 用户的触摸事件导致 **ScrollPosition** 的 **pixels** 值发生变化。
* **ScrollPosition** 的变化会通知 **RenderViewport**，它的 **offset** (滚动偏移) 改变了。
* **RenderViewport** 被标记为 "**需要重新布局**"，下一帧 Flutter 会再次调用它的 **performLayout()** 。

③ **重新布局**

* **RenderViewport** 再次创建 **SliverConstraints**，但这次的 **scrollOffset** 已经是一个正值了 (如：如 150.0)。
* **RenderViewport** 再次调用 **RenderSliverList.layout()** ，并传入新的约束。
* **RenderSliverList** 查看新的 **scrollOffset**。它发现 index = 0 的 item 的绘制起点现在是 -150.0，已经部分或完全滑出视口顶部。同时，列表底部出现了新的空白区域。
* **RenderSliverList** 的 **performLayout**() 内部会调用一个至关重要的方法：**RenderSliverMultiBoxAdaptor** 的 **addInitialChild()** 和 **collectGarbage()** 。
* 「**加载新项**」它会计算出当前视口和缓存区所需的 index 范围。假设现在需要 8 号和 9 号 item，它就会通过 **SliverMultiBoxAdaptorElement** 调用 **SliverChildBuilderDelegate** 的 build(context, 8) 和 build(context, 9)，创建新的 Widget -> Element -> RenderObject，并将其添加到 Render Tree 中。
* 「**回收旧项**」同时，它会检查哪些旧的子项 (比如 index = 0) 已经完全滑出了视口和缓存区。**RenderSliverMultiBoxAdaptor** 中的 **collectGarbage** 方法会被调用。这个方法会遍历所有当前的子 RenderObject，判断它们的位置是否已经远离了可见区域。如果一个子项被判定为 "垃圾"，它对应的 **Element** 会被 **deactivate** 和 **unmount**，其 **RenderObject** 会被 **detach**，最终被 Dart 的垃圾回收器回收。

🤔 "**计算所需范围 -> 创建新项 -> 回收旧项**" 的循环，在每次滑动 (导致offset变化) 时都会发生，从而实现了高效的懒加载和资源回收。

### 3.4. GridView

**简介**：

用于创建 **二维可滚动网格布局容器**，能够将一系列子Widget 排列成 **多行多列的网格形式**，支持横向和纵向滚动。

#### 3.4.1. API 详解

继承 **BoxScrollView**，属性和Listview差不多，核心是 "**gridDelegate**"，它负责定义 **网格的几何结构**。

```dart
// 控制网格布局的代理
final SliverGridDelegate gridDelegate;

// Flutter 提供了两个实现
SliverGridDelegateWithFixedCrossAxisCount
- crossAxisCount: 固定列数。
- mainAxisSpacing: 主轴间距。
- crossAxisSpacing: 交叉轴间距。
- childAspectRatio: 子项的宽高比。默认为 1.0。非常重要，用于计算子项在主轴上的高度。

SliverGridDelegateWithMaxCrossAxisExtent
- maxCrossAxisExtent: 子项在交叉轴上的最大尺寸
- 其它参数同上
```dart

提供了 **五种构造方式**：

```dart
// 模拟一些数据
final List<int> data = List.generate(50, (index) => index);

// ✨ ① GridView() - 默认构造函数
// 需要手动提供 gridDelegate 和 children 列表，适合少量、固定的子项。
GridView(
  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 3,	// 交叉轴子项数量
    crossAxisSpacing: 10,	// 交叉轴方向相邻子项间的间距
    mainAxisSpacing: 10,	// 主轴方向相邻子项间的间距
    childAspectRatio: 1.0, // 子项的宽高比
  ),
  children: data.map((i) => GridItem(index: i)).toList()
);

// ✨ ① GridView.count() - 最常用，用于创建固定列数的网格
GridView.count(
  // 核心参数：固定列数
  crossAxisCount: 4,
  crossAxisSpacing: 10,
  mainAxisSpacing: 10,
  children: data.map((i) => GridItem(index: i)).toList(),
);

// ✨ ③ GridView.extent() - 响应式布局，根据子项的最大宽度自动计算列数。
GridView.extent(
  // 核心参数：子项在交叉轴上的最大尺寸
  maxCrossAxisExtent: 120.0,
  crossAxisSpacing: 10,
  mainAxisSpacing: 10,
  children: data.map((i) => GridItem(index: i)).toList(),
);

// ✨ ④ GridView.builder() - 高性能懒加载，用于大量或无限数据的场景，按需构建子项。
GridView.builder(
  // 布局代理，与默认构造函数中的一样
  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 3,
    crossAxisSpacing: 10,
    mainAxisSpacing: 10,
  ),
  // 核心参数：子项总数
  itemCount: data.length,
  // 核心参数：子项构建器
  itemBuilder: (context, index) {
    // 只有当 item 将要显示时，此方法才会被调用
    print('Building item for builder: $index');
    return GridItem(index: data[index]);
  },
);

// ✨ ⑤ GridView.custom() - 完全自定义，提供了最大的灵活性，可以自定义子项的构建和管理策略。
GridView.custom(
  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
    maxCrossAxisExtent: 150,
    mainAxisSpacing: 10,	// 主轴间距
    crossAxisSpacing: 10,	// 交叉轴间距
  ),
  // 核心参数：子项代理
  // SliverChildBuilderDelegate 行为与 GridView.builder 相同
  childrenDelegate: SliverChildBuilderDelegate(
    (context, index) {
      return GridItem(index: data[index]);
    },
    childCount: data.length,
  ),
);
```dart

简单使用示例【--->[c35/gridview_demo.dart](https://github.com/配套示例源码/blob/master/lib/c35/gridview_demo.dart)<---】运行效果：

#### 3.4.2. 源码剖析

有了前面 **ListView** 的经验，看起源码来可谓是轻车熟路了，先是 **构造方法**：

```dart
// 😄 前三个的 Sliver 都是【SliverChildListDelegate】，全是一次性加载所有子控件
// 区别在于【网格布局代理类】的不同：
//
//「SliverGridDelegateWithFixedCrossAxisCount」
// 固定交叉轴上的子项数量 (列数/行数)，无论屏幕多大，始终显示固定的列数
// 子项宽度：childWidth = (totalWidth - spacing) / crossAxisCount
//
//「SliverGridDelegateWithMaxCrossAxisExtent」
// 固定子项在交叉轴上的最大尺寸，根据屏幕大小自动计算合适的列数
// 开发者指定子项最大宽度固定，如：maxCrossAxisExtent = 150.0
// 计算列数：crossAxisCount = ceil(totalWidth / (maxCrossAxisExtent + spacing))
// 计算子项宽度：childWidth = (totalWidth - spacing) / crossAxisCount

GridView()  → 需要自定义 SliverGridDelegateWithFixedCrossAxisCount 通过 gridDelegate 传入

GridView.count()  → 内部自动创建 SliverGridDelegateWithFixedCrossAxisCount

GridView.extend() → 内部自动创建 SliverGridDelegateWithMaxCrossAxisExtent

// 💡 懒加载，Sliver 是【SliverChildBuilderDelegate】，需传入自定义的 gridDelegate 参数。
GridView.builder()

// 既需要自定义 gridDelegate 参数，也需要自定义 childrenDelegate 参数。
GridView.custom()
```dart

**GridView** 也是继承 **BoxScrollView**，直接搜 **buildChildLayout()** ：

#### 3.4.3. SliverGrid - 网格布局

用于在 **二维网格中放置多个 box 子组件** 的 **Sliver** 组件，专门为滚动视图设计的 **网格布局组件**。

**RenderSliverGrid** 的核心源码：

```dart
class RenderSliverGrid extends RenderSliverMultiBoxAdaptor {
  @override
  void performLayout() {
    // 🎯【准备阶段】获取滚动约束条件
    final SliverConstraints constraints = this.constraints;
    childManager.didStartLayout();
    childManager.setDidUnderflow(false);

    final double scrollOffset = constraints.scrollOffset + constraints.cacheOrigin;
    final double remainingExtent = constraints.remainingCacheExtent;
    final double targetEndScrollOffset = scrollOffset + remainingExtent;

    // 🎯【计算可见范围】获取布局策略、计算第一个/最后一个可见子项索引
    final SliverGridLayout layout = _gridDelegate.getLayout(constraints);
    final int firstIndex = layout.getMinChildIndexForScrollOffset(scrollOffset);
    final int? targetLastIndex = targetEndScrollOffset.isFinite ?
    layout.getMaxChildIndexForScrollOffset(targetEndScrollOffset) : null;

    // 🎯【垃圾回收】移除不在可见范围内的子组件，释放内存
    if (firstChild != null) {
      final int leadingGarbage = calculateLeadingGarbage(firstIndex: firstIndex);
      final int trailingGarbage = targetLastIndex != null ? calculateTrailingGarbage(lastIndex: targetLastIndex) : 0;
      collectGarbage(leadingGarbage, trailingGarbage);
    } else {
      collectGarbage(0, 0);
    }

    // 🎯【布局子组件】每个子组件都通过 SliverGridGeometry 获得精确的位置和尺寸
    // 双向构建-既向前也向后添加子组件，懒加载-只构建可见区域的子组件

    // 处理第一个子组件
    final SliverGridGeometry firstChildGridGeometry = layout.getGeometryForChildIndex(firstIndex);

    // 向前添加子组件
    for (int index = indexOf(firstChild!) - 1; index >= firstIndex; --index) {
      final SliverGridGeometry gridGeometry = layout.getGeometryForChildIndex(index);
      final RenderBox child = insertAndLayoutLeadingChild(
        gridGeometry.getBoxConstraints(constraints),
      )!;
      final SliverGridParentData childParentData = child.parentData! as SliverGridParentData;
      childParentData.layoutOffset = gridGeometry.scrollOffset;
      childParentData.crossAxisOffset = gridGeometry.crossAxisOffset;
    }

    // 向后添加子组件
    for (int index = indexOf(trailingChildWithLayout!) + 1; targetLastIndex == null || index <= targetLastIndex; ++index) {
      // ... 类似的布局逻辑
    }

    // 🎯【计算几何信息】估算总滚动范围、计算绘制区域、计算缓存区域
    final double estimatedTotalExtent = reachedEnd
      ? trailingScrollOffset
      : childManager.estimateMaxScrollOffset(
          constraints,
          firstIndex: firstIndex,
          lastIndex: lastIndex,
          leadingScrollOffset: leadingScrollOffset,
          trailingScrollOffset: trailingScrollOffset,
        );
    final double paintExtent = calculatePaintOffset(
      constraints,
      from: math.min(constraints.scrollOffset, leadingScrollOffset),
      to: trailingScrollOffset,
    );
    geometry = SliverGeometry(
      scrollExtent: estimatedTotalExtent,
      paintExtent: paintExtent,
      maxPaintExtent: estimatedTotalExtent,
      cacheExtent: cacheExtent,
      hasVisualOverflow: estimatedTotalExtent > paintExtent || constraints.scrollOffset > 0.0 || constraints.overlap != 0.0,
    );
  }
}
```dart

代码有点多，梳理下执行链条：

```dart
RenderSliverGrid.performLayout()  // 开始网格布局
  ↓
childManager.didStartLayout()  // 初始化子组件管理器
  ↓
_gridDelegate.getLayout(constraints)  // 获取网格布局策略
  ↓
layout.getMinChildIndexForScrollOffset(scrollOffset)  // 计算第一个可见子项索引
  ↓
layout.getMaxChildIndexForScrollOffset(targetEndScrollOffset)  // 计算最后一个可见子项索引
  ↓
collectGarbage(leadingGarbage, trailingGarbage)  // 回收不可见的子组件
  ↓
layout.getGeometryForChildIndex(firstIndex)  // 获取第一个子项的几何信息
  ↓
for (index >= firstIndex; --index)  // 【循环1】向前布局缺失的子组件
  → insertAndLayoutLeadingChild()
  → 设置 layoutOffset 和 crossAxisOffset
  ↓
for (index <= targetLastIndex; ++index)  // 【循环2】向后布局新的子组件
  → insertAndLayoutChild()
  → 设置 layoutOffset 和 crossAxisOffset
  ↓
childManager.estimateMaxScrollOffset()  // 估算总滚动范围
  ↓
calculatePaintOffset() / calculateCacheOffset()  // 计算绘制和缓存区域
  ↓
geometry = SliverGeometry(...)  // 创建最终几何信息
  ↓
childManager.didFinishLayout()  // 完成布局，清理资源
```dart

😄 套下数据写个简单的例子 (垂直方向、一行4列，子元素高度为50，Viewport 为180，有24个子项)：

```dart
// ① 计算可见范围
scrollOffset = 0 (初始位置)
targetEndScrollOffset = 0 + 180 = 180
layout.getMinChildIndexForScrollOffset(0) = 0     // 第一个可见项：索引0
layout.getMaxChildIndexForScrollOffset(180) = 15  // 最后一个可见项：索引15
// 计算详解
mainAxisCount = (180 / 50).ceil() = 3.6.ceil() = 4 行
maxChildIndex = max(0, 4 * 4 - 1) = 15

// ② 分析子项分布 (24个):
行1 (y=0-50):    [0] [1] [2] [3]
行2 (y=50-100):  [4] [5] [6] [7]
行3 (y=100-150): [8] [9] [10][11]
行4 (y=150-200): [12][13][14][15]
行5 (y=200-250): [16][17][18][19]    ← 不可见
行6 (y=250-300): [20][21][22][23]    ← 不可见

实际需要布局的子项: 索引 0-15 (只有前16个)
不会创建的子项: 索引 16-23 (后8个)

// ③ 布局执行
collectGarbage(): 清理超出范围的子项

第一个循环 (向前布局):
无需执行 (从索引0开始)

第二个循环 (向后布局):
for (index = 1; index <= 15; ++index) {  // 注意：只到15，不到23
  insertAndLayoutChild() // 只创建索引1到15的子项
  设置 layoutOffset 和 crossAxisOffset
}

索引16-23的子项: 完全不会被创建！

// ④ 最终几何信息
estimatedTotalExtent = childManager.estimateMaxScrollOffset()
// 会根据已知的16个子项来估算24个子项的总高度
// 估算结果: 6行 × 50px = 300px

paintExtent = 180px (viewport高度)
scrollExtent = 300px (估算的总滚动范围)

// 渲染结果
┌─────────────────────────┐ ← viewport top (y=0)
│ [0]  [1]  [2]  [3]     │ ← 行1: 已创建，完全可见
│ [4]  [5]  [6]  [7]     │ ← 行2: 已创建，完全可见
│ [8]  [9]  [10] [11]    │ ← 行3: 已创建，完全可见
│ [12] [13] [14] [15]    │ ← 行4: 已创建，部分可见
└─────────────────────────┘ ← viewport bottom (y=180)
未显示区域:
│ [16] [17] [18] [19]    │ ← 行5: 未创建，不可见
│ [20] [21] [22] [23]    │ ← 行6: 未创建，不可见
```dart

### 3.5. PageView

**简介**

可滚动的列表，特殊之处在于它的每个子组件 (称为"**页面**") 在滚动时都会强制占据整个视口 (**Viewport**)。常用于引导页、轮播图。TabBarView 也是基于它实现的，用来配置TabBar展示不同标签下的内容。

#### 3.5.1. API 详解

继承 **StatefulWidget**，同样挑几个属性讲讲：

* **pageSnapping**：**bool**，是否启用页面吸附，默认true，滚动停止时会自动吸附到最近的页面边界，设置 false，则可以停在任何位置。
* **padEnds**：**bool**，是否在列表的两端添加填充，默认true，会在第一页和最后一页添加额外的填充空间。使得第一页和最后一页能够居中显示在视口中。这个参数只有 **viewportFraction** < 1.0 时才生效。
* **onPageChanged**：**ValueChanged?** ，当一个新页面完全显示时 (pageSnapping完成后) 调用，可以获取新页面的索引。
* **childrenDelegate**：**PageView** 内部使用它来生成子组件，不同构造方法最终会创建不同类型的 **SliverChildDelegate**。

提供了 **三种构造方式**：

```dart
// ✨ ① PageView() - 默认构造函数，适合页面数量较少且固定的情况
PageView(
  children: <Widget>[
    _buildPage(1, Colors.pink),
    _buildPage(2, Colors.cyan),
    _buildPage(3, Colors.deepPurple),
  ],
)

// ✨ ② PageView.builder() - 构造器构造函数，最常用，懒加载，适合页面数量多或不确定的情况。
// 假设有100个页面
const int pageCount = 100;
PageView.builder(
  itemCount: pageCount,
  itemBuilder: (BuildContext context, int index) {
    // itemBuilder 会在页面即将进入视口时被调用
    // 这意味着只有当用户滑动到某个页面时，它才会被构建
  }
)

// ✨ ③ PageView.custom() - 自定义构造函数，对子项的构建、布局和回收逻辑进行高度自定义时。
PageView.custom(
  // childrenDelegate 是核心，它决定了如何提供子页面
  childrenDelegate: SliverChildBuilderDelegate(
    (BuildContext context, int index) {
      // 如：奇数页和偶数页显示不同的内容
      if (index.isEven) {
        return Container(
          color: Colors.green,
          child: Center(
            child: Text(
              'Even Page ${index + 1}\n(From PageView.custom())',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 22, color: Colors.white),
            ),
          ),
        );
      } else {
        return Container(
          color: Colors.orange,
          child: Center(
            child: Text(
              'Odd Page ${index + 1}\n(From PageView.custom())',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 22, color: Colors.white),
            ),
          ),
        );
      }
    },
    // 同样可以指定子项数量，也可以为 null 表示无限列表
    childCount: 20,
  ),
);
```dart

页面的切换控制，用到的 → **PageController**，它继承自 **ScrollController**，在原有像素级别的基础上，新增了 "**页面**" 级别的滚动控制，构造方法 & 类成员：

```dart
PageController({
  this.initialPage = 0,           // 初始页面索引
  this.keepPage = true,           // 是否保存页面状态
  this.viewportFraction = 1.0,    // 视口占比，< 1.0 每页只占部分视口，可以看到相邻页面的一部分
                                  // > 1.0: 每页超出视口，会有padding效果
  super.onAttach,                 // 附加回调
  super.onDetach,                 // 分离回调
}) : assert(viewportFraction > 0.0);

double? get page	// 当前页面的精确位置，可能包含小数部分，如 1.5 表示在第1页和第2页之间
                  // 必须在 PageView 构建完成后才能访问

// 核心方法

// 动画地切换到指定页面
animateToPage(int page, {required Duration duration, required Curve curve})

// 无动画地直接跳转到指定页面
jumpToPage(int page)

// 动画地切换到下一页
nextPage({required Duration duration, required Curve curve})

// 动画地切换到上一页
previousPage({required Duration duration, required Curve curve})
```dart

简单使用示例【--->[c35/pageview_demo.dart](https://github.com/配套示例源码/blob/master/lib/c35/pageview_demo.dart)<---】运行效果：

💡 **Tips**：滑动几页后，切换Tab，再切回来，发现会从第一页开始，即重新创建。如果想 **保存页面状态**，子页面需混入 **AutomaticKeepAliveClientMixin** 并重写 **wantKeepAlive** 返回 true ❗️

#### 3.5.2. 源码剖析

😄 没啥新意，默认构造是 **SliverChildListDelegate**，**builder()** 则是 **SliverChildBuilderDelegate**，前者一次性构建所有的子Widget，后者动态懒加载。**PageView** 继承 **StatefulWidget**，直接看 **_PageViewState.build()** ：

**SliverFillViewport** 继承 **StatelessWidget**，直接看 **build()** ：

* **_SliverFractionalPadding**：负责根据视口大小动态计算并添加内边距，让SliverFillViewport的首尾子项能够居中显示。
* **_SliverFillViewportRenderObjectWidget**：Widget 和 RenderObject间的桥梁，负责创建和管理**RenderSliverFillViewport** 渲染对象。

**RenderSliverFillViewport** 的父类 **RenderSliverFixedExtentBoxAdaptor** 实现了 **performLayout()** ，关键代码：

```dart
abstract class RenderSliverFixedExtentBoxAdaptor extends RenderSliverMultiBoxAdaptor {
  @override
  void performLayout() {
    // ① 初始化阶段

    // 获取约束信息
    final SliverConstraints constraints = this.constraints;
    childManager.didStartLayout();

    // 计算关键偏移量
    final double scrollOffset = constraints.scrollOffset + constraints.cacheOrigin;
    final double targetEndScrollOffset = scrollOffset + remainingExtent;

    // ② 索引计算阶段

    // 获取约束信息
    final SliverConstraints constraints = this.constraints;
    childManager.didStartLayout();

    // 计算关键偏移量
    final double scrollOffset = constraints.scrollOffset + constraints.cacheOrigin;
    final double targetEndScrollOffset = scrollOffset + remainingExtent;

    // ③ 垃圾回收阶段
    // 计算需要布局的子组件索引范围
    final int firstIndex = getMinChildIndexForScrollOffset(scrollOffset, -1);
    final int? targetLastIndex = getMaxChildIndexForScrollOffset(targetEndScrollOffset, -1);

    // ④ 子组件布局阶段
    // 向前布局：清理不再需要的子组件
    final int leadingGarbage = calculateLeadingGarbage(firstIndex: firstIndex);
    final int trailingGarbage = calculateTrailingGarbage(lastIndex: targetLastIndex);
    collectGarbage(leadingGarbage, trailingGarbage);
    // 向后布局：从 firstChild 向前插入和布局子组件
    for (int index = indexOf(firstChild!) - 1; index >= firstIndex; --index) {
      final RenderBox? child = insertAndLayoutLeadingChild(_getChildConstraints(index));
      childParentData.layoutOffset = indexToLayoutOffset(-1, index);
    }

    // ⑤ 几何信息结算阶段：从 trailingChildWithLayout 向后插入和布局子组件
    for (int index = indexOf(trailingChildWithLayout!) + 1; index <= targetLastIndex; ++index) {
      RenderBox? child = insertAndLayoutChild(_getChildConstraints(index), after: trailingChildWithLayout);
      childParentData.layoutOffset = indexToLayoutOffset(-1, index);
    }

    // ⑥ 完成阶段
    // 计算各种范围信息
    final double paintExtent = calculatePaintOffset(constraints, from: leadingScrollOffset, to: trailingScrollOffset);
    final double cacheExtent = calculateCacheOffset(constraints, from: leadingScrollOffset, to: trailingScrollOffset);

    // 设置最终的几何信息
    geometry = SliverGeometry(
      scrollExtent: estimatedMaxScrollOffset,
      paintExtent: paintExtent,
      cacheExtent: cacheExtent,
      maxPaintExtent: estimatedMaxScrollOffset,
      hasVisualOverflow: ...,
    );
  }
}
```dart

## 4. 高级组件 & 自定义滚动

**Sliver** 是 **Flutter** 为了解决 **大量内容滚动时的性能问题** 而设计的 **视口驱动渲染机制**，它 **只构建和渲染用户当前能看到的部分**，相比 **普通Widget** 一次性构建所有内容，导致内存爆炸和性能问题要高效得多。

### 4.1. CustomScrollView

用于 **构建自定义、复杂的滚动视图**，它本身不直接决定其子项的布局，而是创建了一个可以容纳 **Sliver** 系列组件的 **滚动视口** (Viewport)。继承自 **ScrollView**，只是重写了 **buildSlivers()** ，返回构造参数传入的 **slivers** - **Sliver组件列表**。

### 4.2. SliverPersistentHeader

**Persistent**-"**持久化**"，该组件可以 **根据滚动位置改变自身大小**，并且可以选择性地 "**钉**" 在视口(Viewport) **顶部**的 **Sliver**。当它滚动到屏幕边缘时，它不会像普通列表项那样完全滚出屏幕，而是可以收缩到一个最小高度并"固定在那里"，直到被下一个 **SliverPersistentHeader** 或者滚动会顶部所代替。😄 其实就很常说的"**吸顶**"组件。

```dart
class SliverPersistentHeader extends StatelessWidget {
  const SliverPersistentHeader({
    Key? key,
    required this.delegate,	 // 头部布局的委托对象，包括：最大/最小高度和构建逻辑
    this.pinned = false,	// 是否固定在视口顶部 (滚动也不消失)
    this.floating = false,	// 是否有浮动效果 (用户反向滚动会立即重新出现)
  });
}
```dart

**SliverPersistentHeaderDelegate** 是一个抽象类，需继承并实现下述方法：

```dart
@override
double get minExtent => 60.0; // 最小高度

@override
double get maxExtent => 200.0; // 最大高度

// 返回头部的 UI 组件，参数：
// 「shrinkOffset」-头部从最大高度 maxExtent 收缩的距离，可能范围[0.0, maxExtent-minExtent]
// 当 shrinkOffset 为 0 时，头部处于完全展开状态，当达到最大值时，头部处于完全收缩状态
// 可以利用这个值来实现各种动画效果，如 (透明度、位移、大小锁房)
//
//「overlapsContent」该 Header 当前是否与滚动视图中的主要内容重写。
// 通常在 pinned 为 true 时，Header 下方的内容开始滚动到其后面时，此值为 true。
@override
Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
  return Container(/* 你的头部内容 */);
}

@override
bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) {
  // 返回是否需要重建
  return true;
}
```dart

写个简单使用示例【--->[c35/sliver_persistent_header_demo.dart](https://github.com/配套示例源码/blob/master/lib/c35/sliver_persistent_header_demo.dart)<---】运行效果：

😶 简单传几个参数就实现了吸顶和浮动效果，跟下源码，看下是怎么做到的，**build()** 根据不同的值情况返回不同的 **渲染对象**，跟下对应的 **performLayout()** 的核心代码：

从下往上看，先是 **_SliverScrollingPersistentHeader** → **RenderSliverScrollingPersistentHeader**：

接着是 **_SliverFloatingPersistentHeader** → **RenderSliverFloatingPersistentHeader**：

再接着 **_SliverPinnedPersistentHeader** → **RenderSliverPinnedPersistentHeader**：

最后是 **_SliverFloatingPinnedPersistentHeader** → **RenderSliverFloatingPinnedPersistentHeader**，浮动效果来自于父类 **RenderSliverFloatingPersistentHeader**，吸顶效果则是重写 **updateGeometry()** 实现：

😄 在 **CustomScrollView** 中连续使用多个 **SliverPersistentHeader** 会怎么样？**会一层层叠起来**！【--->[c35/multiple_pinned_header_demo.dart](https://github.com/配套示例源码.dart)<---】运行效果：

如果想实现 "**分组吸顶**"(多个分组只有一个分组标题吸顶)，可以使用 [**flutter_sticky_header**](https://pub.dev/packages/flutter_sticky_header) 三方库，使用案例【--->[c35/sticky_header_group_demo.dart](https://github.com/配套示例源码.dart)<---】运行效果：

### 4.3. SliverAppBar

基于 **SliverPersistentHeader** 实现的具体 **应用栏组件** (内置应用的常见功能，如标题、操作按钮、背景等)，开箱即用，相比起手写一坨 **_SliverHeaderDelegate**，直接配置几个属性即可轻松实现相同的效果：**floating**、**pinned** 就不用说了，还有这些：

* **snap**：是否启用快速收缩/展开动画。
* **expandedHeight**：完全展开时的高度，通常和 flexibleSpace 来显示背景内容，null 时使用默认工具栏高度。
* **collapsedHeight**：收缩时的最小高度，不写默认为 toolbarHeight + bottom?.preferredSize.height。
* **stretch**：bool，是否启用拉伸效果，默认false， 禁用拉伸效果，应用栏保持固定大小。设为true，当用户向下过度滚动时，应用栏会被拉伸放大。开启后的视觉效果：下拉时应用栏的 **flexibleSpace** 区域会被拉伸，拉伸后背景内容会按比例放大。
* **stretchTriggerOffset**：double，设置触发 **onStretchTrigger** 回调 (拉伸回弹) 需要的过度滚动距离，默认100像素，计算方式: 从应用栏的自然位置开始计算向下的拖拽距离。
* **onStretchTrigger**：**Future** ，拉伸触发的异步回调，用户拖拽超过阈值且松手时 (拉伸距离达到stretchTriggerOffset)，注意，只在 stretch = true 时有效。

写个简单使用示例【--->[c35/sliver_app_bar_demo.dart](https://github.com/配套示例源码/blob/master/lib/c35/sliver_app_bar_demo.dart)<---】运行效果：

跟下源码，内部使用 **_SliverAppBarDelegate** 来实现 **SliverPersistentHeaderDelegate**：

### 4.4. SliverLayoutBuilder

**LayoutBuilder** 的 **Sliver** 版本，允许开发者在 "**布局**" 过程中获取 **SliverConstraints**，并根据这些约束 **动态构建** 不同的 Sliver 布局。**SliverConstraints** 属性前面讲解过了，不在赘述，简单使用示例：

```dart
SliverLayoutBuilder(
  builder: (BuildContext context, SliverConstraints constraints) {
    // 根据约束条件动态构建内容 (价差周范围)
    if (constraints.crossAxisExtent > 600) {
      // 宽屏显示多列
      return SliverGrid(
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) => YourItemWidget(index),
          childCount: 20,
        ),
      );
    } else {
      // 窄屏显示单列
      return SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) => YourItemWidget(index),
          childCount: 20,
        ),
      );
    }
  },
)
```dart

代码调用链路：

```dart
// 【创建阶段】SliverLayoutBuilder
@override
RenderObject createRenderObject(BuildContext context) => _RenderSliverLayoutBuilder();

//【布局阶段】_RenderSliverLayoutBuilder
@override
void performLayout() {
  rebuildIfNecessary();  // 检查是否需要重建
  child?.layout(constraints, parentUsesSize: true);  // 布局子组件
  geometry = child?.geometry ?? SliverGeometry.zero;  // 设置几何信息
}

//【重建阶段】RenderConstrainedLayoutBuilder
// 当约束发生变化时，rebuildIfNecessary() 会触发 builder 函数重新执行，
// Builder 函数接收最新的 SliverConstraints 参数
// 🎯 核心方法：检查是否需要重建
void rebuildIfNecessary() {
  assert(_callback != null);
  if (_previousConstraints != constraints) {
    // 💡 关键判断：约束发生变化时触发重建
    _previousConstraints = constraints;
    _callback!();  // 调用布局回调，重新执行 builder 函数
  }
}

// 🔄 布局回调函数，会重新调用 builder
LayoutCallback<ConstraintType>? _callback;

void set layoutCallback(LayoutCallback<ConstraintType>? value) {
  if (value == _callback) return;
  _callback = value;
  markNeedsLayout();
}

// 【绘制阶段】
@override
void paint(PaintingContext context, Offset offset) {
  if (child?.geometry?.visible ?? false) {
    context.paintChild(child!, offset);  // 绘制子组件
  }
}
```dart

### 4.5. NestedScrollView

当你在一个可滚动组件中放入一个"**同方向**"的可滚动组件，通常会遇到两大类问题："**手势冲突**" & "**布局约束问题**"。比如最经典的例子：**两个垂直滚动的ListView嵌套**，会怎么样？

先是会报错：xxx has an unbounded height，尝试添加 **固定高度** 约束后。只有内部的列表在滑动，当它滚动尽头时，滚动事件并不会自动传递给外部的ListView。(🐶一种不太好的解法，内部ListView设置：**shrinkWrap:true + physics: NeverScrollableScrollPhysics()** ，即收缩+禁止滚动，仅适用于列表项少且固定的情况)。

而 **NestedScrollView** 就是为了解决这两个问题而设计出来的：

* 通过 **滚动协调器** ( **_NestedScrollCoordinator**) 统一管理和分配滚动事件，消除竞争.
* 为 **body** 提供了有界约束，使其内部的可滚动组件可以正常布局。

#### 4.5.1. API 详解

构造方法：

```dart
class NestedScrollView extends StatefulWidget {
  const NestedScrollView({
    super.key, // Widget的唯一标识符，用于性能优化和状态保持
    this.controller, // 外层滚动控制器，用于程序化控制滚动位置和监听滚动事件
    this.scrollDirection = Axis.vertical, // 滚动方向，默认垂直滚动（仅影响外层滚动）
    this.reverse = false, // 是否反向滚动，true时从底部开始滚动（仅影响外层滚动）
    this.physics, // 滚动物理效果，控制弹性、边界行为等滚动特性（仅影响外层滚动）
    required this.headerSliverBuilder, // 头部构建器，返回头部Sliver组件列表（如SliverAppBar）
    required this.body, // 主体内容Widget，通常是TabBarView或其他滚动组件
    this.dragStartBehavior = DragStartBehavior.start, // 拖拽开始行为，控制手势识别的起始时机
    this.floatHeaderSlivers = false, // 是否优先浮动头部Sliver，true时向下滚动优先展开头部
    this.clipBehavior = Clip.hardEdge, // 内容裁剪行为，控制超出边界内容的显示方式
    this.restorationId, // 状态恢复ID，用于应用重启时恢复滚动位置
    this.scrollBehavior, // 滚动行为配置，定义滚动样式、物理效果等平台相关行为
  });
```dart

**核心属性**：

* **headerSliverBuilder**：**NestedScrollViewHeaderSliversBuilder** → List Function(BuildContext context, bool innerBoxIsScrolled)，用于构建 **头部** 的 **Sliver** 组件列表。第二个参数的值代表"**嵌套的滑动内容是否已经达到顶部，开始滑动**"。
* **body**：**Widget**，主体部分，通常是一个包含可滚动内容的组件，最常见的是 **TabBarView**，其每个子页面都是一个 ListView 或 CustomScrollView，这部分内容构成了 "**内部滚动视图**"。
* **controller**：**ScrollController**，控制外层滚动，内层滚动由 **PrimaryScrollController** 自动管理。
* **floatHeaderSlivers**：是否优先浮动头部Slivers，默认 false，设为 true，向下滚动会优先展开头部。
* **注**：scrollDirection、reverse、physics 只影响外层滚动视图，内层滚动视图需要在body中单独配置。

最简单的使用代码示例 (注意headerSliverBuilder列表的元素必须为Sliver组件，如：SliverList)：

```dart
 NestedScrollView(
  // 头部
  headerSliverBuilder: (BuildContext context, bool innerBoxIsScrolled) {
    return <Widget>[
      SliverToBoxAdapter(
        child: Container(height: 200, color: Colors.orange),
      ),
    ];
  },
  // 主体
  body: Container(
    color: Colors.orange.shade50,
    child: ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 30,
      itemBuilder: (context, index) => Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: Colors.orange,
            child: Text('${index + 1}'),
          ),
          title: const Text('这是主体内容 (body)'),
          subtitle: Text('列表项 ${index + 1}'),
        ),
      ),
    ),
  ),
),
```dart

运行效果：

尝试 **SliverAppBar**：

```dart
 headerSliverBuilder: (BuildContext context, bool innerBoxIsScrolled) {
  return <Widget>[
    // 🎨 可折叠的 SliverAppBar
    SliverAppBar(
      title: const Text('📱 SliverAppBar 示例'),
      backgroundColor: Colors.purple,
      foregroundColor: Colors.white,
      floating: true,
      pinned: true,
      snap: true,
      expandedHeight: 200.0,
      // 🎭 弹性空间 - 展开时显示的内容
      flexibleSpace: FlexibleSpaceBar(
        title: const Text('可折叠标题'),
        background: Container(
          color: Colors.purple,
          child: Center(
            child: Icon(Icons.star, size: 80, color: Colors.white.withOpacity(0.3)),
          ),
        ),
      ),
      // 根据内容滚动状态决定是否显示阴影
      forceElevated: innerBoxIsScrolled,
    ),
  ];
},
```dart

运行效果：

在 **NestedScrollView** 中，使用 floating、pinned、snap 等属性的 **SliverAppBar** 时，会产生 "**重叠**" 问题：

AppBar 在展开/收起过程中可能遮挡内容、内层滚动视图的内容可能显示在 AppBar 下方、滚动对齐不正确。

为了避免 body 的初始内容被 Header 遮挡，你需要使用这两对组合：

* **SliverOverlapInjector**：将它作为 **headerSliverBuilder** 返回的 Sliver 列表中的一个父组件，包裹住其他 Sliver。它会捕获其子 Sliver (如 SliverAppBar) 所占据的重叠量。
* **SliverOverlapInjector**：在 body 内部的可滚动视图，将它作为第一个Sliver，它会将**SliverOverlapAbsorber** 捕获到的重叠量作为内边距，应用到其内部，从而将 body内容往下挪，避免被遮挡。

用法示例 (注：两者必须使用同一个 **SliverOverlapAbsorberHandle**)：

```dart
// 在 headerSliverBuilder 中，套Sliver组件
SliverOverlapAbsorber(
  handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
  sliver: SliverAppBar(...), // 包装会产生重叠的组件
)

// 在 body 的每个滚动视图中，在 TabBarView 的每个 Tab 中都要使用 SliverOverlapInjector
SliverOverlapInjector(
  handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
)
```dart

另外，你可能发现滑动后，且Tab到别的页面，回来后，第一页的 **滑动距离没有保持**，给 **CustomScrollView** 的 **key** 属性设置一个 **PageStorageKey** 的对象 (唯一标识) 即可解决。原理是 **ScrollPosition** 类中通过 **PageStorage** 组件进行滑动进度的读写。

💡 **Tips**: 在 body 的 TabBarView 中为每个 ListView 都提供了自己的 ScrollController，会导致NestedScrollView 的协调机制 失效！

#### 4.5.2. 源码剖析

核心大脑 **_NestedScrollCoordinator** (协调器)：

```dart
class _NestedScrollCoordinator implements ScrollActivityDelegate, ScrollHoldController { ... }
```dart

它管理两个独立的 ScrollController： **_outerController** 和 **_innerController**：

协调内外滚动位置的同步、处理手势分发和滚动事件。滚动分发的核心算法 (用户开始拖拽-**drag()** → 拖拽更新-**applyUserOffset()** )：

* **向上拖拽** (delta < 0)：优先消除内层 overscroll → 然后滚动外层 → 最后滚动内层。
* **向下拖拽** (delta > 0)：根据 **floatHeaderSlivers** 决定是否优先滚动外层。

然后是 **惯性滚动处理**，当手指离开屏幕：

然后是关键的 **_getMetrics()** ，它创建统一的滚动指标，让内外两个独立的滚动视图在物理模拟时表现得像一个整体。最后是为了解决 SliverAppBar 重叠问题的 SliverOverlapAbsorber/Injector 机制：

在 **RenderSliverOverlapInjector.performLayout()** 中：

画个调用时序图帮助理解：

### 4.6. Notification通知机制

**ScrollNotification** 是一个抽象类，用于 **在滚动相关事件发生时发出通知**，它是整个滚动通知系统的核心基类。

```dart
abstract class ScrollNotification extends LayoutChangedNotification with ViewportNotificationMixin {
  ScrollNotification({
    required this.metrics,
    required this.context,
  });

  final ScrollMetrics metrics;  // 滚动指标信息
  final BuildContext? context;  // 触发通知的组件上下文
}
```dart

核心属性：

* **metrics**：ScrollMetrics，描述滚动视图内容的详细信息，包含：pixels(当前位置)、minScrollExtent(最小滚动范围)、maxScrollExtent(最大滚动范围)、viewportDimension(视口尺寸)等。
* **context**：触发此通知的 Widget 的构建上下文，可用于查找滚动组件的渲染对象，确定视口大小等。
* depth：继承自 **ViewportNotificationMixin**，表示通知冒泡经过的视口数量，通常监听器只响应 depth 为 0 的通知 (本地通知)。

它的几个字类：

```dart
// 开始滚动
class ScrollStartNotification extends ScrollNotification {
  final DragStartDetails? dragDetails; // 拖拽开始详情
}

// 滚动更新
class ScrollUpdateNotification extends ScrollNotification {
  final DragUpdateDetails? dragDetails; // 拖拽更新详情
  final double? scrollDelta; // 滚动距离增量
}

// 过渡滚动
class OverscrollNotification extends ScrollNotification {
  final double overscroll; // 过度滚动的像素数
  final double velocity;   // 滚动速度
}

// 滚动结束
class ScrollEndNotification extends ScrollNotification {
  final DragEndDetails? dragDetails; // 拖拽结束详情
}

// 用户滚动方向改变
class UserScrollNotification extends ScrollNotification {
  final ScrollDirection direction; // 滚动方向
}

// 用户停止交互
class UserScrollNotification extends ScrollNotification {
  final ScrollDirection direction;	// 处于 idle
}
```dart

使用示例：

```dart
// 使用 NotificationListener<ScrollNotification> 包裹滑动视图进行监听
NotificationListener<ScrollNotification>(
  onNotification: (ScrollNotification notification) {
    if (notification is ScrollUpdateNotification) {
      print('滚动位置: ${notification.metrics.pixels}');
    }
    return false; // 不消费通知，继续向上传播
  },
  child: ListView(...),
)
```dart

相比 **ScrollController**，**ScrollNotification** 的优势在于 "**解耦**" 和 "**事件驱动**"，具体表现在：

* 任何父组件都可以通过 **NotificationListener** 监听到其子孙树中任何滚动组件的事件，无需获取该滚动组件的 ScrollController，这使得父组件与子滚动组件间没有强依赖关系，代码更清晰、更易维护。
* **NotificationListener** 提供了丰富且详细的事件类型，让你能精确地知道滚动的具体阶段。而**ScrollController.addListener()** 只有一个通用的"滚动变动"通知，你无法直接区分是用户拖动、惯性滑动还是代码驱动的滚动。
* **ScrollNotification** 是一种标准的、**自下而上** 的"**事件冒泡机制**"，而 **ScrollController** 则主要用于自上而下的 **控制**，监听只是其附加功能。

😁 **ScrollNotification** 的事件来源可以分为两种：

```dart
// 用户手势交互

1. 用户拖拽屏幕 -> GestureDetector 识别
2. 手势生成 DragStartDetails, DragUpdateDetails, DragEndDetails
3. 这些手势信息传递给 ScrollActivity

// ② 程序化滚动

// ScrollController 主动调用
controller.animateTo(100.0); // 程序控制滚动
controller.jumpTo(200.0);    // 立即跳转
```dart

然后 **Scrollable** 是所有滚动组件的基础，其内部事件生成流程：

* **手势识别**: **RawGestureDetector** 识别用户手势
* **活动创建**: 根据手势类型创建不同的 **ScrollActivity** (**DragScrollActivity**-用户拖拽、**DrivenScrollActivity**-程序滚动、**BallisticScrollActivity**-惯性滚动)。
* **位置更新:ScrollPosition** 根据活动更新滚动位置。
* **通知分发**: **ScrollPosition** 创建并分发 **ScrollNotification**。

**ScrollPosition** 是事件创建的核心，关键源码：

```dart
abstract class ScrollPosition {

  /// 开始滚动时调用
  void didStartScroll() {
    // 实际上是通过 activity 来分发通知的！
    activity!.dispatchScrollStartNotification(copyWith(), context.notificationContext);
  }

  /// 滚动更新时调用
  void didUpdateScrollPositionBy(double delta) {
    // 通过 activity 分发滚动更新通知
    activity!.dispatchScrollUpdateNotification(copyWith(), context.notificationContext!, delta);
  }

  /// 滚动结束时调用
  void didEndScroll() {
    // 通过 activity 分发滚动结束通知，并保存偏移量
    activity!.dispatchScrollEndNotification(copyWith(), context.notificationContext!);
    saveOffset();
    if (keepScrollOffset) {
      saveScrollOffset();
    }
  }

  /// 过度滚动时调用
  void didOverscrollBy(double value) {
    assert(activity!.isScrolling);
    // 通过 activity 分发过度滚动通知
    activity!.dispatchOverscrollNotification(copyWith(), context.notificationContext!, value);
  }

  /// 用户滚动方向改变时调用
  void didUpdateScrollDirection(ScrollDirection direction) {
    // 直接创建 UserScrollNotification 并分发
    UserScrollNotification(
      metrics: copyWith(),
      context: context.notificationContext!,
      direction: direction
    ).dispatch(context.notificationContext);
  }

  /// 滚动指标更新时调用
  void didUpdateScrollMetrics() {
    assert(SchedulerBinding.instance.schedulerPhase != SchedulerPhase.persistentCallbacks);
    assert(_haveScheduledUpdateNotification);
    _haveScheduledUpdateNotification = false;
    if (context.notificationContext != null) {
      // 分发滚动指标变化通知
      ScrollMetricsNotification(
        metrics: copyWith(),
        context: context.notificationContext!
      ).dispatch(context.notificationContext);
    }
  }
}
```dart

接着是 **事件传播的链路**：

```dart
ScrollPosition.didUpdateScrollPositionBy()
   ↓
ScrollPosition._dispatch(ScrollUpdateNotification(...))
   ↓
BuildContext.dispatchNotification(notification)
   ↓
Element._notificationTree.dispatch(notification)
   ↓
向上遍历 Element 树
   ↓
查找 NotificationListener<ScrollNotification>
   ↓
执行 onNotification 回调
   ↓
根据返回值决定是否继续传播
```dart

### 4.7. 缓存机制

**Flutter 滑动** 涉及的缓存机制，分为两种：**布局缓存** (**cacheExtent**-预加载和延迟加载) 和 **状态缓存** (**KeepAlive**，State对象和子树不销毁)。

#### 4.7.1. 布局缓存

首先，**缓存区域** 不在 **视口可见范围内**：

```dart
┌─────────────────┐ ← 上方缓存区域 (不可见)
│    Cache Area   │
├─────────────────┤ ← 视口顶部边界
│                 │
│   Visible Area  │ ← 用户能看到的区域
│                 │
├─────────────────┤ ← 视口底部边界
│    Cache Area   │
└─────────────────┘ ← 下方缓存区域 (不可见)
```dart

假设有这样的场景：

视口高度：800px、cacheExtent：250px 、当前滚动位置：1000px、每个列表项高度：100px

**RenderViewport** 中 **计算约束** 的伪代码：

```dart
class RenderViewport {
  void performLayout() {
    // 1. 计算缓存起始点
    double cacheOrigin = scrollOffset - cacheExtent;
    // cacheOrigin = 1000 - 250 = 750px

    // 2. 计算总的布局范围
    double totalExtent = cacheExtent + viewportHeight + cacheExtent;
    // totalExtent = 250 + 800 + 250 = 1300px

    // 3. 创建约束传递给 Sliver
    SliverConstraints constraints = SliverConstraints(
      scrollOffset: max(0, scrollOffset - cacheOrigin),	// = max(0, 1000-750)=250
      cacheOrigin: cacheOrigin,           // 🎯 缓存起始位置 = 750px
      remainingCacheExtent: totalExtent,  // 🎯 剩余缓存范围 = 1300px
      remainingPaintExtent: viewportHeight, // 🎯 可绘制范围 = 800px (只绘制可见部分)
      // ... 其他属性
    );

    // 4. 传递给子 Sliver
    child.layout(constraints);
  }
}

// 缓存区域的内容布局(垂直坐标)：
┌─────────┬──────────────────────────────────┐
│ 位置    │ 说明                             │
├─────────┼──────────────────────────────────┤
│ 0-750   │ 之前的内容(不处理)                │
├─────────┼──────────────────────────────────┤
│ 750-999 │ 📦 上方缓存区域 (构建但不绘制)     │ ← cacheOrigin 到 scrollOffset
├─────────┼──────────────────────────────────┤
│1000-1800│ 👁️ 可见区域 (构建且绘制)          │ ← scrollOffset 到 scrollOffset + viewport
├─────────┼──────────────────────────────────┤
│1800-2050│ 📦 下方缓存区域 (构建但不绘制)     │ ← viewport 后的 cacheExtent
├─────────┼──────────────────────────────────┤
│ 2050+   │ 未处理的内容                      │
└─────────┴──────────────────────────────────┘
```dart

**RenderSliver** 处理逻辑伪代码：

```dart
class RenderSliverList {
  void performLayout(SliverConstraints constraints) {
    // 1. 根据约束确定需要布局的子项范围
    double startOffset = constraints.cacheOrigin;        // = 750px
    double endOffset = startOffset + constraints.remainingCacheExtent; // = 750 + 1300 = 2050px

    // 2. 根据子项高度计算索引
    int firstIndex = (startOffset / itemHeight).floor();    // = (750/100).floor() = 7
    int lastIndex = (endOffset / itemHeight).ceil() - 1;    // = (2050/100).ceil() - 1 = 20

    // 2. 布局可见和缓存区域的子项 (Item 7 到 Item 20 都会被构建)
    for (int i = firstIndex; i <= lastIndex; i++) {
      RenderBox child = buildChild(i);  // 🔧 这里触发 Widget 构建
      child.layout(childConstraints);

      // 3. 设置子项的布局信息
      double childOffset = i * itemHeight;
      setChildParentData(child, offset: currentOffset);
    }

    // 4. 返回几何信息
    geometry = SliverGeometry(
      scrollExtent: totalItemCount * itemHeight,      // 总内容高度
      paintExtent: min(800, visibleContentHeight),    // 只绘制可见部分
      cacheExtent: 1300,                              // 包含缓存的总范围
      // 🎯 关键：告诉 Viewport 哪些需要绘制
      visible: true,
    );
  }
}

// 缓存子组件的实际状态，Item 状态列表
Item 0-6:   ❌ 未构建 (太远了)
Item 7-9:   ✅ 已构建 + ❌ 不绘制 (上方缓存区)
Item 10-17: ✅ 已构建 + ✅ 绘制 (可见区域)
Item 18-20: ✅ 已构建 + ❌ 不绘制 (下方缓存区)
Item 21+:   ❌ 未构建 (太远了)
```dart

**RenderViewport** 绘制阶段的处理逻辑伪代码：

```dart
class RenderViewport {
  void paint(PaintingContext context, Offset offset) {
    // 1. 创建裁剪区域 (只绘制可见部分)
    Rect viewportRect = Rect.fromLTWH(0, 0, size.width, size.height);
    context.pushClipRect(repaintBoundary, viewportRect, paintSliver);
  }

  void paintSliver(PaintingContext context, Offset offset) {
    // 2. 遍历所有子 Sliver
    for (RenderSliver sliver in children) {
      // 3. 只绘制与可见区域相交的部分
      if (sliver.geometry.visible && sliver.geometry.paintExtent > 0) {
        context.paintChild(sliver, offset);  // 🎨 实际绘制
      }
      // 🔧 缓存区域的子项不会被绘制，但仍然存在于渲染树中
    }
  }
}

// 缓存区域的"存在形式"
Widget Tree:       RenderObject Tree:     Paint Operations:
───────────       ─────────────────      ─────────────────
ListView             RenderSliverList         [Canvas Operations]
 │                    │                        │
 ├─Item7(缓存)        ├─RenderBox7(缓存)       ├─❌ 跳过 Item7
 ├─Item8(缓存)        ├─RenderBox8(缓存)       ├─❌ 跳过 Item8
 ├─Item9(缓存)        ├─RenderBox9(缓存)       ├─❌ 跳过 Item9
 ├─Item10(可见)       ├─RenderBox10(可见)      ├─✅ 绘制 Item10
 ├─Item11(可见)       ├─RenderBox11(可见)      ├─✅ 绘制 Item11
 └─...                └─...                   └─...
```dart

😄 所以，"**缓存区域**" 其实就是 "**已构建但不绘制**" 的组件， 它们存在于 **Widget树** 和 **RenderObject树** 中，但在绘制阶段被跳过。当用户滚动时，这些组件可以立即变为可见状态，无需重新构建。

#### 4.7.2. 状态缓存

对于使用了 **SliverChildDelegate** 的可滚动视图 (如 ListView.builder, GridView.builder 等)，其按需构建的子项，当完全滑出 cacheExtent 所定义的缓存区后，并且没有被 **KeepAlive** 保活时，它的 **RenderObject** 会被 **detach**，**Element** 会被 **unmount**，最终占用的内存会被垃圾回收。所以 **KeepAlive** 的核心目标就是：

当列表项滑出屏幕时，不销毁其状态 (State)，以便在它重新滑入屏幕时能够恢复如初。

为了实现这个目标，Flutter 设计了一些协同工作的类，一一看看，先是 **AutomaticKeepAliveClientMixin**

用法：将其混入到想要保持状态的 **State** 类中，必须重写 **wantKeepAlive** getter (bool)，以告诉Flutter框架 "我是否想被保活"。可以按需重写 **updateKeepAlive()** ，在运行时动态改变保活状态。

"**条件性保活**" 的代码示例：

```dart
class _KeepAliveListItemState extends State<KeepAliveListItem>
    with AutomaticKeepAliveClientMixin {

  bool _shouldKeepAlive = true;

  @override
  bool get wantKeepAlive => _shouldKeepAlive;

  @override
  void updateKeepAlive() {
    // 🎯 这个方法的作用：
    // 1. 通知父级容器（通常是 Viewport）
    // 2. 重新评估当前 Widget 的保活状态
    // 3. 添加或移除 KeepAlive 标记
    super.updateKeepAlive();
  }

  void toggleKeepAlive() {
    setState(() {
      _shouldKeepAlive = !_shouldKeepAlive;
    });
    // 🚨 关键：wantKeepAlive 变化后必须调用
    updateKeepAlive();
  }
}
```dart

点开 **AutomaticKeepAliveClientMixin**，在 **initState()** 中会检查 **wantKeepAlive**，为false，不做任何操作，为true，创建 **KeepAliveHandle** 并发送 **KeepAliveNotification**：

```dart
// 在 AutomaticKeepAliveClientMixin 源码中
void _ensureKeepAlive() {
  assert(_keepAliveHandle == null);
  _keepAliveHandle = KeepAliveHandle();
  KeepAliveNotification(_keepAliveHandle!).dispatch(context);
}
```dart

最近的 **AutomaticKeepAlive** 组件捕获这个通知，然后将 **handle** 添加到内部的 **_handles** 映射中：

```dart
Map<Listenable, VoidCallback>? _handles;

@override
void initState() {
  super.initState();
  _updateChild();
}

void _updateChild() {
  _child = NotificationListener<KeepAliveNotification>(
    onNotification: _addClient,
    child: widget.child,
  );
}

bool _addClient(KeepAliveNotification notification) {
  final Listenable handle = notification.handle;
  _handles ??= <Listenable, VoidCallback>{};
  assert(!_handles!.containsKey(handle));
  _handles![handle] = _createCallback(handle);
  handle.addListener(_handles![handle]!);

  if (!_keepingAlive) {
    _keepingAlive = true;
    // 更新 KeepAlive Widget 的 keepAlive 属性为 true
    _updateParentDataOfChild(childElement);
  }
  return false;
}

@override
Widget build(BuildContext context) {
  // 💡 所以 wantKeepAlive 为 true 其实是包了一个 KeepAlive Widget
  return KeepAlive(keepAlive: _keepingAlive, child: _child);
}

// 更新子元素的ParentData
void _updateParentDataOfChild(ParentDataElement<KeepAliveParentDataMixin> childElement) {
  childElement.applyWidgetOutOfTurn(build(context) as ParentDataWidget<KeepAliveParentDataMixin>);
}
```dart

然后 **KeepAlive.applyParentData()** 会被触发

```dart
class KeepAlive extends ParentDataWidget<KeepAliveParentDataMixin> {
  @override
  void applyParentData(RenderObject renderObject) {
    assert(renderObject.parentData is KeepAliveParentDataMixin);
    // 获取 ParentData 对象
    final KeepAliveParentDataMixin parentData = renderObject.parentData! as KeepAliveParentDataMixin;
    // 当 widget 中的 keepAlive 值与 parentData 中存储的值不同时，才执行更新
    if (parentData.keepAlive != keepAlive) {
      // 将 Widget 数据写入到 RenderObject 的 parentData
      parentData.keepAlive = keepAlive;
      // 获取父级 RenderObject  (如：RenderSliverList)
      final RenderObject? targetParent = renderObject.parent;
      // 当 keepAlive 的值从 true 变成了 false，通知父级 RenderObject 需要重新布局
      // 解释：一个子项不再被保活，父级可能需要立即将其作为"垃圾"回收掉，标记为需要重新布局
      // 就会在下一帧触发父级的performLayout()，进而触发 collectGarbage 逻辑
      if (targetParent is RenderObject && !keepAlive) {
        targetParent.markNeedsLayout();
      }
      // 当 keepAlive 从 false 变为 true 时，没有调用 markNeedsLayout，这是因为
      // "开始保活" 这个决定并不影响当前布局。它只会在未来，当这个子项即将被回收时
      // 才会生效。所以不需要立即触发重新布局。这是一个精巧的性能优化。
    }
  }
}
```dart

**RenderViewport** 在布局的时候，检查到 **parentData** 为 **KeepAliveParentDataMixin类型** 且 **keepAlive == true**，跳过回收，伪代码示例：

```dart
@override
void performLayout() {
  // ... 布局计算 ...

  // 🗑️ 垃圾回收阶段
  _collectGarbage(leadingGarbage, trailingGarbage);
}

void _collectGarbage(int leadingGarbage, int trailingGarbage) {
  // 检查子元素的 parentData 中的 keepAlive 标记
  for (RenderSliver child = firstChild; child != null; child = child.parentData.nextSibling) {
    final SliverPhysicalParentData parentData = child.parentData as SliverPhysicalParentData;

    // 🔍 关键检查：如果有 KeepAliveParentDataMixin
    if (parentData is KeepAliveParentDataMixin && parentData.keepAlive) {
      // 🛡️ 保活：不回收这个子元素
      continue;
    }

    // 🗑️ 回收：移除不在视口内且未保活的子元素
    if (shouldGarbageCollect(child)) {
      child.parent = null;
      adoptChild(child);
    }
  }
}
```dart

**KeepAliveParentDataMixin** 的定义：

```dart
mixin KeepAliveParentDataMixin on ParentData {
  /// Whether to keep the child alive even when it is no longer visible.
  bool keepAlive = false;
}

// SliverMultiBoxAdaptorParentData 的实现
class SliverMultiBoxAdaptorParentData extends SliverLogicalParentData
    with ContainerParentDataMixin<RenderBox>, KeepAliveParentDataMixin {
  int? index;

  @override
  String toString() => '${super.toString()}; ${keepAlive ? "keepAlive" : ""}';
}
```dart

具体子类 **RenderSliverMultiBoxAdaptor** 的回收逻辑示例：

```dart
@protected
void collectGarbage(int leadingGarbage, int trailingGarbage) {
   invokeLayoutCallback<SliverConstraints>((SliverConstraints constraints) {
     // 回收前导和尾部元素
      while (leadingGarbage > 0) {
        _destroyOrCacheChild(firstChild!);
        leadingGarbage -= 1;
      }
      while (trailingGarbage > 0) {
        _destroyOrCacheChild(lastChild!);
        trailingGarbage -= 1;
      }
      // 💡 筛选出不在需要保活的子元素，具体步骤：
      // 遍历保活缓存桶，获取每个子元素的ParentData，检查 keeepAlive是否为false
      // 不保活的元素通过 _childManager.removeChild() 进行移除
      _keepAliveBucket.values.where((RenderBox child) {
        final SliverMultiBoxAdaptorParentData childParentData = child.parentData! as SliverMultiBoxAdaptorParentData;
        return !childParentData.keepAlive;
      }).toList().forEach(_childManager.removeChild);
    });
}

void _destroyOrCacheChild(RenderBox child) {
  // 获取子项 ParentData
  final SliverMultiBoxAdaptorParentData childParentData = child.parentData! as SliverMultiBoxAdaptorParentData;
  // 需要保活节点的处理
  if (childParentData.keepAlive) {
    // 从子节点双向链表中摘除，不需要重新布局和绘制，只是断开连接，不销毁RenderObject本身❗️
    remove(child);
    // 加入保护缓存桶
    _keepAliveBucket[childParentData.index!] = child;
    // remove() 后 child.parentData 可能会被清空或修改，重新赋值下
    child.parentData = childParentData;
    // 同样是怕remove()操作改变与父节点RenderSliverMultiBoxAdaptor的关系。
    super.adoptChild(child);
    // childParentData内部的一个状态标记，用于记录该子项当前正处于被缓存的状态。
    childParentData._keptAlive = true;
  } else {
    // 不需要保活，执行销毁逻辑，完整的销毁流程：
    // a. RenderObject 从其父节点 `detach`。
    // b. 对应的 Element 被 `deactivate` 和 `unmount`。
    // c. 所有相关的状态（State）对象被 `dispose`。
    // d. 最终，这些对象等待 Dart 的垃圾回收器进行内存回收。
    // 这是一个不可逆的操作，所有状态都会丢失。
    _childManager.removeChild(child);
  }
}
```dart

## 5. 实战案例：自定义上下拉加载组件

😄 想搞个：正常下拉刷新，上拉加载更多，下拉加载过度，显示二楼的组件。

### 5.1. 自带下拉刷新组件-RefreshIndicator

快速看下自带下拉刷新组件 **RefreshIndicator** 的实现原理找找灵感，点开源码可以看到它使用 "**状态机模式**" 管理整个刷新过程：

```dart
enum _RefreshIndicatorMode {
  drag,     // 拖拽状态
  armed,    // 准备就绪（拖拽到足够距离）
  snap,     // 动画到最终位置
  refresh,  // 执行刷新回调
  done,     // 刷新完成，淡出动画
  canceled, // 取消刷新，淡出动画
}

// 关键长岭
// 拖拽距离百分比：容器高度的25%即可触发
const double _kDragContainerExtentPercentage = 0.25;

// 最大拖拽因子：可以超出1.5倍的displacement
const double _kDragSizeFactorLimit = 1.5;
```dart

**build()** 中发现滚动监听基于 **NotificationListener** ，滚动处理逻辑在 **_handleScrollNotification()** ，核心代码如下：

```dart
// 💡 【拖拽开始判断】
bool _shouldStart(ScrollNotification notification) {
  return (
    // 必须是用户拖拽触发的滚动
    (notification is ScrollStartNotification && notification.dragDetails != null) ||
    (notification is ScrollUpdateNotification && notification.dragDetails != null &&
     widget.triggerMode == RefreshIndicatorTriggerMode.anywhere)
  ) && (
    // 必须在顶部或底部边缘
    (notification.metrics.axisDirection == AxisDirection.up && notification.metrics.extentAfter == 0.0) ||
    (notification.metrics.axisDirection == AxisDirection.down && notification.metrics.extentBefore == 0.0)
  ) && _mode == null && _start(notification.metrics.axisDirection);
}

// 💡 【拖拽过程处理】更新拖拽偏移
if (notification.metrics.axisDirection == AxisDirection.down) {
  _dragOffset = _dragOffset! - notification.scrollDelta!; // 向下拖拽
} else if (notification.metrics.axisDirection == AxisDirection.up) {
  _dragOffset = _dragOffset! + notification.scrollDelta!; // 向上拖拽
}
// 检查拖拽距离并更新状态
_checkDragOffset(notification.metrics.viewportDimension);

// 拖拽距离检查
void _checkDragOffset(double containerExtent) {
  // 计算拖拽进度：拖拽距离 / (容器高度 * 25%)
  double newValue = _dragOffset! / (containerExtent * _kDragContainerExtentPercentage);

  if (_mode == _RefreshIndicatorMode.armed) {
    // 已经进入准备状态，确保最小值
    newValue = math.max(newValue, 1.0 / _kDragSizeFactorLimit);
  }

  // 更新动画控制器的值（触发重建）
  _positionController.value = clampDouble(newValue, 0.0, 1.0);

  // 检查是否达到激活阈值
  if (_mode == _RefreshIndicatorMode.drag &&
      _valueColor.value!.alpha == _effectiveValueColor.alpha) {
    _mode = _RefreshIndicatorMode.armed; // 进入准备状态
  }
}

//💡 【刷新触发】
case _RefreshIndicatorMode.armed:
  if (_positionController.value < 1.0) {
    _dismiss(_RefreshIndicatorMode.canceled); // 取消刷新
  } else {
    _show(); // 开始刷新
  }

// 💡 【刷新执行】
void _show() {
  final Completer<void> completer = Completer<void>();
  _pendingRefreshFuture = completer.future;
  _mode = _RefreshIndicatorMode.snap;

  // 动画到最终位置
  _positionController
    .animateTo(1.0 / _kDragSizeFactorLimit, duration: _kIndicatorSnapDuration)
    .then<void>((void value) {
      if (mounted && _mode == _RefreshIndicatorMode.snap) {
        setState(() {
          _mode = _RefreshIndicatorMode.refresh; // 进入刷新状态
        });

        // 执行用户的刷新回调
        final Future<void> refreshResult = widget.onRefresh();
        refreshResult.whenComplete(() {
          if (mounted && _mode == _RefreshIndicatorMode.refresh) {
            completer.complete();
            _dismiss(_RefreshIndicatorMode.done); // 完成刷新
          }
        });
      }
    });
}
```dart

加载进度条盖在原滚动视图上的原理则是在外面套了一个 **Stack**。大概了解了，接着来写我们的自定义组件~

### 5.2. 开发过程记录

#### 5.2.1. 状态枚举

就下拉刷新+上拉加载更多的状态：

```dart
/// 刷新状态枚举
enum CpRefreshState {
  idle,          // 空闲状态
  pulling,       // 拖拽中
  canRefresh,    // 可以刷新
  refreshing,    // 刷新中
  refreshed,     // 刷新完成
  canSecondFloor, // 可以进入二楼
  secondFloor,   // 二楼状态
}

/// 加载状态枚举
enum CpLoadState {
  idle,         // 空闲状态
  pulling,      // 拖拽中
  canLoad,      // 可以加载
  loading,      // 加载中
  loaded,       // 加载完成
  noMore,       // 没有更多数据
}
```dart

#### 5.2.2. 组件结构

从动图可以看到，这个二楼占据了整个内容区域，它出现时内容区域不见了，隐藏时内容区域又出来了，直接**Column** 一把梭：

再写一个简单的控制类，测试下显示和隐藏，initState() 时_attach() 下 State、dispose() 时 _death() 下 State：

简单调用下：

OK，搭个简单的结构，等下再慢慢调~

#### 5.2.3. 滑动处理

要做的事情：**滑动状态的判定+显示对应的UI+触发相关回调**，外层套个**NotificationListener** 来捕获滑动事件。只需关注三种滚动事件：

* **ScrollStartNotification**：拖动状态开始
* **ScrollEndNotification**：拖动状态结束
* **OverscrollNotification**：滚动超出边界时，其中的 **overscroll** 属性是 "**每次通知事件的增量值而不是总的过度距离**"，所以需要另外维护一个变量做 "**累加**"。

逻辑不算复杂，判断下拉还是上拉过度，然后走刷新或者加载更多的逻辑，然后根据不同的状态显示文本， 文章超过 **掘金最大字符数**，就不同贴代码了，运行效果：

到此就把基本的核心骨架实现了，然后就是各种细节完善啦，比如过渡动画等。源码【--->[c35/cp_second_floor_refresh_demo.dart](https://github.com/配套示例源码/blob/master/lib/c35/cp_second_floor_refresh_demo.dart)<---】。