---
title: "Flutter入门到精通（二十八）：UI实战：玩转自定义弹窗"
pubDate: 2024-01-29
description: "Flutter中三种弹窗实现方式详解，Dialog、BottomSheet、自定义Overlay。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第二十八篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

 公司项目「Flutter重构数据表单录入模块」的版本上线跑好一阵子了，截至目前没发现什么太大的问题。在摸🐟补 **Flutter基建 + 写新需求** 的同时，小组成员又盘算着 **重(lian)构(shou)** 另一个「网店模块」，其涉及到的内容要复杂多了，其中一个就是得搞很多 **自定义Widget**，特别是有着让很多初级开发崽 闻风丧胆😱的 📊**图表Widget**，需要对 **Flutter的绘制&动画** 有一定的了解。

😄 不过问题不大，**Futter动画的API** 之前就有涉猎了 → [《二十三、⚡️玩转Flutter动画[上]》]( "")，至于 **Flutter绘制** 后面的章节也会扒一扒。😁 本节的话，先来系统学习下 **Flutter弹窗**，🤷‍♀️ 因为组里给我分发了一个 **自定义筛选弹窗Widget** 的小任务，这玩意在 APP 里很常见，长这样 (截图源自咸鱼App)：

> 就 **一组** 类型的 **筛选项**，点击弹出对应 **筛选面板**，用户 **按需配置筛选条件**，弹窗关闭触发列表的 **条件查询**。

😑 整这个弹窗的时候踩了一些 **坑**，如：如何控制弹窗的显示位置？为什么在弹窗上弹窗反而显示在弹窗的底下❓

🤷‍♀️ 索性，本节来系统地扒一下 **Flutter** 中 **弹窗** 相关的知识点，通过 **理论+源码+实战** 的学习方式😁。本节学习路线图如下：

### 1.1. 例子：Flutter 中的各种内置弹窗

简单调研了一下，网上关于 **Flutter弹窗** 的方法有这些：

* **showDialog()** ：弹出一个对话框，一般搭配 **AlertDialog** (包含标题、内容和按钮) 使用 。
* **showGeneralDialog()** ：弹出自定义弹窗，可以完全控制对话框的外观和动画。
* **showCupertinoDialog()** ：iOS风格的对话框。
* **showAboutDialog()** ：显示应用的关于弹窗。
* **showTimePicker()** ：弹出时间选择器。
* **showDatePicker()** ：弹出日期选择器。
* **showSearch()** ：弹出搜索框。
* **showModalBottomSheet()** ：屏幕底部弹窗。
* **SnackBar#showSnackBar()** ：从屏幕底部显示一个短暂的消息提示。
* **showLicensePage()** ：显示应用的许可证页面。
* **showMenu()** ：在指定位置显示一个菜单。
* **PopupMenuButton**：弹出菜单按钮，点击后会在按钮下方显示一个菜单。
* **Tooltip**：当用户长按或悬停在某个元素上，显示一个简短的提示信息。
* **Overlay**：浮窗，可在不改变Widget树结构的情况下，添加悬浮在其它Widget上的内容。
* **Navigator+Route**：路由。
* **Stack**：堆叠布局。

😏 其实，从 **本质上** 来说，主要思路只有两种 → **Stack** 和 **Overlay**，其它方案都是基于 **Overlay(浮窗)** 进行的 **特定封装实现**。**Route-路由**，就不用说了吧，前面写的**《二十二、玩转Flutter路由之——Navigator 1.0详解✈️》**里就说了 → **导航跳转的界面** 是通过 **Overlay-浮窗** 来实现的。而上面的各种 **showXxx()** 实际都是调用 **Navigator.push()** 实现的 **弹窗**，等下扒源码你就知道了~

> 💡 特例：**SnackBar** 的显示和隐藏是由 **ScaffoldMessenger** (管Snacker队列和动画控制) 和 **Scaffold** (在界面上显示SnackBar) 共同管理的。

😊 顺手写了个简单的预览Demo【--->c28/d1/popup_preview.dart<---】方便读者查看上述弹窗的 **UI效果，拿来主义，** 碰到合适的弹窗效果，改改就能用：

😉 接着依次讲讲 **Stack**、**Overlay** 和 **Route** 如何实现自定义弹窗。

## 2. Stack-堆叠布局

