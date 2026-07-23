---
title: "Flutter入门到精通（五）：Flutter UI基础速通"
pubDate: 2024-01-06
description: "Widget的四个直接子类详解，Material与Cupertino组件库入门。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第五篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

🐶上节速通了 **Dart基础语法**，本节打铁趁热把 **Flutter UI基础** 也速通了，冲的官方文档是：[《用户界面》](https://flutter.cn/docs/ui) OR[《User interface》](https://docs.flutter.dev/ui)。本节学习思路：过下常用组件，了解Flutter布局的一些常用套路，最后写一个低仿掘金静态首页的Demo。

## 1. Widget的四个直接子类

Android中的UI组件都是继承 **View** 或 **ViewGroup**，而在Flutter中的Widget，很少直接继承Widget，而是继承它的四个直接子类：

**StatelessWidget** 和 **StatefulWidget** 就不用说了，**无状态** 和 **有状态**，不理解的可以刷下我之前写的： 《"三棵树**🌲 **"渲染机制》 **。ProxyWidget**，直译 **代理组件**，就定义了一个子控件，然后通过构造函数传入，一般不会直接用，而是用它的两个子类：

* **InheritedWidget**：将数据传递给Widget树中的多个子孙结点，当使用这个 Widget 时，可以创建一个接收数据的上下文，任何子 Widget 都可以通过 **context.dependOnInheritedWidgetOfExactType()** 方法来获取这些数据，而且当数据发生变化时，依赖于这些数据的 Widget 会自动重建，就 **数据共享**。
* **ParentDataWidget**：用来操控 RenderObjectWidget 的布局，如：使用Flex布局时，可以使用它的子类 Flexible 或 Expanded来控制子Widget的布局参数。

**RenderObjectWidget**：为创建和更新RenderObject实例提供框架，也不会直接用，而是用它的子类：

* **SingleChildRenderObjectWidget**：管理单一子Widget的RenderObject，并管理子Widget的位置，子类示例：Align 和 Padding。
* **MultiChildRenderObjectWidget**：管理具有多个子Widget的RenderObject，为它们创建和维护一个列表，并确定它们在渲染树中的位置。子类示例：Row、Column 和 Stack。

🐶 知道下就好了，刚开始不需要手撕这些，都是用它们子类Widget，后面遇到再做专题学习亦可~

## 2. 基础组件 & MD组件

Flutter自带一套 **基础组件**，如：

* **Text** (文本)：显示简单样式文本；
* **Row** (行)：水平方向排列子widget的布局；
* **Column** (列)：垂直方向排列子widget的布局；
* **Stack** (堆栈)：将多个子widget堆叠在一起；
* **Container** (容器)：用于创建矩形视觉元素，可以装饰、设置边距、边框等；
* ...

还有一套按照 **谷歌Material Design设计规范** (视觉效果和交互动效) 实现的组件，以便开发者能快速构建出遵循Material Design规范的应用界面。如：

* **MaterialApp**：作为MD应用程序的根widget，提供了许多基础组件如导航栏、标题；
* **Scaffold** (脚手架)：MD布局结构的基本实现，提供了一个抽象层，方便构建和布局页面；
* **AppBar** (应用栏)：MD应用栏，通常显示在应用的顶部，可以显示标题、导航、操作图标等；
* **FloatingActionButton** (浮动按钮)：一个圆形按钮，通常紧贴屏幕的某一个角落；
* ...

😁 使用MD，要确保 **pubspec.yaml** 中配置了 **uses-material-design: true**，**新建的项目默认是启用的**。MD组件需要放在 **MaterialApp** 里才能正确显示！

🤫 对了，其实Flutter附带了两种捆绑设计，如果不喜欢Material，想创建以iOS为中心的设计，可以了解下 [Cupertino组件包](https://docs.flutter.dev/ui/widgets/cupertino)。

## 3. 安利个查Widget神器

😅 Flutter自带Widget 300+，一个个学，学完得到🐵年🐴月啊？肯定是用到的时候查，然后再专门学。那怎么高效地找到想要的Widget及用法呢？

🤩 这里必须安利一波 **张风捷大佬** 的开源项目 [toly1994328/FlutterUnit](https://github.com/toly1994328/FlutterUnit)，收录了绝大部分 **Flutter组件**，做了分类，支持搜索，每个组件还提供详细的属性介绍、代码示例及运行效果展示，**非常良心**：

最重要的是 **支持全平台下载**，手机/电脑装一个，闲着没事可以刷刷组件，😄**巴适得很**！！！

另外，还有一种更便捷的查Widget方式：**直接问AI**，比如我问ChatGPT-4：

> Flutter 中有类似于Android里的swiperefreshlayout 的组件吗？

它的回答：

妙啊！！！不过它有时候会瞎编，给出的答案不一定可靠，还得配合 **搜索引擎+官方API文档** 进行甄别😆~

## 4. 布局构建

Flutter使用Widget作为构建UI的基本单位，不同的Widgets可以 **嵌套组合** 在一起，创建复杂的布局。这里简单过下我认为比较常用的 **布局Widget**。对了，容器Widget添加子控件的属性一般是：**child(单个)** 和 **children(多个，List)** 。

### 4.1. Container (容器)

😃 感觉是Flutter中最常用的 **容纳单个子Widget** 的容器组件了，支持下述样式设置：

* **宽高** (**width**、**height**)：double类型，不设置默认为子控件的大小，如果想占满可以用double.infinity；
* **背景颜色 (color)** ：Color类型，如：Colors.black.withOpacity(0.2) // 不透明度为20%的黑色
* **背景/前景装饰** (**decoration/foregroundDecoration**)：**BoxDecoration**，可以添加背景/前景色、渐变、图像、边框、遮罩等，对了如果设置了decoration，会忽略掉color属性；
* **外/内边距** (**margin、padding**)：**EdgeInsets**，如：EdgeInsets.all(8.0) // 上下所有都添加8个逻辑像素；
* **元素对齐** (**alignment**)：**Alignment**，如：Alignment.topLeft // 左，可选值有9个，米字；
* **额外约束条件** (**constraints** )：**BoxConstraints**，用于限制宽高的最大最小值；
* **变换** (**transform**)：**Matrix4**，对子Widget应用变换效果，如：平移、旋转、倾斜等；

使用代码示例如下：

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
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Container Demo'),
        ),
        body: Center(
          child: Container(
            padding: const EdgeInsets.all(8.0),
            margin: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
            alignment: Alignment.center,
            width: double.infinity,
            height: 200.0,
            decoration: BoxDecoration(
              color: Colors.blue,
              borderRadius: BorderRadius.circular(8.0),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  spreadRadius: 4,
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Text(
              'Hello, Flutter!',
              style: TextStyle(color: Colors.white, fontSize: 22.0),
            ),
          ),
        ),
      ),
    );
  }
}
```

**运行效果**：

### 4.2. Align (对齐组件)

😃 套一个控件上，让它支持在父容器中对齐到特定位置，通过 **alignment** 属性来设置对齐方式。

使用代码示例如下：

```yaml
Container(
  width: 120.0,
  height: 120.0,
  color: Colors.blue,
  child: Align(
    alignment: Alignment.bottomLeft,
    child: FlutterLogo(size: 60),
  ),
)
```

### 4.3. Flex (弹性布局)

😄 水平或者垂直方向排列子Widget，很少直接使用，而是用它的两个子类 **Row(水平)** 和 **Column(垂直)** ！！！简单列下常见属性吧：

* **children** (子控件列表) → List；
* **direction** (主轴方向，必须) → 可选值：Axis.horizontal (水平)、Axis.vertical (垂直)；
* **mainAxisAlignment** (主轴对齐方式) → 如何沿着主轴对齐子Widget，如：MainAxisAlignment.center；
* **crossAxisAlignment** (交叉轴对齐方式) → 主轴的垂直方向子Widget如何对齐，如：CrossAxisAlignment.stretch；
* **textDirection** (水平方向排序) → 可选值：TextDirection.ltr (从左到右) 和 TextDirection.rtl (从右到左)；
* **verticalDirection** (垂直方向排序) → 可选值：VerticalDirection.down (从上到下) 和 VerticalDirection.up(从下到上)；
* **mainAxisSize** (Flex在主轴方向应占用的空间大小) → 可选值：MainAxisSize.min (大小刚好包含子Widget) 和 MainAxisSize.max (尽可能占据更多空间)。

使用代码示例如下：

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyFlexApp());
}

class MyFlexApp extends StatelessWidget {
  const MyFlexApp({super.key});

  @override
  Widget build(BuildContext context) {
    var count = 0;
    return MaterialApp(
      title: 'Flex Demo',
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Flex Demo'),
        ),
        body: Flex(
          direction: Axis.horizontal, // 设置Flex为水平方向
          mainAxisAlignment: MainAxisAlignment.spaceEvenly, // 子Widget间隔均匀排列
          children: <Widget>[
            _createContainer(++count, Colors.red),
            _createContainer(++count,Colors.green),
            _createContainer(++count,Colors.blue),
          ],
        ),
      ),
    );
  }

  // 创建一个具有指定颜色的容器
  Widget _createContainer(int count, Color color) {
    return Expanded(
      flex: count,  // 剩余空间占比
      child: Container(
        height: 100.0,
        color: color,
      ),
    );
  }
}
```

