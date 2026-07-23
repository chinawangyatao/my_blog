---
title: "Flutter入门到精通（十七）：用ViewModel分离UI与逻辑"
pubDate: 2024-01-18
description: "使用ViewModel模式分离Flutter中的UI与业务逻辑，提升代码可维护性。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第十七篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

😆上节手把手带着大伙基于 **dio + riverpod** 封装了一波网络请求，一手无脑定义 **Provider**，发起请求 **refresh()** ，监听值变化 **watch()** ，异步任务执行完，无需手动 **setState()** 更新UI，与状态关联的 **Widget** 会自动更新。

 这套玩法也被我搬运到公司项目上了，正当我以为会收获一堆 "**大佬**🐂🍺" 的 **虚假吹捧**，结果同事看了我的代码，反而提出了 **问题**：

我一看，立马和同事 **讨(zheng)论** 起来了：

* 🐔：封装的结果只是不用写setState()，你这样写UI和逻辑还是混到一起了啊？
* 🦆：em... 我感觉还好，就一些简单的逻辑处理，弹Toast、存数据、关页面，都是和Widget无关的操作。
* 🐔：不对，这些应该分离出来，不该出现在UI层的，就是 **Riverpod** 做不了这个，我才想试试 **Bloc** 的。

😳 啊？**Riverpod** 做不了这个？看到他还在用 **Riverpod** 老版定义 **Provider** 的写法，而不是通过 **@riverpod** 注解生成，我感觉他大概率还没玩透 **Riverpod**，不过也合理，毕竟 **官方文档** 确实写得那么一言难尽🤣。

那本节就引入 **ViewModel** 的 **概念**，用 **Riverpod** 中特殊的 **Provider** → **Notifier** 来实现 **UI与逻辑** 的分离。

## 2. 概念相关

😄 所谓的 **ViewModel** 就是在 **View**(视图) 和 **Model** (数据) 中间添加一个 **桥梁**，包含View层所需的数据和逻辑，但不包含 View(**Widget**) 相关的代码。通常会暴露出数据和命令，如用户操作的响应函数(**回调**)，并且会监听Model的变化，以便更新自己的 **状态**。**MVVM** (Model-View-ViewModel) 模式，可以帮我们构建一个结构清晰、易于维护和测试的应用程序。😏接着手撕一个例子帮助大家理解这种模式~

### 2.1. Model

代表应用程序的 **数据模型**，负责存储数据、定义数据结构 和 处理数据相关的逻辑。

```dart
class UserModel {
  final String id;
  final String name;
  final String email;

  UserModel({required this.id, required this.name, required this.email});

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
    );
  }
}
```

### 2.2. ViewModel

```dart
class UserViewModel extends ChangeNotifier {
  UserModel? _user;

  // 暴露数据
  UserModel? get user => _user;

  // 暴露命令
  void fetchUserData() async {
    var response = await Dio().get("https://mock.apifox.com/m1/4081539-3719383-default/flutter_article/testUser");
    Map<String, dynamic>? responseObject = response.data;
    _user = UserModel.fromJson(responseObject?['data']);
    // 通知View层更新
    notifyListeners();
  }
}
```

### 2.3. View

代表 **用户界面** 的部分，通过监听 ViewModel 的状态变化来更新自己，这里使用 **ChangeNotifierProvider** 来连接ViewModel和View，实现数据的 **双向绑定** (ViewModel的状态变化可以自动反映到View上，View上的UI操作可以通过调用 ViewModel 的方法来影响应用的状态或数据)：

```dart
void main() {
  runApp(const MvvmApp());
}

class MvvmApp extends StatelessWidget {
  const MvvmApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(create: (context) => UserViewModel(), child: const MaterialApp(home: UserView()));
  }
}

class UserView extends StatelessWidget {
  const UserView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final viewModel = Provider.of<UserViewModel>(context);
    return Scaffold(
      appBar: AppBar(title: const Text('User')),
      body: Center(
          child: viewModel.user == null
              ? ElevatedButton(
                  onPressed: () {
                    // 用户交互触发数据加载
                    viewModel.fetchUserData();
                  },
                  child: const Text('Load User'),
                )
              : Text("Hello, ${viewModel.user!.name}, your email is ${viewModel.user!.email}")),
    );
  }
}
```

**运行输出结果如下**：

😄 还是非常好理解的，然后 **状态** 又可以细分为两类：

* **数据/应用状态**：如用户登录信息、应用的配置信息等。
* **页面/UI状态**：如Widget的当前选中状态、用户在表单中输入的数据、滚动位置、动画状态等。

