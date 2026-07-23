---
title: "Flutter入门到精通（二十三）：玩转Flutter动画"
pubDate: 2024-01-24
description: "Flutter动画系统详解，Tween、Curve、AnimatedBuilder、Hero动画等。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: '/images/flutter-cover.png'
---

> 本文是Flutter系统学习系列的第二十三篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

 在 **《十一、Flutter UI框架🦐聊》**提到过 **Flutter** 的本质是一套「**UI框架**」，解决的是「**一套代码在多端的渲染**」。写 UI 时除了常规的 **堆Widget** 外，适当加点 **动画**，可以让我们的 App 变得很 **炫**，本节我们就来系统学习下Flutter中 **动画** 相关的姿势~

**本节学习大纲如下**：

## 2. 概念名词

#### 2.1.1. 动画 (Animation) & 帧率 (PFS)

🤔 **动画是什么？**

> 动画 (Animation) 是一种通过定时拍摄一系列静止的 **固态图像** (**帧**) 以 **一定频率** 连续变化、运动 (播放) 的速度(如每秒16张) 而导致肉眼的 **视觉残像** 产生的错觉——而误以为图画或物体 (画面) 活动的作品及其视频技术。——摘自wiki百科

概括下就是：

> 一系列 **静态图像**，以一定速度连续播放，利用人眼的视觉残像，创造出图像似乎在运动的技术。

😄 通常会把这个静止图像称为「**帧**」，它是影像中的 **最小单位**，而平时提到的60帧、90帧、120帧指的是 **帧率(FPS，Frame Per Second)** ，即 **一秒钟有多少个"画面"在屏幕上发生刷新**。60帧就是1s刷新60次，每帧的持续时间约为16.67ms：

接着看下不同帧率下的动画小姑，以 **6帧小球图像** 为例 (PFS分别为：2帧、10帧、16帧、60帧)：

🤣 2帧卡成PPT，10帧流畅了不少，但还是能察觉到一丝卡顿，16帧很丝滑，60帧反而有些鬼畜 (突兀)。

> 🤔 问：不是FPS值越大，动画就越流畅吗？怎么这里60帧的反而让人感到不连贯？
>
> 😮 答：要创建流畅的动画或视频，不仅需要高FPS，还需要确保 **每一帧间的内容变化适度**。

上面这种通过 **快速切换一系列静态图像来创建动画效果** 的方式也叫「**帧动画**」，常见帧率简介：

* **16帧**：早期电影和动画的标准帧率，动态效果略显生硬，基本能看。
* **24帧**：传统电影和电视剧，既能保证动画的流畅性，又能最大限度地降低胶片的使用量，有些还会使用"运动模糊"的技术，通过在每个帧间添加一些模糊，使得动作看起来更连贯。
* **30帧**：电视广播和一些不太需要快速反应的电子游戏，能够提供良好的观看体验。
* **48帧**：新的电影制作，特别是3D电影，更流畅的动作和更少的运动模糊。
* **60帧**：高清电视广播和大多数现代电子游戏，提供非常流畅的动作，大多数游戏的理想帧率。
* **90帧**：高端电脑游戏、部分VR设备，画面极为流畅，能充分展现高速运动的细节。
* **120帧**：高端电脑游戏、专业体育赛事直播、部分电影，提供极致流畅和细节丰富的视觉体验。
* **240帧及以上**：专业电竞，高速摄影，科研应用，能捕捉到极为细微的动作变化，240帧是人眼所能感知到的理论极限帧率。

#### 2.1.2. 过渡 (Transition)

> **从一个状态或场景切换到另一个状态或场景** 的动画效果，App 中常见的过渡类型有：**页面过渡** (页面切换)、**元素过渡** (如按钮未按下到按下)、**列表过渡** (列表增删和重排序时的效果)、**自定义过渡**。

#### 2.1.3. 缓动 (Easing)

> 一种用于 **模拟显示世界中物体运动的自然规律** 的动画技术，通常通过特定的 **缓动曲线(数学函数-描述动画随时间变化的速度)** 来实现，如逐渐加速或逐渐减速。缓动技术可以使界面元素的运动更加平滑和自然，增强用户体验。

#### 2.1.4. 插值器 (Interpolator)

> **在两个已知值中间生成一个或多个中间值**，通常用于计算动画的 **中间帧**。

#### 2.1.5. 关键帧 (Keyframe)

> 动画中 **定义特定时间点的帧**，用于 **控制动画的变化**。关键帧允许开发者在动画的不同时间点设置特定的属性值，动画引擎一般会在这些关键帧之间插值生成 **中间帧**，从而创建平滑的动画效果。

