---
title: "Flutter入门到精通（十四）：状态管理之Provider详解"
pubDate: 2024-01-15
description: "Provider状态管理框架的使用详解，ChangeNotifier、Consumer、Selector等。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
---

> 本文是Flutter系统学习系列的第十四篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 概念

🤔 忘记在哪看到过这样一句话：

> **状态(State)管理**——响应式编程框架绕不过去的一道坎。

**Flutter Widget** 的核心设计理念之一也是 **响应式**，自然也需要面对这个问题。😆 在学习具体的状态管理框架前，先过下概念相关的东西~

### 1.1. 什么是状态？

> 答：**应用中随时可能变化且影响UI的信息**，如：用户交互 (文本输入)、从网络获取的数据 等。

### 1.2. Flutter中的状态分类

* **局部状态 (Local State)** ：**仅在单个Widget内部使用和管理**，如：复选框是否处于选中状态，并不需要共享给应用的其它部分。
* **全局状态 (Global State)** ：**跨多个Widget共享的状态**，如：用户的登录信息，需在多个页面中访问和显示。

😄 Flutter 中常说的状态管理，管的是 **全局/共享状态**。

### 1.3. Flutter预置哪些状态管理方式？

#### 1.3.1. setState()

**最基础的状态管理方式**，调用此方法告知Flutter框架，需要重新运行构建方法来更新UI。

> **局限**：主要适用于管理单个Widget或Widget树中 **较小范围的局部状态**，当应用规模扩大，需要 **跨多个Widget共享和更新状态** 时，会变得 **非常复杂和低效**。

#### 1.3.2. InheritedWidget

Flutter提供的功能性Widget，**允许共享数据在Widget树中从上往下传递**，而不需要通过 **在每个Widget的构造方法中传递**。

> **局限**：**需手动编写大量样板代码** (自定义InheritedWidget)，**子Widget中需显式声明依赖于哪个InheritedWidget**，**灵活性有限** (如异步更新、更细粒度的条件更新等支持困难)

😐 综上，当应用中只有 **少量简单状态需要管理**，直接使用 **setState()** 和 **InheritedWidget** 就可以了。但对于 **复杂的大型项目** (状态管理逻辑较为复杂的应用)，则需要选择一个 **更加高效、易维护的状态管理框架**。

### 1.4. 选状态管理框架要考虑的点有哪些？

* **API简洁易用**：开发者可以快速上手，轻松实现状态管理，不需要编写大量的模板代码。
* **性能**：只在必须更新时更新状态，且尽可能减少重建Widget的次数，以保持应用的流畅性能。
* **状态一致性**：多个Widget需响应一个状态变化，得确保所有相关组件都能及时并正确响应状态变化。
* **可预测**：同样的状态始终导致相同的输出，数据流向清晰且易于追踪。
* **模块化和可重用**：支持状态的模块化，允许状态被封装并在应用的不同部分重用。
* 可扩展性、调试/测试便利性、异步支持、状态同步、灵活性、状态恢复和持久化、文档和社区支持等...

😄 哈哈，有点书面化了，个人感觉在做库的快速选型时可以参考这个三要素：**Star数**、**issues数**、**最近Commit时间**。

😐 对了，前面写**《六、项目实战-非UI部分🤷‍♂️》**时提到了 **Eventbus (事件总线)** ，有读者可能有这样的问题？

**跨组件共享数据** 为啥不使用 **EventBus**？以前做Android开发时，跨Activity、Fragment传递数据，一种常规的解耦方式不就是用它吗？😳

🤔 em... 作为一个辅助工具来处理组件间的通信可以，但作为一个主要的状态管理方案就不太建议了，因为需要考虑很多问题，然后做好些额外设计，如：

