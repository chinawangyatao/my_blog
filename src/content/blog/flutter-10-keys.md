---
title: "Flutter入门到精通（十）：进阶：玩转各种Key"
pubDate: 2024-01-11
description: "Flutter中各种Key的作用和使用场景，ValueKey、GlobalKey、UniqueKey等。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: '/images/flutter-cover.png'
---

> 本文是Flutter系统学习系列的第十篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 问题引入

 写了一阵子UI，不知道大家有没有发现，在创建自定义Widget时，编译器总会贴心地提示我们 **在构造方法中添加一个key**：

**将自定义Widget的key参数传递给父类Widget的构造方法**，如果初始化自定义Widget实例时没有设置key参数，那么这个属性值就会是 **null**。那这个key到底是拿来干嘛的呢？

> 答：在Widget树中 **唯一标识(不能重复使用)** 和 **比较Widget**，以及在 **Widget移动或改变时保持其状态**。一般不需要设置它，除非是 **对某些具备状态且相同的组件进行增删或排序**。

写个没设置Key引起BUG的经典例子 (点击移除Widget数组中第一个元素)：

```dart
import 'package:flutter/material.dart';

class TestKeyPage extends StatefulWidget {
  const TestKeyPage({super.key});

  @override
  State<StatefulWidget> createState() => _TestKeyPageState();
}

class _TestKeyPageState extends State<TestKeyPage> {
  List<Widget> items = [
    const TestKeyWidget(color: Colors.green),
    const TestKeyWidget(color: Colors.blue),
    const TestKeyWidget(color: Colors.red)
  ];

  @override
  Widget build(BuildContext context) => Scaffold(
      floatingActionButton: FloatingActionButton(
          child: const Icon(Icons.remove),
          onPressed: () {
            items.removeAt(0);	// 点击移除
            setState(() {});
          }),
      body: Column(
        children: items,
      ));
}

class TestKeyWidget extends StatefulWidget {
  final Color color;

  const TestKeyWidget({super.key, required this.color});

  @override
  State<StatefulWidget> createState() => _TestKeyWidgetState();
}

class _TestKeyWidgetState extends State<TestKeyWidget> {
  int count = 0;

  void increment() {
    setState(() {
      ++count;
    });
  }

  @override
  Widget build(BuildContext context) => Container(
      color: widget.color,
      width: 100,
      height: 100,
      alignment: Alignment.center,
      child: GestureDetector(
        onTap: increment,
        child: Text("$count", style: const TextStyle(color: Colors.white, fontSize: 30)),
      ));
}
```

运行后，点击数字自增，让三个Widget数字依次显示为：**绿1蓝2红3**，然后点击移除按钮：

😳 第一个绿色Widget被移除了，但是数字显示不对，应该是：**蓝2红3**，现在却变成了：**蓝1红2**。解法也很简单，为每个TestKeyWidget指定一个key，如：

```dart
List<Widget> items = [
  const TestKeyWidget(key: ValueKey(1), color: Colors.green),
  const TestKeyWidget(key: ValueKey(2), color: Colors.blue),
  const TestKeyWidget(key: ValueKey(3), color: Colors.red)
];
```

此时再次重复上面的操作，Widget正确移除，数字也显示正确：

没有Key来标识Widget，发生重排序后，Flutter会 **错误地关联状态**，视觉上就看到：**位置移动** 了，但是 **状态却没随之移动**，导致状态看起来 **"丢失"** 了。

😁 **精简下就是**：

> **在需要保持状态 + 涉及到重排序的场景，不设置Key，都会有"状态丢失"的问题。**

接着了解下Flutter中Key相关的API~

## 2. Key详解

Key的类继承结构图如下：

### 2.1. Key

**抽象类**，有一个工厂构造方法，用于创建一个 ValueKey，一般不直接使用，而是用它的两个子类 **LocalKey** 和 **GlobalKey**。

### 2.2. GlobalKey

**全局唯一Key**，**每次build都不会重建**，**可以长期保持组件的状态**，**一般用于跨组件访问Widget的状态**。使用代码示例如下：

```dart
// 定义一个GlobalKey
final GlobalKey _globalKey = GlobalKey();

// 获得BuildContext、State 以及 Widget
_globalKey.currentContext;
_globalKey.currentState;
_globalKey.currentWidget;

// 获得 State，调用其中的属性示例
final state = _globalKey.currentState as _TestWidgetState;
state.count++;
print(state.count);
state.setState(() {});

// 获得 Widget，调用其中的属性示例
final widget = _globalKey.currentWidget as TestWidget;
print(widget.color);	// 获得控件颜色

// 获得 Context，调用其中的属性示例
final renderBox = _globalKey.currentContext!.findRenderObject() as RenderBox;
print(renderBox.size);	// 获得控件尺寸
print(renderBox.localToGlobal(Offset.zero))	// 获得控件坐标
```

**Tips**： **不要在build() 方法中创建GlobalKey**！！！性能不好不说，还可能出现意想不到的异常，如：子树里的GestureDetector可能会由于每次build时重新创建GlobalKey而无法继续追踪手势事件。

