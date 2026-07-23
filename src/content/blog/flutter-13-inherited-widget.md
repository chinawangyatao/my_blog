---
title: "Flutter入门到精通（十三）：从Widget源码到InheritedWidget"
pubDate: 2024-01-14
description: "深入Widget源码，理解InheritedWidget的数据传递机制。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第十三篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

😝 前面写的**《十一、Flutter UI框架🦐聊》**一文中提到 **Flutter** 的本质是一套 **UI框架**，解决的是 **一套代码在多端渲染**。Flutter 的架构从上到下分为如下 **三层** ，上层组件依赖下层组件，组件间无法跨层访问：

 作为一个UI崽，大部分时间都是在 **Framework** 层 **堆Widget**，个人感觉还是有必要了解下Widget背后的原理哒。先回顾下Flutter中关于Widget核心设计理念的名词：

* **万物皆Widget**：不管是 **结构**(如按钮、文本)、**布局** 还是 **样式**，只要 **与图形构建相关** 的UI元素，都是Widget，它只是 **描述UI元素配置信息的抽象**。
* **声明式+响应式UI**：无需通过 **命令式代码** 来手动创建和管理UI的各个部分，只需通过声明性代码来描述界面的外观和结构。当应用程序的状态改变时，Flutter框架会自动重建UI，以匹配新的状态。
* **不可变性**：Widget一旦被创建，就不能被修改，每次状态改变时，Flutter会根据最新的状态创建**一棵新的Widget树**，这种不变性有助于提高应用程序的性能，使得Flutter可以快速确定哪些Widget需要在Element树和RenderObject树中更新，而不是每次都重建整个UI树。
* **组合优于继承**：鼓励通过组合小的、简单的对象来创建复杂的对象，而不是通过创建复杂的继承结构。

😄 然后是老生常谈的渲染 "**三棵树🌲**"：

* **Widget** → **对视图的结构化描述**，存储视图渲染相关的 **配置信息**：布局、渲染属性、事件响应等信息。
* **Element** → **Widget的实例化对象**，承载视图构建的 **上下文数据 (BuildContext)** ，连接Widget到完成最终 **渲染** 的 **桥梁**。
* **RenderObject** → 负责实现视图渲染的对象；

😁 概念的东西回顾得差不多了，本节带着大伙来康康Widget的源码，为后面的 **状态管理** 章节做准备，内容如下：

> **Tips**：本节涉及的源码都是简化过的，只保留了关键代码以方便阅读，更详细代码可自行查看

## 2. Widget

### 2.1. 源码

```dart
// 不可变注解
@immutable
abstract class Widget extends DiagnosticableTree {
  const Widget({ this.key });

  final Key? key;

  @protected
  @factory
  Element createElement();

  @override
  String toStringShort() {
    final String type = objectRuntimeType(this, 'Widget');
    return key == null ? type : '$type-$key';
  }

  static bool canUpdate(Widget oldWidget, Widget newWidget) {
    return oldWidget.runtimeType == newWidget.runtimeType
        && oldWidget.key == newWidget.key;
  }

  //其它与调试相关的方法...
}
```

**源码解读**：

* 继承抽象类 DiagnosticableTree(诊断树) ，用于提供调试信息相关的方法；
* 定义了一个 **Key**，看过前面写的**《十、进阶-玩转各种Key🔑》**就知道它是 **Widget的唯一标识**，用于 **比较Widget是否相等**，以及在 **Widget移动或改变时保持其状态**。
* **createElement()** ：**将Widget实例化为一个具体的Element**，Widget可能被包含在UI树中零次或多次。每次被包含在UI树中，都会被实例化为一个Element，即Widget和Element的关系是 **一对多**。
* toStringShort()：返回此Widget的简单文本描述，一般是 runtimeType-key。
* **canUpdate()** ：用于 **比较两个Widget是否相等**，如果新旧Widget的runtimeType和key都 **相等**，那Flutter框架会认为它们是 **相同** 的，**更新** 现有的Element以反映新Widget，而不是创建一个新的Element。如果不相等，**删除** 旧Element，**创建与新Widget对应的新Element**，并将其插入到UI树中的相应位置。

就一个Key，确实 **轻量**，不过实际开发中很少直接用Widget，而是用它的子类，先来看下它的继承关系吧~

### 2.2. 继承关系