😀 弹窗的 **最简单** 实现方式，**Stack** 组件允许你以 **堆叠** 的形式摆放子组件，**后者居上(后面的会盖住前面的)** ，有点像Android里的帧布局，它的主要属性如下：

* **alignment**：子组件的对齐方式，默认 AlignmentDirectional.topStart，即左上角对齐。
* **textDirection**：文本方向，用于确定 AlignmentDirectional 的方向。
* **fit**：子组件的大小调整方式，默认为 StackFit.loose，即子小部件根据其内容大小。
* **clipBehavior**：裁剪行为，默认为 Clip.hardEdge，即超出边界的部分会被裁剪。
* **children**：传递给父类的子组件列表。

一般搭配 **Align (对齐)** 和 **Positioned** (**定位**，相对于Stack边缘进行精确定位) 组件使用，简单代码示例【--->c28/d2/stack_use_demo.dart<---】

运行结果如下：

### 2.1. 组件：IndexedStack-索引堆叠

**Stack** 还有一个常用的子类 **IndexedStack (索引堆叠)** ，通过 **index** 属性来控制 **显示多个子组件中的哪一个**，它 **不能为负数** (默认值为0)，否则会导致 **RenderIndexedStack#childAtIndex()** ，简单代码示例【--->c28/d2/indexed_stack_use_demo.dart)<---】

### 2.2. 例子：IndexedStack 手搓筛选弹窗

😏 基于上面这个例子进行扩展，用 **IndexedStack** 简单实现下 **筛选菜单** 的效果，核心思路：

> 将 **显示内容部分的Widget** 和 **筛选弹窗Widget列表** 放到 **IndexedStack** 中，index为0的时候显示内容，其它值显示对应的弹窗Widget。

具体实现下【--->c28/d2/filter_menu_indexed_stack.dart<---】，先定义 **菜单栏配置** 和 **控制器** 类：

接着定义 **FilterMenuIndexedStack** 类，传入四个参数，State 中维护两个字段「 **_currentIndex**-当前展开的菜单索引」和「 **_stackIndex**-当前显示的IndexedStack索引」，两者 **相差1**：

再接着是 **动态生成菜单项** 的方法：

然后是生成 **菜单弹窗** 的方法 (限制最大高度，弹窗自适应，剩余空间填充黑色半透明)：

紧接着是 **build()** 方法，把它们都组合起来：

最后调用下 **FilterMenuIndexedStack** 组件【--->c28/d2/filter_menu_indexed_stack_test.dart<---】：

运行看看效果：

控制台输出：

😄 Amazing❗️非常简单，不过这种实现方式有个最大的局限 → **弹窗出来时看不到内容区域**，这个无解🤷‍♀️，内容区域和弹窗在同一个 **IndexedStack** 中，而 **IndexedStack** 的特性就是 **只显示一个**。😆 接着换成 **Stack**，自己手动来控制显示与隐藏。

### 2.3. 例子：Stack 手搓筛选弹窗

【--->c28/d2/filter_menu_stack.dart 和 filter_menu_stack_test.dart<---】

😊 先是 **菜单项配置** 和 **控制器**，改成直接传 **构建弹窗Widget的方法**，提供一个 **State** 的方法调用封装：

然后是 **State** 部分，这里的 **状态管理** 用的「 **ValueNotifier** + **ValueListenableBuilder**」，前者会持有一个值，并在该值发生变化时通知监听器，后者是一个 **Widget**，会监听一个 **ValueListenable** (如ValueNotifier) 的值变化，并在值变化时重建自身。😄 相比「**setState()** 」触发 **整个Widget的build()重建** 更加 **轻量**，可以减少不必要的重建，提高性能。

💡 记得重写自定义组件的 **dispose()** 方法，在其中调用 **ValueNotifier** 变量的 **dispose()** ，以防止不必要的 **内存泄露**：

其它的跟 **IndexedStack** 部分的代码非常相似，就不复述了，直接写调用代码，**initState()** 初始化：

排序弹窗：

输入弹窗：

运行效果如下：

### 2.4. BUG：键盘弹出导致页面溢出

😄 哈哈，这下子弹窗出现的时候也可以看到内容部分了，而在输入弹窗这里，我故意搞了一个很常见的 **BUG** →「**键盘弹出导致页面溢出**」，解法 →「**套个SingleChildScrollView**」