运行效果：

其实用 **Row** 就等价于上面设置direction属性为Axis.horizontal的 Flex 啦。例子里用 **Expanded** 实现了一个按比例划分的效果，类似提供子组件 **伸缩Widget** 还有 **Spacer** 和 **Flexible**。

### 4.4. Spacer(空间)、Expended(延展)、Flexible(灵活)

😁 这三个Widget都有一个 **flex** 属性，你可以给它分配一个 **正整数 (分配比重)** ，较高flex值的Widget相比较低flex值的widget获得更多的额外空间，简述下区别：

* **Spacer**：创建一个快速填充控件的Widget，flex默认值1，即占据所有可用空间；
* **Expended**：让 子Widget 填充所有额外的空间；
* **Flexible**：控制 子Widget 如何占据未被其它内容使用的空间，以及它们应该保持自然大小，还是填充额外的控件。它更灵活，提供了两种内容适应：FlexFit.tight(紧凑) FlexFit.loose(松散)。

### 4.5. Wrap (包裹布局)

😆 默认情况下 Row 和 Column 不会 **滚动**，当子控件们的总宽度/高度超过屏幕密度，会导致溢出，表现为：屏幕边缘显示裁剪警告：通常是一条黄色和黑色条纹的区域。除了直接套 **SingleChildScrollView(滚动视图)** 让其可以水平/垂直方向滚动外，**还可以用 Wrap(包裹布局)** ：当一行 (水平模式) 或 一列 (垂直模式) 空间不足以容纳更多子Widget时，**自动将溢出的Widget转移到新的行或列中**。Flex有的属性Wrap都有，还有两个特有属性：