#### 2.1.6. 补间动画 (Tweening)

> 指的是 **在两个关键帧之间生成中间帧的过程**，使得动画从一个状态平滑地过渡到另一个状态。常规玩法：**定义起始状态和结束状态，使用插值器控制动画的变化速率，从而实现各种复杂的动画效果**。

#### 2.1.7. 物理动画 (Physics-based Animation)

> 指的是 **基于物理的动画**，模拟物理现象（如重力、弹性、摩擦、碰撞等）的动画效果。

#### 2.1.8. 附：游戏相关名词

* 精灵 (Sprite)：指游戏中的一个二维图像或动画，通常用于表示角色、道具等。
* 时间轴 (Timeline)：指动画的时间进程，用于控制动画的播放顺序和时间。
* 状态机 (State Machine)：指通过状态和状态转换来控制角色或对象行为的逻辑结构。
* 碰撞检测 (Collision Detection)：用于检测游戏对象之间是否发生碰撞。
* 纹理 (Texture)：应用于3D模型或2D图形表面的图像。
* 网格 (Mesh)：3D模型的几何形状，由顶点和边组成。
* 骨骼动画 (Skeletal Animation)：使用骨骼和关节来控制3D模型的动画。
* 粒子系统 (Particle System)：用于模拟诸如火焰、烟雾、爆炸等效果的系统。
* 渲染 (Rendering)：将3D场景转换为2D图像的过程。
* 光照 (Lighting)：用于模拟光源对场景的影响。
* 阴影 (Shadow)：由光源和物体遮挡产生的阴影效果。
* 物理引擎 (Physics Engine)：用于模拟物理现象，如重力、摩擦、碰撞等。
* 路径规划 (Pathfinding)：用于计算角色或对象从一个点移动到另一个点的路径。
* 人工智能 (Artificial Intelligence, AI)：用于控制非玩家角色(NPC)的行为和决策。

## 3. Flutter 动画核心 API

> 💡 **Tips**：知道下类名，是干嘛的就行，属性和方法列出来，只是方便用时检索~

### 3.1. Animation

抽象类，主要用于 **保存动画的值和状态**，还提供了变化监听，常用属性：

* **status** → **AnimationStatus**，返回当前动画的状态。
* **value** → T，返回当前动画的值。
* **isDismissed** → bool，检查动画是否在起点停止。
* **isCompleted** → bool，检查动画是否在终点停止。

常用方法：

* **addListener** (VoidCallback listener)：添加值变化的监听器。
* **removeListener** (VoidCallback listener)：移除值变化的监听器。
* **addStatusListener** (AnimationStatusListener listener)：添加状态变化的监听器。
* **removeStatusListener** (AnimationStatusListener listener)：移除状态变化的监听器。
* **drive**(Animatable child)：将一个 Tween 或 CurveTween 链接到动画上。

### 3.2. Curve-动画曲线

抽象类，继承自 **ParametricCurve** ，用于定义 **参数化动画缓动曲线 (动画随时间的变化速率)** 。我们把 **匀速动画** 称为 **线性** 的，**非匀速动画** 称为 **非线性** 的。一般很少 **自定义Curve** (重写transform方法，实现自定义插值逻辑)，而是使用Flutter 给我们提供的 **预定义曲线**，常用曲线 (通过 **Curves** 类访问，如**Curves.linear** )：

| **缓动曲线名称** | **描述** |
| --- | --- |
| **linear** | 线性曲线，匀速变化 |
| **decelerate** | 开始较快，然后减速，倒置的 f(t) = t² 抛物线 |
| **ease** | 立方贝塞尔曲线，开始和结束时缓慢，中间加速。 |
| **easeIn** | 立方贝塞尔曲线，开始时缓慢，然后加速。 |
| **easeOut** | 立方贝塞尔曲线，开始时加速，然后减速。 |
| **easeInOut** | 立方贝塞尔曲线，开始和结束时缓慢，中间加速。 |
| **fastOutSlowIn** | 立方贝塞尔曲线，开始时快速，然后减速。 |
| **bounceIn** | 振荡曲线，幅度逐渐增大。 |
| **bounceOut** | 振荡曲线，幅度逐渐减小。 |
| **elasticIn** | 振荡曲线，幅度逐渐增大，同时超出其边界。 |
| **elasticOut** | 振荡曲线，幅度逐渐减小，同时超出其边界。 |

### 3.3. AnimationController-动画控制器

用于 **控制动画的播放、状态和进度**，继承于 **Animation** ，常用属性：

