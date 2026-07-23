---
title: "Flutter入门到精通（十五）：状态管理之Riverpod使用详解"
pubDate: 2024-01-16
description: "Riverpod状态管理框架的使用详解，Provider类型对比、最佳实践。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: '/images/flutter-cover.png'
---

> 本文是Flutter系统学习系列的第十五篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

😑 搜了圈 **Riverpod详解** 的文章，大多 **浅尝辄止**，写个Hello Riverpod就完了，写得好些的又 **年代久远**，基于 0.x、1.x 进行的讲解，最新版都更新到 **2.5.1** 了...

🙃 然后[《官方文档》](https://riverpod.dev/docs/introduction/getting_started)写得是 **一言难尽**，以致于我花了好些时间也无法 **一窥Riverpod的全貌**。查阅了大量文章 + 硬撸官方文档 + 自己实践 + 阅读源码，按照自己觉得比较合适的学习曲线，输出成一篇 **Riverpod用法详解** 的文章。希望能帮到在做 **Flutter状态管理框架选型** 的铁子，能够快速参透 **Riverpod的使用方法**。

## 1. Provider vs Riverpod

这两个库的作者都是 **Remi Rousselet**，新库命名其实就是旧库的 **字母重排**，估计是想表达 **Provider重构升级版** 的寓意😂。之所以要搞这个库，是因为 **Provider** 存在一些 **局限**，主要有这几点：

**① 依赖BuildContext**

Provider 是基于 **InheritedWidget** 封装，读取状态需要 BuildContxt，所以 **只能在Widget树中声明使用**。而在有些场景不不一定能直接拿到 BuildContext，如在 **非UI层** (如业务逻辑层) 访问状态，只能通过某种方式传递 BuildContext实例，繁琐之余还增加了代码的耦合度。使用不当，还可能导致 **ProviderNotFoundException**。

② **多个相同类型的Provider**，**需要自己维护一个Key进行区分**。

如：Widget树的同一层级，为相同类型的状态创建多个同类型的Provider，子Widget无法确定使用哪个Provider的数据，**需要指定一个特定的Key来进行区分**。😳 这种手动维护的东西，多了就容易乱...

```dart
void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => Counter(1), key: ValueKey(1)),
        ChangeNotifierProvider(create: (_) => Counter(2), key: ValueKey(2)),
      ],
      child: MyApp(),
    ),
  );
}

// 调用出，通过key指定使用哪个Counter实例
Provider.of<Counter>(context, listen: false, key: ValueKey(1)).increment();
```

**③ 如果需要跨Widget共享状态，Provider就没法弄成局部私有的，只能是全局可访问的。**

比如：同一层级的Widget → A、B、C、D，状态虽然只有A和C用到，但是为了共享，需要在 **更高层级** 注册这个状态，然后B和D也能访问到这个没用到的状态。另外，如果是涉及到跨多个层级共享状态的修改，复杂的多层嵌套，可能会改得你想骂人🤬

而 **Riverpod** 在 **Provider** 的基础上进行重构，解决上述问题之余，提供了 **更灵活/精细的状态管理机制**，**状态不可变**，**编译时类型安全**、**易于测试** 等特性，更清晰的代码组织和维护方式 (**注解代码生成**)，可以帮助我们有效地 **组织和管理大规模的状态**。

😄 当然，不是说 **Provider库** 就一无是处，它的优点是 **简单易用**，**上手难度低**，适用于应用规模较小，状态管理不太复杂的场景。**适合就好❗️** 接着说下 **Riverpod库** 的基本使用～

## 2. 基本使用

### 2.1. 依赖添加

**😮官方文档** 上来就让你唰唰唰在 **终端** 使用下述命令安装依赖包：

```dart
flutter pub add flutter_riverpod
flutter pub add riverpod_annotation
flutter pub add dev:riverpod_generator
flutter pub add dev:build_runner
flutter pub add dev:custom_lint
flutter pub add dev:riverpod_lint
```

或者在 **pubspec.yaml** 中添加依赖，然后执行 **flutter pub get** 安装依赖包：

```yaml
name: my_app_name
environment:
  sdk: ">=3.0.0 <4.0.0"
  flutter: ">=3.0.0"

dependencies:
  flutter:
    sdk: flutter
  # Riverpod核心库
  flutter_riverpod: ^2.5.1
  # Riverpod注解
  riverpod_annotation: ^2.3.5

dev_dependencies:
  # Dart代码生成文件
  build_runner:
  # 为Dart和Flutter项目自定义lint规则，Lint有助于捕获潜在错误，并强制执行一致的编程风格
  custom_lint:
  # Riverpod代码生成器
  riverpod_generator: ^2.4.0
  # 专为Riverpod设计的一套lint规则，有助于再使用Riverpod时执行最佳实践
  riverpod_lint: ^2.3.10
```

啊？不是，**这些库真的都是必须的吗**？

> 答：如果不需要 **不需要注解代码生成和Lint**，只添加一个 **flutter_riverpod** 就能正常使用 Riverpod了。然后，如果你项目有在用 **flutter_hooks** (支持React状态管理玩法的库，在不创建 StatefulWidget 和 State 的情况下，直接在函数组件中声明和管理状态)，可以添加 **hooks_riverpod** 依赖，其中包含一些额外功能来使得Hooks与Riverpod的集成更加容易。⚠️ 本节不讨论 hooks_riverpod 相关内容~

😳 官方 **推荐使用注解代码生成**，更好的可读性和灵活性，如：方便的参数传递，生成代码时 Riverpod会自动选择最合适的Provider类型。

### 2.2. 补全插件-Flutter Riverpod Snippets

😄 然后，为了简化 Riverpod 的代码编写，官方建议安装一个 **Flutter Riverpod Snippets** 的IDE插件：

对，就 **补全**，类似于 Live Template 那一套，输入 **触发补全的字母组合**，选中后回车补全：

**触发字母组合** & **对应生成的代码** 可到 [《Flutter Riverpod Snippets 插件主页》](https://marketplace.visualstudio.com/items?itemName=robert-brunhage.flutter-riverpod-snippets)自行查询，😏 有 **Github Copilot** 加持，表示不太需要介个，嘿嘿~

### 2.3. 简单代码示例

😄 前面说了，可以只添加一个 **flutter_riverpod** 依赖就可以使用Riverpod来管理状态，写个简单的计数器例子来验证，顺便熟悉Riverpod库的使用方法：

* **主页面**：显示当前计数的 Text + 点击跳转计数页的Button。
* **计数页**：显示当前计数的 Text + 点击计数+1的Button。
* 测试流程：点击主页面按钮跳转计数页，点几下计数Button，关闭页面，看主页面计数是否刷新。

**具体实现代码如下**：

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// ① 创建一个状态提供者，StateProvider会观察一个值，并再改变时得到通知
final clickCountProvider = StateProvider<int>((ref) => 0);

void main() {
  // ② 想使用Riverpod 的 Provider 必须用 ProviderScope 包裹MyApp！
  runApp(const ProviderScope(child: MyApp()));
}

// ③ 继承ConsumerWidget，它是可以提供监听Provider的Widget
class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // ④ 通过ref.watch() 来监听Provider的值，当Provider的值改变时，会自动刷新UI
    final int count = ref.watch(clickCountProvider);
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('Riverpod Demo')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Text('点击计数：$count'),
              Builder(
                builder: (context) => ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const CountPage()),
                    );
                  },
                  child: const Text('跳转到增加计数页面'),
                ),
              ),
            ],
          )),
      ),
    );
  }
}