* **spacing** (主轴组件间距) → double；
* **runSpacing** (交叉组件间距) → double；

有一点要注意：Wrap不能使用Flex中的Flexible和Expanded等 **控制子项如何占用额外空间** 的组件！！！

### 4.6. Stack (堆叠布局)

😅 **以堆叠的形式摆放子组件**，**后者居上**，有点像Android里的FrameLayout(帧布局)，常用属性有这些：

* **children** (子控件列表) → List，按照列表顺序堆叠，首个控件在底部，最后一个在顶部；
* **alignment** (对齐方式) → AlignmentGeometry，默认值：AlignmentDirectional.topStart (左上角)；
* **fit** (适应模式) → StackFit，决定未使用Positioned修饰的组件如何适应Stack的大小，如：StackFit.expand 填满额外的可用空间；
* **clipBehavior** → Clip，决定超过Stack大小的Widget如何显示，如：Clip.none 允许Widget绘制在Stack之外；
* **textDirection** (文本对齐) → 根据文本方向变化对齐方式，如：TextDirection.ltr 文本从左到右，表示上左对齐；

使用代码示例如下：

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
      title: 'Flutter Stack Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MyHomePage(),
    );
  }
}

class MyHomePage extends StatelessWidget {
  const MyHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    var count = 1;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flutter Stack Demo'),
      ),
      body: Center(
        child: Stack(
          alignment: Alignment.center,
          children: _createContainerList()
        ),
      ),
    );
  }

  List<Widget> _createContainerList() {
    var colorList = [Colors.red, Colors.blue, Colors.green, Colors.purple];
    List<Widget> containerList = [];
    for (int i = 4; i > 0; i--) {
      containerList.add(Container(
        height: 100.0 * i,
        width: 100.0 * i,
        color: colorList[i - 1],
      ));
    }
    return containerList;
  }
}
```

运行效果：

### 4.7. Flow (流动布局)

🤣 **创建需要自定义布局策略的场景**，如：**非线性布局或重叠的布局** (比如子控件圆形排列)，常用属性有这些：

* **children** (子控件列表) → List
* **delegate** (代理) → **FlowDelegate**，需要继承FlowDelegate创建一个自定义的代理来决定子widget的大小及位置，对应重写的方法：paintChildren(子Widget绘制)、getSize(Widget的大小)、shouldRepaint(什么情况下需要重新绘制布局)

使用代码示例如下 (生成一个十字架布局)：

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const CrossFlowWidget());
}

class CrossFlowWidget extends StatelessWidget {
  const CrossFlowWidget({super.key});

  @override
  Widget build(BuildContext context) {
    const double size = 50.0;
    return MaterialApp(
        home: Scaffold(
      appBar: AppBar(
        title: const Text('Flutter Flow Demo'),
      ),
      body: Flow(
        delegate: CrossFlowDelegate(),
        children: List<Widget>.generate(
          5,
          (int index) => Container(
            width: size,
            height: size,
            alignment: Alignment.center,
            color: index == 2 ? Colors.red : Colors.blue,
            // 中间的是红色
            child: Text(index.toString(), textAlign: TextAlign.center),
          ),
        ),
      ),
    ));
  }
}

class CrossFlowDelegate extends FlowDelegate {
  @override
  void paintChildren(FlowPaintingContext context) {
    final double size = context.getChildSize(0)?.width ?? 0;
    // 依次绘制：中间，上左右下
    context.paintChild(2,
        transform: Matrix4.translationValues(2 * size, size, 0.0));
    context.paintChild(0,
        transform: Matrix4.translationValues(2 * size, 0.0 * size, 0.0));
    context.paintChild(1,
        transform: Matrix4.translationValues(size, size, 0.0));
    context.paintChild(3,
        transform: Matrix4.translationValues(3 * size, size, 0.0));
    context.paintChild(4,
        transform: Matrix4.translationValues(2 * size, 2 * size, 0.0));
  }

  @override
  bool shouldRepaint(CrossFlowDelegate oldDelegate) => false;
}
```

