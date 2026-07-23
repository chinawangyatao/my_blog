---
title: "Flutter入门到精通（三十）：玩转自定义绘制三部曲（中）"
pubDate: 2024-01-31
description: "Flutter自定义绘制进阶，路径、变换、组合等高级技巧。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
---

> 本文是Flutter系统学习系列的第三十篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

😄 经过上节[《二十九、🖌玩转自定义绘制三部曲[上]》]( "")的学习，一些简单的自定义绘制任务对各位童鞋来说应该是信手拈来了🤏，打铁趁热🔥，本节继续跟着更深入地学习 **Flutter绘制** 相关的姿势，学习路线如下：

## 2. 手势-GestureDetector👋

🤔 所谓的 "**手势**"，指的是：

用户在触摸屏上进行的一系列交互操作 (如点击)，然后这些操作可被APP检测并做出相应的响应。

**自定义绘制** 时，很多时候也需要根据用户手势返回一定的反馈，比如：点击折线图中的点弹窗显示详细信息

😄 那如何在自定义绘制时 **识别手势** 呢？😏 em... 我换个问题：**怎么给一个Widget添加点击监听**？是的，没错，就是套一个 **GestureDetector** 组件，重写 **onTap()** 执行点击逻辑。除了 **点击** 外，它还提供不同类型手势的回调，比如常见的：**双击、长按、滑动、拖动、缩放** 等。

### 2.1. API 速览

下面是 **GestureDetector** 的 **常用API** 梳理 (扫一遍，用到查，不死记)：

```dart
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

// ===================【💡 平移/拖拽 💡】====================
onPanDown (GestureDragDownCallback?)：当用户手指按下平移时触发。
onPanStart (GestureDragStartCallback?)：当平移开始时触发。
onPanUpdate (GestureDragUpdateCallback?)：当平移过程中手指移动时触发。
onPanEnd (GestureDragEndCallback?)：当平移结束时触发。
onPanCancel (GestureDragCancelCallback?)：当平移操作被取消时触发。
// ✨ 触发流程：
// 正常是从上往下走，onPanCancel() 的触发时机是 onPanStart() 之前取消，一般出现在手势嵌套的场景。
// 💡「HorizontalDrag-水平拖拽」和「VerticalDrag-竖直拖拽」可看作 Pan 事件在水平和垂直方向上的应用。
// 回调对象信息基本一致，方法名也雷同，只处理水平方向拖拽用前者，只处理竖直方向拖拽用后者。
// ❗️ 注：只能用一个，不能同时使用！！！如果需要处理复杂方向拖拽还是用Pan！

// ===================【💡 缩放 💡】====================
onScaleStart (GestureScaleStartCallback?)：当缩放开始时触发。
onScaleUpdate (GestureScaleUpdateCallback?)：当缩放过程中手指移动时触发。
onScaleEnd (GestureScaleEndCallback?)：当缩放结束时触发。
// ✨ 触发流程：从上往下，触点移动会不断触发 onScaleUpdate()
// ❗️ 注：Scale 是 Pan 的父类，两者不能同时使用，后者能做的，前者也能做。
```dart

😀 **自定义绘制** 的手势识别亦是如此，给 **CustomPaint** 套一个 **GestureDetector**，然后通过 **CustomPainter** 的 **构造方法** 传入相关参数 (一般是 **ValueNotifier** 类型，然后调 **super(repaint: xxx)** ，值变化自动触发重绘)。

💡 **附**：**shouldRepaint()** 的回调时机：

* ① 新 CustomPainter 实例被提供给 RenderCustomPaint 对象时。
* ② 新 CustomPainter 实例与旧的实例属于不同的类类型。
* ③ CustomPainter 属性变化，且变化会影响绘制结果。

### 2.2. 手势+绘制代码示例

源码【--->c30/d2/paint/gesture\_paint\_preview.dart<---】

#### 2.2.1. Tap-点击触点画圆

**实现目标**：点击后以触点为圆心，绘制圆圈及坐标文本的例子，关键实现代码：

运行效果：

💡 **小贴士**：

