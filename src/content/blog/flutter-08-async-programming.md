---
title: "Flutter入门到精通（八）：进阶：异步编程速通"
pubDate: 2024-01-09
description: "Dart异步编程详解，Future、async/await、Stream、Isolate等并发模型。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第八篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

🥰 年前肝了篇 **《Flutter入门到精通 (七、项目实战-UI部分🤷‍♀️)》**代表Flutter实战小项目的落幕，意味着我们的Flutter已经入门，接下来就该 **进阶** 啦，即 **专项知识点的学习**。恰逢有小伙伴在 **《四、Dart基础语法速通🏃》**提到：

索性Flutter进阶的第一篇就来刨刨 **Flutter** 中的 **异步编程**，本节学习路线如下：

* 简单了解点概念性的东西，对Dart并发的整体架构建立一个初步认知，有助于后面的学习，涉及：Flutter 架构概览、Flutter 线程模型、Dart的并发实现（isolate机制）、Dart单线程模型（Event Loop）、同步 & 异步、耗时任务的分类（IO密集型 & 计算密集型）
* 了解完概念，接着就是针对Dart异步编程三大API → Future、Stream、Isolate 的专项突袭了~

话不多说，直接开始🏃...

## 1. 概念相关

作为一只Flutter菜🐔，大部分时间其实都是在Framework层 **堆组件 + 调API**，概念部分就当看个乐子。大概了解下，暂时没必要深究，能涨见识最好，实在不理解也没关系，更没必要背哈😄~

### 1.1. Flutter 架构概览

**Google** 推出 **Flutter** 旨在提供一个 **高性能**、**跨平台一致** 的 **UI框架**，让开发者可以用 **一套代码** 构建出美观的移动、网页和桌面应用。

**Google** 选择 **Dart** 作为 **Flutter** 编程语言的一些可能考量：

* Dart 拥有 **类似C++和Java的熟悉语法**，让熟悉这些语言的开发者能够快速上手；
* Dart 是一种 **多范式** 语言，可以实现面向对象、函数式、响应式等不同的编程风格；
* Dart 拥有庞大的 **库生态系统**，提供了丰富的核心库和三方包，满足各种开发需求；
* Dart 支持 **JIT(即时编译)** 和 **AOT(预编译)** ，实现热重载和热重启，以及生成高效的原生代码；
* 等等...