* **状态一致性**：多个Widget需响应同一个状态变化时，你得确保所有相关组件都能 **及时正确响应状态变化**。
* **不直接支持状态的初始化和恢复**：可能需要额外的逻辑来确保状态的正确性。
* **很难实现细粒度的更新控制**：如仅在特定条件下更新状态或组件。
* **事件流散布，不好管理**：可能存在大量的事件和订阅者、事件链较长等，遇到问题定位根源比较困难。
* 需要在Widget销毁时 **手动解绑回调**，不然可能会引起 **内存泄露**。等等...

 综上，自己造轮子挖坑踩坑填坑，大可不必，官方文档[《List of state management approaches》](https://docs.flutter.dev/data-and-backend/state-mgmt/options)罗列了一系列的状态管理框架，本节挑个最简单的 **Provider** 学习一波~

## 2. Provider

**官方推荐**，**基于InheritedWidget实现**，允许开发者在应用的不同层级中 **传递和监听状态变化**。

### 2.1. 基本用法

执行 **flutter pub add provider** 添加依赖，然后开耍~

#### 2.1.1. 创建数据模型类 (继承ChangeNotifier)

在其中定义操作数据的方法，并调用 **notifyListeners()** 通知监听者数据变化：

```dart
import 'package:flutter/material.dart';

class LoginStatusModel extends ChangeNotifier {
  bool _isLogin = false;

  bool get isLogin => _isLogin;

  void updateLoginStatus(bool isLogin) {
    _isLogin = isLogin;
    notifyListeners();  // 通知监听者数据变化
  }
}
```dart

#### 2.1.2. 提供状态数据

通常在 main.dart 的 main() 中的 MaterialApp 的上方，使用 **Provider或其子类**，包裹 App实例，并将 **状态模型实例作为值传递**：

```dart
void main() {
  runApp(
    ChangeNotifierProvider(
      create: (context) => LoginStatusModel(),
      child: const MyApp()、
    ),
  );
}
```dart

#### 2.1.3. 使用状态数据

在需要访问或监听数据变化的Widet中，使用 **Provider.of()** 、**Consumer** 获取：

```dart
class TextWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // 使用 Consumer 监听 CounterModel
    return Consumer<LoginStatusModel>(
      builder: (context, loginStatus, child) {
        return Text('${loginStatus.isLogin}');
      },
    );
  }
}

// 也可以使用  Provider.of() 来获取：
Text('${Provider.of<LoginStatusModel>(context, listen: false).isLogin}')
```dart

#### 2.1.4. 多个需要共享的数据模型

可以使用 **MultiProvider** 来同时提供多个 Providers，代码示例如下：

```dart
void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => LoginStatusModel()),
        ChangeNotifierProvider(create: (context) => CounteModel()),
        // 其他 Providers...
      ],
      child: const MyApp(),
    ),
  );
}
```dart

#### 2.1.5. 处理异步数据

如果需要处理异步数据，可以使用 **FutureProvider** 或 **StreamProvider**，代码示例如下：

```dart
FutureProvider<String>(
  create: (context) => fetchData(),
  initialData: '加载中...',
  child: Consumer<String>(
    builder: (context, data, child) {
      return Text(data);
    },
  ),
)
```dart

### 2.2. 一点细节

#### 2.2.1. Provider.of() 的问题

**Provider.of()** 有一个参数 **listen**，默认为true，即监听状态变化，**调用了此方法的Widget将会被重建**。如果只是想在 **Widget#build()** 中访问状态，建议设置 **listen: false** 以减少不必要的重建。

#### 2.2.2. Consumer 调优小技巧

Consumer有个可选的 **Widget? child** 参数，可以将 **不需要在每次状态更新时重建的组件** 放在这个参数中，这样可以 **缩小控件的刷新范围**，提高性能。

简单代码示例：

```dart
return Scaffold(
  body: Consumer(
    builder: (BuildContext context,CounterModel counterModel,Widget? child){
      return Column(
        children: [
          Text("${counterModel.count}"),
          ElevatedButton(
            onPressed: ()=> counterModel.increment(),
            child: const Text("点击加1"),
          ),
          child!	// 引用child组件
        ],
      );
    },
    child: Column(
      children: [
        Text("不依赖状态变化的组件"),
      ],
    ),
  ),
);
```dart

#### 2.2.3. 更细粒度的刷新-Selector

**Consumer** 用于监听Provider中 **所有数据变化**，**Selector** 则用于是监听 **一个或多个值的变化**。简单代码示例：

```dart
class UserModel with ChangeNotifier {
  String _name;
  int _age;

  UserModel({String name = 'CoderPig', int age = 30})
      : _name = name,
        _age = age;

  String get name => _name;
  int get age => _age;

  set name(String newName) {
    _name = newName;
    notifyListeners(); // 通知监听者数据已更改
  }

  set age(int newAge) {
    _age = newAge;
    notifyListeners(); // 通知监听者数据已更改
  }
}

// 调用处：当name发生变化时重建，age发生变化不重建
Selector<UserModel, String>(
  selector: (_, model) => model.name,
  builder: (_, name, __) {
    return Text(name);
  },
)
```dart

**Tips**：Selector 也有 **Widget? child** 参数，可用于设置不需要更新的Widget，提高性能

#### 2.2.4. 快速调用扩展

库中有几个 **BuildContext** 的扩展，方便快速调用。

* **ReadContext** → **BuildContext.read()** ：对应 Provider.of()，用于获取数据，不会触发刷新。
* **WatchContext** → **BuildContext.watch()** ：对应Consumer()，只是不支持传child参数。
* **SelectContext** → **BuildContext.select()** ：对应 Selector()，只是不支持传child参数。

### 2.3. 其它API

* **FutureProvider**：适用于异步数据获取，可以轻松地在数据加载时显示加载指示器。
* **StreamProvider**：适用于流式数据，如数据库更新、WebSocket 消息等。
* **ProxyProvider**：可以组合多个 Providers，并基于它们的输出创建新的数据。
* **ListenableProvider**：适用于任何实现了 Listenable 接口的类。
* **ValueListenableProvider**：适用于 ValueListenable 类型的数据。

### 2.4. 源码解读

😄 Provider的用法还是非常简单的，接着来扒下源码，了解库背后的设计原理，使用起来更加有的放矢。先复习下 **InheritedWidget** 的原理图吧，毕竟 **Provider** 是基于它进行的封装：

#### 2.4.1. InheritedProvider

OK，开扒，先是 **ChangeNotifier**，它是Flutter Framework提供的基础类，用于：**在值改变时通知监听器**：

```dart
mixin class ChangeNotifier implements Listenable {
  // 核心属性
  int _count = 0;	// 监听器计数
  List<VoidCallback?> _listeners = _emptyListeners;	// 监听器列表

  // 核心方法
  void addListener(VoidCallback listener) { /* 添加一个监听器 */ }
  void removeListener(VoidCallback listener) { /* 移除监听器 */ }
  void notifyListeners() { /* 通知所有注册的监听器，即遍历调用监听器注册的回调函数 */  }
  void dispose() { /* 当对象不再需要调用时调用，它会移除所有监听器并释放资源 */ }
}
```dart

基于 **观察者模式** 实现，数据模型变化的方法中调用 **notifyListeners()** 通知所有监听器。那是啥时候添加和移除监听器的呢？看了下 **ChangeNotifierProvider** 没有找到相关调用，它继承了 **ListenableProvider**，在此找到了方法调用：

```dart
class ListenableProvider<T extends Listenable?> extends InheritedProvider<T> {
  ListenableProvider({
  Key? key,
  required Create<T> create,
  Dispose<T>? dispose,
  bool? lazy,
  TransitionBuilder? builder,
  Widget? child,
}) : super(
        key: key,
        startListening: _startListening,
        create: create,
        dispose: dispose,
        lazy: lazy,
        builder: builder,
        child: child,
      );

  static VoidCallback _startListening(
    InheritedContext<Listenable?> e,
    Listenable? value,
  ) {
    value?.addListener(e.markNeedsNotifyDependents);
    return () => value?.removeListener(e.markNeedsNotifyDependents);
  }
}
```dart

然后 **\_startListening()** 作为参数 **startListening** 传递给父类 **InheritedProvider** 的构造方法，点开父类发现它竟是 **所有 Provider的父类**，源码注释中这样描述它：**InheritedWidget的泛型实现**。简化版源码如下：

```dart
// 继承SingleChildStatelessWidget
class InheritedProvider<T> extends SingleChildStatelessWidget {
  // 创建新的数据对象，并通过InheritedProvider使其在应用的widget树中可用
  InheritedProvider({
    Key? key,
    Create<T>? create,	// 当Provider首次插入Widget树时调用，用于创建数据。
    T Function(BuildContext context, T? value)? update, // 当依赖的数据发生变化时调用，用于更新数据s
    UpdateShouldNotify<T>? updateShouldNotify,	// 数据更新后是否通知依赖InheritedWidget的Widgets
    void Function(T value)? debugCheckInvalidValueType,
    StartListening<T>? startListening,	// 数据对象被创建后立即监听它的变化，可在此设置监听器
    Dispose<T>? dispose,	// 当Provider从Widget树中移除时调用
    this.builder,	// 接受一个BuildContext和Widget的子节点，可以用它来构建一个依赖于BuildContext的Widget
    bool? lazy,	// 控制Provider的懒加载行为，默认为true，延迟创建数据对象，直到它被首次请求
    Widget? child,
  })  : _lazy = lazy,
        _delegate = _CreateInheritedProvider(
          create: create,
          update: update,
          updateShouldNotify: updateShouldNotify,
          debugCheckInvalidValueType: debugCheckInvalidValueType,
          startListening: startListening,
          dispose: dispose,
        ),
        super(key: key, child: child);

  // 已经有数据对象，且想在应用中共享时，可以使用这个构造方法
  InheritedProvider.value({
    Key? key,
    required T value,	// 需要共享的已经存在的数据对象
    UpdateShouldNotify<T>? updateShouldNotify,
    StartListening<T>? startListening,
    bool? lazy,
    this.builder,
    Widget? child,
  })  : _lazy = lazy,
        _delegate = _ValueInheritedProvider(
          value: value,
          updateShouldNotify: updateShouldNotify,
          startListening: startListening,
        ),
        super(key: key, child: child);

  // 传入delegate实例
  InheritedProvider._constructor({
    Key? key,
    required _Delegate<T> delegate,
    bool? lazy,
    this.builder,
    Widget? child,
  })  : _lazy = lazy,
        _delegate = delegate,
        super(key: key, child: child);

  final _Delegate<T> _delegate;
  final bool? _lazy;

  @override
  _InheritedProviderElement<T> createElement() {
    return _InheritedProviderElement<T>(this);
  }

  @override
  Widget buildWithChild(BuildContext context, Widget? child) {
    return _InheritedProviderScope<T?>(
      owner: this,
      // ignore: no_runtimetype_tostring
      debugType: kDebugMode ? '$runtimeType' : '',
      child: builder != null
          ? Builder(
              builder: (context) => builder!(context, child),
            )
          : child!,
    );
  }
}
```dart

🤔 定义了三种构造 **InheritedProvider实例** 的方法，差异点在于 **\_delegate属性** 的赋值，依次为： **\_CreateInheritedProvider** (数据对象随Provider创建而创建)、 **\_ValueInheritedProvider** (对已有的数据对象进行共享)、直接传入delegate实例。

#### 2.4.2. \_Delegate & \_DelegateState

点开这两个 **私有Provider的父类** 康康：

```dart
@immutable
abstract class _Delegate<T> {
  // 创建一个_DelegateState类型的实例
  _DelegateState<T, _Delegate<T>> createState();
}

abstract class _DelegateState<T, D extends _Delegate<T>> {
  // 指向_InheritedProviderScopeElement的引用
  _InheritedProviderScopeElement<T?>? element;

  // 返回当前的数据对象
  T get value;

  // 通过Element访问当前代理并强转，提供一种访问和操作代理数据的方法
  D get delegate => element!.widget.owner._delegate as D;

  // 是否有可用的数据值
  bool get hasValue;

  // 代理即将更新时调用，默认返回false
  bool willUpdateDelegate(D newDelegate) => false;

  // 当状态对象被销毁时调用
  void dispose() {}

  // 根据提供的数据和状态构建UI或执行逻辑，isBuildFromExternalSources参数用于指示构建是否由外部源 (如数据变化) 触发
  void build({required bool isBuildFromExternalSources}) {}
}
```dart

😳 哈？这 **\_Delegate** 和 **\_DelegateState** 跟 **Widget 和 State** 的关系有点像啊！这里是通过 **代理** 的方式来操作状态对象。接着依次看下 **\_DelegateState** 的两个子类，先是 **\_CreateInheritedProviderState**：

```dart
class _CreateInheritedProviderState<T>
    extends _DelegateState<T, _CreateInheritedProvider<T>> {
  VoidCallback? _removeListener; // 在不需要时移除监听器的回调
  bool _didInitValue = false;	// 是否初始化值的标记，即是否有可用的数据值
  T? _value;	// 存储状态数据
  _CreateInheritedProvider<T>? _previousWidget;	 // 指向前一个Widget的引用，用于更新时比较
  FlutterErrorDetails? _initError;	// 存储初始化时发生的错误详情

  @override
  T get value {
    // 检查是否在创建值时过程中抛出了异常，如果是抛出StateError
    // 通过一系列化的断言和状态标志来确保在创建或更新值时，正确地锁定和解锁状态，防止在不合适的时机读取或修改值。
    // 如果_didInitValue为false，说明值尚未初始化，尝试调用delegate.create() 或delegate.update() 来初始化或修改值。
    if (!_didInitValue) {
      _didInitValue = true;
      if (delegate.create != null) {
         _value = delegate.create!(element!);
      }
      if (delegate.update != null) {
         _value = delegate.update!(element!, _value);
      }
      // 暂时禁用对依赖项的通知，即执行下述操作期间，即使 InheritedWidget 状态发生变化
      // 也不不会立即通知依赖于它的Widget，防止更新过程中可能发生的不要的重建或更新。
      element!._isNotifyDependentsEnabled = false;
      // 尝试设置一个监听，以便在_value发生变化时做出响应
      _removeListener ??= delegate.startListening?.call(element!, _value as T);
      // 恢复对依赖项的通知
      element!._isNotifyDependentsEnabled = true;
      // 返回当前的状态数据
      return _value as T;
    }
  }

  @override
  void dispose() {
    super.dispose();
    // 如果有设置监听器，移除监听
    _removeListener?.call();
    if (_didInitValue) {
      delegate.dispose?.call(element!, _value as T);
    }
  }

  @override
  void build({required bool isBuildFromExternalSources}) {
    // 是否需要通知依赖项的标记
    var shouldNotify = false;
    // 外部触发 + 已初始化值 + 委托类实现了update()
    if (isBuildFromExternalSources &&
        _didInitValue &&
        delegate.update != null) {
      // 存储当前值
      final previousValue = _value;
      // 更新_value
      _value = delegate.update!(element!, _value as T);
      // 如果delegate提供了_updateShouldNotify()，使用这个方法决定是否通知依赖项
      if (delegate._updateShouldNotify != null) {
        shouldNotify = delegate._updateShouldNotify!(
          previousValue as T,
          _value as T,
        );
      } else {
        // 否则通过简单比较来判断是否通知
        shouldNotify = _value != previousValue;
      }
      // 需要通知依赖项的话，且存在监听器，移除监听器并将其值为null
      if (shouldNotify) {
        if (_removeListener != null) {
          _removeListener!();
          _removeListener = null;
        }
        _previousWidget?.dispose?.call(element!, previousValue as T);
      }
    }
    // 需要通知依赖项的话，将_shouldNotifyDependents设为true，确保依赖项会被通知
    if (shouldNotify) {
      element!._shouldNotifyDependents = true;
    }
    // 更新委托，调用父类的build()并返回，传递isBuildFromExternalSources参数
    _previousWidget = delegate;
    return super.build(isBuildFromExternalSources: isBuildFromExternalSources);
  }

  @override
  bool get hasValue => _didInitValue;
}
```dart

不难发现 \_**value** 做了 **懒加载**，在值需要用的的时候才调用create()初始化。然后build()中的逻辑：

* ① 判断是否同时满足 **外部触发**、**已初始化**、**委托类实现了update()** ，是才执行后续更新和通知。
* ② 更新状态：保存当前状态到previousValue，通过委托类的update() 方法来更新状态值\_value。
* ③ **决定是否通知依赖项**：如果委托类提供了 **\_updateShouldNotify()** ，调用此方法并传入新旧值进行比对，否则直接比较新旧值是否相等，根据比对值来决定是否通知。
* ④ **执行通知**：如果决定通知依赖项且存在监听器，将其移除并置为null，调用委托的dispose()来处理旧值。
* ⑤ **标记通知**：如果需要通知依赖项，将element的\_shouldNotifyDependents设置为true，确保依赖项会被通知。
* ⑥ 更新委托并调用父类的build()，同时 **isBuildFromExternalSources** 参数。

接着看看 **\_ValueInheritedProviderState：**

```dart
class _ValueInheritedProviderState<T>
    extends _DelegateState<T, _ValueInheritedProvider<T>> {
  VoidCallback? _removeListener;

  @override
  T get value {
    // 先禁用依赖通知，尝试设置一个数据变化监听，启用依赖通知，最后返回当前的状态数据
    element!._isNotifyDependentsEnabled = false;
    _removeListener ??= delegate.startListening?.call(element!, delegate.value);
    element!._isNotifyDependentsEnabled = true;
    assert(delegate.startListening == null || _removeListener != null);
    return delegate.value;
  }

  // 当 delegate 更新时是否应该通知依赖它的组件
  @override
  bool willUpdateDelegate(_ValueInheritedProvider<T> newDelegate) {
    bool shouldNotify;
    if (delegate._updateShouldNotify != null) {
      shouldNotify = delegate._updateShouldNotify!(
        delegate.value,
        newDelegate.value,
      );
    } else {
      shouldNotify = newDelegate.value != delegate.value;
    }

    if (shouldNotify && _removeListener != null) {
      _removeListener!();
      _removeListener = null;
    }
    return shouldNotify;
  }

  @override
  void dispose() {
    super.dispose();
    _removeListener?.call();
  }

  @override
  bool get hasValue => true;
}
```dart

大概流程和前者类似，代码简单多了，不过到此，我们还没看到 **InheritedWidget** 的身影，它在哪呢？

#### 2.4.3. \_InheritedProviderScope

回到 **InheritedProvider#buildWithChild()** 中的 **\_InheritedProviderScope**：

```dart
class _InheritedProviderScope<T> extends InheritedWidget {
  const _InheritedProviderScope({
    required this.owner,
    required this.debugType,
    required Widget child,
  })  : assert(null is T),
        super(child: child);

  final InheritedProvider<T> owner;
  final String debugType;

  @override
  bool updateShouldNotify(InheritedWidget oldWidget) {
    return false;
  }

  @override
  _InheritedProviderScopeElement<T> createElement() {
    return _InheritedProviderScopeElement<T>(this);
  }
}
```dart

😄 嘿，**InheritedWidget** 不就在这吗？通过构造方法传入一个 **InheritedProvider** 的引用，这货来看是充当 **状态管理中数据传递的桥梁** 啊。然后 **updateShouldNotify()** 原本的作用：

> 当InheritedWidget更新时，决定是否通知依赖它的子widget。

这里直接返回false，那InheritedWidget更新怎么通知依赖项更新啊？往下看你就知道了~

#### 2.4.4. \_InheritedProviderScopeElement

接着 **createElement()** 返回了一个 **\_InheritedProviderScopeElement** 实例，同样看下源码：

```dart
class _InheritedProviderScopeElement<T> extends InheritedElement
    implements InheritedContext<T> {
  _InheritedProviderScopeElement(_InheritedProviderScope<T> widget)
      : super(widget);

  bool _shouldNotifyDependents = false; // 是否需要通知依赖项
  bool _isNotifyDependentsEnabled = true;	// 是否允许通知依赖项
  bool _updatedShouldNotify = false;	// 状态是否有足够的变化需要通知依赖项
  bool _isBuildFromExternalSources = false;	// 当前构建是否由外部源触发

  // 尝试从祖先Element中查找特定类型的InheritedWidget
  @override
  InheritedElement? getElementForInheritedWidgetOfExactType<
      InheritedWidgetType extends InheritedWidget>() {
    InheritedElement? inheritedElement;
    visitAncestorElements((parent) {
      inheritedElement =
          parent.getElementForInheritedWidgetOfExactType<InheritedWidgetType>();
      return false;
    });
    return inheritedElement;
  }

  // 获取当前Widget
  @override
  _InheritedProviderScope<T> get widget =>
      super.widget as _InheritedProviderScope<T>;

  @override
  void updateDependencies(Element dependent, Object? aspect) {
    // 更新依赖此Element的依赖项列表
  }

  // 通知依赖此元素的Element
  @override
  void notifyDependent(InheriedWidget oldWidget, Element dependent) {
    // 获取依赖项依赖的数据
    final dependencies = getDependencies(dependent);
    // 是否需要通知的标记
    var shouldNotify = false;
    if (dependencies != null) {
      // 判断是否为代理类型
      if (dependencies is _Dependency<T>) {
        // 依赖项如果已经标记为需要重建(dirty)，无需执行选择器，直接返回
        if (dependent.dirty) {
          return;
        }
        // 遍历选择器，传入当前value (InheritedWidget的数据)
        for (final updateShouldNotify in dependencies.selectors) {
          shouldNotify = updateShouldNotify(value);
          // 如果有一个选择器返回true，表明根据当前数据变化，依赖项需要被通知
          if (shouldNotify) {
            break;
          }
        }
      } else {
        shouldNotify = true;
      }
    }
    // 如果最终决定需要通知依赖项，调用下述方法将依赖项标记为"dirty"
    if (shouldNotify) {
      dependent.didChangeDependencies();
    }
  }

  // InheritedWidget被新的实例替换时回调，对标志位进行设置
  @override
  void update(_InheritedProviderScope<T> newWidget) {
    _isBuildFromExternalSources = true;
    _updatedShouldNotify =
        _delegateState.willUpdateDelegate(newWidget.owner._delegate);
    super.update(newWidget);
    _updatedShouldNotify = false;
  }

  // InheritedWidget更新后调用
  @override
  void updated(InheritedWidget oldWidget) {
    super.updated(oldWidget);
    if (_updatedShouldNotify) {
      // 通知所有依赖当前InheritedWidget的元素
      notifyClients(oldWidget);
    }
  }

  // 依赖关系发生变化时回调
  @override
  void didChangeDependencies() {
    _isBuildFromExternalSources = true;
    super.didChangeDependencies();
  }

  @override
  Widget build() {
    // 懒加载，在需要时才计算值
    if (widget.owner._lazy == false) {
      value;
    }
    _delegateState.build(
      isBuildFromExternalSources: _isBuildFromExternalSources,
    );
    // 标记重置
    _isBuildFromExternalSources = false;
    if (_shouldNotifyDependents) {
      _shouldNotifyDependents = false;
      notifyClients(widget);
    }
    return super.build();
  }

  @override
  bool get hasValue => _delegateState.hasValue;

  // 标记需要通知依赖项
  @override
  void markNeedsNotifyDependents() {
    markNeedsBuild();
    _shouldNotifyDependents = true;
  }

  @override
  T get value => _delegateState.value;

  // 建立当前Element与祖先InheritedWidget的依赖关系
  @override
  InheritedWidget dependOnInheritedElement(
    InheritedElement ancestor, {
    Object? aspect,
  }) {
    return super.dependOnInheritedElement(ancestor, aspect: aspect);
  }
}
```dart

😐 不难看出这个类的主要作用就是 **负责管理和通知依赖项的更新**，回顾下原 **InheritedElement** 依赖项更新的方法调用流程：

上面说到 **\_InheritedProviderScope#updateShouldNotify()** 写死返回false，这样做的意图很明显：

> **接管 InheritedWidget 原先的更新机制，自定义更新逻辑，以实现更细粒度的刷新控制**。

具体细节如下：

* 用 **\_updatedShouldNotify** 的标志位代替 **原updateShouldNotify()** 维持原有的刷新逻辑。
* **notifyDependent()** 中对 **\_Dependency** 类型的数据做特殊处理，有状态更新通知依赖项。
* 重写 **markNeedsNotifyDependents()** ，用于强制依赖项更新。点开 **InheritedContext** 的源码，可以看到这个方法的注释：

```dart
/// It an extra [markNeedsNotifyDependents] method and the exposed value.
abstract class InheritedContext<T> extends BuildContext {.
  T get value;

  /// Marks the [InheritedProvider] as needing to update dependents.
  ///
  /// This bypass [InheritedWidget.updateShouldNotify] and will force widgets
  /// that depends on [T] to rebuild.
  void markNeedsNotifyDependents();

  bool get hasValue;
}
```dart

**简单翻译下**：

> 将InheritedProvider标记为需要更新依赖项，这将绕过InheritedWidget.updateShouldNotify，并将强制依赖的Widgets重新生成。

然后这方法在哪里有调用到呢？看回上面的 **ListenableProvider#\_startListening()** ：

🤏 吼，给状态数据value添加一个监听器，当value发生变化时，调用 markNeedsNotifyDependents() 标记依赖项需要被通知更新。返回一个匿名函数 (闭包)，在不需要监听value时接触监听关系，避免内存泄露。最后看下访问和监听状态的相关代码，先是 **Provider.of()** ：

```dart
static T of<T>(BuildContext context, {bool listen = true}) {
  final inheritedElement = _inheritedElementOf<T>(context);
  if (listen) {
   context.dependOnInheritedWidgetOfExactType<_InheritedProviderScope<T?>>();
  }
  final value = inheritedElement?.value;
  return value as T;
}
```dart

**dependOnInheritedWidgetOfExactType()** 上节讲过，获取最近的 **\_InheritedProviderScope<T?>** 实例，其中会调用 **dependOnInheritedElement()** 注册依赖关系，然后会回调 **didChangeDependencies()** 触发重建，这就是 **listen参数设置为false** 可以减少不必要重建的原因，最后返回了当前的状态数据。然后看下**Consumer**：

```dart
class Consumer<T> extends SingleChildStatelessWidget {
  Consumer({
    Key? key,
    required this.builder, // 如何根据数据和可选的child来构建这个Widget的UI
    Widget? child,
  }) : super(key: key, child: child);

  final Widget Function(
    BuildContext context,
    T value,
    Widget? child,
  ) builder;

  // 构建并返回Widget的实际UI
  @override
  Widget buildWithChild(BuildContext context, Widget? child) {
    return builder(
      context,
      Provider.of<T>(context),
      child,
    );
  }
}
```dart

继承了 **SingleChildStatefulWidget**，内部还是调用的 **Provider.of()** 来更新访问状态数据，Selector 也是类似，就不再复述了。

#### 2.4.5. 方法调用流程图

😄 到此，算是把Provider的源码快速过完了，估计大伙可能还有些混乱，接着画个调用流程图串起来，帮助理解整个框架的运行机制：