* **value** → T，当前动画的值。
* **duration** → Duration，动画的持续时间。
* **reverseDuration** → Duration，动画反向播放的持续时间。
* **lowerBound** → double，动画的最小值，默认为0.0。
* **upperBound** → double，动画的最大值，默认为1.0。
* **status** → AnimationStatus，动画的当前状态。
* **velocity** → double，动画值每秒的变化率。
* **isAnimating** → bool，动画是否正在播放。
* **lastElapsedDuration** → Duration，动画开始到最近一次动画更新经过的时间。

常用方法：

* **forward**({ double? from })：从当前值或指定值开始向前播放动画。
* **reverse**({ double? from })：从当前值或指定值开始反向播放动画。
* **animateTo**(double target, { Duration? duration, Curve curve = Curves.linear })：将动画从当前值驱动到目标值。
* **animateBack**(double target, { Duration? duration, Curve curve = Curves.linear })：将动画从当前值反向驱动到目标值。
* **repeat**({ double? min, double? max, bool reverse = false, Duration? period })：重复播放动画，可以指定最小值、最大值、是否反向和周期。
* **fling**({ double velocity = 1.0, SpringDescription? springDescription, AnimationBehavior? animationBehavior })：使用弹簧模拟驱动动画(阻尼效果)。
* **animateWith**(Simulation simulation)：根据给定的模拟驱动动画。
* **stop**({ bool canceled = true })：停止动画。
* **dispose**()：释放动画控制器使用的资源。
* **reset**()：将控制器的值设置为 lowerBound，停止动画并重置到起点或解散状态。
* **resync**(TickerProvider vsync)：使用新的 TickerProvider 重新创建 Ticker。

### 3.4. Tween-补间动画

**Animatable** 的子类，用于在动画中插入两个值(**begin** & **end**)，并在动画生命周期内生成一系列值。常用方法：

* **transform**(double t)：抽象方法，子类实现，根据传入的动画时钟值t (动画过程变化的值，通常是0.0-1.0 之间) 返回计算后的插值值。
* **evaluate**(Animation animation)：使用动画的当前值来计算插值值，通过调用 transform() 来实现。
* **animate()** ：将 Tween 对线应用到 Animation 对象上，生成插值值。
* **chain()** ：将多个 Tween 对象链接在一起，使得 Animation 对象可以依次使用它们生成插值值。

## 4. 🌰 写下例子

### 4.1. 实现Widget缩放动画

接着写下例子，循序渐进了解这个4个核心API的作用，先整个Container从小变大的动画吧：

```dart
class AnimatedBox extends StatefulWidget {
  const AnimatedBox({super.key});

  @override
  State createState() => _AnimatedBoxState();
}

// 💡 混入 SingleTickerProviderStateMixin 以获取 vsync
class _AnimatedBoxState extends State<AnimatedBox> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    // 💡 初始化 AnimationController，设置动画时长为2秒
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    // 💡 初始化 Tween 补间动画，设置起始值为0，结束值为300，添加值变化监听，setState() 刷新UI
    _animation = Tween(begin: 0.0, end: 200.0).animate(_controller)..addListener(() {
      setState(() {});
    });
    // 启动动画(正向执行)
    _controller.forward();
  }

  @override
  void dispose() {
    // 💡 释放 AnimationController
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 💡 通过 Animation.value 获取当前动画值，设置宽高
    return Container(
      width: _animation.value,
      height: _animation.value,
      color: Colors.blue,
    );
  }
}
```

**运行看下效果**：

### 4.2. 开启无限循环

🤔 em... 动画只执行一次就停止了，怎么让它无限循环呢？一个简单的粗暴的方法：添加动画状态监听，在动画结束后，重置动画，然后重新启动动画：

```dart
_animation.addStatusListener((status) {
  // 💡 监听动画结束后，重置动画，并重新启动
  if (status == AnimationStatus.completed) {
    _controller.reset();
    _controller.forward();
  }
});
```

**运行效果如下**：

### 4.3. 循环变大变小

🤔 em... 实现下 **从小变大又从大变小** 呢？修改下动画状态监听，正向结束反向执行，反向结束正向执行：

```dart
  _animation.addStatusListener((status) {
    // 💡 动画正向执行结束后，反向执行, 反向执行结束后，正向执行
    if (status == AnimationStatus.completed) {
      _controller.reverse();
    } else if (status == AnimationStatus.dismissed) {
      _controller.forward();
    }
  });
```

**运行效果如下**：

😏 其实，实现上面的效果，只需要调用一句 **_controller.repeat(reverse: true);** 来启动动画即可。

### 4.4. 修改动画曲线