这里要注意「**绘制边界**」的问题，**CustomPainter** 中绘制的内容都会被显示到屏幕上，即便绘制内容超出边界。所以，建议执行具体绘制前先做下「**画布裁剪**」，调用下 **canvas.clipRect(Offset.zero & size)** 即可。**Offset** 重写了 **&运算符** → Rect operator &(Size other) => Rect.fromLTWH(dx, dy, other.width, other.height)，可以根据 **偏移和尺寸** 直接获得Rect对象。

#### 2.2.2. DoubleTap-双击圆变色

**实现目标**：绘制文本显示双击坐标，如果触点在圆圈内变色，关键实现代码：

运行效果：

💡 **小贴士**：

> 写这个示例时遇到「**莫名的重绘**」，表现为：同一个页面上有多个 **CustomPaint** 组件，其中一个重绘导致了另一个组件的重绘 (调了它的CustomPainter实例的paint()方法)，具体原因分析后面讲，你暂且知道套个「**RepaintBoundary**」组件来隔离重绘区域，就可以解决这个问题。

#### 2.2.3. LongPress-长按弹窗

**实现目标**：长按+触点在圆圈内绘制弹窗，点击隐藏弹窗。🤔 这里有个问题：

> 需要给自定义绘制传递 **两个参数**：**是否显示弹窗** + **长按抬起的触点**，任意一个发生变化，都要触发重绘，而 CustomPainter#super() 只支持 **一个Listenable** 类型的 **repaint** 参数。

😆 解法有二，先说简单的 → 调用「**Listenable.merge()** 」将 **多个Listenable对象合并** 成一个新的 Listenable 对象。当前 **任何一个被合并的Listenable对象** 变化，合并后的 Listenable 对象都会通知其监听器。应用示例：

然后是稍微麻烦点的 →「**自定义ChangeNotifier**」维护属性，手动调用 **notifyListeners**() 通知监听器。示例：

😄 用哪个看具体场景，简单的直接merge()，涉及复杂刷新再自定义ChangeNotifier。运行效果：

💡 **小贴士**：

> 这里调的 **Rect** 提供的 **contains(Offset point)** 判断触点是否在矩形区域内，本质上还是 **比较点坐标和边界进行** 的判断，具体实现：return offset.dx >= left && offset.dx < right && offset.dy >= top && offset.dy < bottom，😄 不用我们自己手写，方便偷懒啊，类似的 **RRect** 和 **Path** 也提供了 **contains()** 方法。

#### 2.2.4. Pan-平移圆形控制柄

想实现的效果：

**绘制思路**：判断触点要圆心距离，小于半径直接使用触点坐标绘制，大于半径则求弧度并计算出边缘坐标。

* **求弧度**：使用 **math.atan2** (点.y-圆心.y, 点.x-圆心.x)，不论点在哪个象限，它都能根据点坐标算出从x轴正方向到该点的弧度，范围为-π到π中间。然后 Offset 类重写了 **减号操作符(-)** ，两个Offset变量直接相减就能得出atan2()括号里的值。
* **求边缘坐标**：有弧度以后就是套公式算坐标了 → **x=圆心x+cos(angle)、y=圆心x+sin(angle)** ，然后Offset 给我提供了一个工厂方法 **fromDirection()** ，只需传入弧度和距离，即可得到计算后的Offset：

思路有了，代码自然也就不难写出来啦~

#### 2.2.5. VerticalDrag-垂直拖拽下落小球

想实现的效果：

**绘制思路**：两种行为会触发重绘 **垂直向上的拖拽手势(触点)** 和 **下落动画(动画值)** ，先上拉后下落，同一时间只有一个行为在进行。自定义一个 **ChangeNotifier**：

**onVerticalDragUpdate()** 触点移动更新触点，**onVerticalDragEnd()** 拖拽结束执行动画：

具体绘制部分，抽取出一个绘制小球的方法，对边界值进行修正：

😄 到此，简单地实现了一个拖拽小球自由下落的效果，当然有点反直觉，毕竟从高处下落的小球一般会弹起再落下，反复直到最后再停下来，这里直接应用的 **GravitySimulation-重力加速度** 的物理模拟动画，如果读者想精确控制弹跳效果，可以自己尝试下手动计算~

#### 2.2.6. Scale-缩放-图片的缩放旋转平移

想实现的效果：

