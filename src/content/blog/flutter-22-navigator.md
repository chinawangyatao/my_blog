---
title: "Flutter入门到精通（二十二）：Flutter路由之Navigator详解"
pubDate: 2024-01-23
description: "Navigator 1.0路由机制详解，路由栈管理、自定义路由等。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: '/images/flutter-cover.png'
---

> 本文是Flutter系统学习系列的第二十二篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

**😄路由是什么？** 通俗点说就是「**页面跳转**」，**路由管理** 就是「**控制和管理页面跳转的过程和规则**」。实际开发中，很少直接用Flutter的路由来进行页面跳转，基本用的第三方，比如 **GetX** 就自带路由管理。

🤔 如果想搞懂路由框架背后的实现原理，感觉还是有必要对Flutter路由做下深入了解的，所以本节就来扒一扒 **Navigator 1.0** 的使用方法，以及对关键源码进行解读。

## 2. Flutter 路由用法详解

🤔 Flutter 的路由系统主要分为两个版本：

* **Navigator 1.0**：Flutter 早期的路由系统，侧重于 **移动端(Android/iOS)** ，采用「**命令式**」编程风格，使用 **Navigator.push()** 和 **Navigator.pop()** 等方法来管理「**路由栈**」。
* **Navigator 2.0**：Flutter 1.22 版本后新增，侧重于 **复杂的桌面端/网页端**，采用「**声明式**」编程风格，使用 **Router** 和 **RouteInformationParser** 等类来描述和管理「**路由树**」。

😄 我搞移动端居多，所以本节只研究 **Navigator 1.0** 的使用与原理，它涉及到的两个 **核心类**：

* **Route**：屏幕或页面的抽象。
* **Navigator**：管理Route的Widget，通过Route的 **入栈与出栈** 来实现页面的跳转。

😁 Flutter 提供了两种配置路由的跳转的方式：「**普通/匿名/动态/直接路由**」和「**命名/静态路由**」，一一讲解~

### 2.1. 匿名/动态/直接/普通路由

**不需要提前注册**，可以直接在代码中创建和导航的路由，适用于简单使用或单次导航的场景。用法非常简单：

```dart
// 💡 跳转页面
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => SecondScreen()),
);

// 💡 关闭页面
Navigator.pop(context);
```

🤔 可以看到除了BuildContext外，**匿名路由** 还需要传入一个 **Route** 类型的参数，这里用的是 **MaterialPageRoute**，它可以使用与对应平台风格一致的 **切换动画**，Android 上是上下滑动切换，iOS 上是左右滑动切换，如果想实现全平台的左右滑动，可以使用 **CupertinoPageRoute**。

😄 当然，也可以 **自定义PageRoute**，以完全控制页面切换的动画和行为。如果只是想简单自定义下过渡动画，可以使用 **PageRouteBuilder** 来快速创建自定义路由，它提供了 **pageBuilder** 和 **transitionsBuilder** 属性来定义页面和过渡动画，使用代码示例如下：

```dart
// 💡 只通过 pageBuilder 定制渐入的过渡动画
Navigator.of(context).push(
  PageRouteBuilder(pageBuilder: (context, animation, secondaryAnimation) {
    return FadeTransition(opacity: animation, child: const SecondPage();
  })
);

// 💡 pageBuilder + transitionsBuilder 定制过渡动画：新页面从屏幕右侧滑入，旧页面从左侧划出
Navigator.of(context).push(PageRouteBuilder(
  pageBuilder: (context, animation, secondaryAnimation) => const SecondPage(),
  transitionsBuilder: (context, animation, secondaryAnimation, child) {
    var begin = const Offset(1.0, 0.0);	// 动画的起始位置，X轴方向屏幕右侧偏移起点
    var end = Offset.zero;	// 动画的结束位置，0表示没有偏移，即初始位置
    var curve = Curves.easeInOut;	// 创建动画曲线，easeInOut 表示开始慢，中间加速，结束慢
    // 创建一个从begin到end的补间动画，.chain 表示与曲线结合，即创建一个遵循指定曲线的动画
    var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
    // SlideTransition 是用于在小部件上应用滑动动画的Widget
    return SlideTransition(
      position: animation.drive(tween),
      child: child,
    );
}));
```

