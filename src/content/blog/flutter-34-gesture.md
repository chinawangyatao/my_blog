---
title: "Flutter入门到精通（三十四）：玩转Flutter手势机制"
pubDate: 2024-02-04
description: "Flutter手势识别系统深度解析，GestureDetector、手势竞争等。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第三十四篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

😄 在前面的章节[《三十、🖌玩转自定义绘制三部曲[中]》]( "")中简要介绍过「**GestureDetector组件**」，并用它写了一些好玩的 "**自定义手势**" 案例：

😶 仅仅止步于这个组件的使用是远远不够的，一个完整的手势执行链路可以拆解为如下 "**五个阶段**"：

> **物理触摸** (屏幕) -> **操作系统** (Android/iOS) -> **Flutter 引擎** (Engine, C++) -> **Flutter 框架** (Framework, Dart) -> **你的应用代码**

😁 本节主要系统研究下 "**Flutter框架层**" 的 "**手势机制**" 的实现原理，对研究过程不感兴趣的可以直接看流程图：

## 2. 核心概念

😶 先区分清楚两个 "**核心概念**"~

### 2.1. 指针事件

图形用户界面 (**GUI**) 编程中，**物理输入设备与屏幕交互的底层事件流**，直接反映输入设备 (如手指、鼠标、触控笔等) 等的物理操作，它是所有 **用户交互的最基础数据**，描述了输入设备在屏幕上的 **接触状态变化**。

一个完整的指针交互通常包含一系列完整的事件，形成完整的生命周期，最核心的四类指针事件：

* **指针按下**：第一次接触到屏幕时触发，**所有交互的起点**。
* **指针移动**：指针在屏幕上按住并移动时连续触发，**实现拖动、滑动等效果的数据基础**。
* **指针释放**：当指针离开屏幕时触发，标志着 **一次完整的触摸或点击操作** 已经完成。
* **指针取消**：系统需要中断当前正在进行中的任何基于指针的操作，如突然的电话夺走了APP的焦点。

### 2.2. 手势

直接处理这些 **原始的指针事件** 的话，需要我们自己管理状态、判断事件间隔、移动距离，来识别用户到底是想 "单击" 还是 "长按"。而 "**手势**" 是基于 "**指针事件序列的高层交互抽象**"，将连续的指针动作解释为 "**具有清晰业务含义的交互行为**"，如：点击、长按、Pan等。不用关注 down-move-up 的具体细节，直接响应 onTap、onPanUpdate 这样清晰的意图。

## 3. 常用控件 API

### 3.1. Listener 组件

**Flutter** 中 **最底层的手势监听器组件**，它直接监听 **触摸、鼠标等输入设备的原始指针事件 (PointerEvent)** ，不会解释和组合手势，只是简单地 **报告指针的状态变化**。支持同时跟踪多个指针的状态 (**多指触控**)，适合自定义手势识别、需要高性能的场景。

```dart
/// 继承自 SingleChildRenderObjectWidget
class Listener extends SingleChildRenderObjectWidget {
  /// 构造函数
  const Listener({
    super.key,
    this.onPointerDown,      // 指针按下事件，提供 PointerDownEvent
    this.onPointerMove,      // 指针移动事件，提供 PointerMoveEvent
    this.onPointerUp,        // 指针抬起事件，提供 PointerUpEvent
    this.onPointerCancel,    // 指针取消事件，提供 PointerCancelEvent
    this.onPointerHover,     // 指针悬停事件，提供 PointerHoverEvent (主要用于鼠标)
    this.onPointerSignal,    // 指针信号事件，提供 PointerSignalEvent (如滚轮滚动)
    this.behavior,           // 命中测试行为
    super.child,
  });
}

// PointerEvent 的核心属性
pointer - 指针 ID，用于区分多个指针
kind - 设备类型（触摸、鼠标、手写笔等）
position - 全局坐标位置
localPosition - 相对于组件的本地坐标
delta - 移动增量（仅在 Move 事件中）
pressure - 压力值（支持压感的设备）
size - 接触面积大小

/// ✨ Listener使用代码示例：基础指针事件监听
Listener(
  onPointerDown: (PointerDownEvent event) {
    print('指针按下: ${event.localPosition}');
    print('设备类型: ${event.kind}');
    print('指针ID: ${event.pointer}');
  },
  onPointerMove: (PointerMoveEvent event) {
    print('指针移动: ${event.localPosition}');
    print('移动增量: ${event.delta}');
  },
  onPointerUp: (PointerUpEvent event) => print('指针抬起'),
  child: Container(
    width: 200,
    height: 200,
    color: Colors.blue,
    child: const Center(child: Text('触摸区域')),
  ),
)

/// 多指触控事件监听
final Set<int> _activePointers = <int>{};

Listener(
  onPointerDown: (event) {
    _activePointers.add(event.pointer);
    print('当前活跃指针数量: ${_activePointers.length}');
  },
  onPointerUp: (event) {
    _activePointers.remove(event.pointer);
    print('指针${event.pointer}已抬起');
  },
  child: Container(/* ... */),
)
```

### 3.2. GestureDecotor 组件

**Flutter** 中 **监听和响应用户手势操作** 的 **最核心组件** (透明不可见)，普通 **Widget** 想添加手势交互，外层套个 **GestureDecotor** 即可轻松实现 "**点击赋能**🐶" 。先提下容易被忽视的 "**behavior**" 属性，它决定了 **GestureDecotor** 如何响应其区域内的指针，有下述可选值 (**HitTestBehavior枚举**)：

* **deferToChild** (默认)：只有当 child 的可见、不透明的部分被点击时才响应，比如：你的 child 是一个没有颜色的 Container，或者是一个有大片透明区域的 Image，那么点击这些透明区域是无效的 ❗️ ❗️ ❗️
* **opaque**：GestureDetector 将自己视为一个不透明的矩形区域，即便 child 是透明的，点击 GestureDetector 的 **整个区域都会触发事件**。同时，它会 **阻止事件穿透**，后面的组件不会再接收到这个点击事件。当你希望空白/透明区域都能响应点击，切不希望点击事件影响到堆叠在下层的组件时，可用此值。
* **translucent**：与 **opaque** 类似，但它 **允许事件穿透**。

接着梳理下具体的 **手势回调属性** (**单击、双击、长按、拖拽/平移、缩放**) 涉及到的 **API** (不用死记，用到再查)：