运行效果：

### 4.8. SizeBox (定尺寸盒)

😂 很常用的 **占位组件**，有点像写XML时，定义一个固定宽高的View来占位，常见用法示例：

* 需要在两个控件间增加一点控件，可以用一个没有子控件的SizedBox 来作为 **占位符，** 如： SizedBox(width: 8.0)；
* 用它包裹一个子控件，并 **指定一个固定宽高**，强制子控件具有这个特定的大小，不受其它子控件内容大小的影响。

### 4.9. Padding (边距组件)

🙂 给子控件添加 **内边距** 用，简单代码示例：

```dart
Padding(
  padding: const EdgeInsets.all(8.0),	// 上下左右添加相同的内边距
  child: Text('Hello Flutter'),
),
// 水平和垂直方向：EdgeInsets.symmetric(vertical: 20.0, horizontal: 50.0)
// 上下左右单独设置内边距：EdgeInsets.only(left: 10.0, top: 20.0)
```

### 4.10. Divder、VerticalDivider (水平/垂直分割线)

😉 就设置水平/垂直的分割线，常用属性有这些：

* **color** (颜色)： Color；
* **thickness** (线粗细)：double；
* **indent** (前面的空缺长度)：double;
* **endIndent** (后面的空缺长度)：double;
* **height** (高度)：double；