然后是 **页面传参** & **数据回传**，前者通过 **新页面的构造函数传递**，后者通过 **pop()** 方法回传，写个简单的选颜色例子，先是第一个页面：

```dart
void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const MyHomePage(),
    );
  }
}

class MyHomePage extends StatelessWidget {
  const MyHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    // 配合 ValueListenableBuilder 组件使用，在值发生变化时自动通知监听者，从而更新UI
    ValueNotifier<Color> colorNotifier = ValueNotifier<Color>(Colors.black);

    return Scaffold(
      appBar: AppBar(title: const Text("Flutter路由学习Demo")),
      body: Center(
        child: Column(
          children: [
            // 颜色改变时刷新Text组件
            ValueListenableBuilder(
                valueListenable: colorNotifier,
                builder: (context, value, child) {
                  return Text("当前选中的颜色：$value", style: TextStyle(color: value));
                }),
            const SizedBox(height: 5),
            // 点击跳转颜色选择页
            ElevatedButton(
                onPressed: () async {
                  // 💡 await 异步等待页面关闭数据回传
                  Color? chooseColor = await Navigator.of(context)
                      .push(MaterialPageRoute(builder: (context) => ColorChoosePage(color: colorNotifier.value)));
                  if (null != chooseColor) colorNotifier.value = chooseColor;
                },
                child: const Text("跳转颜色选择页"))
          ],
        ),
      ),
    );
  }
}
```

然后是跳转的选择颜色页：

```dart
class ColorChoosePage extends StatefulWidget {
  // 💡 通过构造方法传递数据
  final Color color;

  const ColorChoosePage({super.key, required this.color});

  @override
  State createState() => _ColorChoosePageState();
}

class _ColorChoosePageState extends State<ColorChoosePage> {
  final _random = Random();

  @override
  Widget build(BuildContext context) {
    // 获得屏幕宽度的1/5
    final widgetWidth = MediaQuery.of(context).size.width / 5 - 10;
    // 随机生成25个颜色
    final colors = List.generate(
        25,
        (index) => Color.fromRGBO(
              _random.nextInt(256),
              _random.nextInt(256),
              _random.nextInt(256),
              1,
            ));

    return Scaffold(
      appBar: AppBar(title: const Text('颜色选择页')),
      body: Padding(
        padding: const EdgeInsets.all(5),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("之前选中的颜色", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 5),
            _generateColorItem(widget.color, widgetWidth),
            const Text("选色板", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 5),
            Expanded(
                child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 5,
                crossAxisSpacing: 5.0,
                mainAxisSpacing: 5.0,
              ),
              itemCount: colors.length,
              itemBuilder: (context, index) => _generateColorItem(colors[index], widgetWidth),
            ))
          ],
        ),
      ),
    );
  }

  // 生成颜色组件
  Widget _generateColorItem(Color color, double widgetWidth) => GestureDetector(
        onTap: () {
          // 💡 关闭页面时给上一个页面传递数据
          Navigator.pop(context, color);
        },
        child: Container(
          width: widgetWidth,
          height: widgetWidth,
          color: color,
          alignment: Alignment.center,
          child: Text(
            color.toString().substring(10, 16),
            style: const TextStyle(color: Colors.white),
          ),
        ),
      );
}
```

**运行看看效果**：

### 2.2. 命名/静态路由

说完匿名路由，接着说下命名路由，就是 **需要提前注册的路由**，先给每个路由定义一个「**字符串名称**」，然后通过这个名称来导航到对应的路由，适用于复杂应用或重复导航的场景。玩法如下：

> 在应用的 **根级别** (MaterialApp 或 CupertinoApp ) 定义路由，使用「**routes**」参数将路由名称映射到对应的Widget。

😊 用命名路由实现前面匿名路由选颜色Demo的效果，先是第一个页面：