图中可以看到Widget有4个直接子类，依次看看源码😁~

## 3. StatelessWidget

**没有状态改变**，仅用做展示，UI表现形式取决于 **构造函数中提供的参数**。

### 3.1. 源码

```dart
abstract class StatelessWidget extends Widget {
  const StatelessWidget({ Key? key }) : super(key: key);

  @override
  Widget build(BuildContext context);

  @override
  StatelessElement createElement() => StatelessElement(this);
}
```

**源码解读**：

* 构造方法允许传入一个可选的Key，用于控制框架是否应该在Widget重建时替换或保留某个Element。
* **build()** ：子类必须重写的抽象方法，返回一个新的Widget对象。通常只在三种情况下调用：**Widget第一次插入树中**、**父级Widget更改配置**，**依赖的InheritedWidget发生更改**。
* **createElement()** ：创建与此Widget关联的 **StatelessElement** 对象。

### 3.2. **StatelessElement**

```dart
class StatelessElement extends ComponentElement {
   StatelessElement(StatelessWidget super.widget);

  @override
  Widget build() => (widget as StatelessWidget).build(this);

  @override
  void update(StatelessWidget newWidget) {
    super.update(newWidget);
    // 用断言的原因：StatelessWidget是不变的，理论上新旧Widget应该是相等的，如果不等，可能是一个逻辑错误。l
    assert(widget == newWidget);
    rebuild(force: true);
  }
}
```

**源码解读**：

* 构造方法传入一个StatelessWidget实例传递给它的父类。
* **build()** ：调用Widget的build()，实际构建UI的地方。
* **update()** ：当框架需要更新与Element关联的Widget时调用。
* **rebuild(force)** ：强制重新构建Element，即使Widget没有改变。

所以 **StatelessElement** 的作用：

> 负责将StatelessWidget描述的UI声明转换为实际的 **界面**，并 **管理** 这些界面的 **生命周期和更新过程**。

### 3.3. BuildContext

**对Widget树上某一个位置的引用**，用于查找、访问和操作该位置上的相关信息。每个Widget都有一个与之对应的 **BuildContext**，它指示了 **该Widget在Widget树中的位置**。然后源码里有这样一句注释：

> /// [BuildContext] objects are actually [Element] objects. The [BuildContext] /// interface is used to discourage direct manipulation of [Element] objects.

简单翻译下：**BuildContext** 实际上就是 **Element对象**，定义此接口是为了阻止对Element对象的直接调用。可以看到 Element 实现了这个 **抽象类**：

> abstract class Element extends DiagnosticableTree implements BuildContext { }

综上，**BuildContext对象** 是 **Element对象** 的 **引用**，提供了 **构建Widget树时与Element进行交互的方式**，如：查找Element的RenderObject、注册依赖关系、获取祖先Widget等操作。一些常用的API：

* **Theme.of(context)** : 获取最近的 Theme，用于获取当前的主题信息。
* **MediaQuery.of(context)** : 获取最近的 MediaQuery，用于获取媒体查询信息，如设备尺寸、设备像素比、屏幕亮度等。
* **Navigator.of(context)** : 获取最近的 Navigator 状态，用于页面导航。
* **Scaffold.of(context)** : 获取最近的 Scaffold 状态，用于显示 SnackBar、打开 Drawer 等。
* **Form.of(context)** : 获取最近的 Form 状态，用于表单验证和保存。
* **BuildContext.dependOnInheritedWidgetOfExactType():** 获取最近的指定类型的 InheritedWidget。
* **Provider.of(context)** ：当使用 provider 包来进行状态管理时，用于获取最近的提供者 T。
* **BuildContext.findRenderObject()** : 获取与当前 BuildContext 相关联的 RenderObject，这可以用来获取 widget 的尺寸和位置。
* **BuildContext.owner**: 获取当前 BuildContext 的 Element 所属的 BuildOwner，这通常用于框架内部。
* **BuildContext.widget**: 获取与当前 BuildContext 相关联的 widget。

另外，需要注意，**不同的API需要在Widget的不同生命周期调用**，否则可能会抛出异常。如：不能在 build() 中直接调用 **Scaffold.of(context)** ，因为在构建过程中，Scaffold 可能还没有被创建。这种情况下，可以使用**Builder** 来获取子树的Context，或者使用 **ScaffoldMessenger**。示例如下：