class CountPage extends ConsumerWidget {
  const CountPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final int count = ref.watch(clickCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('增加计数'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text('点击计数：$count'),
            Builder(
              builder: (context) => ElevatedButton(
                onPressed: () {
                  // ⑤ 获取Provider的通知器修改状态值(自增)
                  ref.read(clickCountProvider.notifier).state++;
                },
                child: const Text('点击计数+1'),
              ),
            ),
          ],
        ))
    );
  }
}
```

**运行结果如下**：

😄 阔以正常使用，接着归纳下Riverpod的基本使用流程：

* ① 创建一个 **全局final** 的 **Provider实例** 来存储 **状态/数据**，传入一个 **初始化状态的方法**。
* ② 使用 **ProviderScope** 包裹 **MyApp** 实例。
* ③ 需要用到状态的 **Widget** 继承 **ConsumerWidget**，它的 **build()** 会提供一个 **WidgetRef** 类型的参数。
* ④ 需要 **读取状态值**，调用 **ref.watch(xxxProvider)** 来获取，状态值改变，会触发UI更新。
* ⑤ 需要 **修改状态值**， 调用 **ref.read(xxxProvider.notifier).state** = xxx。

😁 还算简单，接着添加 **注解相关的依赖**，试下 **代码生成** 的玩法，先注释掉定义clickCountProvider变量的那一行，添加下述代码：

```dart
@Riverpod(keepAlive: true)
int clickCount(ClickCountRef ref) => 0;
```

然后打开 **终端**，可以执行 **flutter pub run build_runner build** 生成对应的Provider代码，也可以执行 **flutter pub run build_runner watch** 监听相关文件改动触发代码文件的重新生成。😣 然后代码报错了：

提示找不到这个 **notifier**，点进去看下这个生成的 **clickCountProvider** 实例：

😮 咦，生成的代码用的是 **Provider** 类，上面没用注解的写法，用的是 **StateProvider**。在解决报错前，先来过下 Riverpod 中都有哪几种 Provider 吧 ❗️

### 2.4. 各种 Provider

**Provider (状态提供者)** 是 **Riverpod** 里 **状态管理的核心**，负责创建和存储管理状态，通知UI组建状态更新等功能，Riverpod 提供了下述这些不同类型的 Provider，以满足不同的需求：

* **Provider**：只存储 **不可变** 的值或对象，最简单的状态提供者，只对外提供访问状态值的接口，外部无法对状态值进行修改。
* **FutureProvider**：处理 **异步操作**，如：从网络请求数据数据，它会再Future完成时通知其观察者。通常与 **autoDispose** 修饰符一起使用。
* **StreamProvider**：处理 **基于流的异步数据**，监听一个Stream，并在新数据到达前通知其观察者。

😄 用 **FutureProvider** 和 **StreamProvider** 写个简单的异步加载网络数据的简单例子：

```dart
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final articleFutureProvider = FutureProvider.autoDispose(
    (ref) async => await Dio().get('https://www.wanandroid.com/article/list/0/json').then((res) => res.data));