**绘制思路**：缩放回调能拿到触点坐标、触点数量、缩放比例和角度，根据这些信息生成 **Matrix4** 矩阵，在绘制时调 **Canvas#transform** (Float64List matrix4) 进行矩阵变化，比较简单，直接上代码：

绘制处：

💡 **小贴士**：

> Matrix4#multiplied() 的作用是将当前Matrix4对象与传入的Matrix4对象相乘，并 **返回相乘后的新矩阵**。另外，源码示例中这部分是通过路由跳转到新页面显示的，因为 **GestureDetector** 和外层 **SingleChildScrollView** 滑动手势的冲突，整起来有点麻烦，后续会有专门的章节来研究和处理手势冲突~

## 3. 贝塞尔曲线📊

😄 高级自定义绘制必懂知识点：它是一种「**参数曲线**」→ 由「**控制点**」定义 → 用于「**创建平滑和可控的曲线**」。根据控制点的数量，分为不同的 **阶数**：一阶 (两个点，直线)、二阶 (三个点，简单弧线)、三阶 (四个点，复杂曲线)、多阶 (点更多，计算量越大)，大多数情况下 **三阶** 就够我们用了😀。很多童鞋看到这玩意就头大，其实，可能是没有掌握要诀而已，并没想象中那么难。

### 3.1. 公式推导

> 源码【--->c30/d2/paint/bezier\_calculate\_preview.dart<---】

在进行公式推导前，先提下「**线性插值**」→ **用于估算两个已知点间的未知点**。简单点说：

> 在两点间画一条直线，并通过这个直线来找到位于两点间的某个特定位置上的点。

具体来说，假设有两个已知点 P0(x0,y0) 和 P1(x1,y1)，以及一个参数t (0≤t≤1)，线性插值就是找到一个点B(t)，它在两点间，且它的位置由参数t来控制。公式如下：

> **B(t) = (1-t)P0 + tP1** → (B点的xy坐标)：x(t) = (1-t)x0 + tx1、y(t) = (1-t)y0 + ty1

当t=0，B点位于P0，t=1，B点位于P1，0≤t≤1，在两者之间，直观理解：

> t = **从P0到P1的相对距离**，1-t = 从P1到P0的相对距离

代入具体数据帮助理解：假设有两个点 → P0(39,225) 和 P1(353,75)，找t=0.3时的点B(t)，直接套公式：

* B(0.5) = (1-0.3)P0 + 0.3P1 → B(0.3) = 0.7P0 + 0.3P1
* 代入坐标 → B(0.3) = 0.7(39,225) + 0.3(353,75)
* 分解为各个坐标变量的线性插值
* x(0.5)=0.7*39 + 0.3*353,75 ≈ 133
* y(0.5)=0.7*225 + 0.3*75 ≈ 180
* 所以，当t=0.3时，点B(t)的坐标为(133,180)，表示在两点间走了0.3的的路程：

😄 弄懂 **线性插值**，**一阶贝塞尔曲线** 的 **参数方程** 也知道了 → **B(t) = (1-t)P0 + tP1**，接着来推导 **二阶**。相比一阶多了一个控制点 (图中的P1)：

然后 **P0P1** 和 **P1P2** 上分别求t时的点位置 **Q0** 和 **Q1**：

接着 **Q0Q1** 上t时的点位置就我们想要的点 **B**：

推导过程：

```dart
// 先能得出这样的方程组
Q0 = (1-t) * P0 + t * P1
Q1 = (1-t) * P1 + t * P2
B = (1-t) * Q0 + t * Q1

// 代入下Q0和Q1
B = (1-t) * ((1-t) * P0 + t * P1) + t * ((1-t) * P1 + t * P2)
B = (1-t)^2 * P0 + (1-t) * t * P1 + t * (1-t) * P1 + t^2 * P2

// (1-t) * t 和 t * (1-t) 是相同的，合并下就是「二阶贝塞尔曲线」的参数方程啦：
B = (1-t)^2 * P0 + 2 * (1-t) * t * P1 + t^2 * P2

// 当然，还可以往下继续拆解，展开平方项(1-t)^2=1 - 2t + t^2、合并类似项：
B = (1 - 2t + t^2) * P0 + 2 * (1-t) * t * P1 + t^2 * P2
B = P0 - 2t * P0 + t^2 * P0 + 2t * P1 - 2t^2 * P1 + t^2 * P2
B = P0 - 2t * P0 + t^2 * P0 + 2t * P1 - 2t^2 * P1 + t^2 * P2
```dart