### 4.11. ListView (列表组件)

🙃 **可容纳多个子组件的滚动组件**，常用属性有这些：

* **children** (子控件列表) → List
* **paddding** (内边距) → double
* **scrollDirection** (滚动方向) → Axis.vertical(垂直，默认)，Axis.horizontal(水平)；
* **reverse** (是否反向滚动) → bool，设置为true时，列表将从最后一个元素开始显示，并且反向滚动；
* **shrinkWrap** → bool，列表是否减少自身尺寸以适应子项的总长度。

构造ListView的常见方式有这几种：

#### 4.11.1. 默认构造函数

适合 **静态列表或者不会变化的小型列表**，简单代码示例如下：

```dart
ListView(
  children: <Widget>[
    ListTile(title: Text('Item 1')),
    ListTile(title: Text('Item 2')),
    ListTile(title: Text('Item 3')),
  ],
);
```

#### 4.11.2. ListView.builder

适合 **大型或者无限列表**，构建项是 **惰性加载** 的，只有当它们即将显示时才会创建，简单代码示例如下：

```dart
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) {
    return ListTile(title: Text('Item $index'));
  },
)
```

#### 4.11.3. **ListView.separated**

在 **ListView.builder** 的基础上多了一个 **分隔器**，在需要在列表项间添加 **分割线** 的场合非常有用，简单代码示例如下：

```dart
ListView.separated(
  itemCount: items.length,
  itemBuilder: (context, index) {
    return ListTile(title: Text('Item $index'));
  },
  separatorBuilder: (context, index) => Divider(height: .5),
)
```

#### 4.11.4. ListView.custom

提供 **更多自定义功能**，如使用 **SliverChildListDelegate** 和 **SliverChildBuilderDelegate** 来创建子项与分隔符，简单代码示例如下：

```dart
ListView.custom(
  childrenDelegate: SliverChildListDelegate(
    [
      ListTile(title: Text('Item 1')),
      ListTile(title: Text('Item 2')),
      //... 更多的子项
    ],
  ),
)
```

🐶 常用的布局组件就学到这吧，其它的用到再学，接着用Flutter写一个简陋的掘金静态首页练练手吧~

## 5. 实战：写个简陋的掘金静态首页

**掘金首页截图**

简单粗暴地将首页分成三个区域，然后一一实现~

### 5.1. 搜索栏

水平从左到右，套个Row，然后是搜索按钮和搜索文本，需要一个灰色的圆角背景，然后还要占满和签到图标间所有的控件。实现代码如下：

```dart
// 顶部搜索栏
class SearchBarWidget extends StatelessWidget {
  const SearchBarWidget({super.key});

  @override
  Widget build(BuildContext context) {
    // 添加内间距：水平16像素，垂直8像素
    return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
        child: Row(
          children: <Widget>[
            // 使用Expanded填满剩余控件
            Expanded(
                child: Container(
              // 设置下容器的内边距，不然图标和文本太挤了
              padding:
                  const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
              // 设置圆角灰色背景
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6), // 圆角背景色
                borderRadius: BorderRadius.circular(8.0), // 圆角的大小
              ),
              // 搜索图标和搜索提示文本
              child: const Row(
                children: [
                  Icon(Icons.search, color: Color(0xFF8C8D92)),
                  SizedBox(width: 8.0), // 图标和文本之间的间距
                  Text('搜索技术社区',
                      style: TextStyle(
                          fontSize: 14.0, // 字体大小
                          color: Color(0xFF8C8D92), // 设置字体颜色
                          decoration: TextDecoration.none, // 设置不显示下划线
                          fontWeight: FontWeight.normal) // 设置字体不要加粗
                      ),
                ],
              ),
            )),
            // 在签到图标和搜索框间添加一点间距
            const SizedBox(width: 8.0),
            const Icon(Icons.assistant_photo)
          ],
        ));
  }
}

class _MyHomePageState extends State<MyHomePage> {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: const Column(
        children: [SearchBarWidget()],	// 实例化这个搜索栏Widget
      ),
    );
  }
}
```