final articleStreamProvider = StreamProvider.autoDispose((ref) async* {
  final response = await Dio().get('https://www.wanandroid.com/article/list/0/json');
  yield response.data;
});

void main() {
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('Riverpod Demo')),
        body: const Row(
          children: [
            Expanded(child: FutureProviderExample()),
            Expanded(child: StreamProviderExample()),
          ],
        ),
      ),
    );
  }
}

class FutureProviderExample extends ConsumerWidget {
  const FutureProviderExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final responseAsyncValue = ref.watch(articleFutureProvider);

    return Center(
        child: SingleChildScrollView(
            child: responseAsyncValue.when(
      data: (data) => Text('Data: $data'),
      loading: () => const CircularProgressIndicator(),
      error: (err, stack) => Text('Error: $err'),
    )));
  }
}

class StreamProviderExample extends ConsumerWidget {
  const StreamProviderExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final responseStream = ref.watch(articleStreamProvider);
    return Center(
        child: SingleChildScrollView(
            child: responseStream.when(
      data: (data) => Text('Data: $data'),
      loading: () => const CircularProgressIndicator(),
      error: (err, stack) => Text('Error: $err'),
    )));
  }
}
```

运行结果如下，

上面监听 **FutureProvider** 或 **StreamProvider** 时，返回类型是 **AsyncValue**，用于表示 **异步操作的不同状态** (加载中、已完成、操作失败)，可以使用 **when关键字** 来处理不同的状态。

😊 继续过完剩下的Provider：

**❗️Riverpod 2.0新增**：

* **NotifierProvider**：提供一种更灵活的方式来管理状态和业务逻辑，支持任何类型的 **"Notifier"** 。
* **AsyncNotifierProvider**：专门用于管理异步操作的状态，如网络请求，它提供了一个结构化的方法来处理异步数据的加载、成功、错误和状态更新。

❎ **已过时**：

* **StateProvider**：创建和提供一个简单的可变状态，允许监听状态变化并响应这些变化。Riverpod 2.0 中推荐使用 **NotifierProvider** 来代替它。
* **StateNotifierProvider** ：将 **StateNotifier** 类与 **Riverpod** 集成，管理复杂的状态逻辑，并通知UI更新。Riverpod 2.0 中推荐使用 **NotifierProvider** 来代替它。
* **ChangeNotifierProvider**：将 **ChangeNotifier** 类与 **Riverpod** 集成，管理可观察的状态对象，**ChangeNotifier** 中需要自己调用 **notifyListeners()** 通知变更。

😏 吼吼，试下用2.0新增的 **NotifierProvider** 来替换前面的 **StateProvider**，解决报错的问题：

```dart
class ClickCount extends Notifier<int> {
  // 重写此方法返回Notifier的初始状态
  @override
  int build() => 0;

  void increment() {
    // state 表示当前状态
    state++;
  }
}

final clickCountProvider = NotifierProvider<ClickCount, int>(() => ClickCount());

