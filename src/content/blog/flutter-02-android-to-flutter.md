---
title: "Flutter入门到精通（二）：从Android到Flutter的知识迁移"
pubDate: 2024-01-03
description: "用类比Android的方式学Flutter，对比两者在UI、生命周期、状态管理等方向的异同。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: '/images/flutter-cover.png'
---

> 本文是Flutter系统学习系列的第二篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

上节**《开发初体验》**阐述了 **开始学Flutter的动机 (适配鸿蒙)** 、**Flutter开发环境搭建及常见问题 (Windows系统)** ，以及 **逐行解读Demo里的main.dart**，算是对Flutter建立了简单的基础认知。

😆 搭完环境，跑完demo，按照一般教程的套路，要么开始学一个个Widget，要么按部就班学Dart语法。可以，但对于我们这种练习时长两年半的安卓🐔来说，效率太低了。🤔️更快的学习方式应该是利用 **知识的可迁移**，通过比对 Android 和 Flutter 中 **相近知识点的差异** 来进行 **发散学习**。

😗 So，本节以官方文档为引 → 英文[《Flutter for Android developers》](https://docs.flutter.dev/get-started/flutter-for/android-devs)/ 中文[《给 Android 开发者的 Flutter 指南》](https://flutter.cn/docs/get-started/flutter-for/android-devs)进行对比学习，我在原内容的基础上做了一些调教 (**内容调整，精简代码和添加注释**)，理解起来会更容易(个人感觉)，有错的地方还望不吝指出，万分感激😁，当然喜欢原汁原味的可以直接看原文档。话不多说，直接开冲。

## 2. View(视图) VS Widget(控件)

### 2.1. 声明式UI

**Android** 和 **Flutter** 采用两种不同的编程风格来完成UI编程，分别是：**命令式 (主动设置)** 和 **声明式 (被动变化)** 。怎么理解？写个简单例子：**按钮控制文本的显示和隐藏**，先是Android代码：

```dart
var visible = true
val tv = findViewById<TextView>(R.id.tv)
val bt = findViewById<Button>(R.id.bt)

bt.setOnClickListener {
    visible = !visible;
    if(visible) {
        tv.visibility = View.VISIBLE
        bt.text = "隐藏文本"
    } else {
         tv.visibility = View.GONE
        bt.text = "显示文本"
    }
}
```

需要先找到控件，然后 **主动** 设置控件的属性，再看看Flutter怎么写：

```dart
class _TestPageState extends State<MyHomePage> {
  var visible = false;

  void _switchVisible() {
    setState(() {
      visible = !visible;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column
      (
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Visibility(visible: visible, child: const Text("文本")),
          ElevatedButton(
            onPressed: _switchVisible,
            child: Text(visible ? '隐藏文本' : '显示文本'),
          ),
        ]
    );
  }
}
```

不用关心具体的设置细节，只需 **配置好状态(数据) 和 界面(控件) 的关系**，Flutter 会根据状态变化 **自动更新UI**。一个通俗易懂的比喻😝：**命令式** → 你让TA动，**声明式** → TA自己动。

### 2.2. "三棵树🌲"渲染机制

先提一嘴 **Flutter的三棵树渲染机制**，有助于后面内容的学习😄，Flutter将视图树 (View Tree) 的概念进行了扩展，将视图数据的组合和渲染抽象成三个部分（内容摘取自：[《Flutter 陈航 09-视图渲染 三棵树 Widget》](https://www.cnblogs.com/baiqiantao/p/16950439.html)）：

* **Widget** → **对视图的结构化描述**，存储视图渲染相关的 **配置信息**：布局、渲染属性、事件响应等信息。
* **Element** → **Widget的实例化对象**，承载视图构建的上下文数据，连接Widget到完成最终 **渲染** 的 **桥梁**。
* **RenderObject** → **负责实现视图渲染的对象**；

**Widget被设计成不可变的 (immutable)**

> 当视图渲染的配置信息发生变化，Flutter会 **重建Widget树** 来进行数据更新。因为不涉及实际渲染位图，所以它只是一个 **轻量级** 的数据结构，重建成本很低。另外，得益于Widget的 **不可变性**，可以以较低成本进行 **渲染结点**(Element) 的 **复用**，因此在真实渲染树中可能存在 **不同Widget对应同一个渲染结点的情况** (**多对一**)。

**把Flutter的渲染过程简单分成这三步：**

* 通过 **Widget树** 生成对应的 **Element树**；
* 创建相应的 **RenderObject** 并关联到 **Element.renderObject** 属性上；
* 构建成 **RenderObject树**，**深度优先遍历**，确定树中各对象的 **位置和尺寸 (布局)** ，把它们 **绘制** 到不同图层上。**Skia** 在 **Vsync信号同步** 时直接从渲染树 **合成Bitmap**，最后交给 **GPU渲染**；

例子：Row容器的左边放一个Image，有边放一个Column套两个Text：

Flutter遍历完Widget树，创建子Widget对应的Element的同时，创建与之关联的、负责实际布局和绘制的 RenderObject：

**增加Element中间层的好处 (提高渲染效率)** ：

> 在这一层 **将Widget树的变化(diff)做抽象**，只将 **真正需要修改的部分同步到RenderObject树** 中，最大程度降低对真实渲染视图的修改，提高渲染效率，而不是销毁整个渲染视图树重建。**Element是可复用的**，Widget触发重建，Flutter会根据重新前后Widget树的 **渲染类型及属性变化情况** 决定后续的 **复用或新建**。比如：只是调整了一个渲染样式，Flutter会通知Element复用现有节点，只是 **同步属性** 到RenderObject出发绘制。如果Widget树中涉及到 **Widget类型替换或变更**，Flutter 则会将老的Element及RenderObject 摘除，让新Widget 重新走一遍创建 Element 和 RenderObject 的流程，挂载到 Element 树和 RenderObject 树上。

### 2.3. StatelessWidget & StatefulWidget

上节解读官方Demo里的main.dart后，我们知道了：

* **没有状态改变**，只是用作展示 → 用 **StatelessWidget**；
* **需要保存 (绑定) 状态**，且可能出现状态变化 → 用 **StatefulWidget**；

两者的本质行为是一致的，每一帧都会重建，不同之处在于后者有一个 **跨帧存储和恢复状态的State对象**。有些读者可能会混淆，这里特意把 **Widget** 和 **State(状态)** 拎出来：

> **Widget是不变的**，**变化的是与之绑定的State**，State的任何更改都会 **强制Widget** 的 **重新构建**！！！

**StatefulWidget发生状态变化时的代码调用流程**：

> 调用了状态类中某个方法，里面调用了 **setState (通知Flutter框架重新构建Widget) →build ()** → **didUpdateWidget (处理Widget的更新)** → **dispose(释放资源)** → **initState (初始化状态)** → **didChangeDependencies** (处理依赖关系的变化) → **build(根据新的状态构建Widget)两条编码建议**：

* **不要滥用StatefulWidget**！假如父布局是StatefulWidget，其State每调用一次更新UI，**会间接触发所有子View的销毁和重建**。虽然Flutter通过Element层最大程度降低 **对真实渲染视图的修改**，提高了渲染效率。但无法避免大量的Widget对象的销毁和重建，如果某个Widget的重建涉及耗时操作，页面的渲染性能也会急剧下降。不涉及到状态变化的Widget，老老实实用StatelessWidget。
* **不要在build()的方法内部进行耗时操作**！除了我们主动通过State刷新UI外，在某些特殊场景下，Widget 的build()有可能会执行多次。

### 2.4. 如何在布局中添加或删除一个组件

在Android中可以调用父View的 **addChild()/addView()** 和 **removeChild()/removeView()** 动态地增删子View。而在Flutter中，Widget是不可变的，没法这样玩，要实现类似的效果，可以这样做：**在State里定义一个标志位**，定义一个方法 → **根据标志位的值返回不同Widget**，然后在合适的地方调用这个方法。示例如下：

```dart
class _SampleAppPageState extends State<SampleAppPage> {
  bool toggle = true;	// 定义标志位
  void _toggle() {
    setState(() {
      toggle = !toggle;
    });
  }

  // 根据标志位返回不同Widget的方法
  Widget _getToggleChild() {
    if (toggle) {
      return const Text('Toggle One');
    } else {
      return ElevatedButton(
        onPressed: () {},
        child: const Text('Toggle Two'),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sample App'),
      ),
      body: Center(
        child: _getToggleChild(),	// 调用生成不同Widget的方法
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _toggle,
        tooltip: 'Update Text',
        child: const Icon(Icons.update),
      ),
    );
  }
}
```

### 2.5. Widget 如何实现动画

在Android中可以通过XML定义动画，也可以调用View.animate() 来实现动画。而在Flutter中，通过将 Widget 嵌入一个 **动画Widget** 的方式来实现 Widget 的动画效果。这里改下官方例子，干掉了CurvedAnimation (曲线插值)，直接采用AnimationController默认的线性插值器，使代码更易理解：

```dart
/// with 关键字用于混入(mixin)，它允许将其它类的功能添加到另一个类中，从而实现多继承
/// 这段声明说明，_MyFadeTest 可以访问 TickerProviderStateMixin 中的方法和属性
class _MyFadeTest extends State<MyFadeTest> with TickerProviderStateMixin {
  late AnimationController controller;

  @override
  void initState() {
    super.initState();
    /// 初始化AnimationController实例 → 控制动画的执行过程，包括：开始、停止、暂停、反向播放
    controller = AnimationController(
      /// 动画执行时长
      duration: const Duration(milliseconds: 2000),
      /// 垂直同步信号，用于同步屏幕刷新和动画更新，避免出现屏幕闪烁、撕裂等问题。
      /// 这里的this → TickerProviderStateMixin
      /// 这个Tiker除了在垂直同步时发出信号，还在运行时创建一个介于0-1间的线性差值。
      vsync: this,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Center(
        /// 过渡动画组件，用于实现透明度渐变动画
        child: FadeTransition(
          opacity: controller,	// 子控件透明度
          child: const FlutterLogo(
            size: 100,
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        tooltip: 'Fade',
        onPressed: () {
          controller.forward();	// 按钮按下时开始执行动画
        },
        child: const Icon(Icons.brush),
      ),
    );
  }
}
```

通过上述代码，总结下Flutter Widget动画的基本玩法：

* 自定义State类时 **with TickerProviderStateMixin**；
* 重写 **initState()** 时 初始化一个 **AnimationController** 实例，传入 duration和 vsync → **Ticker**；
* 把需要执行动画的 Widget 放到 **动画Widget** 中，在合适的时机，调用 **controller.forward()** 执行动画；

### 2.6. 如何创建自定义Widget

在Android中自定义View，一般是直接继承View或其子类进行重写和扩展。Flutter中 **推荐** 我们通过 **组合** 的方式来自定义Widget，而不是继承它们。使用代码示例 (🐶继承重写Widget也可以，不过比直接组合复杂)：

```dart
class CustomButton extends StatelessWidget {
  final String label;

  const CustomButton(this.label, {super.key});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {},
      child: Text(label),
    );
  }
}

/// 需要用到自定义Widget的地方
@override
Widget build(BuildContext context) {
  return const Center(
    child: CustomButton('Hello'),
  );
}
```

### 2.7. 常用View对应的Widget

#### 2.7.1. LinearLayout

**水平方向** → **Row**，**竖直方向** → **Column**，代码示例：

```dart
@override
Widget build(BuildContext context) {
  return const Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: <Widget>[
      Text('Row One'),
      Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Text('Column One'),
          Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: <Widget>[Text('Row One'), Text('Row Two')])
        ],
      );
    ],
  );
}
```

**运行效果：**

#### 2.7.2. RelativeLayout

通过组合使用 **Column**、**Row** 和 **Stack Widget** 实现 RelativeLayout 的效果。

#### 2.7.3. ListView

Flutter中的listView依旧对应Android里的ListView，不过不需要Adapter，得益于 Flutter widget 不可变的特点，只需向ListView传入一组 widget，Flutter 会保证滑动的快速顺畅。代码示例如下：

```dart
class _SampleAppPageState extends State<SampleAppPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sample App'),
      ),
      body: ListView(children: _getListData()),
    );
  }

  List<Widget> _getListData() {
    List<Widget> widgets = [];
    for (int i = 0; i < 100; i++) {
      widgets.add(Padding(
        padding: const EdgeInsets.all(10),
        child: Text('Row $i'),
      ));
    }
    return widgets;
  }
}
```

**如何知道点击了哪个列表项？**

> Flutter 没有 Android ListView里的 onItemClickListener，解决方法是：把列表项Widget放到一个**GestureDetector** 里，传入onTap属性来实现点击监听。

**如何动态更新ListView?**

* **少量数据**：在 setState() 里创建一个新的 List，并 **将数据从旧列表拷贝到新列表**；
* **动态列表或大量数据**：创建一个 **ListView.Builder**，接收两个参数：列表初始长度 和 ItemBuilder方法

**ListView.Builder** 使用代码示例：

```dart
@override
Widget build(BuildContext context) {
  return Scaffold(
    appBar: AppBar(
      title: const Text('Sample App'),
    ),
    body: ListView.builder(
      itemCount: widgets.length,
      itemBuilder: (context, position) {
        return getRow(position);
      },
    ),
  );
}

Widget getRow(int i) {
  return GestureDetector(
    onTap: () {
      setState(() {
        widgets.add(getRow(widgets.length));
        developer.log('row $i');
      });
    },
    child: Padding(
      padding: const EdgeInsets.all(10),
      child: Text('Row $i'),
    ),
  );
}
```

#### 2.7.4. ScrollView

直接使用 **ListView** 这个Widget，在Flutter里，它既是 ScrollView 也是 ListView。

### 2.8. 如何为Widget添加点击监听器

在Android中可以调用 setOnClickListener 为View添加点击监听器，而在Flutter中有两种添加监听的方法：

* Widget **支持事件监听**，在处理事件的参数传入具体操作，比如 RaisedButton 的 **onPressed** 参数；
* **不支持事件监听**，可以把 Widget 丢到一个 **GestureDetector** 中并向它的 onTap 参数传递具体操作；

```dart
class SampleTapApp extends StatelessWidget {
    const SampleTapApp({super.key});

    @override
    Widget build(BuildContext context) {
      return Scaffold(
        body: Center(
          child: GestureDetector(
            onTap: () {
              developer.log('tap');
            },
            child: const FlutterLogo(
              size: 200,
            ),
          ),
        ),
      );
    }
  }
```

除了OnTap还，GestureDetector 还可以监听非常多的手势：

### 2.9. 如何使用Canvas进行绘制

在Android中可以使用 Canvas 和 Drawable 将图片和形状绘制到屏幕上。而在Flutter 中也有类似 **Canvas** 的 API，因为它基于相同的底层渲染引擎 **Skia**。Flutter 提供了两个类供我们绘制 → **CustomPaint** 和 **CustomPainter** (支持自定义绘制算法)，官方Demo实现了一个简易绘制签名的功能，核心代码如下：

```dart
class SignatureState extends State<Signature> {
  List<Offset?> _points = <Offset>[];
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      /// 当用户触摸屏幕并拖动时触发，该回调会接收一个details参数，包含触摸事件的详细信息
      onPanUpdate: (details) {
        setState(() {
          /// RederBox对象表示组件在屏幕上的几何形状和位置信息
          RenderBox? referenceBox = context.findRenderObject() as RenderBox;
          /// 将全局坐标转换为局部坐标，以便在SignaturePainter中绘制
          Offset localPosition =
              referenceBox.globalToLocal(details.globalPosition);
          /// 存储用户绘制的点
          _points = List.from(_points)..add(localPosition);
        });
      },
      /// 用户松开手指时触发，将null添加到点列表中，表示绘制结束。
      onPanEnd: (details) => _points.add(null),
      /// 使用 CustomPaint 组件来绘制签名，传入自定义的Painter
      /// 并设置组件的大小为无限大，即占满整个屏幕
      child: CustomPaint(
        painter: SignaturePainter(_points),
        size: Size.infinite,
      ),
    );
  }
}

class SignaturePainter extends CustomPainter {
  SignaturePainter(this.points);
  final List<Offset?> points;
  @override
  void paint(Canvas canvas, Size size) {
    // 创建Paint对象，设置绘制签名时所需的样式和属性
    var paint = Paint()
      ..color = Colors.black
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 5;
    /// 遍历点列表，当前点和下一个点都不为Null，绘制从当前点到下个点的线段
    for (int i = 0; i < points.length - 1; i++) {
      if (points[i] != null && points[i + 1] != null) {
        canvas.drawLine(points[i]!, points[i + 1]!, paint);
      }
    }
  }

  /// 判断是否需要重新绘制签名，新旧点数组比较
  @override
  bool shouldRepaint(SignaturePainter oldDelegate) =>
      oldDelegate.points != points;
}
```

## 3. Activity、Fragment、Intent

### 3.1. Navigator +Route

Fluttre 中并没有 **Activity** 和 **Fragment** 的对应概念，毕竟 **只是在一个宿主Activity里蹦跶**，你可以利用 **Navigator(管理路径的工具)** 对 **Route(应用内屏幕和页面的抽象)** 进行 **压栈(push)** 和 **弹栈(pop)** 操作实现页面的跳转。Flutter提供了两种在页面间导航的方式：

* 定义一个 route 名字的 Map。(MaterialApp)
* 直接导航到一个 route。(WidgetApp)

**官方代码示例**：

```dart
void main() {
  runApp(MaterialApp(
    home: const MyAppHome(), // Becomes the route named '/'.
    routes: <String, WidgetBuilder>{
      '/a': (context) => const MyPage(title: 'page A'),
      '/b': (context) => const MyPage(title: 'page B'),
      '/c': (context) => const MyPage(title: 'page C'),
    },
  ));
}

/// 通过路由名压栈到Navigator中，来跳转到这个Route
Navigator.of(context).pushNamed('/b');

/// 弹栈并返回结果，类似于startActivityForResult()
Object? coordinates = await Navigator.of(context).pushNamed('/location');
Navigator.of(context).pop({'lat': 43.821757, 'long': -79.226392});
```

### 3.2. 如何处理从外部应用接收到Intent

**运行Flutter的原生Activity** 在AndroidManifest.xml中添加

```dart
<intent-filter>
  <action android:name="android.intent.action.SEND" />
  <category android:name="android.intent.category.DEFAULT" />
  <data android:mimeType="text/plain" />
</intent-filter>
```

在这个原生Activity中处理Intent，提取出所需数据，然后 Flutter 再通过使用 **MethodChannel** 获取这个数据：

```dart
public class MainActivity extends FlutterActivity {
    private String sharedText;
    private static final String CHANNEL = "app.channel.shared.data";

    @Override
  	protected void onCreate(Bundle savedInstanceState) {
        // 省略一堆Intent判断
        sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
    }

    // 该方法会在Flutter启用时调用
    @Override
    public void configureFlutterEngine(@NonNull FlutterEngine flutterEngine) {
      // 插件注册到传入的引擎中
      GeneratedPluginRegistrant.registerWith(flutterEngine);
      // 常见一个MethodChannel用于原生Android和Flutter的通信
      // 获取Flutte引擎的二进制消息传递器，设置一个通信的频道名称
      new MethodChannel(flutterEngine.getDartExecutor().getBinaryMessenger(), CHANNEL)
              .setMethodCallHandler(
                      (call, result) -> {
                          // 判断Flutter端调用的方法名是否为 getShredText
                          // 是的话，将变量的值作为结果发送回Flutter侧
                          // 将sharedText置空，避免重复使用旧数据
                          if (call.method.contentEquals("getSharedText")) {
                              result.success(sharedText);
                              sharedText = null;
                          }
                      }
              );
    }
}
```

当Widget渲染时，从Flutter端请求数据：

```dart
class _SampleAppPageState extends State<SampleAppPage> {
  /// 获取跨平台通信的通道
  static const platform = MethodChannel('app.channel.shared.data');
  String dataShared = 'No data';

  @override
  void initState() {
    super.initState();
    getSharedText();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text(dataShared)));
  }

  Future<void> getSharedText() async {
    /// 通过通道调用原生的方法
    var sharedData = await platform.invokeMethod('getSharedText');
    if (sharedData != null) {
      setState(() {
        dataShared = sharedData;
      });
    }
  }
}
```

**小疑问**：

> 宿主Activity 和 Flutter 间通过 MethodChannel 来进行通信，那要实现 Flutter跳转原生Activity页面，该怎么做？约定一个跳转Activity的方法名，如：jumpToActivity，**MethodChannel.MethodCallHandler**的onMethodCall() 里对方法名做判断 **if (call.method.equals("jumpToActivity"))** ，相等，调用 **call.argument("key")** 获取Flutter传递过来的参数，然后初始化创建Intent，startActivity跳转即可。

### 3.3. 如何监听 Activity 的生命周期

FlutterActivity 在内部捕获了几乎所有的 Activity 生命周期事件，并把它们发送给 Flutter 引擎。但大部分都向开发者屏蔽了，只提供了小部分可用的，你需要绑定 **WidgetsBinding** 观察者并监听 **didChangeAppLifecycleState()** ：

Flutter 为你管理引擎的启动和停止，在大部分情况下几乎没有理由要在 Flutter 一端监听 Activity 的生命周期。如果你需要通过监听生命周期来获取或释放原生的资源，无论如何都应该在原生端做这件事。

## 4. 异步UI

Flutter框架基于 **单线程模型的Dart**，通过 **Event Loop(事件循环)** 实现 **异步**，2333，有Android Handler那味了。不过Dart中有着两个队列：**Event Queue(事件队列)** 和 **Microtask Queue(微任务队列，短时间就能完成的异步任务)** ，后者优先级最高，每次的事件循环先查此队列是否有可执行的任务，没有才会去处理事件队列。异步队列很少必须要在事件队列前完成，因此用得不多。I/O、绘制、定时器这些异步事件，都是通过 **事件队列** 驱动主线程执行的。

### 4.1. Future-异步任务

Dart 为事件队列的任务提供了一层封装 → **Future**，表示 **一个在未来时间才会完成的任务**。把一个函数体放入 Future，就完成了 **同步任务到异步任务的包装**。Future还提供 **链式调用**，可在异步任务完成后依次执行链路上的其它函数体。异步函数返回时，内部执行动作未结束，有两种选择：

* **异步处理**：在返回的 Future 对象上注册一个 **then**，等Future执行体结束后，再进行异步处理；
* **同步等待**：同步等待 Future 执行体结束，需在调用处使用 **await**，调用处的函数体使用 **async**，因为Dart里的await不是堵塞等待，而是 **异步等待。**

官方代码示例：

```dart
import 'package:http/http.dart' as http;

// 异步等待请求加载完毕，注意async和await关键字的位置
Future<void> loadData() async {
  var dataURL = Uri.parse('https://jsonplaceholder.typicode.com/posts');
  http.Response response = await http.get(dataURL);
  setState(() {
    widgets = jsonDecode(response.body);
  });
}
```

运行上述代码要先添加http依赖，直接命令行执行：**flutter pub add http**：

不限定版本默认下载最新，需要限定版本可以这样：**flutter pub add http:0.13.4**

还可以在 **pubspec.yaml** 添加依赖，然后再执行 **flutter pub get**

### 4.2. Isolate-多线程

Dart 也提供了多线程机制 → **Isolate**，每个 Isolate 都有自己的 **EventLoop** 与 **EventQueue**，Isolate 间 **不共享任何资源**，只能依靠 **消息机制 (SendPort发送管道)** 通信，所以 **不存在资源抢占问题**。Isolate的创建非常简单，只要给定一个 **函数入口**，创建时再 **传入一个参数** 就可以启动了。

简单代码示例如下（将数据分享给主线程来更新UI）：

```dart
/// 加载数据并更新页面
Future<void> loadData() async {
	/// 创建一个ReceivePort → 用于接收来自Isolate的消息
  ReceivePort receivePort = ReceivePort();
  /// 创建一个新的Isolate，并将dataLoader 和 发送端口传给它
  /// 将在新的Isolate里执行dataLoader函数
  await Isolate.spawn(dataLoader, receivePort.sendPort);
	/// 等待从 Isolate 中获取第一个消息(SendPort)，用于与 Isolate 进行通信
  SendPort sendPort = await receivePort.first;
	/// 向SendPort发消息
  List msg = await sendReceive(
    sendPort,
    'https://jsonplaceholder.typicode.com/posts',
  );
	/// 更新UI
  setState(() {
    widgets = msg;
  });
}

/// 在Isolate里执行的具体异步操作
static Future<void> dataLoader(SendPort sendPort) async {
  /// 创建一个ReceivePort → 用来接收主线程的消息
  ReceivePort port = ReceivePort();
  /// 通过 sendPort 向主线程发送当前 Isolate 的 port.sendPort，用于通信
  sendPort.send(port.sendPort);
  /// 等待从主线程接收消息，并使用 for-in 循环来处理接收到的消息
  await for (var msg in port) {
    // 获取数据的URL地址、回复信息的SendPort
    String data = msg[0];
    SendPort replyTo = msg[1];
    String dataURL = data;
    /// 发起HTTP GET请求，并等待响应
    http.Response response = await http.get(Uri.parse(dataURL));
    /// 将解析后的Json发送会主线程
    replyTo.send(jsonDecode(response.body));
  }
}

/// 向指定SendPort发送消息，并返回一个Future对象用于接收响应
Future sendReceive(SendPort port, msg) {
  ReceivePort response = ReceivePort();
  port.send([msg, response.sendPort]);
  return response.first;
}
```

**总结一下**：

> 执行 **I/O任务**，如存储访问、网络请求，可以放心使用 **async/await**，要执行 **消耗CPU的计算密集型** 工作，可以将其转移到一个 **Isolate** 上以避免阻塞事件循环。

## 5. 小结

到此，算是把官方文档中 🐶**个人觉得比较重要** 的内容过了一遍，相信读者们对Flutter的认知又更深了。剩余部分内容大部分是跟 **Flutter插件(库)** 有关的没，如：如何使用GPS传感器 → 使用geolocator插件；如何使用相机 → 使用image_picker插件；如何使用 Shared Preferences → Shared_Preferences 插件 等等...；还有一部分和 **工程结构**、**资源文件** 相关的。**抛砖引玉，点到为止**，后续会进行相应的专题学习，敬请期待😁~

**参考文献：**

* [《Flutter完整开发实战详解》](https://guoshuyu.cn/home/wx/)
* [《Flutter 陈航 09-视图渲染 三棵树 Widget》](https://www.cnblogs.com/baiqiantao/p/16950439.html)
* [《Flutter 陈航 10-状态 State 编程范式 构建过程》](https://www.cnblogs.com/baiqiantao/p/16951225.html)
* [《Flutter 陈航 23-事件循环 Event Loop 异步 线程 Isolate》](https://www.cnblogs.com/baiqiantao/p/17035861.html)