从动画效果不难看出 **Tween** 默认的 **动画曲线** 是线性的，即动画的值会以恒定的速度从起始值变化到结束值。接着试下把动画曲线改为 **CurvedAnimation**，并将其设置为 **Curves.easeInOut** → 中间快，开始和结束慢：

```dart
_animation = Tween(begin: 0.0, end: 200.0).animate(
    CurvedAnimation(parent: _controller, curve: Curves.easeInOut)
);
```

**运行效果如下**：

😄 感觉这个动画曲线不够好玩，继承 **Curve**，重写 **transform()** 实现一个 **阻尼效果** 吧：

```dart
class DampingCurve extends Curve {
  @override
  double transform(double t) {
    // 💡 实现阻尼效果的曲线逻辑
    return (1 - (1 - t) * (1 - t));
  }
}

// 调用处：
_animation = Tween(begin: 0.0, end: 200.0).animate(
    CurvedAnimation(parent: _controller, curve: DampingCurve())
);
```

**运行效果如下**：

### 4.5. 多种动画并行

😄 单纯的变大变小还不够，再加个旋转试试？

```dart
class _AnimatedBoxState extends State<AnimatedBox> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _sizeAnimation;
  late Animation<double> _rotationAnimation;

  @override
  void initState() {
    super.initState();
    // 💡 初始化 AnimationController，设置动画时长为2秒
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    // 💡 大小变化动画
    _sizeAnimation = Tween(begin: 0.0, end: 200.0).animate(CurvedAnimation(parent: _controller, curve: DampingCurve()))
      ..addListener(() {
        setState(() {});
      });
    // 💡 旋转变化动画
    _rotationAnimation = Tween(begin: 0.0, end: 2 * pi).animate(_controller)
      ..addListener(() {
        setState(() {});
      });
    // 💡 启动动画
    _controller.repeat(reverse: true);
  }

  @override
  void dispose() {
    // 💡 释放 AnimationController
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: _rotationAnimation.value,
      child: Container(
        width: _sizeAnimation.value,
        height: _sizeAnimation.value,
        color: Colors.blue,
      ),
    );
  }
}
```

**运行效果如下：**

😁 有点意思，要不再加个 **从底下往上抛的动画**？在添加之前，问读者一个问题：

> 觉不觉得每新增一个动画，都要写一遍 addListener(() { setState(() {}); }) 有些麻烦？

😏 这个，可以用 Flutter 提供的动画便捷构建工具 → **AnimatedBuilder** 来解决，它允许我们将动画与UI逻辑分离，从而简化代码并提高可读性。加上上抛动画的代码如下：

```dart
// 💡 分别定义缩放、旋转、上抛动画
late Animation<double> _sizeAnimation;
late Animation<double> _rotationAnimation;
late Animation<Offset> _parabolicAnimation;

// 💡 初始化动画，此时不需要再 addListener(() { setState(() {}); })
 _sizeAnimation = Tween(begin: 0.0, end: 200.0).animate(CurvedAnimation(parent: _controller, curve: DampingCurve()));
_rotationAnimation = Tween(begin: 0.0, end: 2 * pi).animate(_controller);
_parabolicAnimation = Tween<Offset>(begin: const Offset(0, 300), end: const Offset(0, -200))
    .animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

// 💡 AnimatedBuilder 只会再动画更新是重建其子树
@override
Widget build(BuildContext context) {
  return AnimatedBuilder(animation: _controller, builder: (context, child) {
    return Transform.translate(
      offset: _parabolicAnimation.value,
      child: Transform.rotate(
        angle: _rotationAnimation.value,
        child: Container(
          width: _sizeAnimation.value,
          height: _sizeAnimation.value,
          color: Colors.blue,
        ),
      ),
    );
  });
}
```

**运行效果如下**：

😄 还可以结合 **Interval** 定义 **动画在整个持续时间内的特定时间段** 来实现 **交织动画** (Stagger Animation)。比如实现这样的效果：缩放动画持续运行、旋转动画在前半段时间内运行、位移动画在后半段时间内运行：

```dart
// 💡 缩放动画全程运行
_sizeAnimation = Tween(begin: 0.0, end: 200.0).animate(CurvedAnimation(
  parent: _controller,
  curve: const Interval(0.0, 1.0, curve: DampingCurve()),
));
// 💡 旋转动画在前半段时间运行，即0-1s
_rotationAnimation = Tween(begin: 0.0, end: 2 * pi).animate(CurvedAnimation(
  parent: _controller,
  curve: const Interval(0.0, 0.5, curve: Curves.linear),
));
// 💡 位移动画在前半段时间运行，即1-2s
_parabolicAnimation =
    Tween<Offset>(begin: const Offset(0, 200), end: const Offset(0, -200)).animate(CurvedAnimation(
  parent: _controller,
  curve: const Interval(0.5, 1.0, curve: Curves.easeInOut),
));
```