// 之前的 ref.read(clickCountProvider.notifier).state++;
ref.read(clickCountProvider.notifier).increment();
```

**😄** 正常运行，但没法像之前那样直接 **notifier).state++** ，看下**NotifierProvider** 的定义：

> typedef NotifierProvider<NotifierT extends Notifier, T

呕吼，**类型别名**，接受两个 **泛型参数**，前者是 Notifier 的字类，定义了 **状态和如何修改状态的逻辑**，后者则是 **管理的状态类型**。**NotifierProvider** 实例会创建一个 **NotifierT** 类型的对象，并监听其状态变化，当状态变化时，所有依赖此提供者的部分都将重新构建。

而 **Notifier** 的 **state** 属性是 **protected** 的，只能在 **Notifier类或其子类中被访问和修改**。这样确保了状态的一致性和可预测性，防止在Notifier之外的地方意外修改状态。这就是上面修改状态，不直接获取state自增，而是老老实实在Notifier里写状态改变方法的原因 ❗️

😏 每次使用 **NotifierProvider** 都得先创建Notifier类，然后创建NotifierProvider来包裹他，有点麻烦了啊，其实可以使用 **@riverpod** 注解来自动生成：

```dart
import 'package:riverpod_annotation/riverpod_annotation.dart';
part 'main.g.dart';

@riverpod
class ClickCount extends _$ClickCount {
  @override
  int build() => 0;

  void increment() {
    state++;
  }
}
```

执行 **flutter pub run build_runner build** 生成代码，点开这个 **_$ClickCount** 类：

呕吼，**ClickCount** 其实是继承了 **AutoDisposeNotifier** 类，相比 **Notifier** 多了一个特性，当没有任何监听器监听它时 (**ref.watch/ref.listen**)，它会自动被清理，这样有助于避免内存泄露。😁 如果想让 **ClickCount** 继承 **Notifier**，只需改下注解： **@Riverpod(keepAlive: true)** ，注意此处 **首字母是大写的** ❗️ 看下生成后的代码：

😄 看到这里，读者估计会好奇： **@riverpod** 和 **@Riverpod** 两个注解有什关系呢？看下源码就知道了~

@riverpod 就是 **Riverpod构造方法的简化调用** 而已，**keepAlive** 默认为 **false**，即 **autoDispose**。

> **Tips**：使用 **注解生成不同类型** Provider的用法示例，可自行查阅[《About code generation》](https://riverpod.dev/docs/concepts/about_code_generation)

### 2.5. WidgetRef

说完 **Provider**，接着说下 **WidgetRef**，它提供了一些方法，用于监听和读取Provider的状态：

* **watch()** ：监听Provider，当状态改变时，使用 watch() 的 Widget 会自动重建。
* **read()** ：**只读取Provider的当前状态**，状态改变，Widget不会重建。
* **listen()** ：通常用于在 **build()** 中监听Provider，当状态改变时，会调用设置的监听器，监听器会在idget重建时自动移除。
* **listenManual()** ：通常在 **State.initState()** 或其它生命周期中监听Provider，此方法返回一个 **ProviderSubscription** 对象，可以使用它来停止监听close()，或者读取Provider的当前状态。
* **refresh()** ：立即使Provider的当前状态无效，**重新计算并返回新值**，常用于触发异步Proivder的重新获取数据，如：下拉刷新、错误重试 等场景。
* **invalidate()** ：使Provider的当前状态无效，然后在下一次读取provider或者下一帧时，Provider会被重新计算。refresh() 是同步的，它是 **异步** 的，没有返回值。
* **exists()** ：判断 Provider 是否已经初始化。

然后是 **获取WidgetRef的方式**，除了上面继承 **ConsumerWidget**，直接通过它的 **build()** 获取外，还可以：

* 继承 **ConsumerStatefulWidget**，通过它的 **State.build()** 获取。
* 使用 **Consumer/ConsumerBuilder** 包裹需要使用 **ref** 的 **Widget**，在 **builder**() 中获取。

简单示例如下：

```dart
class Example extends ConsumerStatefulWidget {
  @override
  _ExampleState createState() => _ExampleState();
}

class _ExampleState extends ConsumerState<Example> {
  @override
  Widget build(BuildContext context) {
    // 在这里你可以使用 ref
    final value = ref.watch(someProvider);
    return Text(value);
  }
}