```dart
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(primarySwatch: Colors.blue),
      // 💡 注册路由
      routes: {
        "/": (context) => const MyHomePage(),
        "/color_choose_page": (context) => const ColorChoosePage(),
      },
      // 💡 初始路由
      initialRoute: "/",
    );
  }
}

class MyHomePage extends StatelessWidget {
  const MyHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    // 配合 ValueListenableBuilder 组件使用，在值发生变化时自动通知监听者，从而更新UI
    ValueNotifier<Color> colorNotifier = ValueNotifier<Color>(Colors.black);

    return Scaffold(
      appBar: AppBar(title: const Text("Flutter路由学习Demo")),
      body: Center(
        child: Column(
          children: [
            // 颜色改变时刷新Text组件
            ValueListenableBuilder(
                valueListenable: colorNotifier,
                builder: (context, value, child) {
                  return Text("当前选中的颜色：$value", style: TextStyle(color: value));
                }),
            const SizedBox(height: 5),
            // 点击跳转颜色选择页
            ElevatedButton(
                onPressed: () async {
                  // 💡 await 异步等待页面关闭数据回传，pushNamed 通过路由名称跳转
                  var result = await Navigator.of(context)
                      .pushNamed("/color_choose_page", arguments: {"chooseColor": colorNotifier.value});
                  Color? chooseColor = result as Color?;
                  if (null != chooseColor) colorNotifier.value = chooseColor;
                },
                child: const Text("跳转颜色选择页"))
          ],
        ),
      ),
    );
  }
}
```

然后是选择颜色页：

```dart
class ColorChoosePage extends StatelessWidget {
  const ColorChoosePage({super.key});

  @override
  Widget build(BuildContext context) {
    // 💡 获取路由参数
    var args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final Color color = args?['chooseColor'] ?? Colors.black;
    final random = Random();
    // 获得屏幕宽度的1/5
    final widgetWidth = MediaQuery.of(context).size.width / 5 - 10;
    // 随机生成25个颜色
    final colors = List.generate(
        25,
        (index) => Color.fromRGBO(
              random.nextInt(256),
              random.nextInt(256),
              random.nextInt(256),
              1,
            ));

    return Scaffold(
      appBar: AppBar(title: const Text('颜色选择页')),
      body: Padding(
        padding: const EdgeInsets.all(5),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("之前选中的颜色", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 5),
            _generateColorItem(context, color, widgetWidth),
            const Text("选色板", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 5),
            Expanded(
                child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 5,
                crossAxisSpacing: 5.0,
                mainAxisSpacing: 5.0,
              ),
              itemCount: colors.length,
              itemBuilder: (context, index) => _generateColorItem(context, colors[index], widgetWidth),
            ))
          ],
        ),
      ),
    );
  }

  // 生成颜色组件
  Widget _generateColorItem(BuildContext context, Color color, double widgetWidth) => GestureDetector(
        onTap: () {
          // 💡 关闭页面时给上一个页面传递数据
          Navigator.pop(context, color);
        },
        child: Container(
          width: widgetWidth,
          height: widgetWidth,
          color: color,
          alignment: Alignment.center,
          child: Text(
            color.toString().substring(10, 16),
            style: const TextStyle(color: Colors.white),
          ),
        ),
      );
}
```

😄 另外，实际开发中，通常会把 **注册路由** 部分的代码单独抽离出来 **动态生成**，然后通过 **onGenerateRoute** 属性传入，改下上面的Demo试试：

```dart
final Map routes = {
  "/": (context) => const MyHomePage(),
  "/color_choose_page": (context) => const ColorChoosePage(),
};

var onGenerateRoute = (settings) {
  // 获取路由名称
  final String? name = settings.name;
  // 获取路由对应的页面构建函数
  final Function? pageContentBuilder = routes[name];
  if (null != pageContentBuilder) {
    // 判断是否有传递参数
    if (settings.arguments != null) {
      return MaterialPageRoute(builder: (context) => pageContentBuilder(context), settings: settings);
    } else {
      return MaterialPageRoute(builder: (context) => pageContentBuilder(context));
    }
  }
  // 未找到路由，跳转到未知页面
  return MaterialPageRoute(builder: (context) => const UnKnowPage());
};

// 💡 调用处
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(primarySwatch: Colors.blue),
      // 💡 路由导航动态生成
      onGenerateRoute: onGenerateRoute,
      initialRoute: "/",
    );
  }
}
```