😏 二阶弄懂了，三阶也不难了，控制点变成了两个 (**P1** 和 **P2**)：

然后 P0P1、P1P2、P2P3 求t时的点位置 **Q0**、**Q1**、**Q2**：

接着求 Q0Q1 和 Q1Q2 在t时的点位置 **R0、R1**：

最后求 R0R1 在t时的点位置就是我们想要的点 **B**：

推导过程：

```dart
// 先能得出这样的方程组
Q0 = (1-t) * P0 + t * P1
Q1 = (1-t) * P1 + t * P2
Q2 = (1-t) * P2 + t * P3
R0 = (1-t) * Q0 + t * Q1
R1 = (1-t) * Q1 + t * Q1
B = (1-t) * R0 + t * R1

// 将Q0和Q1的表达式代入R0和R1中
R0 = (1-t) * [(1-t) * P0 + t * P1] + t * [(1-t) * P1 + t * P2]
R1 = (1-t) * [(1-t) * P1 + t * P2] + t * [(1-t) * P2 + t * P3]
// 展开
R0 = (1-t)^2 * P0 + (1-t)t * P1 + t(1-t) * P1 + t^2 * P2
R1 = (1-t)^2 * P1 + (1-t)t * P2 + t(1-t) * P2 + t^2 * P3
// 合并同类项
R0 = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
R1 = (1-t)^2 * P1 + 2(1-t)t * P2 + t^2 * P3

// 将R0和R1表达式代入B的定义中
B = (1-t) * [(1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2] + t * [(1-t)^2 * P1 + 2(1-t)t * P2 + t^2 * P3]
// 展开并合并同类项
B = (1-t)^3 * P0 + 2(1-t)^2t * P1 + (1-t)t^2 * P2 + (1-t)^2t * P1 + 2(1-t)t^2 * P2 + t^3 * P3
B = (1-t)^3 * P0 + (1-t)^2t * P1 + (1-t)^2t * P1 + 2(1-t)^2t * P1 + (1-t)t^2 * P2 + 2(1-t)t^2 * P2 + t^3 * P3

// 简化后的参数方程
B = (1-t)^3 * P0 + 3(1-t)^2t * P1 + 3(1-t)t^2 * P2 + t^3 * P3
```dart

😃 更高阶贝塞尔曲线的推导过程也是类似，就是计算量会更多而已，推导过程看不懂也没关系，只是了解下原理。会直接 **套公式** 就好，甚至不用套，Flutter 自定义绘制里的 **Path** 已经提供了直接绘制贝塞尔曲线的方法： **二阶-quadraticBezierTo()** 和 **三阶-cubicTo()** 。

💡 **小贴士**：

> Flutter中内置一个 **geometry.dart** 文件，其中定义了一些几何图形和相关的数学运算，用于描述和操作二维空间中的点、大小、矩形、圆角矩形等几何形状，如：**Offset? lerp(Offset? a, Offset? b, double t)** → 根据t的值，在两个 Offset 对象间进行插值计算。

### 3.2. 结合动画

> 源码【--->c30/d2/paint/bezier\_animate.dart<---】

😊 就实现一个t从0-1线性插值绘制不同阶贝塞尔曲线绘制的动画效果，一阶直接套公式：

写起来还是挺麻烦的，**二阶** 也套公式，这里通过 **循环** 的方式来实现实现曲线从0到1的绘制效果：

**三阶** 的话，尝试过直接调 **cubicTo()** 传入三个控制点生成完整曲线，然后通过 **PathMetric + extractPath()** 根据 **当前动画插值** 抠出部分Path来绘制：

😳 但是发现曲线和点一直没显示在r0和r1的连线上，但最终会回到同一个点P3：

猜测是：贝塞尔曲线的参数t 与 曲线长度不是线性关系，用曲线长度来直接计算位置导致的偏差，🤷‍♀️ 不知道怎么解决，还是老老实实一步步 **lerp()** + 套公式：

最后画个 **四阶** 的，也是套公式：

最终运行效果如下：

🐂 数学的魅力，炫啊！

### 3.3. 结合手势