运行效果如下：

键盘弹出，页面会被顶上去 (😃非Dialog中的场景键盘会刚好在输入框下方)，如果不希望顶起页面，可在页面的 **Scaffold** 中添加 **resizeToAvoidBottomInset: false** 配置来禁止页面被顶起。修改后的运行效果：

😅 例子这里不顶起的话，会把输入框盖住，体验不是很好，具体选哪种，读者可在实际开发时自行斟酌。

🤔 用 Stack 来实现弹窗的最大优点就是 **简单**，不用自己算位置、不用担心 Overlay (浮窗) 上弹窗反而显示在底部的问题，当然，缺点是 **灵活性不太好**，哪里想弹哪里弹，写起来有点繁琐🙂。挺多人用的 [gzx_dropdown_menu](https://github.com/GanZhiXiong/gzx_dropdown_menu) 开源下拉筛选菜单库就是 **基于Stack** 实现的。

## 3. Overlay-浮窗

**Overlay** 继承 **StatefulWidget** 类，其对应的 **OverlayState** 类维护了一个 **OverlayEntry** 列表：

看下 **OverlayEntry** 的注释：

**Overlay** 使用 **Stack** 布局，每个 **浮层的容器** 都是一个 **Positioned**，然后 **OverlayEntry** 对应 **浮层UI**，利用 **Stack后者居上** 的特性实现 **浮窗效果**，然后在 **OverlayState#build()** 中遍历 **_entries列表**，通过 **_OverlayEntryWidget** 来完成 **OverlayEntry** 的实际绘制：

😊 理解完 **Overlay的基本原理**，用起就不会束手束脚了，随手写下简单示例【--->c28/d3/overlay_use_demo.dart<---】

运行效果如下：

打开 **Flutter Inspector**，看看此时的 **Widget树**，并没有看到 **Overlay** 组件的踪影：

😏 因为 **MaterialApp** 已经内置了 **Overlay**，真？想想 **Navigator**，实现路由跳转效果不就依赖的 **Overlay**？

**_entries列表** 是私有变量，没法直接 **print打印** 看这三个浮层都是什么，给 **insert()** 方法打下 **断点**：

前两个在**《二十二、玩转Flutter路由之——Navigator 1.0详解》**里有提到：

😄 所以依次是：**遮罩、当前页面、我们添加的浮层**，🤔 那如果是在我们的浮层上插入浮层呢？【--->c28/d3/overlay_insert_overlay.dart<---】

断点处：

🤷‍♀️ 行吧，**新浮层后者居上**，**宽高** 由 **builder函数** 返回的 **Widget大小** 决定，**位置** 则通过 **Positioned** 指定。

### 3.1. 问题：如何指定浮层的显示位置

😳 无它，只需三步：

> 拿到 **锚点Widget的尺寸和坐标**，自己算出 **x,y轴的偏移值**，**Positioned** 设置下。

获取尺寸和坐标的常用API：

```dart
// 通过context获取当前Widget的RenderObject，并转换为RenderBox，
// 它是具有具体尺寸和位置的渲染对象
final RenderBox renderBox = context.findRenderObject() as RenderBox;
final widgetSize = renderBox.size;

// 将 RenderBox 的局部坐标转换为全局坐标(渲染盒子的绝对位置)，Offset.zero 表示左上角
final position = renderBox.localToGlobal(Offset.zero);

// 获取屏幕尺寸
final screenSize = MediaQuery.of(context).size;
```

**获取context** 这个有些讲究，**BuildContext** 在之前的章节**《十八、进阶：🔍探探 BuildContext》**有讲过：

> **BuildContext ≈ Element ≈ Widget在Widget树上的位置引用**，**BuildContext** 实际上就是 **Element**，定义它的原因是为了 **防止开发者直接操作Element**。💡 使用小技巧：在 **异步操作里** 使用 **of(context)** 可以先 **提前获取** 再做 **异步操作**，这样可以尽量保证流程完整执行。另外，建议把 of(context) 相关的操作逻辑放到 **didChangeDependencies()** 中处理。

❗️ 只有获取 **准确的BuildContext** 才能获得 **正确的尺寸和坐标**，两种获取 **局部BuildContext** 的常规方法：

① **套Builder组件**：可在构建过程中获取当前的BuildContext

```dart
Builder(
  builder: (BuildContext context) {
    // 在这里可以使用context
    return Container();
  },
);
```

② **GlobalKey**：使用它可以在任何地方获取与之关联的Widget的BuildContext。

```dart
final GlobalKey myKey = GlobalKey();

// 在构建Widget时使用GlobalKey
Widget myWidget = Container(key: myKey);

// 通过GlobalKey获取BuildContext
BuildContext? context = myKey.currentContext;
```

🤷‍♀️ 当然，你还可以参考各种 **Xxx.of()** 的写法，自己进行遍历，查找文本匹配 Text 的代码示例：

```dart
Element? findTextElement(BuildContext context, String text) {
  Element? foundElement;
  context.visitChildElements((element) {
    if (element.widget is Text) {
      final textWidget = element.widget as Text;
      if (textWidget.data == text) {
        foundElement = element;
      }
    } else {
      foundElement = findTextElement(element, text);
    }
  });
  return foundElement;
}

// 调用处：
final textElement = findTextElement(context, '匹配文本');
if (textElement != null) {
  final textContext = textElement.findRenderObject()?.debugCreator?.element;
  if (textContext != null) {
    print('Found the BuildContext of the Text widget');
  } else {
    print('BuildContext not found');
  }
} else {
  print('Text widget not found');
}
```

### 3.2. 例子：简单的"米"字弹窗

😄 写个 **"米"** 字往不同方向弹浮层的代码示例【--->c28/d3/overlay_pop_demo.dart)<---】，先是构造不同位置的Button：

