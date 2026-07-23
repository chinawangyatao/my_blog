---
title: "Flutter入门到精通（九）：UI实战：Loading缺省页组件封装"
pubDate: 2024-01-10
description: "封装通用的Loading和缺省页组件，提升应用用户体验。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第九篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

🐶 上节**《进阶-Flutter异步编程速通》**好像有点干，有读者私聊我说啃不太动，能不能写点应用实例助消化。

行叭，本节轻松一点，带着大伙来封装个用于显示 **加载状态** 的组件，依次通过 **setState()** 、**FutureBuilde**r 和 **StreamBuilder** 的方式实现一波~

## 1. setState() 实现

😀 先简单枚举下常规的加载状态：

```dart
/// 加载状态枚举
enum LoadingStatus {
  initial, // 初始状态
  content, // 显示内容
  loading, // 加载中
  empty, // 数据空
  disconnect, // 无网络
  error // 错误
}
```dart

接着是切换加载状态的核心逻辑：

> **控件构造方法传入一个加载状态参数** + **组件根据这个参数构造不同加载状态的Widget返回**；

父组件 **setState()** 会导致子组件重建，所以可以理解为 **加载状态组件的状态是确定(不变)** 的，所以继承**StatelessWidget** 而不是 StatefulWidget。而 **加载状态组件** 的布局诉求：

> **默认填满父控件的剩余空间**，如果内容控件的视图的高度 > 父控件的剩余高度，支持滚动；

需要用到的几个组件：

* **LayoutBuilder**：允许创建一个Widget，可以根据父控件的约束动态布局，它的 **builder()** 函数提供了当前BuildContext 和 父Widget传递的 **BoxConstraints**。
* **SingleChildScrollView**：支持滚动的组件；
* **ConstrainedBox**：用于对子Widget应用额外的约束，设置最小宽度和最小高度，使其和父布局一样大；
* **IntrinsicHeight**：让子组件的高度适应实际的大小；

弄清楚要用到哪些组件后，写出具体的实现代码：

```dart
/// 显示加载状态的组件
class LoadingStatusWidget extends StatelessWidget {
  final LoadingStatus? initStatus; // 初始加载状态，测试的时候用
  final Widget? contentWidget; // 显示内容面板的组件
  final Function? retryCallback; // 重试回调

  const LoadingStatusWidget({super.key, this.contentWidget, LoadingStatus? initStatus, this.retryCallback})
      : initStatus = initStatus ?? LoadingStatus.initial;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (BuildContext context, BoxConstraints constraints) {
      return SingleChildScrollView(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minWidth: constraints.maxWidth,
            minHeight: constraints.maxHeight,
          ), child: IntrinsicHeight(child: _generateStatusWidget(initStatus!)),
        ),
      );
    });
  }
}

// 生成显示加载状态的组件
Widget _generateStatusWidget() {
    switch(initStatus) {
     case LoadingStatus.initial:
        return const Container();
      case LoadingStatus.content:
        return contentWidget ?? const Container();
      case LoadingStatus.loading:
        return _loadingStatusWidget();
      case LoadingStatus.empty:
        return _emptyStatusWidget();
      case LoadingStatus.disconnect:
        return _disconnectStatusWidget();
      case LoadingStatus.error:
        return _errorStatusWidget();
      default:
        return Container();
    }
}
```dart

然后是对应状态Widget动态生成的方法：

```dart
// 加载中
Widget _loadingStatusWidget() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SizedBox(
            width: 30,
            height: 30,
            child: CircularProgressIndicator(
              backgroundColor: Colors.grey.withAlpha(33),
              valueColor: const AlwaysStoppedAnimation(Colors.red),
              strokeWidth: 3,
            )),
        const SizedBox(height: 12),
        const Text("加载中...",
            style: TextStyle(
              fontSize: 14.0, // 字体大小
              color: Colors.grey, // 设置字体颜色
              decoration: TextDecoration.none, // 设置不显示下划线
            ))
      ],
    );
  }

// 数据为空
Widget _emptyStatusWidget() {
    return const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(LoadingStatusIcons.loadingEmpty, size: 100, color: MyColors.leiMuBlue),
      SizedBox(height: 12),
      Text("数据为空",
          style: TextStyle(
            fontSize: 14.0, // 字体大小
            color: Colors.grey, // 设置字体颜色
            decoration: TextDecoration.none, // 设置不显示下划线
          ))
    ]);
  }

// 网络不可用
Widget _disconnectStatusWidget() {
  return Column(mainAxisAlignment: MainAxisAlignment.center, children: [
    const Icon(LoadingStatusIcons.loadingDisconnect, size: 100, color: MyColors.leiMuBlue),
    const SizedBox(height: 12),
    const Text("网络不可用",
        style: TextStyle(
          fontSize: 14.0,
          color: Colors.grey,
          decoration: TextDecoration.none,
        )),
    const SizedBox(height: 12),
    GestureDetector(
        onTap: () {
          widget.retryCallback?.call();
        },
        child: const Text("重试",
            style: TextStyle(
              fontSize: 14.0,
              color: Color(0XFF4A90E2),
              decoration: TextDecoration.none,
            )))
  ]);
}

// 加载失败
Widget _errorStatusWidget() {
  return Column(mainAxisAlignment: MainAxisAlignment.center, children: [
    const Icon(LoadingStatusIcons.loadingError, size: 100, color: MyColors.leiMuBlue),
    const SizedBox(height: 12),
    const Text("加载失败...",
        style: TextStyle(
          fontSize: 14.0,
          color: Colors.grey,
          decoration: TextDecoration.none,
        )),
    const SizedBox(height: 12),
    GestureDetector(
      onTap: () {
        widget.retryCallback?.call();
      },
      child: const Text("重试",
          style: TextStyle(fontSize: 14.0, color: Color(0XFF4A90E2), decoration: TextDecoration.none)),
    )
  ]);
}
```dart