> 源码【--->c30/d2/paint/gesture\_x\_bezier\_preview.dart<---】

😊 就实现一个可以通过手势拖拽三阶贝塞尔曲线控制点的效果，核心代码如下：

运行效果如下：

### 3.4. 综合应用：球型水波纹进度条

> 源码【--->c30/d2/paint/ball\_wave\_progress.dart<---】

😀 当初 **自定义Android View** 必写的经典例子，完整效果如下：

中间的 **圆圈进度条** 和 **进度文本** 还好，把坐标原点挪到画布中间，然后依次绘制：

运行效果：

这里有个 **Path API** 的小坑，提醒下：

> 使用 **Path.arcTo()** 时，如果绘制完整圆弧（2 \* pi）会被视为 **零长度路径**，不会绘制出来。比如：起始角度0，扫过角度为2*pi，会发现没任何绘制效果，改成2*pi-1又有。

😄 绘制的难点其实是「**水波纹**」三种实现思路，不难，都是 **障眼法**，一一讲解~

#### 3.4.1. 思路 ①：贝塞尔曲线 + Canvas平移

原理图如下【--->c30/d2/paint/bezier\_calculate\_preview.dart<---】：

按照上面的规律绘制出图形，然后就是 **Canvas.translate()** 移动画板了，**x轴方向** 整个 **AnimationController#repeat()** 反复从0到1变化，平移距离为 **2*半径*动画值**，**y轴方向** 平移距离为 **当前进度值(小数0-1)*2*半径**。

接着调 **Canvas.clipPath()** 做下 **画布裁剪**，就 **抠个圆**，用户只能看到这部分绘制的内容：

🤣 就是这样简单的两句代码，就实现了水波纹的效果：

核心原理掌握了，实现起来就不难了，主要是计算，效果图里有 **深浅两道波纹**，原理：

> 绘制两个曲线，浅色的在下先画，深色的在上后画，两条曲线的x轴有点偏移就好了。

对具体实现代码感兴趣的可以看下 **drawWaveFirst()** 方法。

#### 3.4.2. 思路 ②：周期曲线-正弦函数

周期函数是一种 **在固定时间内重复其值** 的函数，常用于 **模拟波动** 的场景，这里用到其中的 **正弦函数**：

图中曲线的绘制代码：

稍微封装成一个函数，传入波纹颜色和偏移：

运行看下绘制效果：

可以，接着需要连下底下的左右两点，最后弄下路径闭合：

运行效果：

最后画笔style改成 **fill-填充**，然后在绘制前做下画布裁剪 (圆形)，调用这个函数绘制前后两个曲线：

最后的效果：

#### 3.4.3. 思路③：旋转的圆角正方形

🤔 原理：根据动画值 **从下往上平移** 一个 **不断旋转的圆角正方形**，平移调 **Canvas.translate**，旋转的话，可以 **drawRRect()** 绘制圆角矩形 + **Canvas.rotate()** 让画布围绕原点旋转，执行画布操作前得先 **save()** ，操作完**restore()** ，有点麻烦。😏 这里用另外一种实现方式：**Path绘制路径** + **transform() 矩阵变换**，实现代码：

依旧是画布抠圆，然后绘制前后波浪：

最终运行效果：

😊 三种实现方式，不知道读者们喜欢哪种，更喜欢第二种，感觉波形更加自然~

## 4. 实战案例🌰

😏 练手时间，光说不练假把式~

### 4.1. 文字效果

😀 **Flutter自定义绘制** 中 **关于文字的绘制** 有两种方式：

* **TextPainter**：基于 **TextSpan** (文本及样式) 来描述要绘制的文本内容，提供的API比较简单：文本设置、布局、尺寸测量和绘制到Canvas上，适用于快速绘制简单活中等复杂文本的场景。
* **ParagraphBuilder**：基于 **ParagraphStyle** 来指定段落的全局样式，支持段落级别的样式设置：文本对齐、最大行数等，适用于高级文本布局和样式控制的场景，如：复杂段落样式、多样式文本混排等。

😄 这里我们直接使用前者，看下最终实现效果：

详细源码【--->c30/d4/text/text\_paint\_anim\_preview.dart<---】，接着讲下各自的核心实现思路~

#### 4.1.1. 颜色渐变+外框模糊遮罩