**运行效果如下**：

🤷‍♀️ 当然，如果不想用 **Interval** 和 **Tween** 来精确控制每个动画的时间段，也可以为每个动画单独定义一个 **AnimationController** 进行管理。**AnimatedBuilder** 的 **animation** 这样传下动画控制器实例就好：

```dart
AnimatedBuilder(animation: Listenable.merge([_sizeController, _rotationController, _parabolicController])
```

不过，当其中 **任意一个AnimationController发生变化**，**AnimatedBuilder** 都会重新构建其子树，在某些场景，为了避免不必要的刷新，可以将不同的动画分离到不同的 **AnimatedBuilder** 中。

## 5. 其它 API

### 5.1. Ticker

* Flutter 中用于 **驱动动画** 的一个类，它会在每一帧调用一个回调函数，从而实现 **动画的逐帧更新**。
* 创建 **AnimationController** 是需要传递一个 **vsync** 参数，它接受一个 **TickerProvider** 类型的对象，它的主要职责是创建 **Ticker**。通常会将 **SingleTickerProviderStateMixin** 添加到 **State** 的定义中，然后将 **State** 对象作为 **vsync** 参数的值。提供 **单个Ticker** 用 **SingleTickerProviderStateMixin**，提供 **多个Ticker** 用 **TickerProviderStateMixin**。
* Flutter 应用在启动时会绑定一个 **SchedulerBinding** 来给 **每一次屏幕刷新添加回调**，Ticker 通过它注册了**帧回调**。相比起直接用 **Timer** 来驱动动画，它可以防止屏幕外 (手机锁屏或应用切到后台) 继续消耗资源。

### 5.2. AnimationStatus-动画状态

用于表示动画的当前状态的 **枚举类**，包含以下四个枚举值：

* **dismissed**：动画处于起始状态，且未开始播放。
* **forward**: 动画正在从起始状态向结束状态播放。
* **reverse**: 动画正在从结束状态向起始状态播放。
* **completed**: 动画已到达结束状态。

### 5.3. lerp 函数

**线性插值**（Linear Interpolation）的缩写，用于在两个值之间进行插值，生成平滑的过渡效果。Flutter 中给有可能做动画的状态属性都定义了 **静态的lerp()方法**，如：

```dart
// a 为起始颜色，b 为终止颜色，t 为当前动画的进度 [0,1]
Color.lerp(a, b, t);
// 矩形
Rect.lerp(a, b, t);
// 大小
Size.lerp(a, b, t);
// 偏移
Offset.lerp(a, b, t);
// 对齐方式
Alignment.lerp(a, b, t);
// 文本样式
TextStyle.lerp(a, b, t);
// 边框半径
BorderRadius.lerp(a, b, t);
// a起始边框，b 为终止边框
Border.lerp(a, b, t);
// 盒子约束 (最大最小宽高)
BoxConstraints.lerp(a, b, t);
// 边距
EdgeInsets.lerp(a, b, t);
// 矩阵
Matrix4.lerp(a, b, t);
// 半径
Radius.lerp(a, b, t);
// 形状边框
ShapeBorder.lerp(a, b, t);
```

计算公式一般遵循：**返回值 = a + (b - a) ** t** 。写个简单的颜色插值的简单示例：

```dart
class ColorLerpExample extends StatefulWidget {
  @override
  _ColorLerpExampleState createState() => _ColorLerpExampleState();
}

class _ColorLerpExampleState extends State<ColorLerpExample> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        // 💡 使用 Color.lerp() 方法在红色和蓝色之间进行插值
        Color color = Color.lerp(Colors.red, Colors.blue, _controller.value)!;
        return Container(
          color: color,
          width: 100,
          height: 100,
        );
      },
    );
  }
}

void main() {
  runApp(MaterialApp(
    home: Scaffold(
      body: Center(
        child: ColorLerpExample(),
      ),
    ),
  ));
}
```

**运行效果如下**：

当然，也可以直接利用 **AnimationController#drive()** + **ColorTween** 来实现颜色插值：

```dart
_colorAnimation = _controller.drive(
  ColorTween(
    begin: Colors.red,
    end: Colors.blue,
  ),
);
```

点开 **ColorTween** 源码内部，其实还是调用的 **Color.lerp()** ：

### 5.4. 显/隐式动画

**显式动画** 对应 **AnimatedWidget**，**隐式动画** 对应 **ImplicitlyAnimatedWidget**，前者：

