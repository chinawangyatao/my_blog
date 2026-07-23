---
title: "Flutter入门到精通（二十四）：Flutter布局原理探秘"
pubDate: 2024-01-25
description: "Flutter布局系统的底层原理，Constraints向下传递，Size向上传递。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第二十四篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

 刚学 **Flutter** 那会，由于对 **Widget** 的不太熟悉，在堆UI时，经常搞出这样的 **黄色斑马线 (溢出指示器)** ：

控制台也会输出具体的报错信息：

🤷‍♀️ 就：**右边溢出1.7个像素**，这是引起报错的代码：

```dart
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          const Text("标签："),
          Text("烫🔥" * 10),
        ],
      ),
    );
  }
}
```dart

🤔 在学习了更多 **Widget** 后，我知道了：给 **溢出的Text** 套个 **Expanded** 或 **Flexible** 就能解决这个问题：

至于为什么能解决？🤷‍♀️ 不好意思，不知道，反正有溢出套它两就对了，或者用 **Wrap** 代替 **Row**，太长显示不全，它会自动换行。

不甘止步于当一只 **Flutter**🥬🐶，为了更好地扮演 **UI崽**  这个角色，弄清楚 **Flutter布局背后的门道** 非常有必要。所以这节来了，一起来探索下 **Flutter之下的布局规则 & 原理**。

> 💡 **Tips**：这个黄色斑马线只在 **Debug** 时存在，**Release** 包是不会显示出来的 ❗️ 如果你在 **调试阶段** 也不想看到它，可以修改下源码 **debug_overflow_indicator.dart** → **_calculateOverflowRegions()** ，除了最后的**return regions;** 把其它代码都注释掉，溢出也不会绘制黄色斑马线啦。😄 不过，建议还是保留，调试阶段这玩意还是挺有用的~

另外，Android原生开发的App是可以在手机上直接查看 **布局边界** (开发者选项-显示布局边界) 的：

Flutter 也有这样的东西，在 **build()** 方法中设置 **debugPaintSizeEnabled = true** 就可以了：

**本节学习大纲如下**：

## 2. 约束类型