```dart
@override
Widget build(BuildContext context) {
  // 这里调用可能会抛出异常，因为Scaffold可能还没有被创建
  // Scaffold.of(context).openDrawer();

  // 使用Builder来正确获取context
  return Builder(
    builder: (BuildContext context) {
      return GestureDetector(
        onTap: () {
          Scaffold.of(context).openDrawer(); // 正确的调用
        },
        child: Text('Open Drawer'),
      );
    },
  );
}
```

## 4. StatefulWidget

**需要保存状态**，且可能出现状态变化，与之关联的State对象状态发生变化，它都会重新构建自己。

### 4.1. 源码

```dart
abstract class StatefulWidget extends Widget {
  const StatefulWidget({ super.key });

  @override
  StatefulElement createElement() => StatefulElement(this);

  @protected
  @factory
  State createState();
}
```

**源码解读**：

* **createElement()** ：创建一个 **StatefulElement** 实例，用于**管理** StatefulWidget的状态(**State对象**)，并在合适的时候与其通信。
* **createState()** ：子类必须重写的抽象方法，当框架需要StatefulWidget的状态时会调用。框架可能会在StatefulWidget的生命周期内多次调用此方法，比如：在树中的多个位置插入此Widget，框架会为每个位置创建一个单独的State。

### 4.2. StatefulElement

它是 **Widget和State间的桥梁**，看下源码：

```dart
class StatefulElement extends ComponentElement {
    StatefulElement(StatefulWidget widget)
      : _state = widget.createState(),
        super(widget) {
    state._element = this;
    state._widget = widget;
  }

  @override
  Widget build() => state.build(this);

  @override
  void reassemble() {
    state.reassemble();
    super.reassemble();
  }

  @override
  void _firstBuild() {
    state.didChangeDependencies();
    super._firstBuild();
  }

  @override
  void performRebuild() {
    if (_didChangeDependencies) {
      state.didChangeDependencies();
      _didChangeDependencies = false;
    }
    super.performRebuild();
  }

  @override
  void update(StatefulWidget newWidget) {
    super.update(newWidget);
    final StatefulWidget oldWidget = state._widget!;
    state._widget = widget as StatefulWidget;
    rebuild(force: true);
  }

  @override
  void activate() {
    super.activate();
    state.activate();
    markNeedsBuild();
  }

  @override
  void deactivate() {
    state.deactivate();
    super.deactivate();
  }

  @override
  void unmount() {
    super.unmount();
    state.dispose();
    state._element = null;
    _state = null;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _didChangeDependencies = true;
  }
}
```

**源码解读**：

* **构造方法：** 传入一个StatefulWidget实例，并调用它的 **createState()** 创建一些State对象，并赋值给 **_state**。调用父类ComponentElement的构造函数，将State对象的 **_element** 设置为当前的StatefulElement实例，即完成 **State对象与Element的关联**。最后设置 **_widget** 为传入的StatefulWidget实例。
* **build()** ：调用State对象的build()，并传递当前Element，在这里完成 **实际Widget的构建**。
* **reassemble()** ：用于 **热重载** 的场景，先调用State的reassemble()，再调用父类的reassemble()。
* **_firstBuild()** ：**Element第一次被构建时调用**，通知State对象依赖关系已经改变，然后调父类_firstBuild()。
* **performRebuild()** ：**重新构建Widget时调用**，如果 _didChangeDependencies 标志位设置为true，则会通知State对象依赖关系已经改变，并将标志重置为false，然后调父类的 performRebuild()。
* **update()** ：将新的Widget与当前的Element关联，先调父类的update()，然后更新State对象中保存的widget引用，并强制重新构建。
* **activate()** ：Element重新插入到树中时调用，它会调用State对象的activate()，并标记为需要重新构建。
* **deactivate()** ：当Element永久从树中移除时调用，它会调用State对象的 **dispose()** 来清理资源，然后断开State对象与Element的关联，并清空State对象的引用。
* **didChangeDependencies()** ：Element的依赖关系发生变化时调用，会将didChangeDependencies标志设置为true。

### 4.3. State

它是与 **StatefulWidget相关联的状态对象的基类**，看下源码：