然后是 **弹出不同方向上浮层** 的方法：

**运行看看效果**：

### 3.3. BUG：左侧浮层定位不准

😮 应该有细心的同学发现了这个问题 → **左侧浮层的定位有问题**

😅 显示在左侧的浮层，需要 **减去浮层的宽度**，问题来了：**如何获得浮层的宽度**？直接 **findRenderObject()** 肯定是行不通的，因为此时 **RenderObject** 还未挂载。一种最简单的解决方式：

> 使用 **GlobalKey**，然后调 **WidgetsBinding.instance.addPostFrameCallback()** 在 **当前帧绘制完成(构建&布局)** 后通过 **key获取到组件的BuildContext**，获取 **RenderBox**，拿到组件宽度，计算出正确偏移，最后调用浮层实例的 **markNeedsBuild()** 标记需要重建，以达到更新位置的目的。

具体代码如下：

**运行看看效果**：

🤔 点击 **左** 弹出浮层偶尔会有 **突兀的左移**，可以理解，因为这里实际上执行的 **两次刷新**， 一种取巧做法：

> Offset的x,y 设置一个 **足够大的负值**，第一次刷新的时候在 **显示在屏幕外**，用户看不到就是没有二次刷新 🤣

**🤷‍♀️** 不优雅，但无解，至少我没想只刷新一次的方法，试了 Offstage、Opacity，以及 **《FlutterComponent最佳实践之Widget尺寸》**提到的 **自定义RenderProxyBox**、**Notifications** 等方式，都不行， 有一次刷新就能解决的方案也欢迎评论区告知。不过，读者也不用过于担心这个两次刷新，毕竟大多数时候 **局部Context** 的刷新并不会太消耗性能。

### 3.4. 组件：更简单的浮层定位方式

Flutter 提供了两个组件「**CompositedTransformTarget - 目标」** 和「**CompositedTransformFollower** - **跟随者**」 以帮助我们方便地实现「**跟随定位**」，😄 名字看着长，但用法却很简单：**用这两个组件套Widget** + **定义一个相同的 LayerLink** 即可。**CompositedTransformFollower** 的五个重要参数如下：

* **link**：**LayerLink**，用于将两者连接起来。
* **showWhenUnlinked**：bool，当 Follower 没有连接到 Target 时是否显示，默认true。
* **offset**：Follower 相对于 Target 的偏移量，默认 Offset.zero，表示没有偏移。
* **targetAnchor**：定义 Target 的锚点位置，默认 Alignment.topLeft ，表示目标的左上角。
* **followerAnchor**：定义 Follower 的锚点位置，默认 Alignment.topLeft ，表示跟随者的左上角。

😄 **后两个参数** 看着有点懵逼？点你两下就懂了，还是上面的"米"字弹窗：