class Example extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer(
      builder: (context, ref, child) {
        final AsyncValue<Example> example = ref.watch(someProvider);
        return Center(
          child: switch(example) {
             AsyncData(:final value) => Text('Example: ${value.example}'),
             AsyncError() => const Text('Oops, something unexpected happened'),
             AsyncLoading() => const CircularProgressIndicator(),
          }
        )
        // 在这里你可以使用 ref
        final value = ref.watch(someProvider);
        return Text(value);
      },
    );
    }
}
```

**对应关系**：**ConsumerWidget** → **StatelessWidget**，**ConsumerStatefulWidget** → **StatefulWidget**，前者更适合在 **Widget.build()** 中使用，后者可以在 **Widget的生命周期** 中使用Provider，如 initState() 或 dispose() 中。

🤷‍♂️ 基本使用就讲到这，基本可以畅通玩耍Riverpod了，接着对官方文档提到的一些细节点进行解读~

## 3. 进阶使用

### 3.1. 使用Provider发起你的第一个请求

[官方文档](https://riverpod.dev/docs/essentials/first_request) 如是说：

> 网络请求通常属于 **业务逻辑**，在 **Riverpod** 中，业务逻辑被放置在 "**providers**" 中，Provider 是一个强大的函数，具有：**缓存**、**默认错误/加载处理**、**可监听**、**某些数据变化时自动重新执行** 等特性。这使得 Provider 很适合拿来处理 **Get** 请求。

😄 稍微小改下官方给出的代码实例：

**运行输出结果**：

🤷‍♂️ 当然，也可以使用文档里的风骚写法，用 **switch** 来代替 **when**：

然后是可以用 **ConsumerWidget** 来替代 **Consumer** 来减少代码缩进：

再然后是用 **ConsumerStatefulWidget** 来重写：

😄 直接用 **AsyncValue** 省事多了，换之前**《九、UI实战-Loading缺省页组件封装》**还得套个 **FutureBuilder** 来根据异步操作结果自动更新UI。

### 3.2. 执行副作用 (Side Effects)

没有太多前端开发经验的我，一开始看到 [**副作用**](https://riverpod.dev/docs/essentials/side_effects) 这个词是一脸懵逼的 ，后来发现指的是：

> 函数或方法在执行时，除了返回值之外，对外部产生的任何影响。如：修改全局变量、发起网络请求、写入文件、改变程序状态等。

**举两个例子🌰：**

```dart
// 修改全局变量
// 函数不仅返回计算结果，还修改了一个全局计数器，这个行为就是副作用，它影响了程序中其它部分的状态
counter = 0  # 全局变量

def increment_and_return():
  global counter
  counter += 1
  return counter

print(increment_and_return())  # 输出 1，同时修改了全局变量 counter

// 发送网络请求
// 点击按钮发送请求以添加一个Todo项，发送请求这个动作就是一个副作用
// 因为它改变了应用的状态 (可能从服务器获取了新数据)
ElevatedButton(
  onPressed: () {
    // 请求以添加一个Todo项
  },
  child: Text('Add Todo'),
)
```

副作用可能使程序的逻辑变得复杂和难以预测，因此在设计程序时，**管理好副作用** 非常重要，在 **函数式编程**中，推崇没有副作用的函数 (**纯函数**)，这样的函数 **仅通过输入值来确定输出值**，不会影响外部状态，这有助于提高代码的可预测性和可维护性。但在Flutter中，副作用通常是 **与用户交互和数据管理的一部分**，**Riverpod** 就是用来帮助开发者以一种 **更可控和可预测的** 的方式来处理这些副作用的。

🤔 **Riverpod** 中提供了一种 **特殊的Provider** 来封装执行副作用的逻辑，并通过其方法触发这些副作用 → **Notifier**，😄 是的，就是我们前面写 **NotifierProvider例子** 提到的那个 **Notifier**。然后文档写了一个添加Todo的例子，这里稍微调整一下。

看下生成的代码：

接着添加一个 addTodo() 的方法，向后台提交一条Todo记录，添加完，客户端得 **刷新状态(更新本地缓存)** ，比如为 **待办列表变量** 添加一个Todo。然后是几种不同的情况：

① **提交时后端返回新的资源状态**

② **后端没返回新的状态资源，需要自己重新执行Get请求拉取**

③ **手动更新本地缓存**

### 3.3. 将参数传递给请求

HTTP请求，通常依赖于 **外部参数**，现在请求是放在Provider里的，该如何传参呢？

监听处：

**运行输出结果**：

**注意事项**：

> ❗️ 如果两个Widget使用 **相同的Provider+ 相同的参数**，那只会发起一个请求，否则会发起两个请求。Riverpod依赖于参数的 **==运算符**，如果直接实例化一个新对象作为Provider的参数，该对象没有重写==运算符的话，Riverpod会认为参数不同，从而尝试发起新的网络请求。如想传递一个list：ref.watch(activityProvider( **['recreational', 'cooking']** )); 应该添加一个 const 修饰符 → **const ['recreational', 'cooking']** ，或者重写List的==运算符。为了帮助发现此类错误，建议使用 **riverpod_lint** 并启用 **provider_parameters lint** 规则来帮助发现和避免上述错误。

另外，如果不是使用注解生成代码，可以通过 **family()** 来添加参数，代码示例如下：

```dart
final messagesFamily = FutureProvider.family<Message, String>((ref, id) async {
  return dio.get('http://my_api.dev/messages/$id');
});
```

### 3.4. WebSocket 与 同步执行

**Future** 是构建 **Riverpod** 应用的核心方式，但它也支持其它格式，如 **同步对象** 和 **Stream**。同步对象示例：

```dart
// 函数返回类型没用用 Future 包裹
@riverpod
int synchronousExample(SynchronousExampleRef ref) {
  return 0;
}