😐 为了实现绘制文字的 **居中**，需要获取绘制文本的宽高，然后 **(画布宽度-字体宽度) /2** 就是 **绘制点的x坐标**，必须得 **layout()** 才能获取宽高：

然后才是真正的布局绘制：

**gradient.createShader()** → **创建着色器范围** 和 **MaskFilter.blur()** → **添加模糊处理** 时 **配合动画插值** 来实现动画效果 (😶就是对应的属性值\*当前动画插值)。**镂空效果** 的话，就是设置画笔 **style-stroke** + 设置**strokeWidth**。

#### 4.1.2. 文字斜阴影

😐 就是绘制两组文字，后面的 **斜阴影**，先 **save()** 画布，通过 **Canvas.skew()** 让画布沿着水平和垂直方向进行倾斜变换，然后绘制文字，**restore()** 画布后再绘制前面的文字，**x轴倾斜角度\*动画插值** 实现动画效果：

#### 4.1.3. 跑马灯

😐 这个最简单了，就是根据 **动画插**值 修改绘制文字的 **起点的x或y坐标**，需要考虑文本处于边缘的计算：

运行效果：

感觉不够平滑，个人更倾向于 **各自绘制两组文字** (后一组减去画布宽/高偏移)：

运行效果：

#### 4.1.4. 掘金Loading效果

😐 就打开掘金页面的Loading文字效果：**一个平行四边形从左扫到右，扫到的区域透明**。简单实现思路：

> 绘制一个 **颜色透明** 的 **平行四边形**，左右 **画两个白色部分透明** 的 **梯形**，然后从左挪到右。

效果是这样：

梯形颜色改为白色：

最后效果：

#### 4.1.5. 文字像素化

> 源码【--->c30/d4/text/text\_px\_paint\_preview.dart<---】效果：

**核心思路**：

TextPainter 将文本绘制到一个 **临时Canvas** 上，获取像素数据后遍历，判断每个像素的透明度，对不透明的像素进行绘制。

关键代码实现：

① **生成文字像素数据**

② **绘制**

🤷‍♀️ 图像像素化也是这样玩~

### 4.2. 复杂图表

#### 4.2.1. 带手势处理的曲线图

😶 前阵子公司项目用到的 **曲线图**，组里另一个小伙伴写了，但并没有很好地还原UI给出的设计稿，估计是对绘制相关的API还不是很熟悉吧，😄 这里简单写下，也是挺好的练手案例，源码【--->c30/d4/chart/line\_chart.dart<---】拆解下实现步骤：

① **挪原点，绘制坐标轴 & 刻度**

比较简单，直接写出绘制代码：

运行效果：

② **绘制曲线**

😄 要先按比例对原始点进行换算得到当前坐标系的真实坐标：

然后就是 **Path#cubicTo()** 三阶贝塞尔曲线来连点，**控制点的计算** 上节说过了：

绘制代码：

运行效果：

③ **曲线背景渐变**

设计稿中曲线下方有一个 **蓝到白的线性渐变**：

**Path.from()** 复制一份原Path，然后连点，形成 **闭合区域** (最终连到起点)，渐变画笔填充：

运行效果：

④ **手势处理 + 绘制触点蓝白圆圈**

😶 直接实现 **onScaleUpdate()** 回调，支持 **点击和平移** 的监听：

同样需要对原始手势点进行换算得到当前坐标系的真实坐标：

然后就是循环遍历绘制点的数组，判定手势命中点的条件：**x轴方向上差距小于5**，顺带绘制白蓝圆圈：

运行效果：

⑤ **计算绘制提示框**

步骤：

* 提示框宽 = 第二行文本宽度 + 水平内边距 \* 2
* 提示框高 = 垂直内边距 \* 2 + 第一行文本高度 + 第二行文本高度 + 两行文字垂直间距
* Path先挪到左上角圆角矩形的结束点，然后开始连线，圆角用贝塞尔曲线，底部锚点 (倒三角) ，闭合路径。
* 绘制路径

代码：

运行效果：

设计稿的提示框有类似于 **Z轴深度效果的阴影 (越高阴影越模糊)** ：