```dart
// ===================【💡 单击 💡】====================
onTap (GestureTapCallback?)：当用户完成一次点击时触发。
onTapCancel (GestureTapCancelCallback?)：当点击操作被取消时触发。
onTapDown (GestureTapDownCallback?)：当用户手指按下时触发。
onTapUp (GestureTapUpCallback?)：当用户手指抬起时触发。
// ✨ 触发流程：
//
// ① 点击时先触发 onTapDown() → 抬手时触发 onTapUp() → 最后回调 onTap() 表示一个单击事件的触发。
// ② 按下触发onTapDown，滑动再抬起手，会触发 onTapCancel()，而不会触发 onTapUp() 和 onTap()。

// ===================【💡 双击 💡】====================
onDoubleTap (GestureTapCallback?)：当用户完成一次双击时触发。
onDoubleTapCancel (GestureTapCancelCallback?)：当双击操作被取消时触发。
onDoubleTapDown (GestureTapDownCallback)：当用户手指按下双击时触发。
// ✨ 触发流程：
//
// ① 普通双击先触发 onDoubleTapDown()，然后回调 onDoubleTap()
// ② 触发 onDoubleTapDown()，未完成双击事件(如滑动)，会触发 onDoubleTapDown()

// ===================【💡 长按 💡】====================
onLongPressDown (GestureLongPressDownCallback?)：当用户手指按下长按时触发。
onLongPressStart (GestureLongPressStartCallback?)：当长按开始时触发。
onLongPress (GestureLongPressCallback?)：当用户完成一次长按时触发。
onLongPressMoveUpdate (GestureLongPressMoveUpdateCallback?)：当长按过程中手指移动时触发。
onLongPressEnd (GestureLongPressEndCallback?)：当长按结束时触发。
onLongPressUp (GestureLongPressUpCallback?)：当长按结束时手指抬起时触发。
onLongPressCancel (GestureLongPressCancelCallback?)：当长按操作被取消时触发。
// ✨ 触发流程：
//
// ① 从上依次往下走，触点移动会不断触发 onLongPressMoveUpdate()，抬手触发 onLongPressEnd()，最后触发 onLongPressUp() 标志一次长按事件完成。
// ② 在onLongPressStart() 还没触发前滑动，会触发onLongPressCancel() 直接结束。

// ===================【💡 拖拽/平移 💡】====================
onPanDown (GestureDragDownCallback?)：当用户手指按下平移时触发。
onPanStart (GestureDragStartCallback?)：当平移开始时触发。
onPanUpdate (GestureDragUpdateCallback?)：当平移过程中手指移动时触发。
onPanEnd (GestureDragEndCallback?)：当平移结束时触发。
onPanCancel (GestureDragCancelCallback?)：当平移操作被取消时触发。
// ✨ 触发流程：
// 正常是从上往下走，onPanCancel() 的触发时机是 onPanStart() 之前取消，一般出现在手势嵌套的场景。
// 💡「HorizontalDrag-水平拖拽」和「VerticalDrag-竖直拖拽」可看作 Pan 事件在水平和垂直方向上的应用。
// 回调对象信息基本一致，方法名也雷同，只处理水平方向拖拽用前者，只处理竖直方向拖拽用后者。
// ❗️ 注：只能用一个，不能同时使用！！！如果需要处理复杂方向拖拽还是用 Pan！

// ===================【💡 缩放 💡】====================
onScaleStart (GestureScaleStartCallback?)：当缩放开始时触发。
onScaleUpdate (GestureScaleUpdateCallback?)：当缩放过程中手指移动时触发。
onScaleEnd (GestureScaleEndCallback?)：当缩放结束时触发。
// ✨ 触发流程：从上往下，触点移动会不断触发 onScaleUpdate()
// ❗️ 注：Scale 是 Pan 的父类，两者不能同时使用，后者能做的，前者也能做。

// ===================【 参数类型 】====================
typedef GestureTapCallback = void Function();
typedef GestureTapCancelCallback = void Function();
typedef GestureTapDownCallback = void Function(TapDownDetails details);
typedef GestureTapUpCallback = void Function(TapUpDetails details);
typedef GestureLongPressDownCallback = void Function(LongPressDownDetails details);
typedef GestureLongPressStartCallback = void Function(LongPressStartDetails details);
typedef GestureLongPressCallback = void Function();
typedef GestureLongPressMoveUpdateCallback = void Function(LongPressMoveUpdateDetails details);
typedef GestureLongPressEndCallback = void Function(LongPressEndDetails details);
typedef GestureLongPressUpCallback = void Function();
typedef GestureLongPressCancelCallback = void Function();
typedef GestureDragDownCallback = void Function(DragDownDetails details);
typedef GestureDragStartCallback = void Function(DragStartDetails details);
typedef GestureDragUpdateCallback = void Function(DragUpdateDetails details);
typedef GestureDragEndCallback = void Function(DragEndDetails details);
typedef GestureScaleStartCallback = void Function(ScaleStartDetails details);
typedef GestureScaleUpdateCallback = void Function(ScaleUpdateDetails details);
typedef GestureScaleEndCallback = void Function(ScaleEndDetails details);

// 💡 TapDownDetails、TapUpDetails、LongPressDownDetails 记录的信息基本一致
// 「localPosition」→ Offset，触点相对于「组件左上角」的偏移量
// 「globalPosition」→ Offset，触点相对于「屏幕左上角」的偏移量
// 「localPosition」→ PointerDeviceKind(枚举值)，触点设备类型，可选值：
// touch-点击、mouse-鼠标、stylus-针尖笔、invertedStylus-反向针尖笔、unkown-未知

// 💡 LongPressStartDetails 属性：localPosition、globalPosition
// 💡 LongPressEndDetails 属性：localPosition、globalPosition、velocity-结束时的速度信息
// 💡 LongPressMoveUpdateDetails 属性：localPosition、globalPosition、
//		offsetFromOrigin-开始触点到当前触点的「全局」偏移、localOffsetFromOrigin-开始触点到当前触点的「相对」偏移

// 💡 DragDownDetails 属性：localPosition、globalPosition
// 💡 DragStartDetails 属性：localPosition、globalPosition、
//    sourceTimeStamp-拖拽开始时间戳、kind-触点类型
// 💡 DragUpdateDetails 属性：localPosition、globalPosition
//		delta-每次触发时的偏移量、sourceTimeStamp-移动时的时间戳、primaryDelta-主方轴向上的初始偏移量(如未指定，默认null)
// 💡 DragEndDetails 属性：velocity-速度信息、primaryVelocity-主方向轴上的初始速度(如未指定，默认null)

// 💡 ScaleStartDetails 属性：focalPoint-触点与屏幕接触的焦点(平面左上角)、localFocalPoint-触点与屏幕接触的初始焦点(组件左上角)
//		pointerCount-触点个数
// 💡 ScaleUpdateDetails 属性：focalPoint、localFocalPoint、pointerCount、scale-缩放比例
// 		horizontalScale-水平缩放比例、verticalScale-垂直缩放比例、rotation-旋转角度(弧度)
// 💡 ScaleEndDetails 属性：velocity-速度信息、pointerCount-触点个数
```