* 左上：目标的左上，跟随者的右下；
* 上：目标的中上，跟随者的中下；
* 右上：目标的右上，跟随者的左下；

😆 弄清楚了就可以写代码了【--->c28/d3/overlay_pop_layer_link.dart<---】

构建按钮的代码：

**运行看看效果**：

🐂🍺，无需复杂计算，轻松实现"米"字弹窗，而且"左"按钮弹出的浮窗位置也是正确的，不需要我们二次刷新。😳 好奇怎么实现的，那就来简单扒下源码吧，在开扒前先复习下 **Flutter渲染管线** 的基本流程：

**WidgetsFlutterBinding** 初始化Flutter 应用入口：

① **构建阶段**-渲染三棵树🌳：

* **Widget** (组件) ：**Flutter UI 构建的基本单位**，开发者使用Widgets来构建UI，它们是 **不可变** 的，每当应用状态发生改变时，Flutter 会构建一个新的Widgets树。
* **Element** (元素) ：**Widget 在UI树中的实例**，Widgets树被编译成Element树，它们是 **持久** 的，即便Widgets树在状态变化时重新构建，Element 也可以保持不变。
* **RenderObject** (渲染对象) ：**负责实际的布局和绘制**，Element树中每个Element都可能对应一个RenderObject，它会根据Element的配置进行 布局和绘制。

② **布局阶段**

* **RenderObject.performLayout()** ：测量和定位每个 RenderObject。
* **RenderBox**：最常用的 RenderObject 子类，提供了布局和绘制的基本盒模型。

③ **绘制阶段**

* 每个 **RenderObject** 调用其 **paint()** 将 **绘制指令** 添加到 **PaintingContext**，通常是创建一个或多个 Layer。**RenderObject** 会根据需要创建特定的 **Layer**，并设置相应的绘制属性。

④ **合成阶段**

* **场景**：由多个层组成的，这些层一起定义了需要绘制的内容，它是整个绘制过程的最终输出，包含了所有需要在屏幕上显示的元素。对应 **SceneBuilder** 类，用于构建场景。
* **层**：场景的组成部分，每个层可以独立管理其绘制内容，可以包含子层，形成一个层次结构，它的存在存在使得 Flutter 可以高效地管理复杂的绘制操作。对应 **Layer** 类，它是所有层的父类，根据是否 **具备子节点** 划分为 **ContainerLayer** (像素合成操作) 和 **非ContainerLayer**(绘制、纹理)。
* **组织Layer**：Layer 间会形成父子关系，组成Layer树，顶层通常是一个 **RootLayer** (通常是OffsetLayer)，表示整个绘制区域。
* 1、从 **RootLayer** 开始，**递归调用** 每个 **Layer** 的 **addToScene()** 将自身的绘制指令添加到 **Scene** 中，并将 **SceneBuilder** 传递给 **子Layer**，每个 Layer 会返回一个对应的 **EngineLayer**，它是引擎中对于层的表示，Flutter 框架层并不直接操作它。
* 2、**SceneBuilder** 收集所有的绘制指令，调用各种方法如 **pushOffset(位移变换)** 、**addPicture(添加绘制图片)** 、**pushTransform(矩阵变化)** 等。当 **所有Layer** 都添加到 **SceneBuilder** 后，调用它的 **build()** 生成一个 **Scene** 对象。
* 3、最后，**Flutter框架** 调用 **window.render(scene)** 将构建好的 **Scene** 提交给 **Flutter引擎**，引擎解析其中的绘制指令调用 **图形引擎(如Skia)** 将其转化为底层图形API的调用，执行实际绘图操作，将内容绘制到屏幕上。

😄 对详细渲染过程感兴趣可自行查阅Gsy大佬的**《Flutter 画面渲染的全面解析》**，开始跟源码，😳 两者都继承 **SingleChildRenderObjectWidget**，**createRenderObject()** 看下用到的渲染核心类，分别是 **RenderLeaderLayer** 和 **RenderFollowerLayer**，看下 **paint()** 的核心代码：