```dart
// 此注解表示泛型类型参数T是可选的，混入Diagnosticable用于提供调试功能
@optionalTypeArgs
abstract class State<T extends StatefulWidget> with Diagnosticable {
  // 与State关联的StatefulWidget对象
  T get widget => _widget!;
  T? _widget;
  // 获取context的话，返回BuildContext的内部应用 → element
  BuildContext get context { return _element!  }
  StatefulElement? _element;
  // 判断当前State对象是否还挂载在Element树上
  bool get mounted => _element != null;

  // @mustCallSuper：子类重写此方法时必须调用父类的方法
  @protected
  @mustCallSuper
  void initState() {
    //...
  }

  @mustCallSuper
  @protected
  void didUpdateWidget(covariant T oldWidget) { }

  @protected
  @mustCallSuper
  void reassemble() { }

  @protected
  void setState(VoidCallback fn) {
    // 将当前与State对象关联的Element标记为"dirty"(需要重建)
    _element!.markNeedsBuild();
  }

  @protected
  @mustCallSuper
  void deactivate() { }

  @protected
  @mustCallSuper
  void activate() { }

  @protected
  @mustCallSuper
  void dispose() {
    //...
  }

  @protected
  Widget build(BuildContext context);

  @protected
  @mustCallSuper
  void didChangeDependencies() { }
}

// 附：Element#markNeedsBuild() 的代码：
void markNeedsBuild() {
  if (_lifecycleState < _ElementLifecycle.inactive) {
    // 如果Element还没有被激活（也就是还没有加入到树中），则不做任何事情。
    return;
  }
  if (!owner!._debugBuilding) {
    // 如果当前不在构建阶段，则将Element标记为dirty，并且加入到owner的dirty elements队列中。
    _dirty = true;
    // _scheduleBuildFor 会确保在下一个动画帧Element会被重建。
    // 这个过程是异步的，意味着setState()后，UI不会立即更新，而是在下一个才重建并显示最新的状态
    owner!._scheduleBuildFor(this);
  } else {
    // 如果当前已经在构建阶段，说明你正试图在build方法中调用setState，这是不允许的。
    assert(() {
      throw FlutterError(
        'Cannot markNeedsBuild() during the build phase.\n'
        'markNeedsBuild() was called during the build phase for the widget: $this.'
      );
    }());
  }
}
```

**源码解读**：

* **initState()** ：当State对象被创建并插入到树中时调用，用于初始化设置，如：监听器、初始化数据等。
* **didUpdateWidget()** ：当State对象关联的Widget在树中位置不变，但配置发生变化时调用，用于响应与Widget相关的配置变化。父Widget重建并创建新的Widget传递给相同的State时调用，在build()后执行。
* **setState()** ：主动通知框架State对象的内部状态已经改变，框架需要重建这个Widget。
* **deactivate()** ：当State对象从树中暂时移除时调用，一旦调用此方法，对象可能被销毁，也可能被重新插入到树中。
* **activate()** ：当State对象重新插入到树中调用。
* **dispose()** ：当State对象被永久移除时调用，通常在此进行资源释放工作，如：取消监听器、定时器等。
* **build()** ：子类必须实现的抽象方法，根据当前的状态构建UI，每次调setState()后都会调用。
* **didChangeDependencies()** ：当State对象的依赖的InheritedWidget发生变化时调用。

### 4.4. 调用流程/生命周期

😁 相关方法都了解得差不多了，接着简单画个图了解调用过程/生命周期：

😏 结合源码和流程图，相信你应该能回答这个问题 → **为什么Widget重建后，State没有丢失？**

> 答：**State对象是StatefulElement持有的**，当StatefulWidget重建时，新Widget实例会与原来的StatefulElement进行匹配，Flutter框架会调用 **Element#update()** 来关联新的Widget实例。整个过程，StatefulElement 会保持原有的State对象不变，因此，所有状态信息都被保留下来啦😄~

## 5. InheritedWidget

**ProxyWidget** 是一个抽象类，作用如其名 → **作为其它Widget的代理**，允许开发者在子Widget构建中插入一些额外逻辑。源码如下：

```dart
abstract class ProxyWidget extends Widget {
  const ProxyWidget({ super.key, required this.child });
  final Widget child;
}
```

😳 就一个child属性，也忒简洁了吧，通常不会直接使用它，而是使用它的两个子类 → **InheritedWidget** 和**ParentDataWidget**，本节主要了解前者~