运行看看效果：

2333，直接被手机的状态栏遮住了，可以添加一个SizeBox让搜索栏往下挪，也可以直接套个 **SafeArea** 来确保子控件不会被状态栏、导航栏及底部操作栏所遮挡，修改后的代码：

```dart
class _MyHomePageState extends State<MyHomePage> {
  @override
  Widget build(BuildContext context) {
    return SafeArea(child: Container(
      color: Colors.white,
      child: const Column(
        children: [SearchBarWidget()],
      ),
    ));
  }
}
```

不得不说 **热重载真香**，代码保存后，界面自动就刷新了：

### 5.2. 中间的内容部分

这部分稍微复杂一点，核心的三个组件： **标签栏**(TabBar)、**标签页**(TabBarView) 还有 **列表**(ListView)。一步步来，先是TabBar和TabBarView的联动，需要用到 **SingleTickerProviderStateMixin** 提供一个选中的动画效果。

```dart
// 中间的内容面板
class ContentWidget extends StatefulWidget {
  const ContentWidget({super.key});

  @override
  State<StatefulWidget> createState() => _ContentWidgetState();
}

class _ContentWidgetState extends State<ContentWidget>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<String> tabStrList = [
    '关注',
    '推荐',
    '热榜',
    '头条',
    '后端',
    '前端',
    'Android',
    'iOS',
    '人工智能',
    '开发工具'
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: tabStrList.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: Column(
          children: <Widget>[
            TabBar(
              isScrollable: true, // 设置可滚动
              controller: _tabController, // 关联TabController
              tabs: tabStrList.map((e) => Tab(text: e)).toList(),
            ),
            TabBarView(
                // 同样使用TabBarView
                controller: _tabController, // 关联同一个TabController
                children: tabStrList
                    .map((e) => Text(e,
                        style: const TextStyle(backgroundColor: Colors.blue)))
                    .toList()),
          ],
        ),
      );
  }
}
```

运行后，底部直接出现黑黄警告条：

因为我们没放在默认的 DefaultTabController 里，所以需要我们自己设置宽高，这里直接套两个Expanded填满解君愁：

```dart
  @override
  Widget build(BuildContext context) {
    // 让Scaffold填满剩余空间
    return Expanded(
      child: Scaffold(
        body: Column(
          children: <Widget>[
            TabBar(
              isScrollable: true, // 设置可滚动
              controller: _tabController, // 关联TabController
              tabs: tabStrList.map((e) => Tab(text: e)).toList(),
            ),
            // 高度填满剩余空间
            Expanded(child: TabBarView(
                // 同样使用TabBarView
                controller: _tabController, // 关联同一个TabController
                children: tabStrList
                    .map((e) => Text(e,
                        style: const TextStyle(backgroundColor: Colors.blue)))
                    .toList()),
            ),
          ],
        ),
      ),
    );
  }
```

保存看看效果：

还可以，接着把中间的文本改成ListView，需要一个分割先，直接使用 ListView.separated 来构造：

```dart
class ContentListWidget extends StatelessWidget {
  const ContentListWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
        itemBuilder: (context, index) {
          return Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(children: [
                const Row(children: [
                  Text('Flutter入门到精通',
                      style: TextStyle(
                          fontSize: 14.0, // 字体大小
                          color: Colors.black, // 设置字体颜色
                          decoration: TextDecoration.none // 设置不显示下划线
                          ))
                ]),
                const Row(children: [
                  Icon(Icons.person),
                  SizedBox(width: 4),
                  Text('Flutter')
                ]),
                const SizedBox(height: 10),
                const Row(
                  children: [
                    Expanded(
                        child: Text(
```

                            '时代峰峻了思考的放开了教师节快乐地方就是看漏点击福克斯搭建开发手机打开发送点击开发技术的开发律师代理费是劳动法',