```dart
// RenderLeaderLayer
// 💡 【LeaderLayer】是一个记录目标位置偏移的层，paint() 将它推送到绘制的上下文中。
@override
void paint(PaintingContext context, Offset offset) {
  if (child != null) {
    context.pushLayer(LeaderLayer(link: link, offset: offset), super.paint, offset);
  } else {
    context.pushLayer(LeaderLayer(link: link, offset: offset), (PaintingContext context, Offset offset) {}, offset);
  }
}

// RenderFollowerLayer
bool showWhenUnlinked;
Offset offset;
Alignment targetAnchor;
Alignment followerAnchor;

// 💡【FollowerLayer】也是一个层，跟随 LeaderLayer 的位置
// paint() 将其推送到绘制上下文中，并应用偏移和锚点对齐。
@override
void paint(PaintingContext context, Offset offset) {
  if (child != null) {
    context.pushLayer(
      FollowerLayer(
        link: link,
        showWhenUnlinked: showWhenUnlinked,
        offset: this.offset,
        targetAnchor: targetAnchor,
        followerAnchor: followerAnchor,
      ),
      super.paint,
      offset,
    );
  }
}
```

跟下这两个实现 "**跟随**" 效果的 **Layer** 类，先是记录 "**领导者**" 的位置和变换信息的 **LeaderLayer**：

```dart
class LeaderLayer extends ContainerLayer {
  LeaderLayer({ required this.link });

  final LayerLink link;

  @override
  void addToScene(SceneBuilder builder, [Offset layerOffset = Offset.zero]) {
    link.leader = this;
    super.addToScene(builder, layerOffset);
  }

  @override
  void remove() {
    link.leader = null;
    super.remove();
  }
}
```

然后是记录 "**跟随者**" 对象的 **FollowerLayer**，它会根据 LeaderLayer 的位置和变换信息来调整自己的位置和变换，从而实现跟随效果。

```dart
class FollowerLayer extends ContainerLayer {
  FollowerLayer({
    required this.link,
    this.showWhenUnlinked = true,
    this.unlinkedOffset = Offset.zero,
    this.linkedOffset = Offset.zero,
  });

  final LayerLink link;	// 💡 持有一个LeaderLayer对象
  final bool showWhenUnlinked;
  final Offset unlinkedOffset;
  final Offset linkedOffset;

  @override
  void addToScene(SceneBuilder builder, [Offset layerOffset = Offset.zero]) {
    // 💡 跟随者未连接，且 showWhenUnlinked为true，未连接时显示
    if (link.leader == null) {
      if (showWhenUnlinked) {
        // 将变换矩阵应用于Scene(场景)，它会修改后续绘图操作的坐标系统
        builder.pushTransform(Matrix4.translationValues(unlinkedOffset.dx, unlinkedOffset.dy, 0.0).storage);
        // 将当前Layer添加到场景中
        super.addToScene(builder, layerOffset);
        // 从当前堆栈中移除最近添加的变变换或剪辑区域，避免影响后续绘制内容
        builder.pop();
      }
    } else {
      // 💡 ① 从link.leader对象中获取最后的变换矩阵
      final Matrix4 transform = link.leader!.getLastTransform()!;
      // 💡 ② 应用平移变换 (前面算出的偏移)
      transform.translate(linkedOffset.dx, linkedOffset.dy);
      // 💡 ③ 将变换矩阵推入场景构建器builder中，
      // transform.storage是一个包含矩阵数据的Float64List
      builder.pushTransform(transform.storage);
      // 调用父类的方法将当前层添加到场景中
      super.addToScene(builder, layerOffset);
      // 弹出变换矩阵
      builder.pop();
    }
  }
}
```

🤏 行吧，一句话概括原理：**利用底层渲染层的变换，无需频繁重建Widget或进行复杂的状态管理**。

> 💡 **Tips**：Target 和 Follower 是一对多的关系，而一个跟随者只能有一个目标😊。

### 3.5. BUG：浮层上弹对话框反而显示到浮层下

😄 如题，写个简单的代码示例复现这个问题【--->c28/d3/overlay_pop_bug.dart<---】 运行效果如下：

在弹窗上调用 **showDialog()** 弹对话框，竟然显示在 **Overlay** 的下方了？？？打开 **Flutter Inspector** 看看Widget树，😳em... 看不出什么，弹多几个对话框，发现浮层依旧处于最后：

给 **OverlayState#insert()** 打了下断点，发现 **弹浮层** 会进，**弹对话框** 不会进。🤔 在**《二十二、玩转Flutter路由之——Navigator 1.0详解》**中我们有讲过 **MaterialApp** 使用了一个 **Navigator** 来管理路由堆栈，它的内部使用 **Overlay** 来实现显示路由页面。难道这里的问题难道跟 **Route** 有关？点开 **showDialog()** 的源码，**Navigator.of().push()** 映入眼帘：