没啥复杂，就是 **重写关注手势对应的回调方法**，写个不同手势行为打印日志的代码示例【--->[c34/gesture_detector_demo.dart](https://github.com/配套示例源码/blob/master/lib/c34/gesture_detector_demo.dart)<---】，运行效果：

😀 日志如期把 **对应手势的参数** 都打印出来了，但如果细看 "**单击**" 触发的日志打印，会发现：

> **单击竟然会走长按的回调，而且是在OnTapDown() 之前**

🤨 这是为啥咧？再加下 **水平/垂直Drag** 相关的回调，同样会触发回调：

😄 恭喜您，提前解锁知识点：**手势竞争的幕后机制**——"**手势竞技场 (Gesture Arena)** "，不过这个等下再讲，先把另外几个手势控件也提一嘴~

### 3.3. IgnorePointer & AbsorbPointer

Flutter 中用于 **控制指针事件传递** 的组件，它们都可以 **阻止子组件接收用户的触摸事件**。前者作用如下：

* **忽略指针事件**：让事件"穿透"到下层组件
* **临时禁用交互**：在特定条件下禁用某个区域的交互
* **创建透明遮罩**：制作可穿透的覆盖层

后者作用如下：

* **吸收指针事件**：完全阻止事件传递给下层组件
* **创建模态遮罩**：制作不可穿透的覆盖层
* **防止误操作**：在加载或处理过程中阻止用户操作

前者是 **跳过当前往下传**，后者是 **直接不再往下传**，核心代码：

```dart
/// IgnorePointer - 忽略指针事件
class IgnorePointer extends SingleChildRenderObjectWidget {
  const IgnorePointer({
    super.key,
    this.ignoring = true,      // 是否忽略指针事件让其直接穿透到下层
    this.ignoringSemantics,    // 是否忽略语义
    super.child,
  });
}

/// AbsorbPointer - 吸收指针事件
class AbsorbPointer extends SingleChildRenderObjectWidget {
  const AbsorbPointer({
    super.key,
    this.absorbing = true,     // 是否吸收指针事件阻止传递到下层
    super.child,
  });
}

/// IgnorePointer 示例 - 事件穿透
Stack(
  children: [
    // 下层按钮
    ElevatedButton(
      onPressed: () => print('下层按钮被点击'),
      child: const Text('下层按钮'),
    ),
    // 上层忽略指针的容器
    IgnorePointer(
      ignoring: true,  // 忽略事件，穿透到下层
      child: Container(
        width: 100,
        height: 100,
        color: Colors.red.withOpacity(0.5),
        child: const Center(child: Text('穿透层')),
      ),
    ),
  ],
)

/// AbsorbPointer 示例 - 事件吸收
Stack(
  children: [
    // 下层按钮
    ElevatedButton(
      onPressed: () => print('下层按钮被点击'),
      child: const Text('下层按钮'),
    ),
    // 上层吸收指针的容器
    AbsorbPointer(
      absorbing: true,  // 吸收事件，阻止传递
      child: Container(
        width: 100,
        height: 100,
        color: Colors.blue.withOpacity(0.5),
        child: const Center(child: Text('阻挡层')),
      ),
    ),
  ],
)
```

### 3.4. InkWell & InkResponse

Flutter 中提供 **Material Design** 风格触摸反馈效果-**水波纹(Ripple)** 的组件，两者创建的形状区域不同，**InkWell-矩形-填充整个容器**，**InkResponse-圆形-图标按钮等小组件**。❗️ 注意事项：必须配合 **Material 父组件** 使用，避免在滚动列表中过度使用，避免影响性能。核心代码：

```dart
/// InkWell - 矩形水波纹效果
class InkWell extends InkResponse {
  const InkWell({
    super.key,
    super.child,
    super.onTap,               // 点击回调
    super.onDoubleTap,         // 双击回调
    super.onLongPress,         // 长按回调
    super.onTapDown,           // 按下回调
    super.onTapUp,             // 抬起回调
    super.onTapCancel,         // 取消回调
    super.onHighlightChanged,  // 高亮状态变化
    super.onHover,             // 悬停回调（鼠标）
    super.focusColor,          // 焦点颜色
    super.hoverColor,          // 悬停颜色
    super.highlightColor,      // 高亮颜色
    super.overlayColor,        // 覆盖层颜色
    super.splashColor,         // 水波纹颜色
    super.splashFactory,       // 水波纹工厂
    super.radius,              // 水波纹半径
    super.borderRadius,        // 边框圆角
    super.customBorder,        // 自定义边框
    super.enableFeedback,      // 是否启用触觉反馈
    super.excludeFromSemantics, // 是否从语义中排除
    super.focusNode,           // 焦点节点
    super.canRequestFocus,     // 是否可以请求焦点
    super.onFocusChange,       // 焦点变化回调
    super.autofocus,           // 是否自动焦点
  });
}

/// InkResponse - 圆形水波纹效果
class InkResponse extends StatelessWidget {
  const InkResponse({
    super.key,
    this.child,
    this.onTap,
    this.onTapDown,
    this.onTapUp,
    this.onTapCancel,
    this.onDoubleTap,
    this.onLongPress,
    this.onHighlightChanged,
    this.onHover,
    this.containedInkWell = false,    // 是否包含在 InkWell 中
    this.highlightShape = BoxShape.circle, // 高亮形状
    this.radius,                      // 水波纹半径
    this.borderRadius,                // 边框圆角
    this.customBorder,                // 自定义边框
    this.focusColor,                  // 焦点颜色
    this.hoverColor,                  // 悬停颜色
    this.highlightColor,              // 高亮颜色
    this.overlayColor,                // 覆盖层颜色
    this.splashColor,                 // 水波纹颜色
    this.splashFactory,               // 水波纹工厂
    this.enableFeedback = true,       // 是否启用触觉反馈
    this.excludeFromSemantics = false, // 是否从语义中排除
    this.statesController,            // 状态控制器
    this.focusNode,                   // 焦点节点
    this.canRequestFocus = true,      // 是否可以请求焦点
    this.onFocusChange,               // 焦点变化回调
    this.autofocus = false,           // 是否自动焦点
  });
}

// 水波纹动画过程
onTapDown → 创建 InkSplash → 开始扩散动画 → onTapUp → 开始消散动画 → 动画完成 → 移除效果

// 状态管理链路
Normal → Pressed (highlightColor) → Released →
Normal 或 Focused (focusColor) 或 Hovered (hoverColor)

// 💡 基础用法示例

// 1. 简单的 InkWell 使用
Material(
  child: InkWell(
    onTap: () => print('InkWell 被点击'),
    child: Container(
      padding: EdgeInsets.all(16),
      child: Text('点击我'),
    ),
  ),
)

// 2. 自定义颜色的 InkWell
Material(
  child: InkWell(
    onTap: () => print('自定义颜色'),
    splashColor: Colors.blue.withOpacity(0.3),    // 水波纹颜色
    highlightColor: Colors.blue.withOpacity(0.1), // 高亮颜色
    child: Container(
      padding: EdgeInsets.all(16),
      child: Text('自定义颜色'),
    ),
  ),
)

// 3. 圆形的 InkResponse
Material(
  shape: CircleBorder(),
  child: InkResponse(
    onTap: () => print('圆形按钮'),
    radius: 24,  // 设置水波纹半径
    child: Padding(
      padding: EdgeInsets.all(12),
      child: Icon(Icons.favorite),
    ),
  ),
)

// 4. 自定义形状的 InkWell
Material(
  borderRadius: BorderRadius.circular(12),
  child: InkWell(
    onTap: () => print('圆角矩形'),
    customBorder: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    child: Container(
      padding: EdgeInsets.all(16),
      child: Text('圆角矩形'),
    ),
  ),
)

// 💡 高级用法示例

// 1. 多种手势响应
Material(
  child: InkWell(
    onTap: () => print('单击'),
    onDoubleTap: () => print('双击'),
    onLongPress: () => print('长按'),
    onTapDown: (details) => print('按下: ${details.localPosition}'),
    onTapUp: (details) => print('抬起: ${details.localPosition}'),
    onTapCancel: () => print('取消'),
    child: Container(
      width: 100,
      height: 100,
      child: Center(child: Text('多手势')),
    ),
  ),
)

// 2. 状态监听
Material(
  child: InkWell(
    onHighlightChanged: (highlighted) {
      print('高亮状态: $highlighted');
    },
    onHover: (hovered) {
      print('悬停状态: $hovered');  // 仅鼠标/触控板
    },
    onFocusChange: (focused) {
      print('焦点状态: $focused');
    },
    child: Container(
      padding: EdgeInsets.all(16),
      child: Text('状态监听'),
    ),
  ),
)

// 3. 自定义水波纹工厂
Material(
  child: InkWell(
    splashFactory: InkRipple.splashFactory,  // 使用 Ripple 效果
    // splashFactory: InkSplash.splashFactory, // 使用 Splash 效果
    onTap: () => print('自定义工厂'),
    child: Container(
      padding: EdgeInsets.all(16),
      child: Text('自定义水波纹'),
    ),
  ),
)
```

💁‍♂️ 了解完API，接着开始讲原理咯~

## 4. Hit Testing - 命中测试

一个系统性的过程，用来确定当用户与屏幕交互时 (如点击、触摸)，哪些 **视觉元素** 应该接收这个事件。简单点说就是：你在屏幕上点了下，坐标是(x,y)，框架需要回答这个问题："**在这个点下面，从前往后都有哪些Widget？谁应该对这个点击负责？** "这个过程发生在任何手势被识别之前，它只找到事件的 "**目标**" 列表。

### 4.1. 命中测试流程

这个过程主要发生在 **渲染层**，涉及的是 **RenderObject** 树，而不是 **Widget** 树，可以分为下面五个关键步骤：

#### 4.1.1. 事件的起点

* 当用户的 **物理触摸** (或鼠标点击) 发生时，**Flutter引擎** 会捕捉到这个 **原始指针事件** (如 **PointerDownEvent**)，并将其传递给 **Flutter Framework** 的顶层。
* **GestureBinding** 这个单例接收到事件，并调用 **RendererBinding.hitTest()** 启动整个命中测试流程。

#### 4.1.2. "从上到下"的遍历

* 命中测试从 **渲染树的根节点 RenderView** 开始，以 **深度优先** 的方式遍历 **RenderObject树**，但有一个重要的视觉规则：后绘制的子节点 (视觉上更靠前) 会先被测试。如：在一个 Stack 中，最后一个子节点会最先被测试。
* 遍历过程会携带一个"侦探的笔记本"—— **HitTestResult** 对象，它的任务就是记录所有被命中的嫌疑人。

#### 4.1.3. 每个 RenderObject 的"自检"

当命中测试算法访问到每一个 **RenderObject** 时，其 **hitTest()** 会被调用，在这个方法中，它需要做两件事：

* **判断自己是否被命中**：通常是通过检查 **触摸点坐标** 的 **position** 是否落在自己的几何边界内，如：size.contains(position)，但是，RenderObject 也可以有自己的 **特殊规则**，如：RenderIgnorePointer 直接撒谎说 "我没被命中"，即使坐标在它的范围内。有些 RenderObject 还能实现更复杂的操作，如：只有在非透明像素区域被点击时才算命中。
* **决定下一步该怎么做**：**hitTest()** 的返回值和行为决定了整个过程的走向，如果自己没被命中，通常会返回 false，命中测试会继续进行，去测试同一父节点下的其它兄弟节点，或者父节点后面的节点。如果自己被命中了，调用 **result.add(BoxHitTestEntry(this, position))** 将自己添加到 "**笔记本**" (**HitTestResult**) 中，然后决定 **是否让子节点继续测试**，若有一个子节点返回 **true**，那它自己也应该返回 **true**，告诉上层："我活我的某个后代被命中了"。

#### 4.1.4. HitTestResult 的形成

**HitTestResult** 是一个列表，但它的添加顺序非常重要，它记录了一条 **从最具体的命中目标 (视觉上最顶层) 到最不具体 (根节点) 的事件分发路径**。如：你点击了一个 Scaffold -> Column -> Card -> InkWell -> Text 结构中的 Text，HitTestResult 列表看起来会是这样，即列表的第一个元素是视觉上最顶层的命中目标：

> [ Entry for Text's RenderObject, Entry for InkWell's RenderObject, Entry for Card's RenderObject, Entry for Column's RenderObject, ... Entry for RenderView ]

#### 4.1.5. 事件的分发 (冒泡)

命中测试结束后，**GestureBinding** 就拿到了这个填满了嫌疑人的 **HitTestResult** 列表。现在，指针事件 (如 **PointerDownEvent**) 会沿着这个列表从头到尾进行分发，每个 **RenderObject** 都有机会处理这个事件，这就是为什么父组件可以捕获到子组件的事件。这个过程通常被称为 "**事件冒泡**"，尽管在 Flutter 中它更像是一个沿着预定路径的分发，而不是严格意义上的冒泡。

😄 了解完 **HitTest** 的机制，现在我们可以更好地理解 **IgnorePointer** 和 **AbsorbPointer** 组件的原理啦～

### 4.2. IgnorePointer 的"穿透"原理

**IgnorePointer** 的渲染对象是 **RenderIgnorePointer**，看下 **hitTest()** 方法：

当 **ignoring** 为 true 时，不调用 **super.hitTest()** ，即不会进行 **子组件** 的命中测试，返回 **false** 表示该组件没有被命中，事件会继续传播到下层组件。而正常时是在 **super.hitTest()** 中会调用 **RenderProxyBoxMixin.hitTestChildren()** 将命中测试传递给子组件：

### 4.3. AbsorbPointer 的"吸收"原理

**AbsorbPointer** 的渲染对象则是 RenderAbsorbPointer，看下它的 **hitTest()** 方法：

当 **absorbing** 为 **true** 时，返回 **size.contains(position)** ，即：如果触摸点在组件范围内，返回 true (表示命中)，否则返回 false。另外，因为不调用 **super.hitTest()** ，意味着不会将事件传递给子组件。反之，调用 **super.hitTest()** 进行正常的命中测试和事件传递。

## 5. Gesture Arena - 手势竞技场

当 **Hit Testing** (命中测试) 完成后，**GestureBinding** 会将指针事件 (如 PointerDownEvent) 通过 **PointerRouter** 路由给所有在 **HitTestResult** 列表中的、且对手势感兴趣的 **GestureRecognizer**。

😶 回顾上面 **GestureDetector** 组件，同时监听 **onTap**、**onLongPress** 和 **onXxxDrag** 时，"**单击手势**" 却触发了长按、拖拽相关回调的问题。💁‍♂️ 其实，**GestureDetector** 背地里创建了好几个，**手势识别器 (Gesture Recognizer)** 。在你手指刚刚按下那一刻，Flutter 并不知道你接下来想做什么，你得意图可能是：单击、长按、双击的第一次点击、拖拽开始，因为未来是不确定的，所以 **Flutter** 的策略是：

**让所有可能的手势识别器都进入准备状态，并加入手势竞技场进行竞争**🤠

🤔 所以，上面的情况实际上是：

手势按下时，**PointerDownEvent** 发生，**TapGestureRecognizer** (负责单击和双击) 和 **LongPressGestureRecognizer** (负责长按) 等识别器被唤醒，都加入"**手势竞技场**"，各自进入"**准备**"状态。

* **LongPressGestureRecognizer** 立即触发 **onLongPressDown()** ，表示："一个潜在的长按开始了，我启动一个计时器，如果用户按住超过预设时间 (500ms)，我就会宣告胜利。"
* **TapGestureRecognizer** 则立即触发 **onTapDown()** ，表示："一个潜在的单击开始了，我正在观察用户会不会很快抬起手指。"

如果计时器还没到时间，手指就抬起了，**PointerUpEvent** 发生：

* **LongPressGestureRecognizer** 立即意识到 "用户抬手了，长按条件不满足，宣告自己落败"，这个失败的动作会触发 **onLongPressCancel()** ，表示："之前潜在的长按，现在被取消了"。
* **TapGestureRecognizer** 则会触发 **onTapUp()** ，表示："用户在有效点击区域内抬起了手指，单击手势已确认完成，宣告胜利"。

😄 还是很好理解的，接着从 "**文字层面**" 梳理下 "**参赛选手 & 比赛规则**"，加深下对 "**手势竞技场**" 的认识。

### 5.1. 参赛选手

**Hit Testing** 后生成 **HitTestResult** 列表中的 **Widget** 中 "**注册**" 的 **GestureRecognizer** (手势识别器)。

这个 "**注册**" 指的是：GestureDetector 或其它手势组件，通过其构造函数的属性 (如onTap)，实例化了一个或多个具体的 **GestureRecognizer** 子类，并准备在自己被 "**命中**" 时将这些识别器送入竞技场参与竞争。比如当你写下 GestureDetector(onTap: () {...})，内部其实做了两件关键的事：

* 创建一个 **TapGestureRecognizer** 的实例专门用来识别 "单击" 手势。
* 把你通过 **onTap()** 传入的 **匿名函数** 和 **TapGestureRecognizer** 实例的 **onTap属性** 关联起来。

💁‍♂️ 一个完整的流程就是：

手指按下屏幕 (PointerDownEvent) → **命中测试形成包含所有命中Widget的列表** → **遍历命中列表中的每个Widget 检查是否注册了GestureRecognizer** → 是的话，把对应的GestureRecognizer加入手势竞技场 → 比赛开始，后续的 **PointerMoveEvent** 和 **PointerUpEvent** 将决定谁是最终的胜利者。

### 5.2. 比赛规则

比的是 "**谁能活到最后**"，每个手势识别器 (GestureRecognizer) 都有自己的 "**生存条件**" 和 "**放弃条件**"，比赛的进程就是 **不断根据用户的输入** (移动、时间) 来淘汰那些不符合条件的选手。

**优先级链条**：

* **最优先** (明确、主动胜利) → **拖动 (Drag/Pan)** 和 **长按 (LongPress)** 只要满足各自的 (移动/时间) 条件，就会立即获胜、终结比赛。
* **次优先** (需要等待) → **双击 (DoubleTap)** 有权让其它手势 (尤其是单击-Tap) 等待，看自己是否成功。
* **默认/兜底选项** → 通常是其他手势都不满足条件后的"默认"赢家，因为需要确认其他可能性 (双击、拖动等) 都已经排除，所以往往它的触发时机最晚，
* **特殊情况** (多点触碰) → **缩放/旋转 (Scale/Rotate)** 通常需要两个或更多手指，当第二个手指按下时，Flutter 会分析多个指针的组合行为。**ScaleGestureRecognizer** 会观察多个指针的相对运动，如果检测到捏合或旋转，它会战胜那些单指的拖动识别器。

**多组件嵌套场景示例**：

① **ListView中有一个GestureDetector(onTap) 的 item**

* **用户垂直拖动**：**TapGestureRecognizer** 和 **ListView** 的 **VerticalDragGestureRecognizer** 同时入场。手指开始垂直移动，前者发现移动超限 (＞**kTouchSlop，约18像素**)，立即认输，后者发现移动超过阈值，且方向正确，立即宣告胜利。结果是：ListView 滚动，onTap() 绝不会触发。
* **用户快速点击**：两者同时入场，手指抬起，移动距离很小(<kTouchSlop)，前者胜利条件未满足，后者获胜，结果是：onTap() 触发，ListView不滚动。

② **ListView (垂直) 嵌套 ListView(水平)**

* 定向拖动识别器 (VerticalDragXxx 和 HorizontalDragXxx) 是 "良性竞争" 的关系吗，它们不会互相"抢夺"，而是根据用户的 **初始拖动方向**，非常绅士地决定谁应该响应。

😏 看到这里，部分读者可能想起经典的 "**滑动嵌套冲突处理问题**"，这会在后续章节进行探讨，本节主要还是深扒 **Flutter手势机制** 为主。从"**宏观**"层面了解完 "**手势竞技场**"，接着深入到源码，从"**微观**"层面继续深化理解。

### 5.3. GestureDecotor 源码

继承 **StatelessWidget**，构造函数参数超过50个，主要分为几大类：

* **基础属性**：child-子组件、behavior-命中测试行为、excludeFromSemantics-是否从语义树中排除、supportedDevices-支持的设备类型、dragStartBehavior-拖拽开始行为 (down-按下位置位置开始、start-手势胜出位置开始)
* **点击类手势**：onTap, onTapDown, onTapUp, onTapCancel、onSecondaryTap、onSecondaryTapDown、onSecondaryTapUp、onTertiaryTap 系列、onDoubleTap 系列
* **长按类手势**：onLongPress, onLongPressStart, onLongPressEnd、onSecondaryLongPress 系列onTertiaryLongPress 系列
* **拖拽类手势**：onVerticalDrag 系列 (垂直拖拽)、onHorizontalDrag 系列 (水平拖拽)、onPan 系列 (平移)
* **缩放和力度**:onScale 系列 (缩放)、onForcePress 系列 (力度按压)

从 **build()** 方法可以看出，**GestureDecotor** 的核心作用其实是：**创建和管理各种手势识别器**

```dart
final Map<Type, GestureRecognizerFactory> gestures = <Type, GestureRecognizerFactory>{};

// 根据回调函数决定创建哪些手势识别器
// 💡 GestureRecognizerFactoryWithHandlers 具体工厂实现
if (onTapDown != null || onTapUp != null || onTap != null || ...) {
  gestures[TapGestureRecognizer] = GestureRecognizerFactoryWithHandlers<TapGestureRecognizer>(...);
}

// 💡 最终返回一个【RawGestureDetector】对象
return RawGestureDetector(
  gestures: gestures,
  behavior: behavior,
  excludeFromSemantics: excludeFromSemantics,
  child: child,
);
```

😄 把里面涉及到的 **两个类的核心代码** 拎出来讲一讲，这种 "**延迟加载**" 的玩法值得借鉴：

```dart
// 💡 GestureRecognizerFactory 抽象工厂基类
// 定义了创建手势识别器的统一接口、泛型约束、
// 分离关注点：创建-constructor() 和 配置-initializer()
@optionalTypeArgs
abstract class GestureRecognizerFactory<T extends GestureRecognizer> {
  const GestureRecognizerFactory();
  T constructor();
  void initializer(T instance);
}

// 💡 GestureRecognizerFactoryWithHandlers 具体工厂实现
class GestureRecognizerFactoryWithHandlers<T extends GestureRecognizer> extends GestureRecognizerFactory<T> {
  const GestureRecognizerFactoryWithHandlers(this._constructor, this._initializer);
  final GestureRecognizerFactoryConstructor<T> _constructor;
  final GestureRecognizerFactoryInitializer<T> _initializer;

  @override
  T constructor() => _constructor();

  @override
  void initializer(T instance) => _initializer(instance);
}

// 💡 使用处实现了【延迟创建】
// ① GestureDetector.build() 这里没调用构造函数创建实例，只是把【构造函数】存储在Factory中。
final Map<Type, GestureRecognizerFactory> gestures = <Type, GestureRecognizerFactory>{};

if (onTapDown != null || onTapUp != null || onTap != null || ...) {
  gestures[TapGestureRecognizer] = GestureRecognizerFactoryWithHandlers<TapGestureRecognizer>(
    () => TapGestureRecognizer(debugOwner: this, supportedDevices: supportedDevices),  // 📝 这里只是存储了一个创建函数
    (TapGestureRecognizer instance) {
      instance
        ..onTapDown = onTapDown
        ..onTapUp = onTapUp
        ..onTap = onTap
        // ... 更多配置
    },
  );
}
// ② RawGestureDetectorState.syncAll() 【真正的创建】
void _syncAll(Map<Type, GestureRecognizerFactory> gestures) {
  assert(_recognizers != null);
  final Map<Type, GestureRecognizer> oldRecognizers = _recognizers!;
  _recognizers = <Type, GestureRecognizer>{};
  for (final Type type in gestures.keys) {
    assert(gestures[type] != null);
    assert(gestures[type]!._debugAssertTypeMatches(type));
    assert(!_recognizers!.containsKey(type));
    // 🎯 这里才是真正创建手势识别器的地方！
    _recognizers![type] = oldRecognizers[type] ?? gestures[type]!.constructor();  // ← 调用 factory.constructor()
    assert(_recognizers![type].runtimeType == type, 'GestureRecognizerFactory of type $type created a GestureRecognizer of type ${_recognizers![type].runtimeType}. The GestureRecognizerFactory must be specialized with the type of the class that it returns from its constructor method.');
    gestures[type]!.initializer(_recognizers![type]!);  // ← 调用 factory.initializer()
  }
  for (final Type type in oldRecognizers.keys) {
    if (!_recognizers!.containsKey(type)) {
      oldRecognizers[type]!.dispose();  // 🗑️ 销毁不需要的识别器
    }
  }
}
```

上面的 **GestureDecotor.build()** 最终返回一个 **RawGestureDetector** 对象，它是Flutter手势系统的 "**基石**"，而 **GestureDetector** 其实是基于它的一层封装，旨在提供更便捷的 API 供开发者使用。

### 5.4. RawGestureDetector 源码

它充当了 "**原始指针事件 (Pointer Events)** " 和 "**手势识别器 (Gesture Recognizers)** " 间的桥梁，允许你精确配置一个或多个GestureRecognizer，并将它们应用到其 child 子组件上。它还是 "**手势竞技场 (Gesture Arena)** " 的入口，当一个 **指针事件** (如触摸按下) 发生时，将该事件 "**喂给**" 所有配置好的识别器，并让它们进入竞技场进行"竞争"，以决定哪个手势最终胜出。构造方法如下：

```dart
class RawGestureDetector extends StatefulWidget {
  const RawGestureDetector({
    super.key,
    this.child,                    // 🎯 子组件
    this.gestures = const <Type, GestureRecognizerFactory>{}, // 🌟 手势识别器工厂映射
    this.behavior,                 // 📍 命中测试行为
    this.excludeFromSemantics = false, // ♿ 是否排除语义化
    this.semantics,               // 🎭 语义化手势代理
  });
}
```

不难看出最核心的属性是 **gestures**，**Key(Type)** 是手势识别器的类型，如 TapGestureRecognizer，而**Value(GestureRecognizerFactory)** 是工厂对象，用于创建和配置手势识别器的实例，还算简单，因为真正的工作其实都是在它的 **State类** 中完成的。

### 5.5. _RawGestureDetectorState 源码

😄 代码略多，懒得贴了，直接上**时序图**，先是 "**初始化阶段**"：工厂模式创建并配置所有识别器，建立 **手势类型** 到 **识别器实例** 的映射关系 → 结果：**所有识别器准备就绪，等待接收指针事件**。

然后是 "**指针事件处理阶段**"，将用户的触摸事件分发给所有注册的识别器，让每个识别器都有机会分析这个事件 → 结果：**所有识别器都接收到同一个指针事件并进入手势竞技场**。

接着是 "**竞技场仲裁阶段**"，多个手势识别器在竞技场中分析指针轨迹，通过算法确定哪个手势最符合用户意图 → 结果：**选出一个胜出的识别器，其他识别器被标记为失败**。

再接着是 "**回调触发与UI更新阶段**"，胜出的识别器触发对应的用户回调函数，执行业务逻辑并更新界面状态 → 结果：用户看到预期的交互响应，完成一次完整的手势处理流程。

最后是 "**资源清理阶段**"，失败的识别器清理资源，重置状态准备处理下一次手势事件 → 结果：**系统回到初始状态，等待下一次用户交互**。

流程图中的 **GestureArenaManager-竞技场管理者** 在 **竞技裁决中** 起到了关键作用，跟下源码。

### 5.6. GestureArenaManager 源码

**全局单例**，它只有一个 **_arenas** 属性，L类型 **Map**，**Key** 是 **触点id**，**Value** 是 **_GestureArena** (竞技场)，即 "**每个触点对应一个竞技场**。GestureArenaManager 的作用就是：

> 为每个指针创建竞技场，协调手势识别器间的竞争，通过复杂的仲裁算法决定最终的胜出者。

核心代码：

```dart
/// 为每个指针维护一个竞技场映射
Map<int, _GestureArena> _arenas = <int, _GestureArena>{};

// 📝【注册阶段】当用户触摸屏幕时
PointerDownEvent → RawGestureDetector._handlePointerDown()
                 ↓
              for (recognizer in _recognizers.values) {
                recognizer.addPointer(event);  // 🏟️ 每个识别器都"进入竞技场"
              }
                 ↓
              GestureArenaManager.add(pointer, recognizer)

/// 添加识别器到竞技场
GestureArenaEntry add(int pointer, GestureArenaMember member) {
  // 为新指针创建竞技场
  final _GestureArena arena = _arenas.putIfAbsent(pointer, () => _GestureArena());

  // 将识别器添加到竞技场
  arena.add(member);

  return GestureArenaEntry._(arena, member);
}

/// 🧠【监听后续事件 + 识别器 + 仲裁阶段】
时间维度：分析手势持续时间（单击vs长按）
空间维度：分析手势移动轨迹（点击vs拖拽）
频率维度：分析点击频率（单击vs双击）
优先级：某些手势有更高优先级

/// 🏆【决胜阶段】
// 1. 识别器确定自己应该获胜时
GestureArenaEntry entry = GestureBinding.instance.gestureArena.add(pointer, recognizer);
entry.resolve(GestureDisposition.accepted);

/// 2. GestureArenaManager._resolve() 被调用
void _resolve(int pointer, GestureArenaMember member, GestureDisposition disposition) {
  final _GestureArena? arena = _arenas[pointer];
  if (arena == null) return;

  if (disposition == GestureDisposition.accepted) {
    // 🏆 设置急切获胜者，即第一个调用 resolve(accepted) 的识别器
    arena.eagerWinner ??= member;
    // ⚡ 尝试解决竞技场
    _tryToResolveArena(pointer, arena);
  } else {
    // ❌ 识别器失败，从竞技场移除
    arena.members.remove(member);
    member.rejectGesture(pointer);  // 通知识别器被拒绝
    _tryToResolveArena(pointer, arena);
  }
}

/// 3. _tryToResolveArena() 执行仲裁
void _tryToResolveArena(int pointer, _GestureArena arena) {
  if (arena.isHeld || arena.hasPendingSweep) return;

  if (arena.members.length == 1) {
    // 🎯 只有一个识别器，直接获胜
    arena.members.first.acceptGesture(pointer);
  } else if (arena.eagerWinner != null) {
    // 🏆 有急切获胜者，让它获胜
    arena.eagerWinner!.acceptGesture(pointer);
    // ❌ 拒绝所有其他识别器
    for (final GestureArenaMember member in arena.members) {
      if (member != arena.eagerWinner) {
        member.rejectGesture(pointer);
      }
    }
  }

  // 🧹 清空竞技场
  arena.members.clear();
  _arenas.remove(pointer);
}

/// 4. 胜出识别器的 acceptGesture() 被调用
@override
void acceptGesture(int pointer) {
  // 📞 触发用户回调
  invokeCallback<void>('onTap', onTap);
}
```

接着看看竞技场 "**核心三剑客**"的源码。

#### 5.6.1. GestureArenaMember - 竞技场成员抽象接口

定义了参与者的基本行为契约，响应竞技场的仲裁结果 (接受/失败)，核心代码：

```dart
abstract class GestureArenaMember {
  /// 🏆 当识别器在竞技场中获胜时调用
  // 1. 标记为已接受状态
  // 2. 触发相应的用户回调（如 onTap）
  // 3. 开始正式处理手势事件，如：invokeCallback<void>('onTap', onTap);
  void acceptGesture(int pointer);

  /// ❌ 当识别器在竞技场中失败时调用
  // 1. 停止追踪该指针
  // 2. 清理相关资源
  // 3. 可能触发取消回调()
  // stopTrackingPointer(pointer);
  void rejectGesture(int pointer);
}

// ✅ 主要实现类
TapGestureRecognizer          // 单击手势
DoubleTapGestureRecognizer    // 双击手势
LongPressGestureRecognizer    // 长按手势
PanGestureRecognizer          // 平移手势
ScaleGestureRecognizer        // 缩放手势
```

#### 5.6.2. _GestureArena - 竞技场实体类

私有类，单个指针的竞技场实体，管理该指针的所有识别器，记录急切获胜者、控制仲裁时机，核心代码：

```dart
class _GestureArena {
  /// 竞技场成员列表
  final List<GestureArenaMember> members = <GestureArenaMember>[];

  /// 急切获胜者（第一个申请获胜的识别器）
  GestureArenaMember? eagerWinner;

  /// 是否被持有（延迟仲裁）
  bool isHeld = false;

  /// 是否有待处理的清扫
  bool hasPendingSweep = false;

  /// 添加成员到竞技场
  void add(GestureArenaMember member) {
    members.add(member);
  }

  /// 从竞技场移除成员
  bool remove(GestureArenaMember member) => members.remove(member);

  /// 判断竞技场是否为空
  bool get isEmpty => members.isEmpty;

  /// 判断是否为唯一成员
  bool isOnlyMember(GestureArenaMember member) {
    return members.length == 1 && members.first == member;
  }

  /// 获取成员数量
  int get length => members.length;

  // 🏆 急切获胜者：第一个主动申请获胜的识别器
  void setEagerWinner(GestureArenaMember member) {
    eagerWinner ??= member;  // 只设置一次，先到先得！
  }
}
```

#### 5.6.3. GestureArenaEntry - 识别器 & 控制器的唯一桥梁

提供 **resolve()** 方法让识别器控制自己的竞争结果，生命周期 arena.add() 创建 → resolve() 销毁，核心代码：

```dart
class GestureArenaEntry {
  /// 解决竞争 - 识别器的唯一出口
  void resolve(GestureDisposition disposition) {
    // 委托给 GestureArenaManager 处理
    GestureBinding.instance.gestureArena._resolve(
      _pointer,
      _member,
      disposition
    );
  }
}

/// 手势处置枚举
enum GestureDisposition {
  accepted,  // 申请获胜
  rejected,  // 主动退出
}

// ✅ 识别器确定手势模式后申请获胜
entry.resolve(GestureDisposition.accepted);

// ❌ 识别器发现不匹配时主动退出
entry.resolve(GestureDisposition.rejected);
```

#### 5.6.4. 完整调用链路图

有点散乱，画个图帮助理解 (识别器有：单击、长按和拖拽，最后裁定单击是胜利者🏆)：

🤔 **GestureArenaManager** 更像是一个 "**仲裁员**" 而非 "**决策者**"，它的职责是：**为每个指针创建独立的竞技场，管理识别器的注册，处理获胜申请 (但不决定谁获胜)、执行仲裁结果**。"真正的决策权" 还是在各个**GestureRecognizer (手势识别器)** 的手上，每个识别器内部都是一个 "**复杂的状态机**"，用于跟踪指针事件序列以判断是否构成了特定手势。

### 5.7. GestureRecognizer 源码

😶 "**手势识别器**" 的 **顶级父类**，看下 **类的继承结构**：

**核心代码**：

```dart
abstract class GestureRecognizer extends GestureArenaMember with DiagnosticableTreeMixin {
  // 调试所有者 - 用于调试信息
  final Object? debugOwner;

  // 设备手势配置
  DeviceGestureSettings? gestureSettings;

  // 支持的设备类型
  Set<PointerDeviceKind>? supportedDevices;

  // 按钮过滤器 - 控制哪些按钮可以触发手势
  final AllowedButtonsFilter _allowedButtonsFilter;

  // 指针ID到设备类型的映射
  // PointerDeviceKind 是一个枚举：touch-点击、mouse-鼠标、stylus-针尖笔
  // invertedStylus-反向针尖笔、unknown-未知
  final Map<int, PointerDeviceKind> _pointerToKind = <int, PointerDeviceKind>{};

  // 四个核心方法
  addPointer() - 注册新指针 ✨
  addAllowedPointer() - 注册允许的指针
  handleNonAllowedPointer() - 处理不允许的指针
  isPointerAllowed() - 检查指针是否被允许

  // 💡 这里的"允许"指的是符合识别器过滤条件的"指针事件"，有两个可选条件：
  // supportedDevices-设备类型、allowedButtonsFilter-按钮过滤(鼠标左右键)
  // 调用链条：
  // 触摸/点击事件 → addPointer(PointerDownEvent) → isPointerAllowed() 检查设备类型和按钮
  // 被允许 → addAllowedPointer() → startTrackingPointer(pointer)-开始跟踪这个指针
  // 不被允许 → handleNonAllowedPointer() 处理不允许的情况
}
```

😐 **GestureRecognizer** 只是定义了基本的手势识别API，具体的逻辑都交给 **对应的子类** 去处理：

#### 5.7.1. PointerRouter 源码

**startTrackingPointer()** 会调用 **PointerRouter.addRoute()** ，它是 **Flutter** 手势系统中的 "**指针事件路由器**"，负责：**将来自引擎的指针事件分发给相应的手势识别器**。主要方法：

```dart
// 为特定指针ID注册一个路由，参数：指针ID、处理事件的回调函数、可选的坐标变换矩阵
void addRoute(int pointer, PointerRoute route, [Matrix4? transform])

// 移除特定指针的路由，GestureRecognizer.stopTrackingPointer() 时会调用
void removeRoute(int pointer, PointerRoute route)

// 注册一个全局路由，接收所有事件，一般用于监听或调试
void addGlobalRoute(PointerRoute route, [Matrix4? transform])

// 移除全局路由
void removeGlobalRoute(PointerRoute route)

// 💡 调用流程
//
// 【注册阶段】
// GestureRecognizer.addPointer() → GestureRecognizer.startTrackingPointer()
// → PointerRouter.addRoute() 注册路由 → 存储在内部映射: Map<int, List<_RouteEntry>>
//
// 【事件分发阶段】
// 引擎发送 PointerEvent → GestureBinding.handlePointerEvent() 接收
// → PointerRouter.route() 分发事件 → 依次调用所有注册的路由回调
//
// 【清理阶段】
// GestureRecognizer.stopTrackingPointer() → PointerRouter.removeRoute() 移除路由
// → 从映射中删除对应条目

typedef PointerRoute = void Function(PointerEvent event);

// PointerEvent-包含所有关于指针输入的信息，如：位置、标识、时间、状态、压力尺寸
class PointerEvent {
  /// 全局坐标位置 (屏幕坐标系)
  final Offset position;

  /// 本地坐标位置 (组件坐标系)
  Offset get localPosition => /* 通过 transform 转换 */;

  /// 移动增量 (相对于上一次事件)
  final Offset delta;

  /// 本地坐标系的移动增量
  Offset get localDelta => /* 通过 transform 转换 */;

  //...
}
```

**简化事件流**：

* 硬件 → 操作系统捕获输入 → Flutter Engine 接收 **PointerData** → Framework 转换为 **PointerEvent**
* 命中测试-**HitTestResult** → 分发给-**GestureRecognizer** → 路由到-**PointerRouter** → **handleEvent()**

#### 5.7.2. OneSequenceGestureRecognizer 源码

抽象父类，它为所有 **追踪单个连续手势** (从一个指针按下开始，直到这个手势序列结束) 的识别器 (如单击、长按、拖动) 提供了核心的逻辑框架，核心方法：

```dart
// ✨ 【生命周期与状态管理】 (需子类重写)

// 当一个新的指针触摸屏幕时，Flutter 的 GestureBinding 会调用此方法
// 识别器决定是否要开始追踪一个新手势
// 通常在这里记录下指针的ID (event.pointer) 和初始状态，并将自己加入手势竞技场。
void addAllowedPointer(PointerDownEvent event)

// 💡 【核心事件处理器】，在手势序列进行中，每当有新的指针事件发生时调用。
// 在 addAllowedPointer 之后，与该指针相关的所有后续事件 (PointerMoveEvent, PointerUpEvent等)
// 都会被发送到这个方法。子类在这里实现其核心逻辑，如：检查移动距离、计时等，以判断手势是否成立。
void handleEvent(PointerEvent event)

// 【最后的清理工作】当识别器不再追踪任何指针后 (手势成功、失败或取消后)，会调用此方法。
// 可以在这里重置所有内部状态，为下一次手势做准备。
void didStopTrackingLastPointer(int pointer)

// ✨【手势竞技场交互方法】 (子类在handleEvent中根据逻辑判断后，调用这些方法来决定自己在竞技场中的状态)

// 声明自己对当前手势的态度。
// GestureDisposition.accepted 表示"我认为我赢了"，GestureDisposition.rejected 表示 "我放弃"。
void resolve(GestureDisposition disposition)

// 更常用的一种，直接解决自己的状态，而不等待其他竞技者
// 如：TapGestureRecognizer 在检测到手指移动过大时，
// 会调用 resolveSelf(GestureDisposition.rejected) 来让自己失败
void resolveSelf(GestureDisposition disposition)

// 告诉框架："我不再对这个指针的事件感兴趣了"，通常在手势被接受或拒绝后调用。
void stopTrackingPointer(int pointer)

// ✨【竞技场结果回调方法】(由框架调用，子类重写以响应)

// 【胜利回调】当你的识别器在竞技场中胜出时，此方法被调用。
// 这是触发最终手势回调（如 onTap、onPanStart）的最佳位置。
void acceptGesture(int pointer)

// 【失败回调】当你的识别器在竞技场中失败时（例如，另一个识别器胜出），此方法被调用。
// 通常在这里触发取消回调（如 onTapCancel）
void rejectGesture(int pointer)	。
```

🤔 所以，**单序列** 类型手势识别器，关注的重点就是 **handleEvent()** ，它回答了最关键的问题："**这个手势是如何被判定成功或失败的？** "。看下它的子类-单击和长按对应的源码。

#### 5.7.3. TapGestureRecognizer 源码

没在 **TapGestureRecognizer** 直接找着 **handleEvent()** 重写， 往上找父类：**BaseTapGestureRecognizer** → **PrimaryPointerGestureRecognizer**：

然后就是 **等待竞技场结果**：

设置了获胜标志，然后触发后续的 onTapUp() 和 onTap() 回调。

#### 5.7.4. LongPressGestureRecognizer 源码

也是继承 **PrimaryPointerGestureRecognizer**，**handleEvent()** 和单击识别器相同，自己重写了 **handlePrimaryPointer()**

定时器超时处理：

状态检查

#### 5.7.5. DoubleTapGestureRecognizer 源码

再挑一个 **双击手势识别器** 的源码看看，和前面个两个不同，它直接继承 **GestureRecognizer**，跟下方法调用：**addAllowedPointer()** → **_trackTap()** → **_TapTracker.startTrackingPointer()** → **_handleEvent()** ：

```dart
void _handleEvent(PointerEvent event) {
  // 🔍 根据指针ID获取对应的追踪器
  final _TapTracker tracker = _trackers[event.pointer]!;

  if (event is PointerUpEvent) {
    // 👆 指针抬起事件 - 这是最关键的时刻！
    if (_firstTap == null) {
      // 🥇 第一次点击完成 - 注册第一次点击
      _registerFirstTap(tracker);
    } else {
      // 🥈 第二次点击完成 - 双击成功！
      _registerSecondTap(tracker);
    }
  } else if (event is PointerMoveEvent) {
    // 👉 指针移动事件 - 检查是否移动超出容差范围
    if (!tracker.isWithinGlobalTolerance(event, kDoubleTapTouchSlop)) {
      // ❌ 移动距离太大，拒绝这次手势
      _reject(tracker);
    }
  } else if (event is PointerCancelEvent) {
    // 🚫 指针取消事件 - 直接拒绝
    _reject(tracker);
  }
}

/// 注册第一次点击，进入"等待第二次点击"状态
void _registerFirstTap(_TapTracker tracker) {
  // ⏰ 启动双击超时定时器
  // 如果在指定时间内没有第二次点击，就会超时并重置状态
  _startDoubleTapTimer();

  // 🔒 【核心机制】hold住竞技场！
  // 这一步非常重要：阻止其他手势识别器（如TapGestureRecognizer）立即获胜
  // 为第二次点击争取时间窗口
  GestureBinding.instance.gestureArena.hold(0); // 模拟hold调用

  // 🧊 冻结追踪器，停止监听指针事件
  _freezeTracker(tracker);

  // 🗑️ 从当前活跃追踪器列表中移除
  _trackers.remove(0); // 模拟移除

  // 🧹 清理其他所有追踪器
  _clearTrackers();

  // 💾 保存第一次点击信息，状态转为"等待第二次点击"
  _firstTap = tracker;
}

/// 第二次点击，双击成功
void _registerSecondTap(_TapTracker tracker) {
  // ✅ 第一次点击的竞技场条目标记为"接受"
  _firstTap!.entry.resolve(GestureDisposition.accepted);

  // ✅ 第二次点击的竞技场条目也标记为"接受"
  tracker.entry.resolve(GestureDisposition.accepted);

  // 🧊 冻结当前追踪器
  _freezeTracker(tracker);

  // 🗑️ 从追踪器列表中移除
  _trackers.remove(0); // 模拟移除

  // 🎊 触发双击成功回调！
  _checkUp(tracker.initialButtons);

  // 🔄 重置所有状态，准备下一次双击检测
  _reset();
}
```

#### 5.7.6. ScaleGestureRecognizer 源码

最后再讲一个 "**缩放**" 对应的手势识别器 **ScaleGestureRecognizer**，也是继承 **OneSequenceGestureRecognizer**，只能同时识别一个手势序列,，直接跟 **handleEvent()** ：

```dart
@override
void handleEvent(PointerEvent event) {
  assert(_state != _ScaleState.ready);
  bool didChangeConfiguration = false;
  bool shouldStartIfAccepted = false;

  // 🎯 根据事件类型进行不同处理
  if (event is PointerMoveEvent) {
    // 移动事件：更新速度追踪器和位置
    final VelocityTracker tracker = _velocityTrackers[event.pointer]!;
    if (!event.synthesized) {
      tracker.addPosition(event.timeStamp, event.position);
    }
    _pointerLocations[event.pointer] = event.position;
    shouldStartIfAccepted = true;
    _lastTransform = event.transform;
  } else if (event is PointerDownEvent) {
    // 按下事件：添加新指针
    _pointerLocations[event.pointer] = event.position;
    _pointerQueue.add(event.pointer);
    didChangeConfiguration = true;
    shouldStartIfAccepted = true;
    _lastTransform = event.transform;
  } else if (event is PointerUpEvent || event is PointerCancelEvent) {
    // 抬起/取消事件：移除指针
    _pointerLocations.remove(event.pointer);
    _pointerQueue.remove(event.pointer);
    didChangeConfiguration = true;
    _lastTransform = event.transform;
  } else if (event is PointerPanZoomStartEvent) {
    // 触控板缩放开始
    _pointerPanZooms[event.pointer] = _PointerPanZoomData.fromStartEvent(this, event);
    didChangeConfiguration = true;
    shouldStartIfAccepted = true;
    _lastTransform = event.transform;
  } else if (event is PointerPanZoomUpdateEvent) {
    // 触控板缩放更新
    if (!event.synthesized && !trackpadScrollCausesScale) {
      _velocityTrackers[event.pointer]!.addPosition(event.timeStamp, event.pan);
    }
    _pointerPanZooms[event.pointer] = _PointerPanZoomData.fromUpdateEvent(this, event);
    _lastTransform = event.transform;
    shouldStartIfAccepted = true;
  } else if (event is PointerPanZoomEndEvent) {
    // 触控板缩放结束
    _pointerPanZooms.remove(event.pointer);
    didChangeConfiguration = true;
  }

  // 🔗 关键调用链
  _updateLines();                                    // ① 更新旋转线
  _update();                                         // ② 更新计算数据

  if (!didChangeConfiguration || _reconfigure(event.pointer)) {
    _advanceStateMachine(shouldStartIfAccepted, event); // ③ 推进状态机
  }
  stopTrackingIfPointerNoLongerDown(event);         // ④ 清理追踪
}
```

状态机核心逻辑在 **_advanceStateMachine()** 中：

```dart
void _advanceStateMachine(bool shouldStartIfAccepted, PointerEvent event) {
  // 🟡 状态1: ready → possible
  if (_state == _ScaleState.ready) {
    _state = _ScaleState.possible;
  }

  // 🟠 状态2: possible → accepted (竞争判定)
  if (_state == _ScaleState.possible) {
    final double spanDelta = (_currentSpan - _initialSpan).abs();
    final double focalPointDelta = (_currentFocalPoint! - _initialFocalPoint).distance;

    // 🏆 【三重判定条件】
    if (spanDelta > computeScaleSlop(event.kind) ||                    // 跨度变化超阈值 (通常为18.0 像素)
        focalPointDelta > computePanSlop(event.kind, gestureSettings) || // 焦点移动超阈值 (通常为18.0 像素)
        math.max(_scaleFactor / _pointerScaleFactor, _pointerScaleFactor / _scaleFactor) > 1.05) { // 缩放比例变化
      resolve(GestureDisposition.accepted); // 🎯 宣布胜利！
    }
  } else if (_state.index >= _ScaleState.accepted.index) {
    resolve(GestureDisposition.accepted);
  }

  // 🟢 状态3: accepted → started (开始手势)
  if (_state == _ScaleState.accepted && shouldStartIfAccepted) {
    _initialEventTimestamp = event.timeStamp;
    _state = _ScaleState.started;
    _dispatchOnStartCallbackIfNeeded(); // 🔥 触发 onStart 回调
  }

  // 🔵 状态4: started (持续更新)
  if (_state == _ScaleState.started) {
    _scaleVelocityTracker?.addPosition(event.timeStamp, Offset(_scaleFactor, 0));
    if (onUpdate != null) {
      invokeCallback<void>('onUpdate', () {
        onUpdate!(ScaleUpdateDetails(
          scale: _scaleFactor,                    // 总缩放比例
          horizontalScale: _horizontalScaleFactor, // 水平缩放比例
          verticalScale: _verticalScaleFactor,     // 垂直缩放比例
          focalPoint: _currentFocalPoint!,         // 全局焦点
          localFocalPoint: _localFocalPoint,       // 本地焦点
          rotation: _computeRotationFactor(),      // 旋转角度
          pointerCount: pointerCount,              // 指针数量
          focalPointDelta: _delta,                 // 焦点变化
          sourceTimeStamp: event.timeStamp
        ));
      });
    }
  }
}
```

不难看出竞争判定的关键逻辑在于当状态为 _ScaleState.possible 时执行三重判定条件：

* **跨度变化**：计算当前指针间平均距离与初始距离的差值，超过 computeScaleSlop() 阈值 (通常18像素) 即认为是 "**缩放**" 意图。
* **焦点移动**：计算当前焦点与初始焦点的直线距离，超过 computePanSlop() 阈值（通常18像素）即认为是 "**拖拽**" 意图。
* **缩放比例**：计算缩放因子的相对变化，任一方向超过5% (1.05倍 )即认为有 "**明显**" 缩放。

也绘制下调用方法的时序图：

## 6. 自定义手势案例：实现N连击

🐶 懒得自己想了，直接抄[《掘金小册：Flutter 手势探索 - 执掌天下》](https://juejin.cn/book/6896378716427911181/section/6959546576196861987 "https://juejin.cn/book/6896378716427911181/section/6959546576196861987")里的 "**N连击手势检测**" 的例子，关键点就是自定义一个支持N连击的手势识别器——**MultipleTapGestureRecognizer**，核心：

* 继承 **OneSequenceGestureRecognizer**，重写 **handleEvent()** 对每次 **PointerUpEvent** (抬起事件) 进行处理，根据 **时间间隔(≤300ms)+点击位置(≤50px)** 判断是否为连击，同时满足才认为是连击，否则重置为第1击(这里要hold()避免阻止TapGestureRecognizer立即获胜)。
* ≥2连击时立即触发连击事件，每次点击后设置300ms定时器，超时后自动重置所有状态 (要release()竞技场)。最后在事件指针跟踪结束回调的 **didStopTrackingLastPointer()** 中判断：如果连击数少于2，宣布识别失败。

具体代码实现：

```dart
class MultipleTapGestureRecognizer extends OneSequenceGestureRecognizer {
  /// 连击时间间隔限制（毫秒）
  final int tapInterval;

  /// 连击位置偏移限制（像素）
  final double positionTolerance;

  /// N连击事件回调函数
  Function(int tapCount, Offset position)? onMultipleTap;

  /// 当前连击次数
  int _tapCount = 0;

  /// 上次点击时间
  DateTime? _lastTapTime;

  /// 上次点击位置
  Offset? _lastTapPosition;

  /// 重置定时器
  Timer? _resetTimer;

  MultipleTapGestureRecognizer({
    this.tapInterval = 300,
    this.positionTolerance = 50.0,
  });

  @override
  String get debugDescription => 'MultipleTapGestureRecognizer';

  @override
  void addAllowedPointer(PointerDownEvent event) {
    // 开始跟踪这个指针
    startTrackingPointer(event.pointer, event.transform);
  }

  @override
  void handleEvent(PointerEvent event) {
    // 只处理抬起事件
    if (event is PointerUpEvent) _handleTapUp(event);
  }

  /// 🎯 处理抬起事件
  void _handleTapUp(PointerUpEvent event) {
    final now = DateTime.now();
    final position = event.position;

    // 检查是否在连击时间间隔内
    bool isWithinTapInterval = false;
    if (_lastTapTime != null) {
      final timeDiff = now.difference(_lastTapTime!).inMilliseconds;
      isWithinTapInterval = timeDiff <= tapInterval;
    }

    // 检查是否在连击位置范围内
    bool isWithinPositionTolerance = true;
    if (_lastTapPosition != null) {
      final distance = (position - _lastTapPosition!).distance;
      isWithinPositionTolerance = distance <= positionTolerance;
    }

    // 判断是否为连击
    if (isWithinTapInterval && isWithinPositionTolerance) {
      _tapCount++;
    } else {
      _tapCount = 1;
    }

    // 更新状态
    _lastTapTime = now;
    _lastTapPosition = position;
    // 取消之前的重置定时器
    _resetTimer?.cancel();

    if (_tapCount == 1) {
      // 第一次点击时hold住竞技场，阻止TapGestureRecognizer立即获胜
      GestureBinding.instance.gestureArena.hold(event.pointer);
    } else if (_tapCount >= 2) {
      // 多击成功，立即触发连击事件并获胜
      resolve(GestureDisposition.accepted);
      onMultipleTap?.call(_tapCount, position);
    }

    // 设置重置定时器
    _resetTimer = Timer(Duration(milliseconds: tapInterval), () {
      _tapCount = 0;
      _lastTapTime = null;
      _lastTapPosition = null;
      // 超时后释放竞技场
      GestureBinding.instance.gestureArena.release(event.pointer);
    });
  }

  @override
  void didStopTrackingLastPointer(int pointer) {
    // 如果连击次数小于2，认输
    if (_tapCount < 2)  resolve(GestureDisposition.rejected);
  }

  @override
  void dispose() {
    _tapCount = 0;
    _lastTapTime = null;
    _lastTapPosition = null;
    _resetTimer?.cancel();
    _resetTimer = null;
    super.dispose();
  }
}
```

然后在需要使用自定义手势的地方使用 **RawGestureDetector**，通过 **gestures** 传入支持的手势类型，这里依次传入了"单击"、"长按" 和 "N连击"：

```dart
RawGestureDetector(
  // 设置手势识别器：Key为TapGestureRecognizer类型，Value为手势识别器的工厂对象
  gestures: {
    TapGestureRecognizer: GestureRecognizerFactoryWithHandlers<TapGestureRecognizer>(
      () => TapGestureRecognizer(),
      (GestureRecognizer instance) {
        (instance as TapGestureRecognizer).onTap = () {
          _gestureHistory.value = ['触发单击', ..._gestureHistory.value];
          _bgColorNotifier.value = _tapColor;
        };
      },
    ),
    LongPressGestureRecognizer: GestureRecognizerFactoryWithHandlers<LongPressGestureRecognizer>(
      () => LongPressGestureRecognizer(),
      (GestureRecognizer instance) {
        (instance as LongPressGestureRecognizer).onLongPress = () {
          _gestureHistory.value = ['触发长按', ..._gestureHistory.value];
          _bgColorNotifier.value = _longPressColor;
        };
      },
    ),
    MultipleTapGestureRecognizer: GestureRecognizerFactoryWithHandlers<MultipleTapGestureRecognizer>(
      () => MultipleTapGestureRecognizer(),
      (GestureRecognizer instance) {
        (instance as MultipleTapGestureRecognizer).onMultipleTap = (tapCount, position) {
          _gestureHistory.value = ['触发N连击: $tapCount', ..._gestureHistory.value];
          _bgColorNotifier.value = _multipleTapColors[(tapCount - 2) % _multipleTapColors.length];
        };
      },
    ),
  }, child: ...
```

运行效果：

😄 还是非常简单的，完整源码【--->[c34/multiple_tap_gesture_demo.dart](https://github.com/配套示例源码/blob/master/lib/c34/multiple_tap_gesture_demo.dart)<---】

## 7. 画个图收尾

如题，最后梳理下流程，画个图作为收尾：