### 2.3. 路由操作

😄 介绍完匿名和命名路由的入栈和出栈，接着说下Flutter提供的一些路由操作~

#### 2.3.1. 路由替换

就 **新路由进栈并替换当前路由**，适用场景示例：

> 页面跳转后，点击返回按钮，默认会回到上一个页面，如果不想回到上一个页面，而是直接回到 上上一个页面。比如：登录页跳主页面。

Flutter 提供了三个替换API，使用代码示例如下：

```dart
// 💡 匿名路由替换
Navigator.of(context).pushReplacement(
    MaterialPageRoute(builder: (context) => const ReplacePage())
);

// 💡 命名路由替换
Navigator.of(context).pushReplacementNamed("/replace");

// 💡 命名路由替换，先 pop 再 push 新页面
Navigator.of(context).pushReplacementNamed("/replace");
```

#### 2.3.2. 新路由入栈+移除之前的路由，直到条件满足

🤷‍♀️ 如题，Flutter 提供两个API，使用代码示例如下：

```dart
// 💡 匿名路由
Navigator.pushAndRemoveUntil(
  context,
  MaterialPageRoute(builder: (context) => NewPage()),
  (Route<dynamic> route) => route.isFirst, // 保留直到第一个路由（即主页）
);

// 💡 命名路由
// 假设你有一个Navigator对象和一个路由名称
Navigator.of(context).pushAndRemoveUntil(
  MaterialPageRoute(builder: (context) => NewPage()),
  (Route<dynamic> route) => route.isFirst, // 保留直到第一个路由（即主页）
);
```

#### 2.3.3. 路由出栈，直到条件满足

就 **不跳页面，只弹出导航堆栈中的路由，直到条件满足**。使用代码示例如下：

```dart
// 💡 弹出直到根路由为止
Navigator.of(context).popUntil((Route<dynamic> route) => route.isFirst);
Navigator.of(context).popUntil((Route<dynamic> route) => route.settings.name = "/");
Navigator.of(context).popUntil(ModalRoute.withName("/"));
```

关于 **路由出栈**，Flutter 还提供了这两个API：

* **canPop**：检查当前导航堆栈是否还有路由可以弹出，处于根路由时，会返回false。
* **maybePop**：尝试弹出当前路由，如果导航堆栈没其他路由或弹出操作被拦截，不会执行任何操作。

#### 2.3.4. 删除指定路由

💁‍♂️ Flutter 提供了两个直接删除路由的API (不涉及路由的推入和弹出，立即关闭)：**removeRoute()** 和 **removeRouteBelow()** ，使用代码示例如下：

```dart
// 获得当前路由
final route = ModalRoute.of(context);

// 💡 移除指定路由，如：当前路由
if (route != null) {
  Navigator.of(context).removeRoute(route);
}

// 💡 移除指定路由下方的单个路由
if (route != null) {
  Navigator.of(context).removeRouteBelow(route);
}
```

😄 关于Flutter路由的用法就讲解到这~

## 3. 源码详解

在具体扒源码前，简单思考下设计一个路由系统时需要考虑哪些因素。🤔 大部分路由系统都是采用 **栈(LIFO，后进先出)** 的「**数据结构**」，每个页面作为一个「**栈帧**」存在在页面栈中。栈帧一般包含以下信息：

* **页面标识**（如：页面名称、URL 等）
* **页面参数**（用于数据传递）
* **页面状态**（如加载状态、缓存状态、生命周期等）

接着是「**页面跳转的管理**」，基本操作有：

* **入栈操作**：用户从页面A跳到页面B，需要将B压入 **栈顶**，要保持页面A在栈中的位置。
* **出栈操作**：用户从页面B返回页面A，需要将B从栈顶移除，页面A成为新的栈顶页面。
* **清栈操作**：在某些场景下，如：用户退出应用，需要清空整个页面栈。