### 5.1. 简单使用示例

可以高效地将 **共享的数据传递给子Widget树**，不需要 **手动将数据通过构造函数一层层往下传递**。这个组件之前我们没用过，写个简单代码示例~

```dart
import 'package:flutter/material.dart';

// 定义一个简单的Theme类来持有颜色数据
class Theme {
  final Color primaryColor;

  Theme({required this.primaryColor});
}

// 创建一个InheritedWidget来传递Theme
class ThemeInheritedWidget extends InheritedWidget {
  // 需要共享的数据
  final Theme theme;

  const ThemeInheritedWidget({super.key, required this.theme, required super.child});

  // 定义一个便捷方法，方便子widget获取最近的ThemeInheritedWidget实例
  static ThemeInheritedWidget? of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ThemeInheritedWidget>();

  // 当InheritedWidget更新时，决定是否通知依赖它的子widget，这里判断theme对象是否改变
  @override
  bool updateShouldNotify(ThemeInheritedWidget oldWidget) => theme != oldWidget.theme;
}

// 使用主题色的StatefulWidget
class ThemedContainer extends StatefulWidget {
  const ThemedContainer({super.key});

  @override
  State<StatefulWidget> createState() => ThemedContainerState();
}

class ThemedContainerState extends State<ThemedContainer> {
  @override
  Widget build(BuildContext context) {
    // 获取最近的ThemeInheritedWidget
    final theme = ThemeInheritedWidget.of(context)?.theme;

    return Container(
      height: 100,
      width: 100,
      color: theme?.primaryColor ?? Colors.white, // 使用InheritedWidget提供的颜色
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    print("didChangeDependencies() is Called");
  }
}

// 使用主题色的StatelessWidget
class ThemedText extends StatelessWidget {
  const ThemedText({super.key});

  @override
  Widget build(BuildContext context) {
    // 获取最近的ThemeInheritedWidget
    final theme = ThemeInheritedWidget.of(context)?.theme;

    return Text(
      'This text is themed',
      style: TextStyle(color: theme?.primaryColor ?? Colors.black),
    );
  }
}

// 调用处
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // 使用ThemeInheritedWidget包裹MaterialApp，提供主题数据
    return ThemeInheritedWidget(
      theme: Theme(primaryColor: Colors.blue),
      child: MaterialApp(
        title: 'InheritedWidget Example',
        home: Scaffold(
          appBar: AppBar(
            title: Text('InheritedWidget Example'),
          ),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                // 使用继承的主题颜色
                ThemedContainer(),
                // 另一个使用继承的主题颜色的widget
                ThemedText(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

void main() {
  runApp(MyApp());
}
```

**运行输出结果**：

同时，控制台输出了 **didChangeDependencies() is Called**，说明这个回调方法确实在 **"依赖"** 变化时被Flutter框架调用了。这里的"依赖"指的是：**子Widget是否使用了父Widget中的数据**。

* 如果删掉 **ThemeInheritedWidget.of(context)?.theme** 这段代码，即不依赖父Widget中的数据，这个方法将不会被调用。
* 一般很少重写这个方法，除非是你需要在依赖改变后执行一些"昂贵"操作，如：网络请求，可以在此方法中执行，这样可以避免每次build()都执行这些操作。

💁‍♂️ 另外，如果只想引用 **ThemeInheritedWidget** 里提供的共享数据，但不希望它发生变化时调用**ThemedContainerState** 的 **didChangeDependencies()** ，可以改为调另一个函数：

```dart
dependOnInheritedWidgetOfExactType()
// 改为：
getElementForInheritedWidgetOfExactType<ThemeInheritedWidget>()!.widget as ThemeInheritedWidget
```

具体原理，等下看源码你就知道了~

### 5.2. 源码

```dart
abstract class InheritedWidget extends ProxyWidget {
  const InheritedWidget({ super.key, required super.child });

  @override
  InheritedElement createElement() => InheritedElement(this);

  @protected
  bool updateShouldNotify(covariant InheritedWidget oldWidget);
}
```

**源码解读**：

* **createElement()** ：返回了一个 **InheritedElement** 实例。
* **updateShouldNotify()** ：子类按需重写，返回bool值，表示 **InheritedWidget** 更新时 **是否通知依赖它的子Widget重新构建。**

### 5.3. InheritedElement