[《官方文档：Understanding constraints》](https://docs.flutter.dev/ui/layout/constraints)里有一句道出了 Flutter 布局过程的 **精髓**：

翻译解读：

> **从顶部向下传递「约束」，从底部向上传递「尺寸」，父级Widget决定「位置」。**

🤔 上面提到的 **约束** 指的是：**父Widget可以限定子Widget可拥有的最小和最大尺寸**。Flutter 中的约束通过 **Constraints** 类进行抽象，且只有两个子类：**BoxConstraints** (盒子约束) 和 **SliverConstraints** (滑动约束)，本节只讨论前者，看下 **BoxConstraints** 的源码：

除了这个 **常量构造函数** 外，还有 **五个命名构造函数**，根据注释描述可以分为三类：

😄 接着写下代码示例，帮助理解这三种约束，比如这样的代码：

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Animation Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Flutter Animation Demo'),
          backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        ),
        body: const HomePage(),
      ),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    // 宽高200的蓝色正方形，里面放一个宽高100的红色正方形
    return Container(
        width: 200,
        height: 200,
        color: Colors.blue,
        child: Container(
          width: 100,
          height: 100,
          color: Colors.red,
        ));
  }
}
```dart

😁 你觉得运行后的效果会是怎样？**蓝色大正方形在下，红色小正方形在上**？不好意思，只有红色大正方形：

是不是一脸懵逼，为啥设置的100**100木有生效？打开Flutter开发者调试工具-**Flutter Inspector**，分别看下两个**Container** 设置的约束：

🐶 好多constraints，其实，只需关注「**renderObject-渲染对象**」的三个属性：

* **constraints** → **父Widget传递的约束**。
* **additionalConstraints** → **额外的约束条件**，进一步约束 **renderObject** 的大小。
* **size** → **renderObject的最终大小**，在布局过程中计算出来的，必须满足前两者的限制条件。

好，接着看参数，第一个Container的 **父约束** 是 w[0-392.7],h[0-683.3]，注意是「**范围**」，**额外约束** 是 w200,h200，后者满足前者的约束条件，所以最终 **size** 为w200,h200。第二个Container 的 **父约束** 为w200,h200，注意是「**准确值**」，**额外约束** 为w100,h100，父约束优先级更高，所以最终 **size** 为w200,h200。

😄 **紧约束** 是 **准确值**，**松约束** 是 **范围**，那 **无约束** 呢？那自然是 **宽高无限制** (minWidth、maxWidth、minHeight、maxHeight 都是 double.infinity)，给第二个 Container 套个 **UnconstrainedBox**，再运行试试，看看此时的 **constraints** 属性：

没有了 **父约束**，**additionalConstraints** 多大，组件就是多大，真的吗？😄 把宽高改成250试试：

🤣 哈哈，无拘无束，直接溢出。🤔 套 **UnconstrainedBox** 组件可以让 **紧约束** 变成 **无约束**，那咋变成 **松约束** 呢？还是套 **Widget**，套：**Align**、**Flex**、**Column**、**Row**、**Wrap**、**Stack** 等组件都可以。比如，套个 Align：

😄 把 Container 宽高改为250，看看会不会溢出：

😊 不会溢出，实际的尺寸只有200。另外，还有一种「**新约束**」，就是 **子Widget** 不受 **父Widget** 约束影响，想宽高多少就多少，想位置在哪就在哪，可以通过 **CustomSingleChildLayout** 组件来实现。它需要提供一个 **delegate** 属性，类型为 **SingleChildLayoutDelegate** 的子类，用于定义布局逻辑。

```dart
// 自定义SingleChildLayoutDelegate
class MySingleChildLayoutDelegate extends SingleChildLayoutDelegate {
  @override
  BoxConstraints getConstraintsForChild(BoxConstraints constraints) =>
      BoxConstraints.tight(const Size(100, 100)); // 自定义子 widget 的约束

  @override
  Offset getPositionForChild(Size size, Size childSize) => const Offset(100, 100); // 自定义子 widget 的位置

  @override
  bool shouldRelayout(covariant SingleChildLayoutDelegate oldDelegate) => false; // 返回false表示当前的布局不需要重新计算或重新布局
}