再接着是「**页面数据如何传递**」，通过 **页面参数传递**？还是 **全局数据共享**？然后是「**页面缓存策略**」，需要保持**栈内/栈外页面状态吗**？是否允许「**重复入栈**」？「**异常处理**」页面跳转失败怎么办？是否限制页面栈的深度，栈溢出怎么办... 😄 好，思维发散激活完毕，具体来看源码~

### 3.1. Navigator.xxx(context) & Navigator.of(context).xxx()

💁‍♂️ 点开源码，可以看到 **Navigator.xxx()** 最终还是调用的 **Navigator.of(context).xxx()** ：

🤷‍♀️ 所以这两种写法作用其实都是一样的，往下看看 **of()** 的源码：

从字面意思上不难看出，它的作用是：

> 从给定的BuildContext中获取 **最近** 的或 **根(最顶层)** 的 **NavigatorState** 返回。

看下这两个查找方法，😂代码非常像，就循环逻辑那里有些不同，一个是找到直接跳出返回，一个是找到了暂存，直到没有父元素(根节点)循环结束再返回：

### 3.2. NavigatorState#build()

🤔 所有的栈操作，都是 **of()** 获得 **NavigatorState** 实例后调用，看看这个类：

😮 哦吼，继承了 **State**，并混入了 **TickerProviderStateMixin** (动画支持) 和 **RestorationMixin** (状态恢复)。状态类的核心任务是完成 **Widget的构建**，先从 **build()** 方法入手：

😳 所以 **导航跳转的界面** 本质上是通过 **Overlay-浮层** 来实现的**❗️** ，它是一个用于在Widget树顶层绘制浮动元素的工具。允许我们在不改变Widget树结构的情况下，添加悬浮在其它Widget之上的内容。通过 **initialEntries** 属性传入 **OverlayEntry(插入到Overlay中的子组件)** 对象列表，定义了初始显示在 **Overlay** 中的条目。跟下 **_allRouteOverlayEntries()** ：