> 需要显式传递一个 **Listenable** (通常是 **Animation**)，手动管理 **AnimationController** 的生命周期。但也更灵活，可以使用 **Tween** 或 **Curve** 进行变换，适用于需要复杂动画控制的场景。设计它的初衷都是为了 **减少样板代码**，不需要在每次动画变化时 **手动调用setState()** ，简化动画处理。

**后者**：

> 会在内部创建和管理 **AnimationController**，开发者只需设置 **目标值**、**持续时间** 和 **动画曲线**。

#### 5.4.1. **☀️AnimatedWidget 的子类们**

* **ListenableBuilder**：监听器构建器，用于监听某个对象的变化并重建界面。
* **AnimatedBuilder**：动画构建器，用于监听动画对象的变化并重建界面。
* **AlignTransition**：对齐动画。
* **DecoratedBoxTransition**：装饰动画。
* **DefaultTextStyleTransition**：默认文本样式动画。
* **PositionedTransition**：定位动画。
* **RelativePositionedTransition**：相对定位动画。
* **RotationTransition**：旋转动画。
* **ScaleTransition**：缩放动画。
* **SizeTransition**：大小动画。
* **SlideTransition**：滑动动画。
* **FadeTransition**：淡入淡出动画。
* **AnimatedModalBarrier**：模态屏障动画。

接着用 **AnimatedWidget** 的子类们实现🌰写个例子处的动画效果，问题来了：**缩放** 有 **ScaleTransition**，**旋转** 有 **RotationTransition**，那 **平移** 呢？ 没有，🤷‍♀️ 那就自己写一个了吧：

```dart
class TranslateTransition extends AnimatedWidget {
  // 💡 传入一个 Animation<Offset> 来控制平移效果
  const TranslateTransition({
    super.key,
    required this.offset,
    this.child,
  }) : super(listenable: offset);

  // 💡 控制平移偏移量的动画
  final Animation<Offset> offset;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    // 💡 将偏移动画的值应用到子组件上
    return Transform.translate(
      offset: offset.value,
      child: child,
    );
  }
}
```

**调用处代码**：

```dart
class _AnimatedBoxState extends State<AnimatedBox> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);
    _animation = _controller; // 默认动画曲线是线性的，有需要可以创建CurvedAnimation使用不同的动画曲线
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TranslateTransition(
      // 💡 创建一个 Tween 插值器，指定偏移动画的开始值和结束值，调用 animate() 转换为 Animation 对象
      offset: Tween<Offset>(
        begin:  const Offset(0, 300),
        end: const Offset(0, -200),
      ).animate(_animation),
      child: ScaleTransition(
        scale: _animation,
        child: RotationTransition(
          turns: _animation,
          child: Container(
            color: Colors.blue,
            width: 300,
            height: 300,
          ),
        ),
      ),
    );
  }
}
```

😄 然后就实现了例子里同样的动画效果啦~

#### 5.4.2. 🌙 ImplicitlyAnimatedWidget 的子类们

* **TweenAnimationBuilder**：补间动画构建器，用于将任何由补间表达的属性动画化到指定的目标值。
* **AnimatedAlign**：对齐动画。
* **AnimatedContainer**：容器动画。
* **AnimatedDefaultTextStyle**：默认文本样式动画。
* **AnimatedScale**：缩放动画。
* **AnimatedRotation**：旋转动画。
* **AnimatedSlide**：滑动动画。
* **AnimatedOpacity**：透明度动画。
* **AnimatedPadding**：内边距动画。
* **AnimatedPhysicalModel**：物理模型动画。
* **AnimatedPositioned**：定位动画。
* **AnimatedPositionedDirectional**：方向定位动画。
* **AnimatedTheme**：主题动画。
* **AnimatedCrossFade**：交叉淡入淡出动画。
* **AnimatedSize**：大小动画。
* **AnimatedSwitcher**：切换动画，在多个子组件之间进行淡入淡出动画。

😄 **ImplicitlyAnimatedWidget** 的子类都是以 **Animated** 开头的啊，同样用它的子类们实现🌰写个例子处的动画效果，同样 **缩放** 有 **AnimatedScale**，**旋转** 有 **AnimatedRotation**，**平移** 得自己写🤷‍♀️：