```dart
class InheritedElement extends ProxyElement {
  InheritedElement(InheritedWidget super.widget);
  final Map<Element, Object?> _dependents = HashMap<Element, Object?>();

  @protected
  void notifyDependent(covariant InheritedWidget oldWidget, Element dependent) {
    dependent.didChangeDependencies();
  }

  @override
  void updated(InheritedWidget oldWidget) {
    if ((widget as InheritedWidget).updateShouldNotify(oldWidget)) {
      super.updated(oldWidget);
    }
  }

  @override
  void notifyClients(InheritedWidget oldWidget) {
    for (final Element dependent in _dependents.keys) {
      notifyDependent(oldWidget, dependent);
    }
  }
}

abstract class ProxyElement extends ComponentElement {
  ProxyElement(ProxyWidget super.widget);

  @override
  Widget build() => (widget as ProxyWidget).child;

  @override
  void update(ProxyWidget newWidget) {
    final ProxyWidget oldWidget = widget as ProxyWidget;
    super.update(newWidget);
    updated(oldWidget);
    rebuild(force: true);
  }

  @protected
  void updated(covariant ProxyWidget oldWidget) {
    notifyClients(oldWidget);
  }

  @protected
  void notifyClients(covariant ProxyWidget oldWidget);
}
```

**源码解读**：

* 当 **InheritedWidget** 需要更新时，父类 **ProxyElement#update()** 会被调用，其中调用了 **updated()。**
* **InheritedWidget#updated()** 判断 **updateShouldNotify()** 是否返回true，是调用父类**ProxyElement#updated()，** 其中调用了 **notifyClients()** 遍历依赖InheritedWidget的所有Element，调用 **notifyDependent()** 进行通知，具体调用的 **Element#didChangeDependencies() 触发重建**。

顺带看看 **Element类** 的 **dependOnInheritedWidgetOfExactType()** 和 **getElementForInheritedWidgetOfExactType()** 的区别：

```dart
@override
T? dependOnInheritedWidgetOfExactType<T extends InheritedWidget>({Object? aspect}) {
  final InheritedElement? ancestor = _inheritedElements == null ? null : _inheritedElements![T];
  if (ancestor != null) {
    return dependOnInheritedElement(ancestor, aspect: aspect) as T;
  }
  _hadUnsatisfiedDependencies = true;
  return null;
}

@override
InheritedWidget dependOnInheritedElement(InheritedElement ancestor, { Object? aspect }) {
  _dependencies ??= HashSet<InheritedElement>();
  _dependencies!.add(ancestor);
  ancestor.updateDependencies(this, aspect);
  return ancestor.widget as InheritedWidget;
}

@override
InheritedElement? getElementForInheritedWidgetOfExactType<T extends InheritedWidget>() {
  final InheritedElement? ancestor = _inheritedElements == null ? null : _inheritedElements![T];
  return ancestor;
}
```

可以看到前者多调了一个 **dependOnInheritedElement()** ，在其中注册了依赖关系，这就是为啥使用后者就不会回调 **didChangeDependencies()** 的原因。

### 5.4. 调用流程

😄 源码了解得差不多了，接着捋下调用流程~

## 6. 小结：Widget重建流程

🤔 通过跟踪源码，可以发现：无论是 **主动调用setState()** 传入匿名函数更新状态，还是 **InheritedWidget** 在共享数据发生改变时遍历所有依赖的子Widget的 **didChangeDependencies()** ，最终都是调用的 **markNeedsBuild()** ，该方法主要做了两件事：

* **_dirty = true** → 标记此Element为"dirty"，即状态改变需要重建，需要在下一帧中更新UI。
* **owner!._scheduleBuildFor(this);** → 安排重建，将此Element加入框架的 **重建队列**。这里的owner指的是Element的 **BuildOwner**，它负责管理一个Widget的构建过程。

在每个动画帧的开始，Flutter框架会调用 **BuildOwner#buildScope()** 创建一个 **上下文(Scope)** 来管理当前帧中所有需要重建的 Element：

* 遍历待处理队列中所有标记为"dirty"的Element。
* 按照一定的顺序 (通常是从顶部到底部) 执行它们的 **rebuild()** 方法进行重建。
* 方法内部会调用 **Widget#build()** ，这样，Widget 就会根据最新的状态被重建。