然后需要把这些状态及与状态有关的逻辑都在到 **ViewModel** 中，在Flutter中的表现就是维护一个大的**Notifier**。

## 3. 用 Riverpod 实现 ViewModel 层

> **Tips**：对 Riverpod 不了解或不熟的童鞋，可以先移步至**《十五、玩转状态管理之——Riverpod使用详解》**了解下用法。

这里使用 **Riverpod 2.0** 新增的 **NotifierProvider** 来实现~

先不用 **@riverpod** 注解自动生成Provider的写法~

调用处：

如果没有 **Flutter Riverpod Snippets** 或 **Github Copilot** 插件补全，定义Provider还是挺麻烦的，😆 用 **@riverpod注解** 解君愁~

调用处无需另外定义Provider变量，直接调：

懵逼的话，点开下生成的源码就知道了~

😋 不得不说 **注解生成Provider真香** ❗️

## 4. 实战示例：引入 ViewModel 改造 登录页

🤔 公司项目代码不太好展示，随手写个Demo演示下，大概流程：

* **主页面**：显示去登录按钮，点击后跳转登录页。
* **登录页**：输入账号密码点击登录按钮，触发登录，登录成功，弹提示，回传登录信息，关闭页面。
* **主界面**：判断收到登录信息，刷新页面，显示登录信息。

😄 先粗暴地实现一波，然后再改造~

### 4.1. 改造前

创建下登录信息的Model类 → **LoginInfo**，就一个 **用户名** 和 **登录时间** 的字段，定义下 **fromJson()** ：

**主页面** (main.dart)：

**登录页** (login_page.dart)：

**运行效果如下**：

### 4.2. 改造后

😆 确实粗暴，接着开始我们的改造，先定义一个大的 **State类** 来存 **数据 & UI** 相关的状态，然后定义一个 **命名构造函数-initial()** 来创建一个初始状态，接着定义一个 **实例方法-copyWith()** 用于基于当前状态创建一个新的状态：

接着，把 **逻辑** 相关都丢到 **ViewModel(Notifier)** 中，这里的难点估计是 **弹窗** 或 **页面跳转**，拿不到当前的 **context**。如果是 **异步操作** 中使用传入 **BuildContext**，会显示 "**Don't use 'BuildContext's across async gaps.** " 的 **警告**：

上面的例子，如果在5s内，用户跳转到别的页面，原先的 **BuildContext(本质是Element引用)** 所对应的Widget可能已经不在Widget树中了，此时，尝试使用这个 BuildContext 将会引发运行时错误。一种常见的解决方式：

> 定义一个 **GlobalKey** 类型的 **顶层变量**，在创建 **MaterialApp** 时，通过 **navigatorKey** 属性传入，然后就可以在应用的 **任何地方** 使用 **navigatorKey.currentContext** 来获取 **BuildContext**。然后需要注意下，它可能会返回 **null** 值，你能确保它不会空的话就用 **!** ，否则还是老老实实判空~

😄 定义一个全局的 **showSnackBar()** 和 **pop()** 代码方便代码复用：

通过 **@rivperod** 注解定义一个Notifier，重写 **build()** 返回 **LoginPageState.initial()** 初始化的状态对象，登录方法完善下逻辑，请求响应成功，设置 **state** 值为 **state.copyWith(loginInfo: loginInfo)** ，具体代码：

😄 然后是登录页：

🤣 现在是真的一点 **逻辑** 都没有了，最后的 **主页面**，直接 **watch()** → **loginPageVMProvider**，loginInfo没值显示去登录按钮，有值显示登录信息：

😄 **ref.watch(loginPageVMProvider).loginInfo** 这样的写法会在 **loginPageVMProvider** 的 **任何状态变化**时都触发 Widget 重建，而无论 **loginInfo** 是否发生变化。比如，调用的另外一个获取banner的方法，更新了另一个 **子状态**，也会触发：

😏 如果只关心某个 **子状态**，可以用 **select()** 来指定一个函数，从Provider的状态中选择一个子状态，只有当这个子状态发生变化时，才会触发依赖于它的 Widget 的重建，**更细粒度的监听**，可以减少不必要的Widget重建，提高性能~

## 5. 小结

💁‍♂️ 本节在上节封装的基础上，引入了ViewModel的概念，利用 Riverpod 实现了 **UI与逻辑的完全分离**，使得代码编写起来更清爽。另外，关于Riverpod的，有些同学可能担心定义了那么多 **Provider的全局变量**，会不会有什么性能影响？其实问题不太大，因为默认是 **懒加载** 的，只有在 **首次调用时才初始化**，而且默认使用的 **AutoDisposeNotifier**，当没有任何监听器监听它时(**ref.watch/ref.listen**)，它会 **自动被清理**。