```dart
class AnimatedTranslate extends ImplicitlyAnimatedWidget {
  const AnimatedTranslate({
    super.key,
    required this.offset,
    required super.duration,
    this.child,
  });

  final Offset offset;
  final Widget? child;

  @override
  AnimatedWidgetBaseState createState() => _AnimatedTranslateState();
}

class _AnimatedTranslateState extends AnimatedWidgetBaseState<AnimatedTranslate> {
  // 💡 用于平移的补间动画
  Tween<Offset>? _offsetTween;

  // 💡 重写此方法，遍历当前补间动画，检查是否需要创建新的补间动画或更新现有的补间动画，返回新的补间动画
  @override
  void forEachTween(TweenVisitor<dynamic> visitor) {
    _offsetTween = visitor(
      _offsetTween,
      widget.offset,
      (dynamic value) => Tween<Offset>(begin: value as Offset),
    ) as Tween<Offset>?;
  }

  @override
  Widget build(BuildContext context) {
    // 💡 根据 Animation<double> 对象的当前值，计算出对应的插值结果
    return Transform.translate(
      offset: _offsetTween?.evaluate(animation) ?? Offset.zero,
      child: widget.child,
    );
  }
}
```

然后 **隐式动画** 无法主动控制动画的开始和暂停，必须重建组件才能执行动画，是的，需要手动触发 **setState()** ❗️ 这里加个按钮点击触发动画值的变化，具体代码如下：

```dart
class _AnimatedBoxState extends State<AnimatedBox> with SingleTickerProviderStateMixin {
  final Duration _animationDuration = const Duration(seconds: 2); // 动画的持续时间
  double _animationValue = 0.0; // 动画的起始值
  Offset _offset = const Offset(0, 300);  // 平移的偏移量

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ElevatedButton(
          onPressed: () {
            setState(() {
              // 💡 点击按钮时，切换动画的起始值和平移的偏移量
              _animationValue = _animationValue == 0.0 ? 1.0 : 0.0;
              _offset = _offset == const Offset(0, 300) ? const Offset(0, 0) : const Offset(0, 300);
            });
          },
          child: const Text('开始动画'),
        ),
        const SizedBox(height: 20),
        AnimatedTranslate(
            offset: _offset,
            duration: _animationDuration,
            child: AnimatedScale(
              scale: _animationValue,
              duration: _animationDuration,
              child: AnimatedRotation(
                  turns: _animationValue,
                  duration: _animationDuration,
                  child: Container(
                    color: Colors.blue,
                    width: 300,
                    height: 300,
                  )),
            ))
      ],
    );
  }
}
```

**代码运行效果** (快速点击按钮还会切换动画的执行方向🤣)：

## 6. 有动画效果的组件

😊 限于篇幅，只做简单介绍，感兴趣的读者可自行编写Demo测试~

* **AnimatedIcon**：显示一个带有动画效果的图标。
* **CircularProgressIndicator**：显示一个圆形的进度指示器，表示任务正在进行中。
* **RefreshProgressIndicator**：显示一个圆形的刷新进度指示器，通常用于下拉刷新操作。
* **LinearProgressIndicator**：显示一个线性的进度条，表示任务的完成进度。
* **CupertinoActivityIndicator**：显示一个iOS风格的旋转加载指示器。
* **RefreshIndicator**：实现下拉刷新功能的组件，通常包裹在可滚动的列表外层。
* **Dismissible**：实现滑动删除功能的组件，通常用于列表项。
* **FlutterLogo**：显示Flutter的标志图标。
* **DrawerHeader**：显示在抽屉顶部的头部区域，通常用于显示用户信息或应用标题。
* **Stepper**：显示一个步骤指示器，通常用于多步骤的表单或流程。
* **ExpandIcon**：显示一个可展开或收起的图标，通常用于折叠面板。

## 7. 路由动画

😄 这个在上节**《二十二、玩转Flutter路由之——Navigator 1.0详解✈️》**已经说过了，就不赘述了~

## 8. Hero动画

用于 **在两个路由(页面) 切换时**，**平滑地移动一个共享的元素**，让用户感觉到两个页面间的 **视觉连续性**。它的实现依赖于 **Hero** 和 **Navigator**，当用户导航到新页面时，Hero 组件会在两个页面间创建一个动画过渡。玩法很简单，只需要在两个页面使用 **tag相同的Hero组件**，Flutter会自动生成过渡帧，使用代码示例如下：

```dart
class FirstPage extends StatelessWidget {
  const FirstPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('First Page')),
      body: Center(
        child: GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const SecondPage()),
            );
          },
          child: Hero(
            tag: 'hero-tag',
            child: Align(
              alignment: Alignment.topLeft,
              child: Container(
                width: 100,
                height: 100,
                color: Colors.blue,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class SecondPage extends StatelessWidget {
  const SecondPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Second Page')),
      body: Center(
        child: Hero(
          tag: 'hero-tag',
          child: Container(
            width: 100,
            height: 100,
            color: Colors.blue,
          ),
        ),
      ),
    );
  }
}
```