再接着用 **GridView** 展示下不同加载状态的效果图：

```dart
// 使用GridView展示不同加载状态的Widget效果
Widget testLoadingStatusWidget() {
  var enumList = LoadingStatus.values;
  return Container(
      alignment: Alignment.center,
      color: Colors.white,
      child: GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3, // 每行两个
              childAspectRatio: 0.5 // 宽高比例
              ),
          itemCount: enumList.length,
          itemBuilder: (BuildContext context, int index) {
            return Center(
                child: LoadingStatusWidget(
                    initStatus: enumList[index],
                    contentWidget: enumList[index] != LoadingStatus.content ? null : const Text("显示内容")));
          }));
}
```dart

运行看看效果：

**Tips**：加载缺省页图标来源：[iconfont/雨子](https://www.iconfont.cn/user/detail?spm=a313x.search_index.0.d214f71f6.754e3a818Gb6wg&uid=4609382&nid=ip2DA1GwSIlu)，如何自定义字体图标可以查阅：**《七、项目实战-UI部分🤷‍♀️》**

最后，写一个异步请求网络如何切换加载状态的代码示例：

```dart
/// 首页
class IndexPage extends StatefulWidget {
  const IndexPage({super.key});

  @override
  State<StatefulWidget> createState() => _IndexPageState();
}

class _IndexPageState extends State<IndexPage> {
  // ① 需要定义一个记录加载状态的变量
  var _loadingStatus = LoadingStatus.initial;
  String _responseResult = '';

  void _loadRequest() {
    // 显示加载中
    _updateLoadingStatus(LoadingStatus.loading);
    Dio().get("https://www.wanandroid.com/article/list/1/json").then((response) async {
      _responseResult = "${response.data}";
      // 显示内容
      _updateLoadingStatus(LoadingStatus.content);
    }).catchError((e) {
      LogUtil.e("$e");
      _responseResult = e.toString();
      if (e is DioException) {
        if (e.error is SocketException) {
          // 网络不可用
          _updateLoadingStatus(LoadingStatus.disconnect);
        } else {
          // 其它异常
          _updateLoadingStatus(LoadingStatus.error);
        }
      } else {
        // 其它异常
        _updateLoadingStatus(LoadingStatus.error);
      }
    });
  }

  // 更新加载状态的通用方法
  void _updateLoadingStatus(LoadingStatus status) {
    setState(() {
      _loadingStatus = status;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
        color: Colors.white,
        child: SafeArea(
            child: Column(children: [
          const SizedBox(height: 10),
          MaterialButton(
            onPressed: _loadRequest,
            color: MyColors.leiMuBlue,
            textColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16.0),
            child: const Text('请求网络'),
          ),
          const SizedBox(height: 20),
          Expanded(
              child: LoadingStatusWidget(
                  initStatus: _loadingStatus,
                  contentWidget: Text(_responseResult,
                      style: const TextStyle(
                        fontSize: 12.0, // 字体大小
                        color: Colors.grey, // 设置字体颜色
                        decoration: TextDecoration.none, // 设置不显示下划线
                      )),
                  retryCallback: _loadRequest)),
        ])));
  }
}
```dart

运行看看效果 (有网点击请求，打开飞行模式断网再请求)：

👏 不错，实现了我们想要的效果，但是这个组件用起来有些麻烦，每次使用需要：

* ① 定义一个LoadingStatus类型的变量来保存当前所处的加载状态；
* ② 需要定义一个更新加载状态并调用 **setState()** 的方法；
* ③ 在异步任务的适当时机调用②中定义更新加载状态的方法；

能用，但也不太好用，接着用我们上节学到的 **FutureBuilder** 来封装下看看~

## 2. FutureBuilder 实现

**FutureBuilder** 是 Flutter 提供的 **可以根据异步操作结果自动更新UI的组件**，它的构造函数中的参数如下:

* **future**：**必须**，代表 FutureBuilder 需要监听的 Future，通常是IO或网络请求等耗时操作；
* **initialData**：可选，提供一个初始值给后面builder回调函数，后者可以调用 snapshot.data 获取这个值；
* **builder**：**必须**，包含一个BuildContext 和 AsyncSnapshot 参数的函数，定义了根据不同的future状态构建不同的UI；

看着复杂，其实用起来很简单，**future** 设置一个异步任务，**builder** 中对异步任务的进行状态进行判断，返回对应状态的Widget即可。直接给出代码实现：

```dart
class FBLoadingStatusWidget extends StatelessWidget {
  final Future<void>? asyncTask;
  final Widget Function(dynamic) contentWidget; // 显示内容面板的组件
  final Function? retryCallback; // 重试回调

  const FBLoadingStatusWidget({super.key, required this.asyncTask, this.retryCallback, required this.contentWidget});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (BuildContext context, BoxConstraints constraints) {
      return SingleChildScrollView(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minWidth: constraints.maxWidth,
            minHeight: constraints.maxHeight,
          ),
          child: IntrinsicHeight(child: _generateStatusWidget()),
        ),
      );
    });
  }

  // 生成显示加载状态的组件
  Widget _generateStatusWidget() {
    return FutureBuilder(
        future: asyncTask,
        builder: (BuildContext context, AsyncSnapshot<dynamic> snapshot) {
          switch (snapshot.connectionState) {
            // 这两个状态很少发生，一般只走 waiting 和 done
            // FutureBuilder 构建时如果指定了future，会立即开始等待future的执行，通常直接进入 waiting状态 而不会走 none状态
            // active状态 只能用于具有中间值的 StreamBuilder
            case ConnectionState.none:
            case ConnectionState.active:
              return Container();
            // 异步任务执行中，但未完成，这个时候适合显示Loading
            case ConnectionState.waiting:
              return _loadingStatusWidget();
            // 异步任务执行完毕，可能是执行成功，也可能是执行失败，需要做具体判断
            case ConnectionState.done:
              if (snapshot.hasError) {
                if(snapshot.error is DioException) {
                  if((snapshot.error as DioException).error is SocketException) {
                    return _disconnectStatusWidget();
                  } else {
                    return _errorStatusWidget();
                  }
                } else {
                  return _errorStatusWidget();
                }
              } else {
                return snapshot.hasData ? contentWidget(snapshot.data) : _emptyStatusWidget();
              }
          }
        });
  }
}
```dart

调用处代码：

```dart
// 待执行的异步任务
Future _loadRequestFB() {
  return Dio().get("https://www.wanandroid.com/article/list/1/json");
}

@override
Widget build(BuildContext context) {
  return Container(
      color: Colors.white,
      child: SafeArea(
          child: Column(children: [
        const SizedBox(height: 10),
        MaterialButton(
          onPressed: _loadRequestFB,
          color: MyColors.leiMuBlue,
          textColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16.0),
          child: const Text('请求网络'),
        ),
        const SizedBox(height: 20),
        Expanded(
            child: FBLoadingStatusWidget(
                asyncTask: _loadRequestFB(),
                contentWidget: (data) {
                  // 这里直接把异步任务的数据显示出来了，实际情况可以做类型强转然后再处理
                  return Text("$data",
                      style: const TextStyle(
                        fontSize: 12.0, // 字体大小
                        color: Colors.grey, // 设置字体颜色
                        decoration: TextDecoration.none, // 设置不显示下划线
                      ));
                }))
      ])));
}
```dart

运行效果和上面的 setState() 效果一致，然后有个问题：

> FutureBuilder 构建时如果指定了future，**会自动执行异步任务**

😑 在有些场景，我们希望 **在需要的时候才加载**，其中一种解决方法：

> 定义一个Future类型的变量，初始值为null，FutureBuilder的future参数设置为这个变量，接着定义一个调用setState()的方法，在其中更新这个变量的值为具体的异步任务。

修改后的部分代码如下：

```dart
Future? _future;

void _loadRequestFB() {
  setState(() {
    _future = Dio().get("https://www.wanandroid.com/article/list/1/json");
  });
}

@override
Widget build(BuildContext context) {
     //...
	   MaterialButton(
        onPressed: _loadRequestFB,
        //...
     Expanded(
              child: FBLoadingStatusWidget(
                  asyncTask: _future,
    //...
}
```dart

👏还是比较简单的，组件使用时需要：

* 定义一个可空的Future类型的变量_future并传递给FutureBuilder组件；
* 定义一个更新_future的方法，在其中调用setState() 更新_future的值，触发FutureBuilder刷新UI；

🤔 不需要像 **setState()** 实现方式那样关注异步任务的执行状态去手动更新UI，**只需关注异步任务的更新**。原理其实还是setState()，只是转移到了FutureBuilder内部，不信可以看看这部分的源码：

😃 FutureBuilder的封装其实够用了，接着再试试用StreamBuilder也写下~

## 3. StreamBuilder 实现

**StreamBuilder** 和 **FutureBuilder** 用法有点类似，就构造参数有些不同：

* **stream**：接受一个Stream对象，用于产生异步数据；
* **builder**：根据Stream的snapshot来返回不同的UI组件；

stream参数，使用 **Stream** 的静态方法 **fromFuture()** 将Future转换为一个Stream流，然后其它代码都不用动~

```dart
Widget _generateStatusWidget() {
  if (asyncTask == null) {
    return Container();
  } else {
    return StreamBuilder(
        stream: Stream.fromFuture(asyncTask!),
        builder: (BuildContext context, AsyncSnapshot<dynamic> snapshot) {
          //...跟上面的FutureBuilder一样的代码
        }
      }
  }
```dart

😶 运行效果，和上面的 setState() 效果一致，用法和 **FutureBuilder** 基本一样。不过写法并没有体验到Stream流的特性，接着改下代码，使得变得更加灵活~

先定义一个Model作为流中的数据进行传递：

```dart
class LoadingStatusModel {
  final LoadingStatus status; // 加载状态
  final dynamic data; // 数据

  LoadingStatusModel(this.status, {this.data});
}
```dart

接着继承StatefulWidget，定义一个StreamController的变量，在initState()处初始化，在dispose()处close()，在build()处根据异步任务的执行状态往Stream发送不同的加载状态信息，StreamBuilder的builder属性处，根据不同的加载状态信息，返回对应的Widget：

```dart
class SBLoadingStatusWidget extends StatefulWidget {
  final Future<dynamic>? asyncTask;
  final Widget Function(dynamic) contentWidget; // 显示内容面板的组件
  final Function? retryCallback; // 重试回调

  const SBLoadingStatusWidget({super.key, this.asyncTask, required this.contentWidget, this.retryCallback});

  @override
  State<StatefulWidget> createState() => _SBLoadingStatusWidgetState();
}

class _SBLoadingStatusWidgetState extends State<SBLoadingStatusWidget> {
  late StreamController<LoadingStatusModel> _streamController;

  @override
  void initState() {
    super.initState();
    _streamController = StreamController();
  }

  @override
  void dispose() {
    super.dispose();
    _streamController.close();
  }

  @override
  Widget build(BuildContext context) {
    // 根据异步任务的不同状态，往Stream发送不同的加载状态信息
    if (widget.asyncTask == null) {
      _streamController.add(LoadingStatusModel(LoadingStatus.initial));
    } else {
      _streamController.add(LoadingStatusModel(LoadingStatus.loading));
      widget.asyncTask!.then((value) {
        _streamController.add(LoadingStatusModel(LoadingStatus.content, data: value));
      }).catchError((error) {
        if (error is DioException) {
          if ((error).error is SocketException) {
            _streamController.add(LoadingStatusModel(LoadingStatus.disconnect));
          } else {
            _streamController.add(LoadingStatusModel(LoadingStatus.error, data: error));
          }
        } else {
          _streamController.add(LoadingStatusModel(LoadingStatus.error, data: error));
        }
      });
    }
    return LayoutBuilder(builder: (BuildContext context, BoxConstraints constraints) {
      return SingleChildScrollView(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minWidth: constraints.maxWidth,
            minHeight: constraints.maxHeight,
          ),
          child: IntrinsicHeight(
              child: StreamBuilder(
                  stream: _streamController.stream,
                  builder: (BuildContext context, AsyncSnapshot<LoadingStatusModel> snapshot) {
                    // 每次往Stream里发信息时都会走 active 状态
                    // 根据不同的加载状态返回对应的Widget
                    if (snapshot.connectionState == ConnectionState.active) {
                      switch (snapshot.data!.status) {
                        case LoadingStatus.initial:
                          return Container();
                        case LoadingStatus.content:
                          return widget.contentWidget(snapshot.data!.data);
                        case LoadingStatus.loading:
                          return _loadingStatusWidget();
                        case LoadingStatus.empty:
                          return _emptyStatusWidget();
                        case LoadingStatus.disconnect:
                          return _disconnectStatusWidget();
                        case LoadingStatus.error:
                          return _errorStatusWidget();
                      }
                    } else {
                      return Container();
                    }
                  })),
        ),
      );
    });
  }
}
```dart

有需要的话，这个StreamController还可以由外部传入，父容器直接往Stream里塞消息，连 **setState()** 都不用~

以上就是本节的全部内容，🤭 哪种写法你更喜欢呢？有更好的封装建议欢迎评论区指出，感谢~