**DialogRoute** 是一个具有 **Material** 设计风格的对话框路由，提供了默认的进入和退出动画、模态屏障颜色和行为，它的 **继承关系树** 如下：

* **RawDialogRoute**：通用对话框路由，允许自定义对话框的各个方面，如页面构建器、过渡动画等。
* **PopupRoute**：弹出式路由，用于显示对话框或弹出菜单，默认透明，并且可以保持状态。
* **ModalRoute**：覆盖整个导航器的模态路由，它可以阻止与之前路由间的交互，并提供模态屏障颜色、标签等属性。
* **TransitionRoute**：具有进出过渡动画的路由，它定义了动画控制器和过渡动画的构建方法。
* **OverlayRoute**：可以与Overlay交互的路由，它通过 **createOverlayEntries()** 方法创建 **OverlayEntry** 列表，并在 **install()** 中将这些条目添加到 **Overlay** 中。
* **Route**：路由顶级父类，抽象类，表示导航器管理的一个页面或屏幕，定义了页面的生命周期方法、如何**install()** 、**disposed()** 等。

😄 之前跟过代码了，**Navigator** 执行路由操作最终都会调 **_flushHistoryUpdates()** ，其中有这段代码：

**rearrangeOverlay**-浮层是否需要重排，默认为true，点进去 **Overlay#rearrange()** ：

**Debug** 窗口添加下相关变量的 **Watch**：

接着跟下 **_insertionIndex()** ：

👏 到此，问题发生的原因就水落石出了：

> **Navigator** 自己维护一个 **OverlayEntity列表**，在导航堆栈状态发生变化时，会调用 **Overlay#rearrange()** 进行 **浮层列表重排**：定义Set暂存_entries里的旧浮层，清空后添加 **新浮层列表** 里的所有浮层，旧浮层Set做下新浮层列表去重，调用 **_insertionIndex()** 计算 **旧浮层Set** 应该插入到 **新浮层列表** 的什么位置。这里的 **above** 和 **below** 参数都为空，返回列表的长度，即 **旧浮层Set** 插入到浮层列表的末尾，而 **Overlay后者居上** 的特性，**旧浮层** 反而显示在 **最上面**。

🤔 问题归因完，接着尝试下能否找到解决之法，突破口还是 **rearrange()** 方法的后两个参数：

> rearrange(Iterable<OverlayEntry> newEntries, { OverlayEntry? below, OverlayEntry? above })

它两可以决定 **旧浮层的插入位置**，先看 **Navigator**，只找到了这一个方法调用，这没法传参啊：

再看看 **Overlay**，浮层列表是 **私有变量**，而且没有提供外部能访问的方法：

🙃 难道真的没有解法吗？😏 莫慌，我有一计：

给弹出的浮层内容视图 **套一个Navigator**，**showDialog()** 传参 **useRootNavigator:false**，查找 **最近的 Navigator** 而不是根 Navigator。

改下代码【--->c28/d3/overlay_pop_bug_fix.dart<---】

运行看看效果：

此时的Widget树：

😆 行吧，虽然不太优雅，但还是解决了我们的问题，更好的方式应该是 **自定义Route** 来实现弹窗~

## 4. Route-路由

😃 **Navigator** 的源码和实现原理在**《二十二、玩转Flutter路由之——Navigator 1.0详解》**已经扒透了，拿它来自定义弹窗难度就不高了，核心思路：继承 **ModalRoute** 或其子类，重写 **buildPage()** 返回 **弹窗的页面内容**，按需自定义过渡动画、遮罩颜色等。

### 4.1. 例子：自定义ModalRoute实现简单弹窗

💡 自定义弹窗路由一般继承自 **ModalRoute** 而不是 **Route**，主要是因为它提供了更多的功能和灵活性，特别是对于需要自定义过渡动画、遮罩颜色、以及处理返回操作的场景。

继承 **ModalRoute** 类必须重写的属性和方法：