Consumer(
  builder: (context, ref, child) {
    // 因为是同步的，所以值不需要用AsyncValue来包裹
    int value = ref.watch(synchronousExampleProvider);
    return Text('$value');
  },
);
```

不支持 **ChangeNotifier** 或 **StateNotifier** 等可监听对象，如果需要与这些对象交互的话，可以将其 **通知机制** 从管道传递到 Riverpod。代码示例：

```dart
@riverpod
ValueNotifier<int> myListenable(MyListenableRef ref) {
  final notifier = ValueNotifier(0);

  // 添加清理回调，当Provider被销毁时，它会调用ValueNotifier#dispose() 来释放资源
  ref.onDispose(notifier.dispose);

  // 添加监听器，当 ValueNotifier 值发生改变时，通知依赖于Provider的所有Widget
  notifier.addListener(ref.notifyListeners);

  // 返回ValueNotifier对象，以便在应用的其它部分中使用
  return notifier;
}
```

如果需要频繁编写这样的逻辑，可以写个 **Ref扩展**，将处理可监听对象的逻辑提取出来，方便复用：

```dart
extension on Ref {
  T disposeAndListenChangeNotifier<T extends ChangeNotifier>(T notifier) {
    onDispose(notifier.dispose);
    notifier.addListener(notifyListeners);
    return notifier;
  }
}

// 调用代码示例
@riverpod
ValueNotifier<int> myListenable(MyListenableRef ref) {
  return ref.disposeAndListenChangeNotifier(ValueNotifier(0));
}

@riverpod
ValueNotifier<int> anotherListenable(AnotherListenableRef ref) {
  return ref.disposeAndListenChangeNotifier(ValueNotifier(42));
}
```

关于 **Stream** 的监听用法，前面讲过了，就不再赘述了~

### 3.5. 请求合并

实际开发中，可能存在 **需要基于一个请求的结果来触发另一个请求** 的场景，一种解法是将一个Provider的结果作为参数传递给另一个Provider ，可以，但用起来比较麻烦。为了改善这一点，Riverpod提供了另一种解法，将**Ref参数** 传递给Provider。代码示例 (先获取用户位置，然后使用此位置来获取附近的餐馆)：

### 3.6. 状态销毁

* **@Riverpod** 注解设置 **keepAlive: true**，可以防止Provider没有监听者时状态被销毁。
* 可以调用 **ref.onDispose()** 设置一个监听器，以便在状态被销毁时执行一些逻辑，如：关闭 StreamController。
* 除此之外，还有 **ref.onCancel** (当Provider最后一个监听者被移除时调用) 和 **ref.onResume** ( 在onCancel()被调用后添加了新的监听者时调用) 。
* 使用 **ref.invalidate()** 可以强制销毁Provider，如果Provider正在被监听，会创建一个新状态，如果没有，Provider 将被完全销毁。
* **更细粒度的控制销毁**：通过 **ref.keepAlive()** ，可以在自动销毁被启用的情况下，更细致地控制状态的销毁行为。如：在请求成功后保持状态，请求失败时不缓存。
* **让状态活跃一段时间**：Riverpod没有内置方法来实现，可以通过 Timer + ref.KeepAlive() 来实现，文档中定义了这样一个扩展：

```dart
extension CacheForExtension on AutoDisposeRef<Object?> {
  void cacheFor(Duration duration) {
    // 调用keepAlive()创建一个链接，只要链接保持打开状态，就会阻止对象被自动清理
    final link = keepAlive();
    // 定时器，指定时间段过去后，对象将不再保持活动状态
    final timer = Timer(duration, link.close);
    // 对象被处理时取消定时器，避免内存泄露
    onDispose(timer.cancel);
  }
}