// 调用处
@override
Widget build(BuildContext context) {
  return Container(
      width: 200,
      height: 200,
      color: Colors.blue,
      child: CustomSingleChildLayout(
        delegate: MySingleChildLayoutDelegate(),
        child: Container(
          color: Colors.red,
        ),
      ));
}
```dart

运行结果和布局层次如下：

😄 到此，我们知道了 **约束是会向下传递的**，但遵守的前提是它俩必须是 **直接的父子关系**。😏 所以，我们可以通过在它俩中间插一个Widget (**套一层**) 来将「**紧约束-固定值**」修改为「**松约束-范围**」、「**无约束-没值**」和「**新约束-不受父级约束影响**」。就：本来是A → B，B要遵守A的约束，现在插一层，变成了A → C → B。B要遵守C的约束，C要遵守A的约束，C接收到A的约束，处理下，然后再传给B，就可以实现约束的修改啦。

💁‍♂️ 另外，除了通过 **Flutter Inspector** 面板查看 **BoxConstraints** 外，还可以给Widget套个 **LayoutBuilder** 以获取父Widget施加的约束，它的 **builder** 回调的第二个参数 **constraints** 就是父级施加的盒约束。不过，没法对这个约束做任何处理，它会原封不动地向子级传递。

## 3. 大道至简-初窥布局流程

😄 写个最简单的例子，通过 **读源码** + **断点调试** 的方式弄清楚布局的具体流程：

```dart
void main() {
  runApp(Container(color: Colors.blue));
}
```dart

**Flutter Inspector** 看下布局层级：

**Container** 的 **constraints** 为null，它的子控件 **ColoredBox** 的 **renderObject** 的 **constraints** 却为 w392.7,h769.5，😳 哪来的？点开 **ColoredBox** 的源码：

继承 **SingleChildRenderObjectWidget** (创建只有一个子Widget的渲染对象)，重写 **createRenderObject()** 返回一个 **_RenderColoredBox** 实例，点开源码：

🤔 em... 就是根据 **size** 绘制矩形，说明在此之前size已经初始化了，而在 **_RenderColoredBox** 中没找着给 **size** 赋值的代码，那必定是在父类里赋值了，跟下代码，发现它是在 **RenderBox** 类中定义的：

给 **setsize()** 打下断点，跟下具体的代码调用流程：

从 **RenderView#performLayout()** 开始跟起，它是 **渲染树的根节点(顶层渲染对象**，所有 **RenderObject的起点**，负责管理窗口的尺寸和绘制内容。

这里是有 **child** 的，所以走的 **RenderBox#layout()** → **RenderObject#layout()** ，然后调的：

接着又是 **RenderBox#layout()** → **RenderObject#layout()** ，再接着：

最后到 **RenderBox#set size()** 赋值。梳理下方法调用流程，画个图，帮助理解：

🤔 大概能归纳出布局的流程：

**父级渲染对象** 布局会触发 **子级渲染对象** 的布局，一般是 **父performLayout()** 调 **子layout()** ，通过 **参数** 传递 **父约束constraints**，在 **子layout()** 后返回 **子size**。在布局时，还会判断 **有无child** 执行不同的计算逻辑来求 **s子size。**

## 4. 回头望月-溢出例子归因

😏 弄清楚布局的大概流程，接着回头看下引言处的例子，分析溢出的原因，先是 **Row**，它继承自 **Flex**：

😄 哈？就是 **direction** 固定为 **Axis.horizontal**，专门 **用于水平排列子组件** 的 **Flex**，点开它的源码：

看下它的创建 **RenderObject(渲染对象)** 的方法：

点开 **RenderFlex#performLayout()** ，调用 **_computeSizes()** 计算子元素的尺寸：

### 4.1. 为什么是溢出1.7个像素？

跟下源码，看下具体是怎么算的：

😄 代码看着逻辑复杂，实则不然，总结下关键逻辑：

* **遍历子元素**：检查 **flex** 值，大于0累加到 **totalFlex** (子元素的总flex值)，为0，计算子元素尺寸并累加到 **allocatedSize** (主轴已分配尺寸)，同时更新 **crossSize** (交叉轴上的尺寸，取最大值)。
* **计算主轴剩余空间-freeSpace** ，**totalFlex** 大于0，说明存在 **弹性子元素**，计算 **每个flex单位** 的空间 **spacePerFlex** = **freeSpace** / **totalFlex**。
* **再次遍历子元素**，只对弹性子元素做处理(flex>0)，计算 **子元素尺寸-maxChildExtent** 并累加到 **allocatedFlexSpace** (已分配的弹性空间)，同时更新 **crossSize**。
* **确定最终尺寸**：如果 **canFlex**-可以进行弹性布局，且 **mainAxisSize == MainAxisSize.max** (主轴空间应尽可能占满)，那最终尺寸 **idealSize** 为 **maxMainSize**-主轴可用最大尺寸，否则为 **allocatedSize**。
* **返回计算结果**：返回一个 **_LayoutSizes** 对象，包含主轴尺寸、交叉轴尺寸和已分配的尺寸。

😁 简单点说就是：

> 遍历所有子元素算一遍，得出 flex值 + 剩余空间，然后遍历 **弹性子元素**(flex>0) 进行布局，最终算出主轴尺寸、交叉轴尺寸，以及已分配的尺寸返回。

看到这里，读者可能会问：

> 怎么没看到调用子元素的 **layout()** 方法来布局？😄 **→ layoutChild()_computeSizes()** 直接把 **ChildLayoutHelper#layoutChild()** 当做参数传过来了，里面调了 **child.layout()** ：

好，接着在这里打下断点，看下每个子元素计算出来的尺寸：

先是第一个Text，显示"标签"：

记着是第二个溢出的Text：

😮 宽度为319.7，加上之前的42.7，直接362.4 → **主轴已分配尺寸**，拿它去减 **主轴可用最大尺寸360.7**，**溢出** 了**1.7** 个像素。回到 **_computeSizes()** 的调用处 **RenderFlex#performLayout()** 继续往下走，可以看到把 **溢出值** 设置给了 **_overflow** 变量：

搜索下变量，发现定义了一个 **_hasOverflow** 的 get 方法：

搜下 **_hasOverflow**，在 **paint()** 方法中找到了它的身影 (布局过程或其它情况调了 **markNeedsPaint()** ，在下一帧渲染时，Flutter 会调用 paint() 来绘制该渲染对象及其子元素)：

最终调用 **paintOverflowIndicator()** ，其中会调用 **_calculateOverflowRegions()** 来绘制 **溢出指示器**。

### 4.2. 为什么套 Expanded 或 Flexible 就不会溢出？

😄 弄清楚为啥是溢出1.7个像素，还有绘制溢出指示器的流程，接下来扒下为啥套 **Expanded** 或 **Flexible** 后 **Text** 就不会溢出。先跟下前者，给溢出的Text套上 **Expanded**，还是上面的断点，然后发现只有第一个Text会走，那就是 **flex > 0**，有 **弹性子元素**。再更下面的代码打断点：

吼，**Expanded** 的 **flex** 为 1，然后 **_getFit(child)** 返回的值为1，对应 **FlexFit.tight**：

把 **子元素的最大尺寸赋值给最小尺寸**，继续往下走，创建了 **子元素约束**：

最后看下返回的 **_LayoutSizes** 对象：

**allocatedSize** 和 **actualSize** 相等， **_overflow** 自然为0，所以 **不会绘制溢出指示器**。🤔 em... 好像并没有消除我们的疑问啊，换个方向，从 **Expanded** 着手，点开源码：

😳 啊？**Expanded** 继承 **Flexible**，只有 **fit** 不一样，然后 **Flexible** 又继承了 **ParentDataWidget**，看注释可以知道它的大概作用：**给 RenderObject 的 parentData 提供数据**。给这个 **applyParentData()** 打下断点，看下方法调用流程：

最终调用 **Flexible#applyParentData()** ，获取 **父级渲染对象** 调用 **markNeedsLayout()** 标记需要 **重新布局** (重新计算子节点的位置和大小)。🤔 所以是在布局前，就把 **flex=1** 和 **fit=FlexFit.tight** 塞到 **ParentData** 中了？还是 **_computeSizes()** 打下断点，留意 **childParentData** 的值：

第一个Text：

flex和fit都是null，然后是第二个Text：

💁‍♂️ 行吧，很清晰了，总结下套 Expanded 或 Flexible 就不会溢出的原因：

* **Expand** 和 **Flexible** 的父类是 **ParentDataWidget**，在 **child** 的 **renderObject** 添加到 **渲染树** 时会调用 **applyParentData()** 更新 **渲染对象** 的 **parentData** 属性(存储布局 **child** 时所需的数据)。
* **RenderFlex#performLayout()** 调 **_computeSizes()** 时，会先获取 **渲染对象** 的 **parentData**，再对子元素进行布局。
* 前面 **Expand#applyParentData()** 把 **parentData** 的 **flex** 设置为1、**fit** 设置为 FlexFit.tight，对应生成的约束 **innerConstraints** 在主轴方向为 **紧约束**，比如上面的 **w(宽度)** 就固定为 **318.0**。
* **Text** 有了一个 **宽度的紧约束**，当内容超过这个宽度，它会尝试 **自动换行** (如果softWrap为true)。

### 4.3. 延展学习

😄 在跟源码的过程中，我们遇到了很多 **陌生的类**，稍微停一停，**温故知新**，先是 **Flutter渲染三棵树🌳**：

* **Widget**：**对视图结构的描述**，存储视图渲染相关的 **配置信息**，如：布局、渲染属性、事件响应等。
* **Element**：**Widget的实例化对象**，承载视图构建的上下文数据，连接Widget到完成最终 **渲染** 的 **桥梁**。
* **RenderObject** → **负责实现视图渲染的对象**。

然后是 **Flutter Widget 的继承关系**：

每个 **Widget** 都有一个 **createElement()** 方法，用于创建与之对应的 **Element对象**。创建后，Flutter 框架会调用 **Element对象** 的 **mount()** 将其插入到元素树中。然后是 **Element** 的继承关系：

😄 哈哈，和 **Widget的继承关系** 非常相近。**Element#mount()** 挂载时，如果它是一个 **RenderObjectElement**，它会调用 **attachRenderObject()** ，并在其中调用 **createRenderObject()** 和 **attachRenderObject()** 创建和附加 **实际的渲染对象**。

😁 **RenderObject** 是渲染库实现的核心，它定义了渲染对象的基本行为和属性，提供一个 **parentData** 属性用于 **存储父级设置的数据**，然后是它的常见方法：

* **setupParentData()** ：在对象被添加到父级对象时调用，以便父级存储子对象的特定数据。
* **markNeedsLayout()** ：标记该对象需要 **重新布局**，调用此方法会使对象及其子树在下一帧中重新布局。
* **markNeedsPaint()** ：标记该对象需要 **重绘**，将对象添加到需要重绘的对象列表中，并在下一帧进行重绘。
* **🌟performLayout()** ：**具体的布局实现**，根据传入的约束（constraints）计算并设置自身的尺寸和位置。每个具体的 RenderObject 子类都需要实现这个方法，以便根据其特定布局需求来安排子节点。
* **🌟layout()** ：**触发布局过程的入口**，通常会检查是否需要重新布局，然后根据需要调用 **当前渲染对象** 的**performLayout()** 来执行实际的布局逻辑，此外，它还处理一些布局前后的准备和清理操作。
* **performResize()** ：只调整自身尺寸，不涉及子节点的布局，通常在 **RenderBox** 类中被重写。
* **paint()** ：实现具体的绘制逻辑，负责将渲染对象绘制到屏幕上，它接收一个 **PaintingContext** 和一个 **Offset** 作为参数，用于在指定的上下文和偏移位置进行绘制。
* **get paintBounds**：返回渲染对象要绘制的边界。

😊 既然提到了 **RenderObject**，也顺带提下它非常重要的子类 → **RenderBox**

> 用于描述一个在二维平面上的对象，并且为它增加一些专门用于盒子布局的功能。

提供一个 **size** 属性表示其 **宽高**，盒子左上角位于(0,0)，盒子右上角位于(width,height)，并使用 **BoxConstraints** 对象来描述布局约束。

## 5. 更进一步-单子 & 多子布局

### 5.1. Align 组件的布局流程

**单子Widget** 以 **Align** 为例，点开源码：

继承 **SingleChildRenderObjectWidget**，然后提供了三个属性：**alignment** 就不用说了，对齐方式，后面两个则是 **宽高分度值(double类型)** ，就是 **Align** 的尺寸为 **子级尺寸** 的若干倍，如：子级的宽度为100，widthFactor为1.5，那么 **Align的宽度** = 100x1.5=150。(当然，还要考虑Align父级的约束)。直接定位 **createRenderObject()** ：

它的渲染对象是 **RenderPositionedBox**，直接跟 **performLayout()** ：

跟下 **alignChild()** 看下具体是怎么对齐子级的：

😏 写个简单的 **Demo**，然后打下断点看看值：

计算出 **offset** 为 **(146.4,334.7)** ，🤔 然后在哪读这个 **parentData** 呢？**RenderPositionedBox** 没看到，跟下它的父类：**RenderAligningShiftedBox** → **RenderShiftedBox**，在 **paint()** 方法找到了它的身影：

断点可以看到前面设置的 **offset偏移**：

😊 嗯，在 **绘制** 的时候应用前面布局算出的 **偏移** ~

### 5.2. Wrap 组件布局流程

**多子Widget** 以 **Wrap** 为例，打开源码：

继承 **MultiChildRenderObjectWidget**，直接定位 **createRenderObject()** ：

它的渲染对象是 **RenderWrap**，直接跟 **performLayout()** ：

😄 代码有点长，同样梳理下关键逻辑，为了便于读者理解，跳过反转相关的代码：

* **获取首个子节点**，如果没获取到，**size** 设置为 **最小约束** (宽高都为0)，直接return。
* **根据主轴方向**，将当前约束的 **maxWidth(水平)** 或 **maxHeight(垂直)** 赋值给 **子约束**。
* **遍历子节点**，调用其 **layout()** 计算出 **子节点的size**，提取它在 **主轴和交叉轴的长度**，判断 **当前行** 能否容纳子节点

  + 如果 **加了会超限制**，更新 **主轴和交叉轴的总长度** (当前行尺寸+行间距)，**记录当前行的布局信息**，**重置行尺寸和子节点计数**。
  + 更新 **当前行的主轴** (子节点数>0，需要添加子节点间距) 和 **交叉轴长度**，当前行子节点计数+1，更新子节点parentData里的_runIndex(所在行索引)，指针移动到下一个子节点。
* 如果 **有子节点未处理** (最后一行)，处理后，记录当前行的布局信息。
* 计算 **容器尺寸**，检查是否有 **视觉溢出** (内容超出容器边界，导致部分内容无法在容器内完全显示)。
* 计算 **交叉轴上的剩余空间**，根据 **runAlignement** 设置不同的交叉轴 **前导空间** 和 **间隔空间**，加上行间距，计算出 **子节点在交叉轴的偏移量**。
* **遍历每一行**

  + 计算 **主轴上的剩余空间**，根据 **alignment** 设置不同的主轴 **前导空间** 和 **间隔空间**，加上子节点间距，计算出 **子节点在主轴的偏移量**。
  + **遍历这一行的子节点**，获取 **parentData**，将 **主轴位置** 和 **交叉轴位置** 组合成一个 **Offset**，赋值给**parentData** 的 **offset** 属性。

还是 **paint()** 打下断点：

😄 同样是在 **绘制** 的时候计算出最终的偏移：组件原本的偏移 + 前面布局算出的偏移~

## 6. 小结

 梳理下本节都学了啥：

* 开头通过一个 **初学Flutter堆Widget** 最常见的 **文字太长溢出** 的例子引出了解 **Flutter布局原理** 的重要性。
* 官方文档的一句话道出了 **Flutter 布局的精髓**：从顶部向下传递「**约束**」，从底部向上传递「**尺寸**」，父级Widget决定「**位置**」。
* 了解了：**紧约束**(固定值)、**松约束**(范围)、**无约束**(无限制)、**新约束**(子级不受父级约束影响)。
* 写了一个最简单的例子 (只有一个Container)，通过 **读源码 + 断点调试** 的方式了解到 **布局的基本流程**。
* 回头分析一开始的 **文字太长溢出**，为什么是溢出1.7个像素、为什么套 Expanded 或 Flexible 就不会溢出。
* **延伸学习**：复习渲染三棵树🌳、Widget的继承关系、Element的继承关系、RenderObject、RenderBox。
* 以 **Align** 和 **Wrap** 为例，带大家了解 **单子 & 多子 Widget** 的布局流程。

🤷‍♀️ 抛砖引玉，主要还是学习 **分析的思路**，相信读者学完本节，以后再遇到布局相关的问题，不会无从下手啦~

**参考文献**：

* [《官方文档：Understanding constraints》](https://docs.flutter.dev/ui/layout/constraints)
* [《掘金小册：Flutter 布局探索 - 薪火相传](https://juejin.cn/book/7075958265250578469 "https://juejin.cn/book/7075958265250578469")
* **《深入研究Flutter布局原理》**