* **barrierColor**：遮罩颜色，通常用于模态路由，以突出显示前景内容并使背景变暗。
* **barrierDismissible**：遮罩是否可以通过点击来关闭。
* **barrierLabel**：无障碍访问提供的描述性字符串标签。
* **maintainState**：路由在不活动时是否保持其状态。
* **opaque**：定义路由是否不透明，true表示不透明将会覆盖所有内容。
* **transitionDuration**：路由过渡动画的持续时间。
* **buildPage** (content,animation,secondAnimation)：构建路由的页面内容，返回一个自定义Widget。animation 是主要过渡动画，如页面的缩放、平移、旋转等，secondAnimation 是次要过渡动画，如页面切换时的淡入淡出效果。

😄 写下简单代码示例【--->c28/d4/custom_pop_route_demo.dart<---】先是自定义Route：

调用处：

运行看看效果：

非常简单，接着写下自定义Route实现 **筛选弹窗** 的基本骨架~

### 4.2. 例子：Route 手搓筛选弹窗

源码【c28/d4/pop_menu_route.dart & pop_menu_route_demo.dart】

#### 4.2.1. 设置弹窗位置

😄 弹窗一般显示在触发弹窗的组件 (**锚点**) 正下方，宽度占满屏幕，直接给锚点组件搞个 **GlobalKey**，然后通过 **anchorKey.currentContext.findRenderObject()** 获得 **renderObject**，得到锚点组件的 **宽高和坐标**，然后就算偏移了。**Stack + Positioned** 实现定位？腻了，😀 换个组件 → **CustomSingleChildLayout**：

用于 **自定义单个子组件的布局 (位置&大小)** ，通过自定义 **布局代理(SingleChildLayoutDelegate)** 可以实现复杂的布局逻辑。用法简单：自定义 **SingleChildLayoutDelegate** 传递给 **CustomSingleChildLayout** 的 **delegate** 参数。

自定义 **SingleChildLayoutDelegate** 必须重写的三个方法：

* **getConstraintsForChild** (constraints)：对子组件的约束，返回 BoxConstraints 对象。
* **getPositionForChild** (size,childSize)：子组件的位置，返回 Offset 对象，指定子组件相对父组件的偏移。
* **shouldRelayout()** ：是否需要重新布局，当布局委托的状态发生变化时，返回true以触发重新布局。

直接传入一个计算好的Offset偏移：

自定义弹窗路由：

写一个调用方法：

调用出：

运行效果如下：

em... 弹窗是实现了，但和我们想要的UI效果不太一致：

🤔 **Route** 由两个浮层组成：**背景遮罩+页面内容**，遮罩的话只能设置单一的颜色，只能从页面内容入手了：

背景遮罩透明，页面内容：Column[有maxHeight的内容视图 + Expand占满剩余空间的半透明]

改下布局代码：

运行看看效果：

#### 4.2.2. 加点动画

😄 弹窗的出现和收起有点突兀，接着给它加点动画，先给内容视图加个尺寸变化的动画：

看看效果：

😳 半透明蒙层的突然出现和消失有点怪怪的，也给它加个透明度变化的动画吧：

看看效果：

👏 现在看起来就丝滑多了~

#### 4.2.3. 完善示例

😄 最后完善下例子，搞个列表弹窗，打开时传参，关闭时回传参数，拉接口：

最终运行效果如下：

😄 熟悉 **Route** 写起 **弹窗** 来是真的简单，而且还不用操心 **直接用Overlay** 弹出窗口显示在底部的问题，巴适~

## 5. 小结

🎉 到此，总算把 Flutter 中实现弹窗的三种核心方式讲完啦，读者喜欢哪一种呢？😏 我是无脑用 **Route** 的，毕竟自带弹窗基本用它，碰到喜欢的效果还能直接抄。在摸索过程中还发现了 **意外之喜**，之前都没发现 **Flutter DevTools** 里的 **Flutter Inspector** 有这几个东西：

详细用法和效果图，可以参见这篇文章：**《DevTools 必知必会系列 —— Flutter inspector》**，行吧，本节就到这，😳 经常有读者私聊我要本专栏的配套代码，索性搞个仓库：[cp_study_flutter_demo](https://github.com/配套示例源码)，后续相关的Demo都会Push上去，欢迎Star🌟，还有啥问题，欢迎评论区留言，谢谢🙏~

**参考文献**

* **《FlutterComponent最佳实践之Widget尺寸》**
* **《flutter 可自定义显示的下拉菜单筛选框》**