直接调 **Canvas#drawShadow()** 绘制阴影，它的四个参数依次为：需要添加阴影的Path、阴影颜色、阴影的偏移和模糊程度 (值越大，越模糊且偏移越大)、是否模拟光源位置(为true会有透视效果)。😐 需要调整绘制顺序，线画阴影，再画对话框，不然阴影会盖住对话框：

运行效果：

⑥ **绘制居中文字**

计算出绘制第二行文本的y坐标，第一行文本的y坐标 = 第二行文本的y坐标-第一行文字的高度-间距：

最终效果：

👏 Nice，此处应有掌声~

#### 4.2.2. 南丁格尔玫瑰图 (鸡冠花图)

🤔 **弗罗伦斯·南丁格尔** 在克里米亚战争期间发明的图表，用以反映军医院的季节性死亡率，促进了医院条件的改良，外观很像饼图，但本质上更像 **极坐标下绘制的柱状图 (圆形直方图)** ，通过圆弧的半径长短反映数值大小。半径和面积间是平方关系，所以视觉上，这种图会将数据的比例夸大。浅浅写个简单例子，源码【--->c30/d4/chart/rose\_chart.dart<---】：

运行效果：

提下代码里两个读者可能疑惑的点：

① **Colors.primaries[i % Colors.primaries.length]**

Colors.primaries 是一个包含一组主要颜色的列表，%求余是为了实现索引超过列表长度时，循环使用。

② **final radius = maxRadius \* sqrt(item.income / 5000)** ;

取平方根是为了减少较大值间的差距，避免较大值占据过多空间，使得图表的视觉效果更佳均匀和美观。

😆 接着加点挑战，实现一个类似于这样的鸡冠花图：

😄 搞个 **每月收支** 的统计展示吧，先是数据结构：

生成下随机数据：

接着具体绘制，先挪圆心到画布中点，然后计算每条数据所占的平均弧度 (左下角不绘制，所以是3/4的圆)：

然后就是遍历数据绘制对应类型支出的图形了：

算出当前收入的半径，起始绘制角度，以及小半径和大半径，连线绘制：

运行效果：

照葫芦画瓢，把剩余三种类型也绘制下：

运行效果 (右侧把画笔风格改成填充)：

🤣 逼格一下子就上来了，做下微调和文字绘制，最终效果：

#### 4.2.3. 地图绘制