Flutter主打一个 **跨端**，架构自然跟 Android架构大相径庭，[《官方文档》](https://flutter.cn/docs/resources/architectural-overview)给出这样的 **Flutter分层架构图**：

上层组件依赖下层组件，组件间无法跨层访问下面，接着 **从下往上** 过下每一层都做了啥：

* **Embedder** (嵌入/平台层)：**负责与底层操作系统进行交互**，提供渲染、输入、辅助功能等服务，并且管理事件循环队列。根据不同的平台使用不同的语言编写，如：Android → Java & C++，iOS、macOS → Objective-C & Objective-C++，Windows、Linux → C++。Flutter 代码可以通过嵌入层集成到现有应用中，也可以作为应用的主体。
* **Engine** (引擎层)：**提供Flutter核心API的底层实现**，包括图形绘制、文本布局、文件和网络IO、插件架构和Dart运行时和编译环境。主要使用C++编写，并通过 **dart:ui** 库暴露给上面的框架层。
* **Framework** (框架层)：**负责提供上层API的封装**，用于构建高质量的应用，如widget、动画、手势、无障碍和文本输入等。使用Dart语言编写，包含了多个层次的库：

* **Foundation** (基础库)：提供一些基础的类和服务，如动画、绘制、手势等，以及一些平台无关的工具类，如日期、时间、集合等；
  + **Rendering** (渲染库)：提供一套用于构建和布局UI树的抽象，以及一些具体的渲染对象，如盒子、文本、图片等。渲染库会根据UI树的变化，自动计算出需要重绘的部分，并调用底层的dart:ui库进行绘制。
  + **Widgets** (组件库)：提供了一套基于渲染库的高级组件，以及一些管理组件状态和生命周期的机制，如StatefulWidget、StatelessWidget、InheritedWidget等。组件库是Flutter开发的基础，它实现了响应式编程模型，让开发者可以方便地构建复杂的用户界面。
  + **Material、Cupertino库**：提供了一套遵循 Material Design 和 iOS风格的组件，如按钮、导航栏、对话框等，以及一些与平台相关的主题、图标、字体等。这些库让开发者可以快速地创建符合不同平台设计规范的应用。

😏 顺带提一嘴 **Flutter性能能媲美原生应用** 的原因（摘自[《Flutter框架分析（一）--架构总览》](https://zhuanlan.zhihu.com/p/363357534)）：

RN等JavaScript+原生渲染跨平台技术 **需要先调用原生框架**，再通过原生框架调用Skia，最后调用至GPU进行绘制。而 **Flutter直接通过Skia调用GPU进行绘制**，少了调原生框架那一步，这就是Flutter性能为啥能媲美原生应用的原因。另外，Android中的Skia升级比较缓慢，而Flutter自带Skia，升级方便，如果使用了更高性能的Skia库，其绘制性能甚至可能超过原生。

### 1.2. Flutter 线程模型

**Flutter 引擎** 并不创建和管理线程，而是抽象出 **Task Runner** 的概念，由对应的 **平台层** 来实现 **四个主要的Task Runner**。Flutter 引擎不关心它们是否为指向同一个Task Runner引用，或者运行在同一个线程中。不过官方还是建议：为了获得最佳性能，应该为每个Task Runner创建一个专用线程。

这四个Task Runner分别为：

* **Platform Task Runner**：**主Task Runner**，对应Android和iOS中的 **主线程**，对于Flutter引擎的接口调用都要保证在Platform Thread进行。不建议在此Runner执行繁重的耗时操作，虽然 **不会直接导致Flutter App的卡顿**，但长时间卡住主线程，App有可能被 **系统Watchdog机制** 强杀。
* **UI Task Runner**：**负责执行Dart代码**，包括 **应用的主代码和 Root isolate**，它也可以调度和提交渲染帧，生成 layer tree 和 semantic tree，与平台无关，它只需要与 Flutter 引擎交互。它的性能直接 **影响Flutter应用的流畅度(卡顿掉帧)** ，所以避免在该Runner上执行耗时计算或者堵塞的操作。
* **Raster Task Runner**：将UI Task Runner 生成的 **layer tree 光栅化** 为 **bitmap**，然后显示在屏幕上。它需要访问设备的 rasterizer (通常由GPU提供)，所以它也被称为 **GPU Task Runner**。
* **IO Task Runner**：负责执行IO相关的任务，如文件读写、网络请求、图片解码等，它可以创建和管理其它Dart isolate，以便在后台执行一些复杂的计算。

注：Android和iOS平台，每个Flutter引擎实例启动时，默认会为UI、GPU、IO Runner 各自创建一个新的线程，而 **所有Flutter引擎实例共享同一个Platform Runner和线程**。

😀 简单提炼下要点：

Flutter中的 Task Runner 是 **管理和运行任务的抽象**，由 **平台层** 实现与 **对应系统线程的关联**。少在 **Platform Runner** 和 **UI Runner** 里做耗时操作，前者可能会导致ANR，后者可能会导致Flutter应用卡顿掉帧。

### 1.3. Dart 并发实现 → isolate

上面提到了 **isolate(隔离区)** ，它是Dart并发编程的 **执行单元**，基于 **Actor模式** 的具体实现，这种 **并发编程模型** 的核心思想：**将程序分解成多个Actor对象，彼此独立的并发实体，通过消息传递进行通信**。在Dart变现为：

每个 isolate 拥有自己的 **内存空间 (堆栈)** 和 **单线程控制的运行实体 (保证代码顺序执行 → 消息队列+事件循环)** ，没有 **共享内存的并发**，无需在isolate内部管理 **同步和锁问题**，由此简化了并发模型。isolate 间只能通过 **消息传递(Port端口)** 进行通信，所以Dart中的消息传递总是 **异步** 的。

😳 网上很多文章喜欢把 isolate 称为轻量级的线程，个人觉得不太贴切，**内存隔离 + 消息通信** 使得 isolate 更像是 **轻量级的进程**。Dart 本身抽象了isolate 和 thread，实际底层还是使用操作系统提供的OS Thread。

当Dart VM创建一个 isolate 时，底层会为其分配一个OS Thread (新建或复用)，Dart VM会管理这些线程，并确保Dart代码能够在正确的 isolate 环境中运行。具体源码可以看下 [isolate.cc](https://github.com/dart-lang/sdk/blob/main/runtime/lib/isolate.cc) 中的 **SpawnIsolateTask** 类，其中的 thread->isolate() 让线程关联对应的isolate实例。

Isolate 由 **Engine层** 里的 **Dart Isolate Setup** 模块创建和管理，**Dart VM启动时创建**的第一个 isolate → **Root Isolate**，它是 **Dart程序的入口点**，负责执行UI线程上的所有Dart代码。可以通过 **Dart的C++调用能力** 把UI渲染相关的任务交给UI线程，也可以接收来自UI线程的事件通知，还可以通过 **Isolate.spawn** 或 **Isolate.spawnUri** 方法创建其它Isolate，用于执行一些耗时的计算任务或IO操作，避免阻塞UI线程。

### 1.4. Dart 单线程模型 → Event Loop

使用 **单线程模型** 来进行 **逻辑处理** 和 **UI渲染**，这个线程一般称作 **UI线程/主线程**，这样设计的目的：**保持UI一致性和可靠性**，**避免多线程带来的并发问题和线程安全问题**。而Dart中的单线程模型指的是：

每个 isolate只有一个 **Event Loop** (事件循环)，它会 **按顺序执行同步代码和异步回调**，不会出现并发执行的情况。

所谓的 **Event Loop(事件循环)** 就是：**只要事件队列不为空，就不断从中获取一个事件并对其进行处理**。事件可能是：用户输入、文件 I/O 通知、计时器等，简易示例图如下：

在Dart中，main()函数执行完毕后，Main Isolate的线程不会立即结束，而是开始逐一处理事件队列中的事件：

当然，这是简化过后的流程图，Dart中的事件循环，其实包含了两个队列：

* **微任务队列** (microtask queue)：即时执行的 **小任务**，不含任何I/O操作或其它需要等待的操作，很少用到；
* **事件队列** (event queue)：需要较长执行时间的 **宏观任务**，如: I/O操作、定时器、绘制事件和用户交互等；

在每次事件循环中，Dart 总是先查询 **微任务队列** 中是否有可执行任务，没有才会去处理 **事件队列** 里的任务。完整流程示意图如下：

### 1.5. 同步 & 异步

上面提到 **同步** 和 **异步**，它们是两种不同的 **程序执行模式**：

* **同步模式**：程序 **按照顺序依次执行**，每个操作都必须等待上一个操作完成才能继续执行。即 **串行执行** (线性、有序)。同步模式可以保证，程序执行的可靠性和稳定性，但执行效率可能会受到限制。
* **异步模式**：程序 **不按照顺序依次执行**，而是通过回调函数、事件驱动或者其他方式实现 **并行执行** (非线性、无序)，每个操作可以在前一个操作尚未完成时开始执行。异步模式可以提高程序的执行效率，充分利用计算资源。

举个简单例子 (**App下载视频**)：

* 同步就是，你得跟个智障😑一样等视频下载完，才能执行其它操作；
* 异步就是，提交了下载任务，App后台自动下载，不妨碍你做其它操作，等视频下载完它再通知你一下👻；

应该很好理解，总结下就是：**任务执行过程中有需要等待结果的耗时任务，可以考虑使用异步提高效率**。

### 1.6. 耗时任务的分类

App中的耗时任务可以笼统地分为两类：

* **IO密集型**：涉及大量的输入/输出操作，如：文件读写、网络通信、数据库访问等；执行此类任务时CPU的利用率相对较低，主要时间花费到等待IO操作的完成上。可以利用异步IO、多线程等方式提高并发性。
* **计算密集型 (CPU密集型)** ：涉及大量的计算操作，如：复杂的数学运算、图像/视频处理等；执行此类任务时CPU的利用率相对较高，主要时间花费在进行各种计算操作上。可以利用多核CPU、并行计算等方式提高计算速度。

接着写下代码演示下这两种类型的任务：

```dart
class _TaskScreenState extends State<TaskScreen> {
  String text = "任务结果";

  // IO密集型任务
  void doIOTask() async {
    Response response = await Dio().get("https://www.wanandroid.com/banner/json");
    setState(() {
      text = response.data.toString();
    });
  }

  // CPU密集型任务
  void doCPUTask() {
    int sum = 0;
    for(int i = 0; i < 1000000000; i++) {
      sum += i;
    }
    setState(() {
      text = "计算结果：$sum";
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const CircularProgressIndicator(),
        const SizedBox(height: 10),
        Text(text),
        MaterialButton(
            color: Colors.blue,
            onPressed: () {
              doIOTask();
            },
            child: const Text('执行IO密集型任务')),
        MaterialButton(
            color: Colors.blue,
            onPressed: () {
              doCPUTask();
            },
            child: const Text('执行计算密集型任务'))
      ],
    );
  }
}
```dart

运行后，分别点击两个按钮执行任务，效果如下：

可以看到，**请求网络不会卡顿**，**执行大规模计算直接卡住**，为啥？因为前面是 **异步**，后面是**同步**，具体分析下：

* await Dio().get(xxx)：告诉Dart启动网络请求，挂起当前函数的执行，让出控制权，直到请求完成。在这段挂起的时间里，Dart的事件循环可以处理其他事件，比如用户界面更新、输入事件或计时器。UI保持响应状态，网络数据获取后可以重新开始执行并更新UI。
* doCPUTask() 中的代码是计算密集型的任务，在循环中执行大规模的同步计算，并没有让出控制权，由于Dart是单线程的，直接堵塞事件循环，导致应用无法处理其它事件，如屏幕刷新或用户交互，这样UI就会冻结直到计算完成。

 直接使用 **Future** + **await** + **async** 三个关键字 **同步变异步**？

```dart
void doCPUTask() async {
  return Future((){
    int sum = 0;
    for(int i = 0; i < 1000000000; i++) {
      sum += i;
    }
    return sum;
  }).then((sum) => setState(() {
      text = "计算结果：$sum";
    })
  );
}
```dart

🤣 抱歉，一样卡死，尽管使用了**异步Future**，但 **同步和计算密集型的代码** 依旧会在单一的isolate上运行，Event Loop依旧需要等待这段同步代码执行完毕后，才能继续处理其它事件。为了解决这个问题，可以把 **计算密集型任务** 丢到 **新的isolate** 中运行，计算完毕后再通过端口发送回主isolate，并更新UI。具体代码如下：

```dart
void doCPUTask() async {
  // 创建一个ReceivePort，用来接收来自新Isolate的消息
  final resultPort = ReceivePort();
  // 创建并启动一个新的Isolate，它将并行执行累加操作
  await Isolate.spawn((sendPort) {
    // 在新建的isolate中执行耗时计算操作
    int sum = 0;
    for(int i = 0; i < 1000000000; i++) {
      sum += i;
    }
    // 计算完毕，通过Port发送结果回主Isolate
    sendPort.send(sum);
  }, resultPort.sendPort);
  // 等待并获取新Isolate发送回来的第一个消息
  int sum = await resultPort.first;
  // 更新UI
  setState(() {
    text = "计算结果：$sum";
  });
}
```dart

😁 修改后运行，此时发现执行计算密集型任务也不会导致UI卡顿啦！关于概念的东西就了解到这吧，接着具体讲下Dart的异步编程API~

## 2. Dart异步编程API详解

Dart 中的异步编程API，主要是通过 **Future** 和 **Stream** 两个API来实现的，一一讲解下~

### 2.1. Future

Dart中的 **Future** 代表 **一个异步任务**，定义一个异步任务的代码示例如下：

```dart
Future<String> fetchData() {
  // 休眠3s模拟执行耗时操作
  return Future.delayed(const Duration(seconds: 3), () {
    return "Hello Flutter!";
  });
}
```dart

😁然后是获取异步返回结果的两种方式~

#### 2.1.1. async + await

两个关键字提供了一种 **类似同步代码的方式来编写异步操作**，好处 → 直观、易于阅读和维护：

* **async** → 用于声明一个异步函数；
* **await** → 用于等待一个异步操作的结果；

调用上述异步任务的代码示例如下：

```dart
Future<void> printData() async {
  var result = await fetchData();
  print(result);
}
```dart

另外，建议对异步操作中可能出现的错误进行处理，直接使用 **try-catch** 关键字进行异常捕获：

```dart
  Future<void> printData() async {
    try {
      var result = await fetchData();
      print(result);
    }  on IntegerDivisionByZeroException catch (e) {
      print("除0异常");
    } catch (e) {
      print(e);
    } finally {
      print("异常与否最终都要执行的代码块");
    }
  }
```dart

对了，还有一点要注意：**使用await会等待，直到异步操作完成才继续往下执行代码**，比如这样的代码：

```dart
// 定义三个异步请求
Future<String> fetchUserOrder1() => Future.delayed(Duration(seconds: 1), () => 'Order 1');

Future<String> fetchUserOrder2() => Future.delayed(Duration(seconds: 2), () => 'Order 2');

Future<String> fetchUserOrder3() => Future.delayed(Duration(seconds: 3), () => 'Order 3');

Future<void> doTasks() async {
	var startTime = DateTime.now().second;
  await fetchUserOrder1();
  await fetchUserOrder2();
  await fetchUserOrder3();
  var endTime = DateTime.now().second;
  print(endTime - startTime);	// 输出：6
}
```dart

因为等待，所以总的运行时间为：1+2+3=6s，如果想三个请求同时执行，可以改下写法：

```dart
Future<void> doTasks() async {
  var startTime = DateTime.now().second;
  var order1 = fetchUserOrder1();
  var order2 = fetchUserOrder2();
  var order3 = fetchUserOrder3();
  await order1;
  await order2;
  await order3;
  var endTime = DateTime.now().second;
  print(endTime - startTime);	// 输出：3
}
```dart

也可以用下下面提到的Future.wait()方法来实现多个耗时任务并行。

#### 2.1.2. then() + catchError() + whenComplete()

这三个方法是Future的一个API，它允许你在Future **成功完成时**、**异常结束时**、**任务完成时(无论成败)** 时执行一个回调参数，使用代码示例如下：

```dart
void printData() {
  fetchData().then((result) {
    print("获取异步结果并输出：$result");
  }).catchError((error) {
    print("捕获异常：$error");
  }).whenComplete(() {
    print("无论是否捕获异常，都会执行的代码块");
  });
}
```dart

Future 的 then() 方法代码如下：

```dart
Future<R> then<R>(FutureOr<R> onValue(T value), {Function? onError})
```dart

返回一个Future，所以在处理连续请求时，可以 **连续追加多个then** 来规避回调地狱，伪代码如下：

```dart
fetchData()
    .then((value) => "写入数据库")
    .then((value) => "刷新UI")
    .then((value) => "埋点上报")
    .catchError((error, stackTrace) => print("stackTrace"));
```dart

#### 2.1.3. FutureBuilder

**FutureBuilder** 是 Flutter 提供的 **可以根据异步操作结果自动更新UI的组件**，它的构造函数中的参数如下:

* **future**：**必须**，代表 FutureBuilder 需要监听的 Future，通常是IO或网络请求等耗时操作；
* **initialData**：可选，提供一个初始值给后面builder回调函数，后者可以调用 **snapshot.data** 获取这个值；
* **builder**：**必须**，包含一个**BuildContext** 和 **AsyncSnapshot** 参数的函数，定义了根据不同的future状态构建不同的UI；

写个简单代码示例：

```dart
class UserListPage extends StatefulWidget {
  const UserListPage({Key? key}) : super(key: key);

  @override
  State<UserListPage> createState() => _UserListPageState();
}

class _UserListPageState extends State<UserListPage> {
  // 请求接口
  Future<List> _fetchRemoteData() async {
    final response = await Dio().get('https://jsonplaceholder.typicode.com/users');
    return response.data;
  }

  // 模拟加载本地缓存
  List _loadLocalData() => [
        {
          "id": 1,
          "name": "Leanne Graham",
          "username": "Bret",
          "email": "Sincere@april.biz",
        },
        {
          "id": 2,
          "name": "Ervin Howell",
          "username": "Antonette",
          "email": "Shanna@melissa.tv",
        },
        {
          "id": 3,
          "name": "Clementine Bauch",
          "username": "Samantha",
          "email": "Nathan@yesenia.net",
        },
      ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('FutureBuilder Example'),
      ),
      body: FutureBuilder(
        future: _fetchRemoteData(),
        initialData: _loadLocalData(),
        builder: (BuildContext context, AsyncSnapshot<List> snapshot) {
          // 根据不同的Future状态返回不同的UI
          switch (snapshot.connectionState) {
            case ConnectionState.none:
              print("Future还未开始执行");
              return const Center(
                child: Text('Future还未开始执行'),
              );
            case ConnectionState.waiting:
              print('Future已经开始执行');
              if(snapshot.hasData) {
                print("接收到从initialData传递过来的初始数据长度：${snapshot.data?.length}");
              }
              return const Center(
                child: Text('Future已经开始执行'),
              );
            case ConnectionState.active:
              print('Future正在执行，但还没有完成');
              return const Center(
                child: Text('Future正在执行，但还没有完成'),
              );
            // Future 已经执行完成
            case ConnectionState.done:
              // 出现异常
              if (snapshot.hasError) {
                print('Future执行失败：${snapshot.error}');
                return Center(
                  child: Text('Future执行失败：${snapshot.error}'),
                );
              } else {
                print('Future执行成功，返回数据长度：${snapshot.data?.length}');
                return Center(
                  child: Text('Future执行成功，返回数据：${snapshot.data?.length}'),
                );
              }
          }
        },
      ),
    );
  }
}
```dart

运行后控制台输出结果如下：

😳 运行结果只走了 **waiting** 和 **done** 状态，其它两种状态很少发生，FutureBuilder 构建时如果指定了future，它会立即开始等待future的执行，通常直接进入 **waiting状态** 而不会走 **none状态**，而 **active状态** 只能用于具有中间值的 **StreamBuilder**。**只有在done状态前**，snapshot.data的值才为initalData传递过来的初始数据，done后异常会置为null，执行成功则为future的返回值。

#### 2.1.4. Future.wait()

在实际开发场景中，有时需要 **等待多个Future返回并收集返回结果**，比如：某个页面需要加载多个接口，需要所有接口结果都返回，才刷新UI，一种简单粗暴的处理方式是：加载UI前判断返回值是否都拿到了，是再刷新。那有更简便的方法吗？😁有的，Future提供了一个 **wait()** 的静态方法，该方法接收一个 **Future列表** 作为参数，当列表中所有Future都完成后才会触发回调。使用代码示例如下：

```dart
Future<void> doTasks() async {
  try {
    // 等待所有异步请求完成
    var orders = await Future.wait([
      fetchUserOrder1(),
      fetchUserOrder2(),
      fetchUserOrder3(),
    ]);
    // 所有请求完成后，执行UI操作
    for (var order in orders) {
      print('Completed: $order'); // 实际上，这里可以是你的UI操作代码
    }
  } catch (error) {
    // 等待期间任何一个 Future 失败都会抛出异常
    print('Error: $error');
  }
}
```dart

#### 2.1.5. Future.delayed()

创建一个 **延迟执行回调的Future**，内部实现为 **Timer** + 延时执行的Future：

#### 2.1.6. Future.microtask() & Future.sync()

**前者作用**：**将创建的事件发送到微任务队列**，具有比事件队列优先执行的特点；

**后者作用**：**同步调用**，立即执行Future里的内容；

简单示例：

```dart
Future<void> doTasks() async {
  Future.microtask(() => print(9));
  Future(() => print(10));
  Future.sync(() => print(11));
}
// 输出结果：11、9、10
```dart

#### 2.1.7. Future.value() & Future.error()

**前者作用**：创建一个已经完成并且成功的Future对象，其值为指定的数值；

**后者作用**：创建一个已经完成且包含错误的Future对象，其错误值为指定的错误对象；

这两个方法可用于 **立即创建并返回Future对象，无需等待异步操作完成**，简单示例：

```dart
Future<String> fetchRemoteData() {
  // 模拟从远程服务器获取数据的异步操作
  return Future.delayed(Duration(seconds: 2), () {
    // 假设数据成功返回
    return Future.value('Remote data');
    // 如果发生错误，可以使用 Future.error 来返回失败的 Future 对象：
    // return Future.error(Exception('Failed to fetch remote data'));
  });
}
```dart

#### 2.1.8. Future.any()

**函数描述**：接受一个 **Iterable** 对象并返回一个 **Future** → 集合中第一个完成的Future结果；

**使用场景**：当存在多个异步操作，而你只关心最快完成的操作的结果时，可以用它；

简单示例：

```dart
import 'dart:async';

void main() {
  Future<String> firstFuture = Future.delayed(Duration(seconds: 2), () => "First Future Completed");
  Future<String> secondFuture = Future.delayed(Duration(seconds: 1), () => "Second Future Completed");

  Future.any([firstFuture, secondFuture])
    .then((result) {
      print("The first future to complete is: $result");
    });
}
// 输出：The first future to complete is: Second Future Completed
```dart

#### 2.1.9. Future.forEach

**函数描述**：接受一个 Iterable 对象和一个回调函数，并返回一个Future → 所有异步操作完成后才会完成；

**使用场景**：需要对Iterable对象中的每个元素执行一个异步操作，且在全部异步操作完成后执行操作，可以用它；

简单示例：

```dart
import 'dart:async';

void main() {
  List<int> numbers = [1, 2, 3, 4, 5];

  Future.forEach(numbers, (int number) {
    return Future.delayed(Duration(seconds: number), () {
      print("Processed number: $number");
    });
  }).then((_) {
    print("All numbers processed");
  });
}
```dart

#### 2.1.10. Future.doWhile()

**函数描述**：创建一个循环异步执行一个函数，直到该函数返回false；

**使用场景**：**轮询**，执行一个异步操作多次，直到达到预期的结果，可以用它；

简单示例：

```dart
Future<void> asyncLooper() async {
  int counter = 0;

  await Future.doWhile(() async {
    // 执行一些异步操作
    await Future.delayed(Duration(seconds: 1));
    // 假设我们的异步操作是打印计数器的当前值
    print('Counter is at $counter');

    // 更新计数器
    counter++;

    // 如果计数器小于5，返回true继续循环；否则返回false停止循环
    return counter < 5;
  });

  // 当循环结束时，这里的代码会执行
  print('Done looping');
}
```dart

### 2.2. Stream (流)

**Future** 代表 **一个异步任务**，**Stream** 则代表 **一个异步任务序列**，即 **一连串的异步任务**。你可以监听Stream来获取它的结果 (数据和错误)，也可以在Stream完成前对它进行暂停或停止监听，它有两种类型：

* **Single-subscription**：**单订阅流**，只能被一个监听器监听；
* **Broadcast**：**广播流**，能被多个监听器同时监听；

#### 2.2.1. 创建Stream的几种方法

① 使用 **Stream的构造方法创建**

* **Stream.fromFuture()：** 将一个Future转化为Stream流；
* **Stream.fromFutures()** ：将一个Future列表转换为Stream流；
* **Stream.fromIterable()** ：将一个Iterable (如List或Set) 转换成 Stream流；
* **Stream.periodic()** ：创建一个周期性发出事件的Stream流；
* **Stream.empty()** ：创建一个空的流，不包含任何事件；
* **Stream.value()** ：创建一个单一值的流，流中只有一个事件；
* **Stream.error()** ：创建一个包含错误事件的流；
* **Stream.multi()** ：允许你使用一个事件生成器函数来控制流的发送，用于创建具有复杂行为的流；

简单代码示例：

```dart
Future<String> fetchAsyncData() async {
  await Future.delayed(const Duration(seconds: 2));
  return 'Future Fetched data';
}

void testStream() {
  Stream.fromIterable([1, 2, 3, 4, 5]).listen((event) => print(event)); // 输出：1、2、3、4、5
  Stream.periodic(const Duration(seconds: 1), (computationCount) => computationCount)
      .take(5)
      .listen((event) => print(event)); // 输出(间隔1s)：0、1、2、3、4
  Stream.fromFuture(fetchAsyncData()).listen((event) => print(event));  // 输出：Future Fetched data
}
```dart

② 使用 **async** + **yield** 或 **yield** 创建

注意这个 **async** 是有个**星号的哈，不是 **async** ！它用于标记一个 **异步生成器函数** (返回Stream对象的函数)，可以在等待异步操作完成的同时产生多个值。然后是给 **Stream监听器传递值** 的两种方式：

* **yield**：每次调用yield时都会向Stream中添加一个值，函数执行到yield语句时会暂停，直到Stream监听器装备好接收下一个值才继续执行，这允许你构建一个可以产生多个值的函数，且这些值不是立即生成的，而是随着消费者的接收能力逐一生成。
* **yield** ：将一个 Stream 的所有值插入到另一个 Stream 中，当生成器函数遇到yield*时，它会等待并传递所有来自另一个 Stream 的值，直到那个 Stream 完成。

简单代码示例如下：

```dart
// 定义一个异步生成器函数，它使用yield来产生数字1到3
Stream<int> numberStream() async* {
  for (int i = 1; i <= 3; i++) {
    yield i; // 向 Stream 发送值 i
    await Future.delayed(Duration(seconds: 1)); // 模拟异步等待
  }
}

// 另一个异步生成器函数使用yield*来传递numberStream生成的所有值
Stream<int> replicatedNumberStream() async* {
  yield* numberStream(); // 将 numberStream 的所有值传递给当前 Stream
}

void main() async {
  print('Start listening to numberStream');
  await for (int number in numberStream()) {
    print('Got a number from numberStream: $number');
  }

  print('Start listening to replicatedNumberStream');
  await for (int number in replicatedNumberStream()) {
    print('Got a number from replicatedNumberStream: $number');
  }
}

// 输出结果：
// Start listening to numberStream
// Got a number from numberStream: 1
// Got a number from numberStream: 2
// Got a number from numberStream: 3
// Start listening to replicatedNumberStream
// Got a number from replicatedNumberStream: 1
// Got a number from replicatedNumberStream: 2
// Got a number from replicatedNumberStream: 3
```dart

③ 使用 **StreamController** 创建

这种方式创建和使用Stream流更加灵活，先明确四个角色：

* **Stream**：**数据源**，可以被监听，单订阅流只能有一个监听器，而广播流可以有多个监听器；
* **StreamController**：**Stream流的控制器**，可以在Stream上发送数据、错误和完成事件、也可以检查Stream是否暂停、是否有订阅者，以及在其它任何发生改变时获取到回调。提供了两个工厂方法来创建实例：**StreamController()** 和 **StreamController.broadcast()** ，分别对应单订阅流和广播流。
* **StreamSink**：**添加Stream事件的抽象类**，用于添加数据、错误和关闭事件到Stream上，StreamController 实现了此接口，因此它也可以作为一个StreamSink使用。
* **StreamSubscription**：**Stream的监听对象**，它可以监听Stream上的数据、错误和完成事件，也可以暂停、恢复和取消订阅。当你调用Stream的 **listen()** 方法时，会返回一个 StreamSubscription 对象，可以使用它来控制订阅。

简单代码示例如下：

```dart
import 'dart:async';

void main() {
  // 创建一个单订阅流的 StreamController
  // 如果想创建广播流可以用 StreamController.broadcast()
  var controller = StreamController<int>();

  // 订阅Stream
  controller.stream.listen(
    (data) {
      print('Received data: $data');
    },
    onDone: () {
      print('Stream is closed');
    },
    onError: (error) {
      print('Error occurred: $error');
    },
  );

  // 往Stream中添加数据
  controller.sink.add(1);
  controller.sink.add(2);
  controller.sink.addError('Something went wrong');
  controller.sink.add(3);

  // 关闭StreamController时，会向Stream发送关闭事件
  // 需要在确保不再发送数据的情况下执行此操作，以防止内存泄露和资源浪费
  controller.close();
}

// 输出结果：
// Received data: 1
// Received data: 2
// Error occurred: Something went wrong
// Received data: 3
// Stream is closed
```dart

有些读者可能会疑惑：没有定义StreamSubscription变量兜住listen()的返回值，然后调用cancel() 取消订阅不会**内存泄露** 吗？

> 答：不会。cancel() 方法一般在监听器不需要接收数据，但Stream还未结束时使用。当调用StreamController的close() 方法时，该控制器上的Stream会结束，一旦Stream结束，它会自动发送一个完成事件给所有监听器，并关闭Stream。这种情况下，监听器就不需要显式调用 cancel() 来取消订阅，因为Stream已经完成。

另外，构造参数中还支持传入一个bool类型的 **sync参数** (默认false) 决定是否创建一个同步类型的StreamController，即事件添加和监听处于同一个Event Loop中，不太建议设置为true，可能导致潜在的堆栈溢出错误。

#### 2.2.2. StreamBuilder

和前面学的 FutureBuilder 类似，状态监听有些不同，简单改下前面的示例实现相同的效果：

```dart
class _UserListPageState extends State<UserListPage> {
  late StreamController<List> _usersStreamController; // Stream控制器
  late Stream<List> _usersStream; // 流

  @override
  void initState() {
    super.initState();
    _usersStreamController = StreamController();
    _usersStream = _usersStreamController.stream;
    fetchData();
  }

  @override
  void dispose() {
    _usersStreamController.close(); // 销毁时要调close()
    super.dispose();
  }

  Future<void> fetchData() async {
    try {
      var remoteData = await _fetchRemoteData(); // 请求远程数据
      _usersStreamController.add(remoteData); // 发送远程数据
      // 延时3s发送一个空数据
      await Future.delayed(const Duration(seconds: 3), () async {
        _usersStreamController.add([]); // 发送远程数据
      });
    } catch (e) {
      _usersStreamController.addError(e); // 发送错误
    }
  }

  // 请求接口
  Future<List> _fetchRemoteData() async {
    final response = await Dio().get('https://jsonplaceholder.typicode.com/users');
    return response.data;
  }

  // 模拟加载本地缓存
  List _loadLocalData() => [
        {
          "id": 1,
          "name": "Leanne Graham",
          "username": "Bret",
          "email": "Sincere@april.biz",
        },
        {
          "id": 2,
          "name": "Ervin Howell",
          "username": "Antonette",
          "email": "Shanna@melissa.tv",
        },
        {
          "id": 3,
          "name": "Clementine Bauch",
          "username": "Samantha",
          "email": "Nathan@yesenia.net",
        },
      ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('FutureBuilder Example'),
      ),
      body: StreamBuilder(
        stream: _usersStream,
        initialData: _loadLocalData(),
        builder: (BuildContext context, AsyncSnapshot<List> snapshot) {
          // 根据不同的Future状态返回不同的UI
          switch (snapshot.connectionState) {
            case ConnectionState.none:
              print("Future还未开始执行");
              return const Center(
                child: Text('Future还未开始执行'),
              );
            case ConnectionState.waiting:
              print('Future已经开始执行');
              if (snapshot.hasData) {
                print("接收到从initialData传递过来的初始数据长度：${snapshot.data?.length}");
              }
              return const Center(
                child: Text('Future已经开始执行'),
              );
            case ConnectionState.active:
              print('Future正在执行，但还没有完成 返回数据长度：${snapshot.data?.length}');
              return const Center(
                child: Text('Future正在执行，但还没有完成'),
              );
            // Future 已经执行完成
            case ConnectionState.done:
              // 出现异常
              if (snapshot.hasError) {
                print('Future执行失败：${snapshot.error}');
                return Center(
                  child: Text('Future执行失败：${snapshot.error}'),
                );
              } else {
                print('Future执行成功，返回数据长度：${snapshot.data?.length}');
                return Center(
                  child: Text('Future执行成功，返回数据：${snapshot.data?.length}'),
                );
              }
          }
        },
      ),
    );
  }
}
```dart

运行后控制台输出结果如下：

相比 FutureBuilder，它会走 **waiting状态**，每次往Stream里发信息时都会走 **active** 状态，调用**StreamController** 的 **close()** 关闭Stream 或者异常，才会走 **done** 状态。

#### 2.2.3. 处理 Stream 的API

上面我们使用 **listen()** 方法来对Stream进行监听，监听数据、错误以及关闭事件。除此之外还有下述API：

```dart
//获取Stream中的第一个元素，若Stream为空，则等待直到有元素可用。
Future<T> get first;

//检查Stream中是否没有元素，并返回对应的Future布尔值。
Future<bool> get isEmpty;

//获取Stream中的最后一个元素，若Stream没有结束，则等待直到Stream结束。
Future<T> get last;

//获取Stream中元素的个数，并返回一个Future整数。
Future<int> get length;

//当Stream中只有一个元素时返回它，否则如果是空或有多个元素则抛出异常。
Future<T> get single;

//检查Stream中的元素是否至少有一个满足条件`test`，是则返回true，否则返回false。
Future<bool> any(bool Function(T element) test);

//确定Stream中是否包含某个特定元素`needle`。
Future<bool> contains(Object? needle);

//丢弃所有的元素，当流关闭时，返回一个包含`futureValue`的Future。
Future<E> drain<E>([E? futureValue]);

//获取Stream中指定位置`index`的元素。
Future<T> elementAt(int index);

//检查Stream中的所有元素是否都满足条件`test`，是则返回true，否则返回false。
Future<bool> every(bool Function(T element) test);

//返回Stream中第一个满足条件`test`的元素，如果没有符合的元素则调用`orElse`。
Future<T> firstWhere(bool Function(T element) test, {T Function()? orElse});

//使用`combine`函数将Stream中的所有元素合并成一个值。
Future<S> fold<S>(S initialValue, S Function(S previous, T element) combine);

//对Stream中的每个元素执行操作`action`。
Future forEach(void Function(T element) action);

//将Stream中的所有元素连接成一个字符串，用`separator`分隔。
Future<String> join([String separator = '']);

//返回Stream中最后一个满足条件`test`的元素，如果没有符合的元素则调用`orElse`。
Future<T> lastWhere(bool Function(T element) test, {T Function()? orElse});

//将Stream的所有元素添加到目标`streamConsumer`中。
Future pipe(StreamConsumer<T> streamConsumer);

//将Stream的元素两两结合（从Stream的开头开始），使用`combine`函数将它们合并成一个值，并返回这个值。
Future<T> reduce(T Function(T previous, T element) combine);

//返回Stream中唯一满足条件`test`的元素，如果没有符合或存在多个则抛出异常，如果没有找到并且`orElse`被提供，则调用`orElse`。
Future<T> singleWhere(bool Function(T element) test, {T Function()? orElse});

//将Stream整理成一个Future列表。
Future<List<T>> toList();

//将Stream整理成一个Future集合。
Future<Set<T>> toSet();
```dart

#### 2.2.4. 修改 Stream 的API

下述API可以 **对原始Stream进行处理并返回新的Stream**，调用这些方法后，监听原始Stream上的监听器会先监听转换后的新Stream，待新的 Stream 处理完成后才会转而回去监听原始的 Stream。

```dart
// 将流中的事件转换为特定类型<R>。
Stream<R> cast<R>();

// 展开流中的每个元素到零个或多个事件。
Stream<S> expand<S>(Iterable<S> Function(T element) convert);

// 将流中的每个事件映射为不同类型的事件。
Stream<S> map<S>(S Function(T event) convert);

// 跳过流的前'count'个事件。
Stream<T> skip(int count);

// 当遇到符合给定条件的事件时，跳过流中的事件。
Stream<T> skipWhile(bool Function(T element) test);

// 只获取流中的前'count'个事件。
Stream<T> take(int count);

// 当事件满足提供的条件时，获取流中的事件。
Stream<T> takeWhile(bool Function(T element) test);

// 过滤流中满足特定条件的事件。
Stream<T> where(bool Function(T event) test);

// 异步转换流中的每个事件。
Stream<E> asyncExpand<E>(Stream<E>? Function(T event) convert);

// 异步映射流中的每个事件。
Stream<E> asyncMap<E>(FutureOr<E> Function(T event) convert);

// 如果提供了比较函数，则返回由不重复元素组成的流，否则比较元素的相等操作符。
Stream<T> distinct([bool Function(T previous, T next)? equals]);

// 处理流中的错误事件。
Stream<T> handleError(Function onError, {bool Function(dynamic error)? test});

// 如果流中的事件处理超过时间限制，则执行超时操作。
Stream<T> timeout(Duration timeLimit,
    {void Function(EventSink<T> sink)? onTimeout});

// 使用指定的流转换器转换流。
Stream<S> transform<S>(StreamTransformer<T, S> streamTransformer);
```dart

😑 折腾 Stream流 的 **API/操作符** 太多了，限于篇幅，这里只是简述函数作用，具体使用示例可以看下张风捷特烈大佬的**《【Flutter 异步编程 - 玖】 | 学习 Stream 的元素转换操作》**~

### 2.3. Isolate (隔离)

 前面讲概念的时候已经演示过如何使用Isolate了：

在执行 **计算密集型耗时任务** 的场景，创建新的isolate来处理耗时任务，避免堵塞主isolate，任务执行完毕后通过端口通知主isolate。

先补充下这四个角色的描述吧：

* **Isolate**：**独立的Dart执行上下文**，可以通过 spwan() 或 spawnUri() 来创建一个新的 isolate；
* **ReceivePort** & **SendPort**：收发其它Isolate消息的端口，可以通过 sendPort属性获取一个SendPort对象，用于发送消息给对应的ReceiverPort；
* **Capability**：isolate的唯一标识，用于控制isolate的暂停和恢复；

再写个简单代码示例：

```dart
  void doCPUTask() async {
    // 创建一个ReceivePort，用来接收来自新Isolate的消息
    final receivePort = ReceivePort();

    // 创建并启动一个新的Isolate，它将并行执行累加操作
    final isolate = await Isolate.spawn((sendPort) {
      int sum = 0;
      for (int i = 0; i < 1000000000; i++) {
        sum += i;
      }
      // 计算完毕，通过Port发送结果回主Isolate
      sendPort.send(sum);
      sendPort.send('Hello');
      sendPort.send('World');
      // 发送一个错误消息给子Isolate
      sendPort.send(Error());
      sendPort.send('exit');
    }, receivePort.sendPort);

    // 监听ReceivePort的信息
    receivePort.listen((message) {
      // 打印接收到的消息
      print('接收到消息: $message');
      // 如果接收到的消息是'exit'，则关闭ReceivePort并杀死子Isolate
      if (message == 'exit') {
        receivePort.close();
        isolate.kill();
      }
    }, onError: (error, stackTrace) {
      print("处理错误信息：$error}");
    }, onDone: () {
      print("ReceivePort 关闭");
    });
  }
```dart

😭 这里有个小坑务必注意！！！我想把 spawn()的第一个函数抽取成一个单独的函数：

```dart
// 具体执行的CPU密集型操作
void echo(SendPort sendPort) {
  int sum = 0;
  for (int i = 0; i < 1000000000; i++) {
    sum += i;
  }
  // 计算完毕，通过Port发送结果回主Isolate
  sendPort.send(sum);
  sendPort.send('Hello');
  sendPort.send('World');
  // 发送一个错误消息给子Isolate
  sendPort.send(Error());
  sendPort.send('exit');
}

// 创建并启动一个新的Isolate，它将并行执行累加操作
final isolate = await Isolate.spawn(echo, receivePort.sendPort);
```dart

结果一直报这个错；

```dart
Unhandled Exception: Invalid argument(s): Illegal argument in isolate message: object is unsendable - Library:'dart:async' Class: _AsyncCompleter@4048458 (see restrictions listed at `SendPort.send()` documentation for more
```dart

搜了一圈网上的文档，都说 sendPort.send() 试图 **发送一个不可发送的对象**，只能发送简单的值类型，但是我发送的对象都是可以传递的，更玄学的是我把send()部分的代码注释了，还是报这个错。最后发现报错的真正原因： isolate.spawn() 是一个 **静态方法**，这个函数必须为 **静态或顶级函数**！！！只需要改下echo()函数的位置，就TM好了💀...

另外，Dart 2.15 开始支持传递一个 **立即调用的闭包** 作为第一个参数，这也是我一开始写的代码没报错的原因~

> Tips:🐶2333，本来还想刨下这些异步API源码，看看背后的实现原理，后面想想还是算了，篇幅太长，读者看着也难受，后面再专门开一篇来跟跟源码吧，本节就酱~

**参考文献**：

* [《The Engine architecture》](https://github.com/flutter/flutter/wiki/The-Engine-architecture)
* [《Dart官方文档：The Event Loop and Dart》](https://dart.cn/articles/archive/event-loop)
* [《Dart官方文档：使用 stream》](https://dart.cn/tutorials/language/streams)
* [《掘金专栏：Flutter 知识进阶 - 异步编程》](https://juejin.cn/column/7141354641874223112 "https://juejin.cn/column/7141354641874223112")
* [《聊一聊Flutter线程管理与Dart Isolate机制》](https://zhuanlan.zhihu.com/p/40069285)
* [《探索Flutter中线程模型/消息循环的底层逻辑》](https://cloud.tencent.com/developer/news/685497)
* [《Dart VM 的相关简介与运行模式解析》](https://zhuanlan.zhihu.com/p/377363912)
* **《必知必会的Flutter异步知识！》**
* [《Flutter 中的同步与异步》](https://zhuanlan.zhihu.com/p/400074689)