😄 对Riverpod不熟悉的建议还是多看几遍**《十五、玩转状态管理之——Riverpod使用详解》**或者官方文档，看都了就用得溜了。如在本文阅读过程中有什么问题或者更好的封装思路，欢迎评论区讨论一波，集思广益，谢谢🙏

**附**：完整的代码 (只是方便演示才写在一起，实际开发可按需放到对应的文件或包中~)

```dart
/// login_model.dart
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:hello_flutter/main.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'login_model.g.dart';

class LoginInfo {
  final String userName;
  final String loginTime;

  LoginInfo({
    required this.userName,
    required this.loginTime,
  });

  factory LoginInfo.fromJson(Map<String, dynamic> json) {
    return LoginInfo(
      userName: json['userName'],
      loginTime: json['loginTime'],
    );
  }
}

class LoginPageState {
  final TextEditingController userNameController;
  final TextEditingController passwordController;
  final LoginInfo? loginInfo;

  LoginPageState({this.loginInfo, required this.userNameController, required this.passwordController});

  LoginPageState.initial()
      : userNameController = TextEditingController(),
        passwordController = TextEditingController(),
        loginInfo = null;

  LoginPageState copyWith({
    TextEditingController? userNameController,
    TextEditingController? passwordController,
    LoginInfo? loginInfo,
  }) {
    return LoginPageState(
      userNameController: userNameController ?? this.userNameController,
      passwordController: passwordController ?? this.passwordController,
      loginInfo: loginInfo ?? this.loginInfo,
    );
  }
}

@riverpod
class LoginPageVM extends _$LoginPageVM {
  @override
  LoginPageState build() => LoginPageState.initial();

  Future<void> login() async {
    final userName = state.userNameController.text;
    final password = state.passwordController.text;
    if (userName.isEmpty || password.isEmpty) {
      showSnackBar("请输入帐号或密码");
    } else {
      var response = await Dio().post(
        "https://mock.apifox.com/m1/4081539-3719383-default/flutter_article/testLogin",
        data: {'username': userName, 'password': password},
      );
      var data = response.data['data'];
      if (response.data['errorCode'] == 200) {
        var loginInfo = LoginInfo.fromJson(data);
        state = state.copyWith(loginInfo: loginInfo);
        showSnackBar("登录成功");
        pop(result: loginInfo);
      } else {
        showSnackBar("登录失败");
      }
    }
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'login_model.dart';

/// login_page.dart → 登录页
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {

  @override
  Widget build(BuildContext context) {
    var loginState = ref.watch(loginPageVMProvider);
    var loginVM = ref.watch(loginPageVMProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('登录页', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.red,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            TextField(
              controller: loginState.userNameController,
              decoration: const InputDecoration(
                labelText: '用户名',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20.0),
            TextField(
              controller: loginState.passwordController,
              decoration: const InputDecoration(
                labelText: '密码',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 20.0),
            MaterialButton(
              onPressed: () {
                loginVM.login();
              },
              color: Colors.red,
              padding: const EdgeInsets.symmetric(vertical: 16.0),
              child: const Text('登录', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}

/// main.dart → 主页面
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hello_flutter/api_client.dart';

import 'login_model.dart';
import 'login_page.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void showSnackBar(String message) {
  if (navigatorKey.currentContext != null) {
    ScaffoldMessenger.of(navigatorKey.currentContext!).showSnackBar(SnackBar(content: Text(message)));
  }
}

void pop<T>({T? result}) {
  if (navigatorKey.currentContext != null) {
    if(result != null) {
      Navigator.pop(navigatorKey.currentContext!, result);
    } else {
      Navigator.pop(navigatorKey.currentContext!);
    }
  }
}

void main() {
  ApiClient.init("https://mock.apifox.com/m1/4081539-3719383-default/flutter_article/");
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(home: const HomePage(), navigatorKey: navigatorKey);
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(title: const Text('Home')),
        body: Center(child: Consumer(builder: (context, ref, child) {
          LoginInfo? loginInfo = ref.watch(loginPageVMProvider.select((value) => value.loginInfo));
          return loginInfo == null
              ? ElevatedButton(
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => const LoginPage()));
                  },
                  child: const Text('去登录'),
                )
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    Text('用户名：${loginInfo.userName}'),
                    Text('登录时间：${loginInfo.loginTime}'),
                  ],
                );
        })));
  }
}
```