// 使用示例
@riverpod
Future<Object> example(ExampleRef ref) async {
  /// 让状态存在5分钟
  ref.cacheFor(const Duration(minutes: 5));
  return http.get(Uri.https('example.com'));
}
```

### 3.7. Provider 即时初始化

**Provider** 默认是 **懒加载** 的，在首次使用时才初始化，如果需要实现 **即时初始化**，可以在 **ProviderScope** 下放置一个 **ConsumerWidget**，并在其中使用 **watch()** 来观察 **Provider**，以此实现 **即时初始化**。代码示例如下：

```dart
void main() {
  runApp(ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const _EagerInitialization(
      child: MaterialApp(),
    );
  }
}

class _EagerInitialization extends ConsumerWidget {
  const _EagerInitialization({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(myProvider);
    return child;
  }
}
```

**问**：当Provider重建，会不会导致整个应用重建？

> **答**：不会，它返回一个child，而不是 **实例化MaterialApp本身**，_EagerInitialization 重新构建，child变量不会改变，Widget没变化，Flutter自然不会重建它。

如果需要处理加载和错误状态，可以添加下述判断：

```dart
class _EagerInitialization extends ConsumerWidget {
  const _EagerInitialization({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final result = ref.watch(myProvider);

    if (result.isLoading) {
      return const CircularProgressIndicator();
    } else if (result.hasError) {
      return const Text('Oopsy!');
    }

    return child;
  }
}
```

### 3.8. 更细粒度的监听-select()

指定 **Provider中某个值改变才进行刷新**，精确控制刷新范围，可以避免不必要的重建。通常与ref.watch() 结合使用，简单使用代码示例：

```dart
class User {
  late String firstName, lastName;
}

@riverpod
User example(ExampleRef ref) => User()
  ..firstName = 'John'
  ..lastName = 'Doe';

class ConsumerExample extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // 只关心firstName属性
    String name = ref.watch(exampleProvider.select((it) => it.firstName));
    return Text('Hello $name');
  }
}
```

如果是监听另外一个 **异步Provider**，可以使用 **selectAsync()** ，代码示例：

```dart
@riverpod
Object? example(ExampleRef ref) async {
  final firstName = await ref.watch(
    userProvider.selectAsync((it) => it.firstName),
  );
}
```

### 3.9. 案例：下拉刷新

🤷‍♂️ 就一个下拉刷新，重新执行请求的例子，比较简单：

```dart
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:http/http.dart' as http;
import 'package:riverpod_annotation/riverpod_annotation.dart';
part 'test_provider.g.dart';
part 'test_provider.freezed.dart';

void main() => runApp(const ProviderScope(child: MyApp()));

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(home: ActivityView());
  }
}

class ActivityView extends ConsumerWidget {
  const ActivityView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activity = ref.watch(activityProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Pull to refresh')),
      body: RefreshIndicator(
        // 刷新时调用 ref.refresh() 刷新 Provider
        onRefresh: () => ref.refresh(activityProvider.future),
        child: ListView(
          children: [
            switch (activity) {
              AsyncValue<Activity>(:final valueOrNull?) =>
                  Text(valueOrNull.activity),
              AsyncValue(:final error?) => Text('Error: $error'),
              _ => const CircularProgressIndicator(),
            },
          ],
        ),
      ),
    );
  }
}

@riverpod
Future<Activity> activity(ActivityRef ref) async {
  final response = await http.get(
    Uri.https('www.boredapi.com', '/api/activity'),
  );

  final json = jsonDecode(response.body) as Map;
  return Activity.fromJson(Map.from(json));
}

@freezed
class Activity with _$Activity {
  factory Activity({
    required String activity,
    required String type,
    required int participants,
    required double price,
  }) = _Activity;