接着简单看下源码：

可以看到默认实现是 **LabeledGlobalKey** 类，也看下这个类的实现：

内部就一个 **debugLabel** 属性，仅仅为了debug时使用，实际开发不会传递这个参数，然后重写了toString() 方法。好像也没啥亮点🤔？往回看 **GlobalKey** 的源码，可以看到BuildContext、Widget、State 其实都是通过 **_currentElement** 属性来获取的，跟下 **_globalKeyRegistry**，指向 **BuildOwner**类中的一个map：

不难看出 **key为GlobalKey对象**，**value为与之关联的Element**，接着分别看下是啥时候 **建立关联** 与 **解除关联** 的。搜下 **_globalKeyRegistry[** 定位到了 **_registerGlobalKey()** 方法：

继续跟，定位到 **Element#mount()** 调用了这个方法：

当 **新建的Widget添加到Widget树** 时，Flutter会为它创建一个新的Element对象，并调用 **mount()** 方法将Element插入到Element树中，并关联一个新的或现有的渲染对象 (**RenderObject**)，这个过程就是所谓的 **挂载**。

与之对应的 **卸载** 则是通过 **unmount()** 方法实现，当Element被永久移除出渲染树时调用的，通常是**与之关联的Widget在树中已经不存在**，**或者被替换成了另一个不同类型的Widget**。该方法主要执行一些清理操作，如：释放资源，解除监听器等。

反过来跟下 **unmount()** 方法，可以看到其中调用了 **_unregisterGlobalKey()** ：

跟下这个方法：

果然，在这个方法里，根据key移除了对应的Element。 然后说下 **GlobalKey** 为什么是全局唯一的：

* 调用 **GlobalKey** 的 **构造方法**，默认返回一个 **新建的 LabeledGlobalKey 对象**
* 该类中没有对 **hashCode()** 和 **equals()** 方法进行重写，判断两个对象是否相等，直接通过 **引用比较(是否指向内存中的相同对象)** 得出结果，而且构造函数也没有用const修饰。

🤣 每次都是 **创建新的对象作为Key**，自然能保证 **全局唯一** 啊！接着，顺带提下另一个实现类 **GlobalObjectKey**，源码如下：

重写了 equals() 和 hashCode() 方法，内部维护一个Object对象，通过判断此对象是否指向同一块内存地址来判断两个GlobalObjectKey是否相等。

> **Tips：**  源码里没看到equals()，只看到了 **operator ==**，这是 **运算符重载** 的写法，作用都是一样的，用于判断两个对象是否相等。重写了 **equals()** 和 **hashCode()** 方法判断对象是否相等的流程：判断两者的哈希码是否相等，不等返回false，相等再执行equals() 进行下一步判断。identical() 用于检查两个引用是否指向同一对象。

所以，如果使用 GlobalObjectKey，是否能实现 **全局唯一性** 取决于你传入的Object对象是否是唯一的！

😶 另外，不要滥用 **GlobalKey**，比如下面两个场景：

* **没必要保存控件的状态也设置GlobalKey**，造成没必要的内存浪费；
* **ListView中为每个item都设置一个GlobalKey**，任何条目改变时，Flutter都需要重新检查整个列表，当列表很长时，会导致严重的性能下降，由此导致不佳的用户体验。

### 2.3. LocalKey

**局部唯一Key，** 或者说是 **同级唯一Key**，在同一父级元素中必须是唯一的，一般用于 **同级Widget间的比较和重排序**。问题引入部分的代码示例就用到了 **LocalKey**，不过用的是它的子类 **ValueKey**，一般很少直接用LocalKey，而是使用它的三个直接子类。依次介绍下~

#### 2.3.1. ValueKey

内部维护一个 **泛型value属性**，重写了==和hashCode()，如果两个ValueKey的 **value属性相等**，则认为两个Key相等。

#### 2.3.2. ObjectKey

内部维护一个 **Object?类型的value属性**，同样重写了==和hashCode()，如果两个ObjectKey的 value属性指向同一对象，则认为两个Key相等。

> 😃 总结下就是：**ValueKey** 判断 **对象值** 是否相等，**ObjectKey** 判断 **对象引用** 是否相等。

#### 2.3.3. UniqueKey

**独一无二的Key**，没有属性也没重写==和hashCode()，那就是比较 **UniqueKey** 对象本身是否 **指向同一个内存地址咯** 来判断Key是否相等。改下问题引入处的代码：

```dart
List<Widget> items = [
  TestKeyWidget(key: UniqueKey(), color: Colors.green),
  TestKeyWidget(key: UniqueKey(), color: Colors.blue),
  TestKeyWidget(key: UniqueKey(), color: Colors.red)
];
```

**UniqueKey()** 创建的Key唯一，所以组件的状态也得以保存。另外，它还有一个使用场景：

> 强制Flutter框架 **不复用旧的Widget而是重新创建**，每次都会走initState()初始化状态；

**参考文献**：

* [《Flutter三棵树系列之详解各种Key》](https://www.cnblogs.com/jingdongkeji/p/17427251.html)