😶 这个没啥，就是找接口，抠数据然后连线，数据源：数据源：[DataV.GeoAtlas 地理小工具](https://datav.aliyun.com/tools/atlas)-[JSON API](https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json)，源码【--->c30/d4/chart/map\_chart.dart<---】

计算边界、缩放比例和偏移，然后对画布进行平移和缩放，最后绘制地图：

运行结果：

### 4.3. 复杂绘制

#### 4.3.1. 叶子Loading进度条

😶 当初 **Android自定义View高级特效的经典案例**，大部分老玩家应该见过，用Flutter简单实现下【--->c30/d4/other/flower\_loading.dart<---】可以将效果拆解成三个部分：

* 圆角进度条
* 右侧旋转的花朵
* 不断飘出的叶子

飘出叶子实现思路可自行借鉴[《一个绚丽的loading动效分析与实现》](https://www.jianshu.com/p/c0a227ebb50a)，我懒得整了，只实现下前两个部分。**圆角进度条** 的话，绘制一个白色背景，然后画布裁剪圆角矩形，根据进度绘制矩形即可：

运行效果：

右边的旋转花朵，直接对画布进行 **矩阵变换** (每超过20就转一圈)，花瓣形状其实就是 **三角形+圆弧**：

加上进度判断，100%时绘制文字不绘制花朵，最终运行效果:

#### 4.3.2. 复刻极简时钟的酷炫UI

😶 某天水群看到一群友发的「极简时钟APP」的某个主题效果：

这切换确实优雅，看得出设计上是花了功夫的，😏 拆解下，用 Flutter 模仿实现一波，作为本节的收尾案例吧~

不难看出：

闹钟主体由 **六个数字** 组成，每个数字又由 **六个小单元** 组成。0-9的变换规律起始是固定的，小单元里有 **两个指针**，分别有各自的 **起始和结束位置** (弧度)，某些时候变化速度也有些不一样，还有 **透明和不透明度变化**。

写出对应的Model类：

写出Model类：

然后就是肉眼👀 逐帧分析，观察并记录每个小单元指针变化的规律 (😳大概，以最终代码为准)：

🤔 接着是动画驱动：**定时器 (每隔1s刷新)** 和 **小单元指针过渡动画**，前者的话无非选 **Timer** 或 **Ticker**：

* **Timer**：属于 **dart:async** 包，用于 **在指定时间后执行一次回调或以固定的时间间隔周期性执行回调函数**。其精度受到，系统调度和应用程序主线程繁忙程度的影响，**不能保证精确的时间间隔**！**适用于不需要高精度和高频率更新的场景**。
* **Ticker**：用于 **以与屏幕刷新率同步的频率(60帧/秒)调用回调函数**，Ticker在 **每帧(16ms)** 都会触发回调，因此非常适合用来 **驱动动画** 及 **需要高频率、精确的时间间隔来更新界面或数据的场景**。使用它时通过在 **状态类(State)** 混入 **SingleTickerProviderStateMixin** (单个Ticker) 和 **TickerProviderStateMixin** (多个Ticker) 已提供 **Ticker** 的上下文。原理：Flutter App在启动时会绑定一个 **SchedulerBinding** 来给 **每一次屏幕刷新添加回调**，**Ticker** 通过它注册了 **帧回调**。

😄 无可厚非，这里妥妥选 **Ticker** 来做定时器，而且相比起 Timer 驱动动画，它还有一个优势：**可以防止屏幕外继续消耗资源 (手机锁屏或应用切到后台)** 。说回后者，**小单元指针过渡动画**，其实就是 **指针起始和位置中间做插值**，过渡时间间隔 **小于1s**，有个稍微的停顿，而不是一直切切切，用户观感会好一些。动画曲线用到 **easeOut**，立方贝塞尔曲线，开始时加速，然后减速，写出相应的代码：

😶 再接着就是具体的绘制了，先绘制第一个圆圈，流程

* 第一个指针的当前角度 = (结束-开始) \* 速度 \* 动画插值；
* 第一个指针的在圆上的点 = 半径 \* cos(当前角度*pi/180)，半径 \* sin(当前角度*pi/180)
* 划线，画笔还要加上透明度和不透明度变化的插值。
* 第二个指针也是这样...

写出实现代码：

运行效果：

😆 Wow，第一个单元的指针动起来了，效果还不太明显，用同样的方式把剩下五个小单元也绘制出来：

😉 Nice，把剩余五个数字也绘制下，搞成全屏横屏，加上背景小圆，各种微调，最终效果：

👏 到此，算是完成了核心 **时间变换过渡效果** 的基本复刻，当然，离完整复刻还差得远呢，比如 **光影** (圆环和指针斜阴影)、指针的不同变化速度，以及各种细节。Flutter 实现光影效果可以看下这个库：[Idean/Flutter-Neumorphic](https://github.com/Idean/Flutter-Neumorphic)：

时间关系，还没来得及去看具体实现原理，感兴趣的读者可在我的源码基础上自行扩展探索~

> 源码：【--->c30/d4/other/simple\_clock.dart.dart<---】

## 5. 小结

🐶 断断续续写了两周，水技术文章这么久以来耗时最多的一篇，毕竟 **用(li)料(zi)扎(chao)实(duo)** ，算是用 **Flutter自定义绘制** 完成了当年没怎么写 **Android自定义View** 的遗憾。所谓的 **动画效果**，本质上都是利用 **肉眼视觉残像** 产生错觉，让人误以为图像似乎真的在运动。**自定义绘制的难点** 不在于相关绘制API的使用，而在于各种 **数学运算** (如三角函数、各种曲线等)。

本节配套源码：**示例源码**（已移除原文仓库链接）

**参考文献**：

* **《Flutter 绘制探索 5 | 深入分析重绘范围 RepaintBoundary》**
* [《Bézier curve的数学原理》](https://xiaochaowei.com/2022/07/09/BezierCurveMathematicalPrinciples/)
* [《振幅、周期、相移和频率》](https://www.shuxuele.com/algebra/amplitude-period-frequency-phase-shift.html)
* [《南丁格尔玫瑰图 - Nightingale Rose Chart》](http://www.tuzhidian.com/chart?id=5c56e4694a8c5e048189c709)