```dart
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis))
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.lightbulb_outline),
                    const Text('999+'),
                    const SizedBox(width: 18),
                    const Icon(Icons.keyboard_voice),
                    const Text('999+'),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8.0, vertical: 4.0), // 根据需要调整内边距
                      decoration: BoxDecoration(
                        color: Colors.grey,
                        borderRadius: BorderRadius.circular(5.0), // 设定边界半径，实现圆角
                      ),
                      child: const Text(
                        'Flutter',
                        style:
                            TextStyle(color: Colors.white), // 设置文本颜色以确保与背景色形成对比
                      ),
                    ),
                    const Icon(Icons.more_vert)
                  ],
                )
              ]));
        },
        separatorBuilder: (context, index) {
          return const Divider(color: Color(0XFFF3F4F6), thickness: 8.0);
        },
        itemCount: 20);
  }
}
```

运行看看效果：

### 5.3. 底部导航栏

直接用 **BottomNavigationBar** + **BottomNavigationBarItem** 来实现：

```dart
class BottomBarWidget extends StatefulWidget {
  const BottomBarWidget({super.key});

  @override
  State<StatefulWidget> createState() => _BottomBarWidgetState();
}

class _BottomBarWidgetState extends State<BottomBarWidget> {
  int _position = 0;

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      onTap: (position) {
        setState(() => _position = position);
      },
      selectedItemColor: Colors.blue, // 选中时的颜色
      unselectedItemColor: Colors.black,  // 未选中时的颜色
      showSelectedLabels: true, // 选中的label是否展示
      showUnselectedLabels: true, // 未选中的label是否展示
      currentIndex: _position,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home), label: '首页'),
        BottomNavigationBarItem(icon: Icon(Icons.whatshot), label: '沸点'),
        BottomNavigationBarItem(icon: Icon(Icons.zoom_out), label: '发现'),
        BottomNavigationBarItem(icon: Icon(Icons.book), label: '课程'),
        BottomNavigationBarItem(icon: Icon(Icons.settings), label: '我'),
      ],
    );
  }
}
```

最后把这个Widget也加上，看看运行效果：

 页面是真的简陋，用的图标都是flutter自带的 (可以到这里查[fluttericon](https://www.fluttericon.com/))，而且数据也是写死的，2333，不过把页面撸出来了，常用的布局构建技巧熟练度也up了，本节就到这，下节来实战写个APP耍耍~

附：最后案例的完整代码：

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      home: MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key});

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
        child: Container(
      color: Colors.white,
      child: const Column(
        children: [SearchBarWidget(), ContentWidget(), BottomBarWidget()],
      ),
    ));
  }
}

// 顶部搜索栏
class SearchBarWidget extends StatelessWidget {
  const SearchBarWidget({super.key});

  @override
  Widget build(BuildContext context) {
    // 添加内间距：水平16像素，垂直8像素
    return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
        child: Row(
          children: <Widget>[
            // 使用Expanded填满剩余控件
            Expanded(
                child: Container(
              // 设置下容器的内边距，不然图标和文本太挤了
              padding:
                  const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
              // 设置圆角灰色背景
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6), // 圆角背景色
                borderRadius: BorderRadius.circular(8.0), // 圆角的大小
              ),
              //
              child: const Row(
                children: [
                  Icon(Icons.search, color: Color(0xFF8C8D92)),
                  SizedBox(width: 8.0), // 图标和文本之间的间距
                  Text('搜索技术社区',
                      style: TextStyle(
                          fontSize: 14.0, // 字体大小
                          color: Color(0xFF8C8D92), // 设置字体颜色
                          decoration: TextDecoration.none, // 设置不显示下划线
                          fontWeight: FontWeight.normal) // 设置字体不要加粗
                      ),
                ],
              ),
            )),
            const SizedBox(width: 8.0),
            const Icon(Icons.assistant_photo)
          ],
        ));
  }
}