  factory Activity.fromJson(Map<String, dynamic> json) =>
      _$ActivityFromJson(json);
}
```

### 3.10. 案例：防抖动/取消网络请求

* **防抖动** (Debouncing)：发送请求前等待用户输入一段时间，确保即使用户输入很快，也只发送一个请求。
* **取消** (Cancelling)：如果用户在请求完成前离开了页面，则取消该请求，避免处理用户看不到的响应。

Riverpod 中可以利用 **ref.onDispose()** 结合 **autoDispose** 或 **ref.watch()** 来实现上述行为。官方文档先写了个一个简单的例子：**main.dart** → 没啥内容，就按钮点击跳转 **DetailPageView**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'detail_screen.dart';

void main() => runApp(const ProviderScope(child: MyApp()));

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      routes: {
        '/detail-page': (_) => const DetailPageView(),
      },
      home: const ActivityView(),
    );
  }
}

class ActivityView extends ConsumerWidget {
  const ActivityView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home screen')),
      body: const Center(
        child: Text('Click the button to open the detail page'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.of(context).pushNamed('/detail-page'),
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

**detail_screen.dart** → 下拉发起请求，并刷新页面

```dart
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:http/http.dart' as http;
part 'detail_screen.freezed.dart';
part 'detail_screen.g.dart';

@freezed
class Activity with _$Activity {
  factory Activity({
    required String activity,
    required String type,
    required int participants,
    required double price,
  }) = _Activity;

  factory Activity.fromJson(Map<String, dynamic> json) =>
      _$ActivityFromJson(json);
}

@riverpod
Future<Activity> activity(ActivityRef ref) async {
  final response = await http.get(
    Uri.https('www.boredapi.com', '/api/activity'),
  );

  final json = jsonDecode(response.body) as Map;
  return Activity.fromJson(Map.from(json));
}

class DetailPageView extends ConsumerWidget {
  const DetailPageView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activity = ref.watch(activityProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detail page'),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(activityProvider.future),
        child: ListView(
          children: [
            switch (activity) {
              AsyncValue(:final valueOrNull?) => Text(valueOrNull.activity),
              AsyncValue(:final error?) => Text('Error: $error'),
              _ => const Center(child: CircularProgressIndicator()),
            },
          ],
        ),
      ),
    );
  }
}
```

然后是离开页面 **取消请求**：

```dart
@riverpod
Future<Activity> activity(ActivityRef ref) async {
  final client = http.Client();
  // 🌟 当 Provider 关闭时，关闭http客户端
  ref.onDispose(client.close);
  final response = await client.get(
    Uri.https('www.boredapi.com', '/api/activity'),
  );
  final json = jsonDecode(response.body) as Map;
  return Activity.fromJson(Map.from(json));
}
```

然后加上 **防抖**：

```dart
@riverpod
Future<Activity> activity(ActivityRef ref) async {
  // 🌟 Provider 被销毁的标记，在onDispose() 回调时将值设置为true
  var didDispose = false;
  ref.onDispose(() => didDispose = true);
  // 延时500ms防抖
  await Future<void>.delayed(const Duration(milliseconds: 500));
  // 🌟 如果标记为true，说明Provider已经被销毁了，抛出异常
  if (didDispose) {
    throw Exception('Cancelled');
  }
  final client = http.Client();
  // 🌟 当 Provider 关闭时，关闭http客户端
  ref.onDispose(client.close);

  final response = await client.get(
    Uri.https('www.boredapi.com', '/api/activity'),
  );

  final json = jsonDecode(response.body) as Map;
  return Activity.fromJson(Map.from(json));
}
```

接着通过定义 **Ref的扩展方法**，减少重复代码编写：

```dart
extension DebounceAndCancelExtension on Ref {
  Future<http.Client> getDebouncedHttpClient([Duration? duration]) async {
    var didDispose = false;
    onDispose(() => didDispose = true);
    await Future<void>.delayed(duration ?? const Duration(milliseconds: 500));
    if (didDispose) {
      throw Exception('Cancelled');
    }
    final client = http.Client();
    onDispose(client.close);
    return client;
  }
}

// 调用处
@riverpod
Future<Activity> activity(ActivityRef ref) async {
  final client = await ref.getDebouncedHttpClient();
  final response = await client.get(
    Uri.https('www.boredapi.com', '/api/activity'),
  );
  final json = jsonDecode(response.body) as Map;
  return Activity.fromJson(Map.from(json));
}
```

### 3.11. 启用 riverpod_lint/custom_lint

Riverpod 附带一个可选的 **riverpod_lint** 包，该包提供 lint 规则来帮助您编写更好的代码，并提供自定义重构选项。添加完依赖，要启用它，还要添加一个与 **pubspec.yam**l 同级目录的 **analysis_options.yaml** 文件，并包含以下内容：

```dart
analyzer:
  plugins:
```

    - custom_lint

然后当你错误使用Riverpod，就可以在IDE中看到警告了，详细规则可以查阅：[riverpod_lint](https://pub.dev/packages/riverpod_lint)