🤔 遍历 **_history** 列表中的每个 **_RouteEntry** 对象，获取它们的 **overlayEntries** (**OverlayEntry对象列表**）进行合并，最终返回一个 **OverlayEntry** 类型的可迭代对象。跟下 **_History**：

😀 混入 **ChangeNotifier**，维护一个 **_RouteEntry** 列表，列表发生更改后发出通知。跟下 **_RouteEntry**：

😊 从它的构造方法不难看出，它就是对 **路由节点的封装**：**存储路由实例**、**管理路由生命周期**、**路由切换** 及 **状态恢复**。而 **OverlayEntry** 则是 **Overlay** 组件的 **浮层节点**，代表一个 **可以被添加到屏幕上的组件**。这两个类要区分开来：

一个 **_RouteEntry** 中的路由 (**Route**) 可能会创建一个或多个 **OverlayEntry** 来实现其内容的展示。

😄 然后 **OverlayEntry列表** 是放在 **OverlayState** 中的：

而 **NavigatorState** 中定义了 **GlobalKey** 类型的 **_overlayKey**，作为 **key** 传入 **Overlay**：

😁 定义了一个 **overlay** 的属性，方便直接获得 **OverlayState** 状态类对象。

### 3.3. 初始路由的创建

**断点** 了一下上面的 **_allRouteOverlayEntries()** ，发现在创建 **Overlay** 前， **_history** 里就有 **_RouteEntry** 了：

🤔 em？这个初始路由是在哪里初始化的呢？在 **navigator.dart** 中搜了下 **_history.add**，发现了这个：

打下 **断点**，看下方法调用流程：

🤔 行吧，**Navigator** 和 **NavigatorState** 关联后调 **_firstBuild()** ，里面调了 **initState()** 和 **didChangeDependencies()** ，最后调 **build()** 方法来构建 Widget。怪不得在 **Overlay** 创建前， **_history** 里就有东西了。

😄 看下 **路由初始化** 部分的代码，调用 **onGenerateInitialRoutes()** 生成 **初始Route对象** 列表，**map()** 遍历，为每个Route对象创建一个 **_RouteEntry** 实例，并加入到 **_history** 中。

🤔 看到这里有些读者可能会问：

> 不就实例化初始路由吗，为啥不直接直接创建 **Route** 和 **_RouteEntry** 实例，搞得那么复杂？

😊 跟下代码：

😮 **RouteListFactory** 竟是类型别名，所以这样设计的目的其实是「**初始路由列表生成的抽象**」，就留个口子，给开发者动态定义路由列表的生成，往上看 **onGenerateInitialRoutes()** 的注释：

如果我们没设置这个属性，将使用默认的 **defaultGenerateInitialRoutes()** 来生成初始路由列表，跟下代码：

😄 这个方法会保证返回的列表 **至少有一个Route对象** (默认路由)，然后生成路由对象都调的 _**routeNamed()** ，看下关键代码：

```dart
Route<T?>? _routeNamed<T>(String name, { required Object? arguments, bool allowNull = false }) {
  // 💡 允许空，且没设置 onGenerateRoute 属性，直接返回null
  if (allowNull && widget.onGenerateRoute == null) {
    return null;
  }
  // 💡 根据给定的路由名称和可选参数，创建一个 RouteSettings对象
  final RouteSettings settings = RouteSettings(
    name: name,
    arguments: arguments,
  );
  // 💡 调用 onGenerateRoute() 回调并传入上面的RouteSettings对象尝试生成路由。
  Route<T?>? route = widget.onGenerateRoute!(settings) as Route<T?>?;
  // 💡 生成失败，且 allowNull 不为false，执行 onUnknownRoute() 回调生成路由
  if (route == null && !allowNull) {
    route = widget.onUnknownRoute!(settings) as Route<T?>?;
  }
  return route;
}
```

看下 **onGenerateRoute** 的定义：

看下它的类型 **RouteFactory**：

😳 又是类型别名，参数是 **RouteSettings**，返回 **Route** 对象，看回前面 **动态注册路由** 的代码：

😄 就，需要 **创建路由实例** 时，调用我们设置的 **onGenerateRoute()** 回调来动态生成路由实例，哈哈，看到这里有没有一种豁然开朗的感觉？

💁‍♂️ 然后，有一点要注意，Demo 里，我们是通过 **MaterialApp** 而非直接通过 **Navigator** 来进行路由设置的！**MaterialApp** (本质上是 **WidgetsApp**) 内部会 **选择性** 创建一个 **Navigator** 来进行路由栈的管理：

🤣 比如，**MaterialApp** 有 **routes** 参数，**Navigator** 没有，它是在 **_onGenerateRoute()** 中进行了处理：

😀 行吧，我们暂且知道了 **初始Route对象** 的构建流程，接着就该摸索下 **浮层节点** 的创建与添加了~

### 3.4. _RouteEntry 的生命周期

再继续往下深扒前，先来了解下 **_RouteEntry 的生命周期**，就 **_RouteLifecycle** 状态机。这个状态机只能「**向下转移**」一旦进入下一个状态，就不能回到上一个状态。😳 注释里给出了它的 **流转图解**：

对各个状态解释一波 (😄翻译的注释)：

* **creation of a _RouteEntry**：_RouteEntry 实例刚创建的 **起始状态**。
* **staging**：准备阶段，等待具体的过渡决策。
* **pushReplace**：通过 **pushReplace()** 及相关方法添加的路由，准备执行 install()、didPush() 等操作。
* **push** ：通过 **push()** 及相关方法添加的路由，准备执行 **install()** 、**didPush()** 等操作。
* **add** ：准备添加到Navigator堆栈中，通常是通过 **onGenerateInitialRoutes** 或 **widget.pages** 创建。
* **replace** ：通过 **replace()** 及相关方法添加的路由，准备执行 **install()** 、**didReplace()** 等操作。
* **pushing#** ：路由推送中，等待 **didPush()** 操作完成。
* **adding**：路由添加中，等待顶层路由的 **didPush()** 操作完成。
* **idle**：**空闲状态**，不执行任何操作。
* **pop** ：准备调用 **didPop()** ，表示路由将要被弹出。
* **complete** ：路由完成操作，准备调用 **didComplete()** 。
* **remove** ：路由准备被移除，将执行 **didReplace()** / **didRemove()** 等操作。
* **removing#** ：等待后续路由完成动画，将转换到dispose状态。
* **popping#** ：路由弹出中，等待调用 **finalizeRoute()** 以转换到dispose状态。
* **dispose** ：路由将被立即销毁。
* **disposing**：_RouteEntry实例正在等待其小部件子树先销毁。在等待销毁期间，它被存储在_entryWaitingForSubTreeDisposal中。
* **disposed**：路由已被销毁。
* **_RouteEntry garbage collected**：终态，实例的内存已被垃圾回收，彻底从系统中移除。

> 注：「*」表示这些状态是临时的，一旦 _flushHistoryUpdates 被调用，_RouteEntry 将退出这些状态。「#」表示这些状态等待未来的事件或其他异步操作完成，然后自动转移到下一个状态。

😏 有个大概印象就行~

### 3.5. 浮层节点的创建&添加

💁‍♂️ 上面创建完初始路由后，还执行了一句 **_flushHistoryUpdates()** ：

🤣 见名知意，就是 **刷新_history列表**，点开方法打下断点，上面创建初始路由时设置了 **initialState: _RouteLifecycle.add**，这里自然是走的 add 逻辑：

调用了 **_RouteEntry#handleAdd()** ，跟下：

其中调用了 **Route#install()** ，点开：

**空实现**，打下断点，看下具体实现类：

**MaterialPageRoute** → **PageRoute** → **ModalRoute** → **TransitionRoute** → **OverlayRoute**，最终定位到了往 **浮层列表** 中添加浮层的代码：

看下 **createOverlayEntries()** 具体是怎么创建浮层的：

😳 创建了 **两个浮层节点**：

* **_modalBarrier**：**遮罩**，防止用户与下面的路由交互，通常会部分遮挡下面的路由。这个屏障可以是透明的，也可以有颜色 (如：一个对话框打开时，下面的页面通常会被暗化)。另外，如果 barrierDismissible 属性设置为 true，用户可以通过点击屏障来关闭路由。
* **_modalScope**：目标路由，实际页面或视图的容器，它还管理路由的状态，如动画和焦点。

另外，除了在 **OverlayRoute#install()** 中添加了浮层，还在 **TransitionRoute#install()** 中添加了路由动画切换的 **AnimationController** 和 **动画状态监听**：

### 3.6. add 操作的调用流程

😄 搞清楚浮层节点在创建&添加，继续看完add操作执行流程，更新路由状态为 **adding**，往 **_observedRouteAdditions** 里添加一个 **_NavigatorPushObservation** 路由Push变化事件：

然后 **continue** 直接进入下轮循环，然后调 **_RouteEntry#didAdd()** ：

看下代码：

接着走 **idle** 的判定：

再往下走，更新参数，继续向后遍历**Navigator** 的 **_history**，直到 **index < 0**，遍历结束。

最后执行后续操作：

😄 看下这个浮层节点重排 **Overlay#rearrange()** 具体做了什么？

**old.removeAll(newEntriesList);** 这段代码的作用是：保证重新插入条目时，不会有重复的条目。

### 3.7. push 操作的调用流程

😊 看源码可以发现 **pushName()** 最终调用的还是 **push()** ：

**_routeNamed()** 前面讲过了，传 **RouteSetting** 参数，调我们传入的 **onGenerateRoute()** 生成Route对象。跟下 **push()** ：

创建了一个状态为 **push** 的 **_RouteEntry** 实例传入 **_pushEntry()** 方法中，点开：

好吧，也是走的 **_flushHistoryUpdates()** ：

😲 吼，**push**、**pushReplace**、**replace** 都调的 **_RouteEntry#handlePush()** ：

读者有疑问的代码估计是这句：**final TickerFuture routeFuture = route.didPush();** 点开代码看看：

跟下 **TickerFuture#_complete()** ：

然后对这个 **TickerFuture** 添加了 **whenCompleteOrCancel()** 的回调，⚠️注意，里面的代码不会立即执行，会在就 **跳转动画完成或取消时** 才执行，代码的执行顺序是先⑧⑨，再④⑤。即动画完成后，才将路由状态设置为 **idle**，调 **_flushHistoryUpdates()** 触发刷新。🤔 em... 简单提下这两个类，后面讲动画的时候再详细解读~

* **Ticker**：Flutter中用于驱动动画的一个类，通常用于更新动画状态，主要作用：**提供一个定时器，在每次屏幕刷新时调用回调函数**。
* **TickerFuture**：与Ticker相关的Future，表示一个 **Ticker** 的完成状态，可以用来等待 Ticker的完成或取消。

说完 **push** & **pushReplace** 的逻辑，接着看下 **replace**，调用了 **route.didReplace(previous);**

好吧，没啥，就是把就路由的AnimationController赋值给新路由，保持状态一致而已~

### 3.8. pop 操作的调用流程

各种 **popXxx()** 最终都会调用 **pop()** 方法：

跟下 **_RouteEntry#pop()** ：

暂存返回值，修改路由状态为 **pop**，然后调路由的 **onPopInvoked(didPop)** ，该方法在路由弹出操作处理后会被调用，**即便弹出操作被取消** (如通过PopScope)，**didPop** 参数用于指示后退导航是否成功。跟下 **_flushHistoryUpdates()** pop状态的处理代码：

跟下 **handlePop()** ：

点开 **Route#didPop()** ：

🤔 这么点东西，看不出什么，具体实现肯定是子类实现的，打下断点看下方法调用流程：

跟下 **finishedWhenPopped**：

跟下 **_popFinalized**：

行吧，最终都会调用 **finalizeRoute()** ，关键的代码如下：

```dart
void finalizeRoute(Route<dynamic> route) {
  // 💡 查找历史记录中的路由索引
  final int index = _history.indexWhere(_RouteEntry.isRoutePredicate(route));
  final _RouteEntry entry =  _history[index];

  // 💡 销毁路由
  entry.finalize();

  // 💡 刷新历史记录
  if (!_flushingHistory) {
    _flushHistoryUpdates(rearrangeOverlay: false);
  }
}

# 💡 _RouteEntry#finalize()
void finalize() {
  currentState = _RouteLifecycle.dispose;
}
```

行吧，就动画执行完后会销毁出栈的Route，路由成功弹出往下走：

感觉有必要把这两属性拎出来讲一哈，也顺带提下 **didPopNext()** ：

* **poppedRoute**：**最近被弹出的路由**，当路由被弹出时，它会被设置为该路由，此变量用于通知新的栈顶路由，其上方的路由已被弹出，可以执行相应的处理逻辑。
* **seenTopActiveRoute**：**是否已经处理过栈顶活动路由的标记**，没处理过调用 **entry.handleDidPopNext(poppedRoute)** 进行处理。
* **didPopNext()** ：当一个路由被弹出，Navigator 会调用此方法来通知下一个路由，以便它可以执行相应的处理。(handleDidPopNext() 里就是调这个方法)。

继续往下走，往 **_observedRouteDeletions** 里添加一个 **_NavigatorPopObservation** 路由变化事件。最后将 **canRemoveOrAdd** 标记设置为 **true**，此时路由的状态处于 **popping** (弹出路由待销毁转换为dispose状态)，修改 **canRemoveOrAdd** 为 true，允许移除或添加路由。

### 3.9. 其它操作

#### 3.9.1. popUntil()

#### 3.9.2. popAndPushNamed()

#### 3.9.3. canPop()

#### 3.9.4. maybePop()

#### 3.9.5. pushAndRemoveUntil()

## 4. 小结

😄 最后，总结下本节学习的内容吧，先是概念相关的以及相关的API：

然后是源码：

 调用流程就不画了，读者自己跟着走一遍就很清楚啦~

**参考文献**：

* **《Flutter基础之路由详解》**
* [《掘金小册： Flutter 路由导航: 源码探索与实战》](https://juejin.cn/book/7255112990310006836 "https://juejin.cn/book/7255112990310006836")