// 中间的内容面板
class ContentWidget extends StatefulWidget {
  const ContentWidget({super.key});

  @override
  State<StatefulWidget> createState() => _ContentWidgetState();
}

class _ContentWidgetState extends State<ContentWidget>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<String> tabStrList = [
    '关注',
    '推荐',
    '热榜',
    '头条',
    '后端',
    '前端',
    'Android',
    'iOS',
    '人工智能',
    '开发工具'
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: tabStrList.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 让Scaffold填满剩余空间
    return Expanded(
      child: Scaffold(
        body: Column(
          children: <Widget>[
            TabBar(
              isScrollable: true, // 设置可滚动
              controller: _tabController, // 关联TabController
              tabs: tabStrList.map((e) => Tab(text: e)).toList(),
            ),
            // 高度填满剩余空间
            Expanded(child: TabBarView(
                // 同样使用TabBarView
                controller: _tabController, // 关联同一个TabController
                children: tabStrList
                    .map((e) => const ContentListWidget())
                    .toList()),
            ),
          ],
        ),
      ),
    );
  }
}

class ContentListWidget extends StatelessWidget {
  const ContentListWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
        itemBuilder: (context, index) {
          return Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(children: [
                const Row(children: [
                  Text('Flutter入门到精通',
                      style: TextStyle(
                          fontSize: 14.0, // 字体大小
                          color: Colors.black, // 设置字体颜色
                          decoration: TextDecoration.none // 设置不显示下划线
                          ))
                ]),
                const Row(children: [
                  Icon(Icons.person),
                  SizedBox(width: 4),
                  Text('Flutter')
                ]),
                const SizedBox(height: 10),
                const Row(
                  children: [
                    Expanded(
                        child: Text(
```

                            '时代峰峻了思考的放开了教师节快乐地方就是看漏点击福克斯搭建开发手机打开发送点击开发技术的开发律师代理费是劳动法',

```dart
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis))
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.lightbulb_outline),
                    const Text('999+'),
                    const SizedBox(width: 18),
                    const Icon(Icons.keyboard_voice),
                    const Text('999+'),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8.0, vertical: 4.0), // 根据需要调整内边距
                      decoration: BoxDecoration(
                        color: Colors.grey,
                        borderRadius: BorderRadius.circular(5.0), // 设定边界半径，实现圆角
                      ),
                      child: const Text(
                        'Flutter',
                        style:
                            TextStyle(color: Colors.white), // 设置文本颜色以确保与背景色形成对比
                      ),
                    ),
                    const Icon(Icons.more_vert)
                  ],
                )
              ]));
        },
        separatorBuilder: (context, index) {
          return const Divider(color: Color(0XFFF3F4F6), thickness: 8.0);
        },
        itemCount: 20);
  }
}

class BottomBarWidget extends StatefulWidget {
  const BottomBarWidget({super.key});

  @override
  State<StatefulWidget> createState() => _BottomBarWidgetState();
}

class _BottomBarWidgetState extends State<BottomBarWidget> {
  int _position = 0;

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      onTap: (position) {
        setState(() => _position = position);
      },
      selectedItemColor: Colors.blue, // 选中时的颜色
      unselectedItemColor: Colors.black,  // 未选中时的颜色
      showSelectedLabels: true, // 选中的label是否展示
      showUnselectedLabels: true, // 未选中的label是否展示
      currentIndex: _position,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home), label: '首页'),
        BottomNavigationBarItem(icon: Icon(Icons.whatshot), label: '沸点'),
        BottomNavigationBarItem(icon: Icon(Icons.zoom_out), label: '发现'),
        BottomNavigationBarItem(icon: Icon(Icons.book), label: '课程'),
        BottomNavigationBarItem(icon: Icon(Icons.settings), label: '我'),
      ],
    );
  }
}
```