**运行效果如下**：

## 9. 物理模拟动画

物理模拟能够让应用富有真实感和更好的交互性，Flutter 中提供了一系列的 **Simulation** 类来帮帮助我们实现物理模拟动画效果，常用的 Simulation 类：

* **GravitySimulation**: 重力加速度。
* **FrictionSimulation**: 摩擦力。
* **SpringSimulation**: 弹簧振动。
* **BouncingScrollSimulation**: 滚动视图边界反弹。
* **ScrollSpringSimulation**：滚动视图的弹性滚动。
* **ClampingScrollSimulation**: 滚动视图的夹紧滚动。
* **ClampedSimulation**: 对另一个模拟应用限制，限制其输出的最小值和最大值。

😄 懒得想例子了，直接搬运下 [官网](https://docs.flutter.dev/cookbook/animation/physics-simulation) 给出的Demo：实现一个可拖动的卡片组件，用户拖动卡片并释放时，卡片会使用弹簧效果回到屏幕中心，具体代码如下：

```dart
import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';

void main() {
  runApp(const MaterialApp(home: PhysicsCardDragDemo()));
}

class PhysicsCardDragDemo extends StatelessWidget {
  const PhysicsCardDragDemo({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: const DraggableCard(
        child: FlutterLogo(
          size: 64,
        ),
      ),
    );
  }
}

// 一个支持拖拽，且松手后会回到中心位置的卡片
class DraggableCard extends StatefulWidget {
  const DraggableCard({required this.child, super.key});

  final Widget child;

  @override
  State<DraggableCard> createState() => _DraggableCardState();
}

class _DraggableCardState extends State<DraggableCard> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  Alignment _dragAlignment = Alignment.center; // 卡片的对齐方式
  late Animation<Alignment> _animation; // 动画

  void _runAnimation(Offset pixelsPerSecond, Size size) {
    // 创建一个动画，从当前位置移动到中心位置
    _animation = _controller.drive(
      AlignmentTween(
        begin: _dragAlignment,
        end: Alignment.center,
      ),
    );
    // 计算每秒的单位移动量
    final unitsPerSecondX = pixelsPerSecond.dx / size.width;
    final unitsPerSecondY = pixelsPerSecond.dy / size.height;
    final unitsPerSecond = Offset(unitsPerSecondX, unitsPerSecondY);
    final unitVelocity = unitsPerSecond.distance;
    // 定义弹簧动画的参数
    const spring = SpringDescription(
      mass: 30,
      stiffness: 1,
      damping: 1,
    );
    // 创建弹簧动画模拟
    final simulation = SpringSimulation(spring, 0, 1, -unitVelocity);
    // 使用弹簧动画来驱动控制器
    _controller.animateWith(simulation);
  }

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this);
    // 添加监听器，当动画值发生变化时，更新_dragAlignment的值，刷新UI
    _controller.addListener(() {
      setState(() {
        _dragAlignment = _animation.value;
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return GestureDetector(
      // 当用户按下时，停止动画
      onPanDown: (details) {
        _controller.stop();
      },
      // 当用户拖动时，更新卡片位置
      onPanUpdate: (details) {
        setState(() {
          _dragAlignment += Alignment(
            details.delta.dx / (size.width / 2),
            details.delta.dy / (size.height / 2),
          );
        });
      },
      // 当用户松手时运行弹簧动画
      onPanEnd: (details) {
        _runAnimation(details.velocity.pixelsPerSecond, size);
      },
      child: Align(
        alignment: _dragAlignment,
        child: Card(
          child: widget.child,
        ),
      ),
    );
  }
}
```

**代码运行效果**：

## 10. 小结

本节我们系统学习了Flutter中动画相关的API，算是对Flutter动画体系的整体有了一个基础的认识。相信你已经知道如何快速创建一个简单动画，以及控制动画的播放，但想要灵活自如运地使用动画，还需要大量的练习、实践与借鉴优秀作品~

**参考文献**：

* [《Flutter实战·第二版：Flutter动画简介》](https://book.flutterchina.club/chapter9/intro.html#_9-1-2-flutter%E4%B8%AD%E5%8A%A8%E7%94%BB%E6%8A%BD%E8%B1%A1)
* [《掘金小册：Flutter 跨平台开发实战》](https://juejin.cn/book/7178741001677176836 "https://juejin.cn/book/7178741001677176836")
* **《Flutter 工程化框架选择——搞定 Flutter 动画》**
* [《flutter 中的动画详解》](https://blog.csdn.net/u010755471/article/details/132314100)