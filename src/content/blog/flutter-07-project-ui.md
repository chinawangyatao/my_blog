---
title: "Flutter入门到精通（七）：项目实战：UI部分"
pubDate: 2024-01-08
description: "Flutter项目实战的UI实现，页面布局、组件封装、交互逻辑。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第七篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

🔥 **三军未动**，**粮草先行**！上节**《六、项目实战-非UI部分》**带着兄弟们，把实战过程中可能会遇到的知识点进行了预研，涉及：网络请求、Json序列化和反序列化、路由跳转、数据共享等内容。

😏所以，本节以放心 **写UI (堆组件)** 啦，因为是边写项目边写文章，很多地方写得不太好或者不对，但应该也会对读者的Flutter学习有所裨益。后续还会进行打磨，最终以仓库 **示例源码**（已移除原文仓库链接） 里的代码为准。😁 用到的接口源地址：[玩Android API](https://www.wanandroid.com/blog/show/2)，话不多说，直接开始~

## 1. 图标

### 1.1. 自定义App图标

在[《三、纯Flutter项目打包 & 混合开发[Android]》]( "")有提过这一点了，建议直接使用Flutter插件 [flutter_launcher_icons](https://pub.dev/packages/flutter_launcher_icons) 来 **自动处理所有平台的图标生成和替换**，需要一张至少 **512x512** 像素的 **图标源图**！！！打开 **pubspec.yaml** 引用插件，并指定 **源图** 及 **生成的图标名**：

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_launcher_icons: ^0.13.1	# 图标生成插件

flutter_icons:
  image_path: "assets/images/icon.png"
  android: "ic_launcher"	# 指定生成的图标名
  ios: true	# iOS是否也生成图标
```

保存后，执行下述命令： **添加插件依赖** 及 **生成并替换图标**：

```dart
flutter pub get
flutter pub run flutter_launcher_icons
```

即可实现图标替换，接着，顺手修改下 **APP名称**，定位到 **android/app/src/main/AndroidManifest.xml** 文件，修改 **android:label** 标签的值为你的应用名称，也支持通过 **strings.xml** 索引字符串资源的写法：

```dart
<application
  android:name=".MainActivity"
  android:label="@string/app_name"
  android:icon="@mipmap/ic_launcher">
  ...
</application>
```

都修改完，运行看看效果：

😄nice~

### 1.2. 内置字体图标

Flutter 默认内置一套 **Material Design的字体图标**，具体有哪些可以到 [官方文档](https://api.flutter.dev/flutter/material/Icons-class.html) 或 [Google Fonts](https://fonts.google.com/icons) 中进行检索，支持两种引用方式：**Icons.xxx** 或 **Code Point(码点)** ，使用代码示例如下：

```dart
Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      // 通过Icons来引用
      Icon(Icons.block, size: 36),
      // 通过码点来引用
      Text('\ue8b6 \ue87d \ue885',style: TextStyle(
        fontFamily: "MaterialIcons",
        fontSize: 28.0,
        color: Colors.blue,
      ),)
    ],
)
```

运行效果如下：

> Tips：字体图标对应的 **码点**，**建议以官方文档为准**！！！比如 **favorite_outlined** 两者对应的码点值如下 (这也是为啥第二个图标是🚘不是♥)：

### 1.3. 自定义字体图标

Flutter中，**字体图标** 相比 **图片** 的优势：

> 体积更小，矢量图(放大不会影响清晰度)、可以应用文本样式(颜色、对齐等)、可以通过TextSpan和文本混用。

如果内置的字体图标满足不了需求，可以进行自定义，在Flutter中可以使用 **ttf格式** 的字体图标。[iconfont.cn](https://www.iconfont.cn/) 上有很多字体图标素材，输入搜索关键字，找到喜欢的图标，点击 **购物车图标** (不要直接点下载，只有SVG、AI和PNG格式)，选完所需的图标，点击 **右上角的购物车图标**，然后点击 **下载代码**，下载完解压，找到里面的 **ttf文件**，复制到Flutter项目的 **assets/fonts** 目录下：

修改 **pubspec.yaml** 文件添加字体图标：

```dart
fonts:
```

  - family: customIcon	# 指定字体名

```dart
    fonts:
```

      - asset: assets/fonts/iconfont.ttf

然后可以就通过 **IconData** 来引用我们的自定义图标啦：

```dart
Icon(
  // 参数依次为：字体图标对应的16进制数字、字体名
  IconData(0xe6c2, fontFamily: 'customIcon'),
  size: 26,
  color: Colors.yellow,
)
```

**运行效果图**：

**字体图标对应的16进制值**，可以打开 **iconfont.json** 文件查看：

每次使用图标都要查看这个 **unicode码** 还挺烦，可以塞到一个类里，将字体文件中的所有图标都定义成 **静态变量**，代码示例如下：

```dart
class CustomIcons {
  static const IconData xiao =  IconData(0xe6c2, fontFamily: 'customIcon');
}

// 使用
Icon(CustomIcons.xiao, size: 26,color: Colors.yellow,)
```

😁再安利两个图标工具站点：[fluttericon.com](https://www.fluttericon.com/) 和 [fluttericon.cn](https://www.fluttericon.cn/)

## 2. 自定义启动页

从 **App启动** 到 **Flutter第一帧渲染结束前** 需要一定的时间，Flutter项目会默认配置一个简单的启动视图 (**白色背景** + **居中的应用图标**)。打开android目录下的 **styles.xml** 文件，可以看到设置了一个启动主题：

点开它指向的 **launch_background.xml** 文件：

修改这两个item值即可实现自定义，需要在 **不同分辨率mipmap** 的文件夹下放一张启动图，还挺麻烦😒。

😜这里直接用Flutter插件 [flutter_native_splash](https://pub.dev/packages/flutter_native_splash) 来快速设置，打开 **pubspec.yaml** 文件引用插件，并 **指定颜色及图片**：

```yaml
dev_dependencies:
	flutter_native_splash: ^2.3.8

flutter_native_splash:
  color: "79B4EB"
  image: assets/images/icon.png
  android: true
  android_gravity: center
  ios: true
  android_12:
    icon_background_color: "79B4EB"
    image: assets/images/icon.png
```

保存后，执行下述命令： **添加插件依赖** 及 **生成并配置启动页**：

```dart
flutter pub get
flutter pub run flutter_native_splash:create

# 如果想去掉自定义闪屏页，可以使用下述命令
# flutter pub run flutter_native_splash:remove
```

编译运行后打开APP看看闪屏效果 (Android 12会裁剪图片中间的圆形部分)：

静态启动页的可玩性不高，如果想搞些动效或者展示信息啥的，官方推荐在静态启动页后尽快显示一个 **SplashScreen** Widget，并在其中执行Flutter动画，简单代码示例如下：

```dart
// splash_screen.dart
import 'package:flutter/material.dart';
import 'dart:async';

class SplashScreen extends StatefulWidget {
  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();

    // 定义显示SplashScreen一段时间之后的逻辑
    Timer(const Duration(seconds: 3), () {
      // Replace it with a function to navigate to your home screen
      // 如：Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (context) => HomeScreen()));
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Text('Welcome to my App!', style: TextStyle(fontSize: 24.0)),
      ),
    );
  }
}
```

然后在 main.dart 中优先显示 SplashScreen：

```dart
// main.dart
import 'package:flutter/material.dart';
import 'splash_screen.dart'; // 确保引入了splash_screen.dart
// import 'home_screen.dart'; 如果有HomeScreen则需要引入

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'My Application',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: SplashScreen(), // 设置SplashScreen为app的起始页面
      // routes: {
      //   '/home': (context) => HomeScreen(), 如果你有主页，可以定义路由
      // },
    );
  }
}
```

## 3. 首页草图

本文主要实现的三个页面：**侧滑导航**、**首页**、**公众号**，从左边的侧滑导航开始搞吧~

## 4. 侧滑导航页UI

### 4.1. Drawer (抽屉)

侧滑导航也叫 **抽屉**，Flutter 内置了一个 **Drawer** 组件来实现 **从屏幕边缘 (左右) 滑出来** 展示一个导航菜单或其它内容。需要搭配 **Scaffold** 使用，它的常用属性如下：

* **child**：抽屉内容Widget，通常是一个 **ListView**，然后包含一个 **DrawerHeader(抽屉头部)** 或 **UserAccountsDrawerHeader(账户信息头部)** ，及若干个 **ListTile(菜单项)** 拼接而成，当然，不喜欢也可以自己按需堆叠组件；
* **elevation**：抽屉阴影大小，以 z 轴高度表示；
* **shape**：Drawer的边框形状，如设置圆角；
* **semanticLabel**：描述抽屉用途，无障碍用到；

简单写下UI：

```dart
import 'package:flutter/material.dart';

/// 侧滑页面
class DrawerScreen extends StatefulWidget {
  const DrawerScreen({super.key});

  @override
  State<StatefulWidget> createState() => _DrawerScreenState();
}

class _DrawerScreenState extends State<DrawerScreen> {
  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: const <Widget>[
          DrawerHeader(
            decoration: BoxDecoration(
              color: Color(0xFF5A78EA),
            ),
            child: Text(
              "Van ♂ Android",
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
              ),
            ),
          ),
          ListTile(
            leading: Icon(Icons.score),
            title: Text('我的积分'),
          ),
          ListTile(
            leading: Icon(Icons.settings),
            title: Text('系统设置'),
          ),
          ListTile(
            leading: Icon(Icons.logout),
            title: Text('退出登录'),
          ),
        ],
      ),
    );
  }
}
```

运行代码后，从左侧划出抽屉看看效果：

UI写完，接着要完善下逻辑，我们当前的期望：

* 打开侧滑时：查询个人积分接口，如果处于登录刷新我的积分，显示账户名和退出登录选项；
* 如果处于未登录专题该，显示去登录文本，点击去登陆或我的积分，都跳转登录页；
* 登陆完，回到此页面，再次查询积分接口，然后刷新UI。

 em...要登录，那得先写下登录页UI~

## 5. 登录页

页面比较简单，顶部一个 **AppBar**，**两个文本输入框** (用户名、密码)、**两个按钮** (登陆、去注册)，AppBar前面介绍过了，这里说下 **文本输入** 和 **按钮** 用到的两个内置组件。

### 5.1. TextField (文本输入)

这里用到 **TextField** 组件，它的常用属性如下：

* **controller**: 控制TextField当前的文本，监听文本的更改，以及控制更复杂的输入操作；
* **decoration**: 装饰TextField外观的InputDecoration对象，可以设置边框、标签、提示文本等；
* **keyboardType**: 用于设置键盘的类型，如文本、数字、电子邮件地址等；
* **textInputAction**: 键盘上的操作按钮（通常是“下一步”或“完成”）的类型；
* **style**: 用来定义输入文本的样式，如字体大小、颜色、字重等；
* **textAlign**: 输入文本的对齐方式，如左对齐、右对齐或居中；
* **autofocus**: 是否在创建时自动获取焦点；
* **obscureText**: 如果是密码输入框，将此项设置为true可以隐藏密码文本；
* **maxLength**: 输入内容的最大长度；
* **onChange**: 当文本内容改变时调用的回调函数；
* **onSubmitted**: 用户在软键盘上按下“提交”按钮时调用的回调函数；
* **onEditingComplete**：输入完成时调用的回调函数；
* **enabled**: 定义TextField是否可编辑；
* **cursorColor**: 光标的颜色；
* **cursorRadius**: 光标的圆角；
* **cursorWidth**: 光标的厚度；
* **minLines**、**maxLines**：最小/最大行数；

### 5.2. MaterialButton

按钮的话，用到 **MaterialButton** 组件，它的常用属性如下：

* **onPressed**: 按钮点击时的回调函数。如果为null，则按钮会被禁用；
* **onLongPress**: 长按按钮时的回调函数；
* **child**: 通常是一个Widget，比如Text或Icon，显示在按钮中，它可以是任意的Widget树；
* **elevation**: 控制按钮在其下方显示的阴影大小。通常用于指示按钮是否被按下；
* **padding**: 按钮内部的空白区域，详细控制可以通过EdgeInsets类来完成；
* **color**: 按钮的背景颜色；
* **disabledColor**: 按钮被禁用时的背景颜色；
* **textColor**: 文本颜色；
* **disabledTextColor**: 按钮被禁用时的文本颜色；
* **splashColor**: 水波纹效果的颜色，当用户点击按钮时显示；
* **highlightColor**: 按钮按下时的背景颜色；
* **highlightElevation**: 按钮被按下时的阴影大小；

### 5.3. 编写登录页UI

知道组件属性后，写页面就水到渠成了，还要加点逻辑：

> 点击登录判断用户名和密码是否为空，不为空才执行登录逻辑，否则弹出提示信息。

具体的实现代码如下：

```dart
import 'package:flutter/material.dart';
import 'package:flutter_wanandroid/ui/register_screen.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../res/colors.dart';

/// 登录页面
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<StatefulWidget> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  void _login() {
    // 登录校验逻辑
    final username = _usernameController.text;
    final password = _passwordController.text;
    if (username.isNotEmpty && password.isNotEmpty) {
      // 在发起登录请求
      Fluttertoast.showToast(msg: "当前登录的用户名：$username → 密码：$password");
    } else {
      Fluttertoast.showToast(msg: "用户名或密码不能为空");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('登录页', style: TextStyle(color: Colors.white)),
        backgroundColor: MyColors.leiMuBlue,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            TextField(
              controller: _usernameController,
              decoration: const InputDecoration(
                labelText: '用户名',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20.0),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(
                labelText: '密码',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 20.0),
            MaterialButton(
              onPressed: _login,
              color: MyColors.leiMuBlue,
              padding: const EdgeInsets.symmetric(vertical: 16.0),
              child: const Text('登录', style: TextStyle(color: Colors.white)),
            ),
            const SizedBox(height: 12.0),
            GestureDetector(
                child: Container(
                  alignment: Alignment.center,
                  padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 12.0),
                  child: const Text("去注册", style: TextStyle(color: Colors.grey)),
                ),
                onTap: () {
                  // 跳转注册页
                  Navigator.push(context, MaterialPageRoute(builder: (context) {
                    return const RegisterScreen();
                  }));
                })
          ],
        ),
      ),
    );
  }
}
```

### 5.4. Toast (提示)

上面我们用 **Toast(吐司提示)** 来展示提示信息，但Flutter并没有内置这样的组件，这里用到三方库 [fluttertoast](https://pub.dev/packages/fluttertoast)。直接执行 **flutter pub add fluttertoast** 添加依赖，然后调用 **Fluttertoast.showToast(msg)** 就能显示Toast了，但运行时可能会报错：

> uses-sdk:minSdkVersion 19 cannot be smaller than version 21 declared in library [:fluttertoast] D:\Code\Flutter\flutter_wanandroid\build\fluttertoast\intermediates\merged_manifest\debug\AndroidManifest.xml as the library might be using APIs not available in 19

**问题概述**：使用 fluttertoast，App的minSdkVersion需要为21或以上版本。

**解决方法**：打开 **android/app/build.gradle** 文件，把 **minSdkVersion** 的值从 **flutter.minSdkVersion** 改为21或以上版本：

然后它会调用系统的Toast，不同的系统版本，可能会有不同的样式差异，比如我两台手机的Toast就不一样：

如果想保证不同系统上都显示 **统一的Toast样式**，可以使用另一个 **支持自定义Toast** 的三方库：[another_flushbar](https://pub.dev/packages/another_flushbar)。另外，🙊一般为了 **方便统一调用**，通常会封装一个建议的工具类：

```dart
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';

/// Toast工具类
/// Android 11 或以上的版本只有[msg]和[toastLength]属性会生效，其它属性会被忽略
class ToastUtil {
  static void show({
    required String msg,
    Toast toastLength = Toast.LENGTH_SHORT,
    ToastGravity gravity = ToastGravity.BOTTOM,
    Color backgroundColor = Colors.black54,
    Color textColor = Colors.white,
    double fontSize = 16.0,
  }) {
    Fluttertoast.showToast(
        msg: msg,
        toastLength: toastLength,
        gravity: gravity,
        backgroundColor: backgroundColor,
        textColor: textColor,
        fontSize: fontSize);
  }
}
```

照葫芦画瓢，顺手把注册页UI也画出来：

页面写完，接着就该折腾：**调用查询积分接口**、**数据解析** 及 **页面刷新** 的逻辑了，建议下复习下**《六、项目实战-非UI部分🤷‍♂️》**再往下阅读~

### 5.5. 封装两个支持泛型的响应基类

请求网络用到 **dio** 库，数据解析用到 **json_serializable** 库，接口返回格式都是固定的，**data** 字段有两种可能的类型：**Object** 或 **列表**，定义两个泛型类：

```dart
import 'package:json_annotation/json_annotation.dart';

part 'base_response.g.dart';

// 让生成的fromJson()和toJson()中包含额外的函数参数，用于指明：
// 如何将泛型类型T的数据转换为Json，以及如何将Json转换为T

@JsonSerializable(genericArgumentFactories: true)
class DataResponse<T> {
  final T? data;
  final int errorCode;
  final String errorMsg;

  DataResponse({required this.data, required this.errorCode, required this.errorMsg});

  // 使用泛型方法的工厂构造方法来创建一个响应实例
  factory DataResponse.fromJson(Map<String, dynamic> json, T Function(dynamic json) fromJsonT) =>
      _$DataResponseFromJson(json, fromJsonT);

  // 使用泛型方法将实例转换为Json
  Map<String, dynamic> toJson(dynamic Function(T value) toJsonT) => _$DataResponseToJson(this, toJsonT);
}

// 如果Data是列表类型用这个
@JsonSerializable(genericArgumentFactories: true)
class ListResponse<T> {
  final List<T>? data;
  final int errorCode;
  final String errorMsg;

  ListResponse({required this.data, required this.errorCode, required this.errorMsg});

  // 使用泛型方法的工厂构造方法来创建一个响应实例
  factory ListResponse.fromJson(Map<String, dynamic> json, T Function(dynamic json) fromJsonT) =>
      _$ListResponseFromJson(json, fromJsonT);

  // 使用泛型方法将实例转换为Json
  Map<String, dynamic> toJson(dynamic Function(T value) toJsonT) => _$ListResponseToJson(this, toJsonT);
}
```

### 5.6. 定义积分Model类

个人积分接口返回数据的示例：

复制下data字段的数据，直接丢 [json2dart_for_json_serializable](https://caijinglong.github.io/json2dart/index_ch.html) 或者 **JsonToDart插件** 生成 Model 类：

```dart
import 'package:json_annotation/json_annotation.dart';

part 'integral.g.dart';

@JsonSerializable()
class Integral extends Object {
  @JsonKey(name: 'coinCount')
  int coinCount;

  @JsonKey(name: 'rank')
  String rank;

  @JsonKey(name: 'userId')
  int userId;

  @JsonKey(name: 'username')
  String username;

  Integral(
    this.coinCount,
    this.rank,
    this.userId,
    this.username,
  );

  factory Integral.fromJson(Map<String, dynamic> srcJson) => _$IntegralFromJson(srcJson);

  Map<String, dynamic> toJson() => _$IntegralToJson(this);
}
```

然后执行下述命令生成对应的序列化和反序列化代码：

```dart
flutter pub run build_runner build --delete-conflicting-outputs
```

生成的 **integral.g.dart** 文件内容如下：

### 5.7. 简单封装下dio库

每次请求都要去实例化一个Dio实例，并进行各种设置再调用，繁琐之余还浪费内存资源，完全可以使用 **单例模式** 简单封装下。接口API文档中这样描述错误码：

> 未登录的错误码为-1001，其他错误码为-1，成功为0

那就笼统地定义两个异常吧，**未登录异常** 和 **其它异常**：

```dart
// 未登录异常
class UnLoginException implements Exception {
  final String message;

  UnLoginException(this.message);
}

// 其它异常
class OtherException implements Exception {
  final String message;

  OtherException(this.message);
}
```

然后 **工厂单例**，封装下请求，根据不同的 errorCode 决定正确响应，以及抛哪种类型的异常，并提供一个更新请求头中Cookie的方法：

```dart
import 'dart:io';

import 'package:dio/dio.dart';
import '../data/model/base_response.dart';

class DioClient {
  late final Dio _dio;
  static DioClient? _instance;

  // 定义一个命名构造函数
  DioClient._internal(this._dio);

  // 单例初始化方法，需要在实例化前调用
  static void init(String baseUrl) {
    _instance ??= DioClient._internal(Dio(BaseOptions(
        baseUrl: baseUrl,
        responseType: ResponseType.json,
        headers: {'user-agent': 'partner/7.8.0(Android;12;1080*2116;Scale=2.75;Xiaomi=Mi MIX 2S)'}))
      //添加请求日志拦截器，控制台可以看到请求日志
      ..interceptors.add(LogInterceptor(responseBody: true, requestBody: true)));
  }

  // 定义一个工厂(私有)构造函数，确保一个类只有一个实例，并提供一个全局访问点来访问该实例
  factory DioClient() {
    if (_instance == null) {
      throw Exception('DioClient is not initialized, call init() first');
    }
    return _instance!;
  }

  // 封装请求
  Future<Response> _performRequest(Future<Response> Function() dioCall) async {
    try {
      Response response = await dioCall();
      var resp = DataResponse<String?>.fromJson(response.data, (json) => json);
      // 根据不同的响应码执行不同的处理逻辑
      switch (resp.errorCode) {
        case 0:
          return response;
        case -1001:
          throw UnLoginException(resp.errorMsg);
        default:
          throw OtherException(resp.errorMsg);
      }
    } on DioException catch (e) {
      print("${e.message}");
      rethrow;
    }
  }

  // 封装GET请求
  Future<Response> get(String endpoint, {Map<String, dynamic>? params}) async {
    return _performRequest(() => _dio.get(endpoint, queryParameters: params));
  }

  // 封装POST请求
  Future<Response> post(String endpoint, {dynamic data, Map<String, dynamic>? params}) async {
    return _performRequest(() => _dio.post(endpoint, data: data, queryParameters: params));
  }

  // 设置Cookie的方法
  setCookies(List<String>? cookies) {
    _dio.options.headers[HttpHeaders.cookieHeader] = cookies;
  }

  // 移除Cookie的方法
  clearCookies() {
    _dio.options.headers.remove("Cookie");
  }
}
```

然后在 **main.dart** 执行 **runApp()** 函数前，调用下 **DioClient.init()** 设置下 **请求域名**：

```dart
void main() {
  DioClient.init("https://www.wanandroid.com/");
  runApp(const MyApp());
}
```

### 5.8. 请求积分接口并刷新UI

在 **_DrawerScreenState** 中定义一个 **_integral** 属性，重写 **initState()** 方法，在这里 **请求积分接口**，并调用**setState()** 更新状态，具体实现代码：

```dart
class _DrawerScreenState extends State<DrawerScreen> {
  Integral? _integral;

  @override
  void initState() {
    super.initState();
    DioClient().get("lg/coin/userinfo/json").then((value) {
      setState(() {
        _integral = DataResponse<Integral>.fromJson(value.data, (json) => Integral.fromJson(json)).data;
      });
    }).catchError((e) {
      if (e is UnLoginException) {
        ToastUtil.show(msg: "未登录，请先登录！");
      } else if (e is OtherException) {
        ToastUtil.show(msg: e.message);
      } else {
        ToastUtil.show(msg: "请求失败：${e.toString()}");
      }
    });
  }
  //...
}
```

然后在 **build()** 方法中，对应组件获取到 **_integral 属性**，显示不同的文本和交互，关键代码如下：

```dart
DrawerHeader(
  decoration: const BoxDecoration(
    color: Color(0xFF5A78EA),
  ),
  child: GestureDetector(
    child: Text(
      // 为空显示去登陆，不为空则显示用户名
      _integral != null ? _integral!.username : "去登录",
      style: const TextStyle(
        color: Colors.white,
        fontSize: 24,
      ),
    ),
    onTap: () {
      // 为空时点击跳转到登录页
      if(_integral == null) {
        Navigator.push(context, MaterialPageRoute(builder: (context) {
          return const LoginScreen();
        }));
      }
    },
  ),
),
ListTile(
  leading: const Icon(Icons.score),
  // 不为空显示积分
  title: Text('我的积分${(_integral != null ? _integral!.coinCount : "")}'),
),
```

😁当 **_integral** 为空时，点击去登录，通过 **Navigator.push()** 跳转到登录页，接着要完善登录页的逻辑：

* 请求登录接口，登录成功，获取响应头里的 **Set-Cookies** ，更新请求头的 **Cookies**，并持久化到本地；
* 关闭页面，通知导航侧滑页面请求积分接口，更新UI；

😐 网络请求是一个耗时过程，用户无感知，网络不佳时，可能存在误操作。为了提高用户体验，一种常规的处理方式：**弹出一个Loading对话框**，告知用户请求已经发起，请稍后。在Flutter中，可以调用 **showDialog()** 来进行展示一个对话框。

## 6. Loading弹窗

### 6.1. showDialog()

它常用属性如下：

* **context**: 当前BuildContext，用于定位对话框的位置。
* **builder**: 一个函数，用于构建对话框内的内容。它返回一个Widget，通常是AlertDialog，SimpleDialog或者Dialog等。
* **barrierDismissible**: 控制用户是否可以通过点击遮罩层来关闭对话框，默认为true。
* **barrierColor**: 遮罩层的颜色。
* **useSafeArea**: 默认情况下，AlertDialog将使用SafeArea来避免屏幕如刘海、屏幕边缘等的干扰。可以通过设置为false来关闭这个功能。

### 6.2. WillPopScope (拦截回退)

😧 点击 **物理退后按键或者手势后退**，加载对话框会消失，但在某些场景，为了保证程序运行逻辑正确，我们不想让用户取消。可以 **WillPopScope** 组件来拦截，它提供了一个回调来 **决定是否允许页面退出**。它的最重要属性：

* **onWillPop**: 一个类型为Future Function()的回调。当用户尝试通过系统的方式离开当前页面时被调用。如果Future解析为false，当前页面不会被退出；如果解析为true，当前页面将被退出。

### 6.3. CircularProgressIndicator (圆环进度条)

Flutter内置一个 **CircularProgressIndicator** 组件，用于显示 **环形加载指示器(圆环进度条)** ，常用属性如下：

* **value**: 这个属性接受一个double类型的值，范围从0.0到1.0。如果提供了这个值，CircularProgressIndicator就会展示一个固定进度的进度条。若值为null，则会展示一个不确定进度的旋转指示器。

* **backgroundColor**: 进度指示器的背景颜色。

* **valueColor**: 进度指示器的颜色。通常是一个Animation对象，用来指示进度条的颜色变化。
* **color**：Flutter 2.0前用于设置指示器颜色的属性，2.0开始，为了更灵活控制颜色，建议使用建议使用valueColor属性。

* **strokeWidth**: 边框的粗细，单位是逻辑像素。
* **semanticsLabel** 和 **semanticsValue**: 程序无障碍阅读时的标签和值。

### 6.4. 组合封装

整合下，写出完整的Loading弹窗代码：

```dart
import 'package:flutter/material.dart';
import 'package:flutter_wanandroid/res/colors.dart';

/// 展示一个加载对话框，[context] 上下文，[canPop] 是否允许关闭对话框
void showLoadingDialog(BuildContext context, {bool canPop = true}) {
  showDialog(
    context: context,
    barrierDismissible: false, // 点击外部不关闭对话宽
    builder: (BuildContext context) {
      return WillPopScope(
          onWillPop: () async => canPop, // 根据canPop参数决定是否允许关闭对话框
          child: const Center(
            child: SizedBox(
              width: 100,
              height: 100,
              child: Card(
                color: Colors.white,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: <Widget>[
                    // 指定一个固定不变的颜色
                    CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(MyColors.leiMuBlue)),
                  ],
                ),
              ),
            ),
          ));
    },
  );
}
```

运行看看效果：

😄nice~

## 7. 简单封装shared_preferences

登录成功完，除了需要更新请求头外，还需要把 **Cookie持久化到本地**，这种小型数据很适合用三方库 [shared_preferences](https://pub.dev/packages/shared_preferences) 来保存，简单封装下。单例，各种数据类型的put、get，是否存在key，清空、移除，没啥难度，直接写出工具代码：

```dart
import 'package:shared_preferences/shared_preferences.dart';

class SharedPreferencesUtil {
  static SharedPreferencesUtil? _instance;
  late final SharedPreferences _preferences;

  // 私有化构造方法
  SharedPreferencesUtil._(this._preferences);

  // 返回实例
  static Future<SharedPreferencesUtil> getInstance() async {
    if (_instance == null) {
      SharedPreferences preferences = await SharedPreferences.getInstance();
      _instance = SharedPreferencesUtil._(preferences);
    }
    return _instance!;
  }

  Future<bool> putString(String key, String value) => _preferences.setString(key, value);

  Future<bool> putStringList(String key, List<String> value) => _preferences.setStringList(key, value);

  Future<bool> putInt(String key, int value) => _preferences.setInt(key, value);

  Future<bool> putDouble(String key, double value) => _preferences.setDouble(key, value);

  Future<bool> putBool(String key, bool value) => _preferences.setBool(key, value);

  String getString(String key, {String defaultValue = ""}) => _preferences.getString(key) ?? defaultValue;

  List<String> getStringList(String key, {List<String> defaultValue = const []}) =>
      _preferences.getStringList(key) ?? defaultValue;

  int getInt(String key, {int defaultValue = 0}) => _preferences.getInt(key) ?? defaultValue;

  double getDouble(String key, {double defaultValue = 0.0}) => _preferences.getDouble(key) ?? defaultValue;

  bool getBool(String key, {bool defaultValue = false}) => _preferences.getBool(key) ?? defaultValue;

  bool containsKey(String key) => _preferences.containsKey(key);

  Future<bool> remove(String key) => _preferences.remove(key);

  Future<bool> clear() => _preferences.clear();
}
```

接着补全下登录部分的代码：

```dart
  void _login() {
    // 登录校验逻辑
    final username = _usernameController.text;
    final password = _passwordController.text;
    if (username.isNotEmpty && password.isNotEmpty) {
      // 弹出登录对话框
      showLoadingDialog(context, canPop: false);
      // 在发起登录请求
      DioClient().post("user/login", params: {"username": username, "password": password}).then((value) async {
        // 关闭Loading对话框
        Navigator.pop(context);
        var resp = DataResponse<UserInfo>.fromJson(value.data, (json) => UserInfo.fromJson(json));
        ToastUtil.show(msg: "登录成功");
        // 获取响应头里的Set-Cookie，设置到请求头中，并通过sp持久化到本地
        List<String>? cookies = value.headers['Set-Cookie'];
        if (cookies != null) {
          DioClient().setCookies(cookies);
          SharedPreferencesUtil.getInstance().then((value) => value.putStringList("cookies", cookies));
          // 关闭登录页
          Navigator.pop(context);
        }
        Fluttertoast.showToast(msg: resp.errorMsg);
      }).catchError((e) {
        Navigator.pop(context);
        if (e is OtherException) {
          ToastUtil.show(msg: "登录失败：${e.message}");
        } else {
          ToastUtil.show(msg: "登录失败：$e");
        }
      });
    } else {
      Fluttertoast.showToast(msg: "用户名或密码不能为空");
    }
  }
```

输入正确账号密码，点击登录，登录成功后，登录页自动关闭，**手动关闭侧滑导航**，**再次点开**，可以看到用户名和积分都显示出来了：

## 8. 完善侧滑导航逻辑

😅 登录成功，需要 **手动关闭侧滑导航**，**再点击展开侧滑才刷新积分**，有点呆我们更希望能在登录成功时，就自动请求接口接口，然后自动刷新UI。

### 8.1. 登录成功自动请求积分接口

这里可以通过 **状态/数据共享** 来实现，使用官方推荐的 **Provider** 来实现，命令行键入 **flutter pub add provider** 添加下依赖。接着定义一个类继承 **ChangeNotifier** 并定义一个通知更新的方法，在里面调用 **notifyListeners()** 通知所有监听者~

```dart
import 'package:flutter/cupertino.dart';

class LoginStatus extends ChangeNotifier {
  bool _isLogin = false;

  bool get isLogin => _isLogin;

  void updateLoginStatus(bool isLogin) {
    _isLogin = isLogin;
    notifyListeners()；
  }
}
```

监听者们会在这个方法被调用时得到通知，在顶层 **main.dart** 文件中，设置 **Provider**：

```dart
runApp(ChangeNotifierProvider(create: (context) => LoginStatus(), child: const MyApp()));
```

**登录页**，登录成功时调用updateLoginStatus() 通知更新：

```dart
Provider.of<LoginStatus>(context, listen: false).updateLoginStatus(true);
```

**侧滑导航**，可以使用 **Consumer** 或 **Provider.of()** 来监听数据变化：

```dart
  @override
  void initState() {
    super.initState();
    // 添加监听，状态改变时回调请求积分的方法
    Provider.of<LoginStatus>(context, listen: false).addListener(_requestCoin);
    _requestCoin();
  }

	// 请求积分的方法
  void _requestCoin() {
    DioClient().get("lg/coin/userinfo/json").then((value) {
      setState(() {
        _integral = DataResponse<Integral>.fromJson(value.data, (json) => Integral.fromJson(json)).data;
      });
    }).catchError((e) {
      if (e is UnLoginException) {
        ToastUtil.show(msg: "未登录，请先登录！");
      } else if (e is OtherException) {
        ToastUtil.show(msg: e.message);
      } else {
        ToastUtil.show(msg: "请求失败：${e.toString()}");
      }
    });
  }
```

运行后，登录成功，登录自动关闭，侧滑导航自动拉取积分接口，nice😁。当然，侧滑这里其实没必要每次展开都拉取的，后续再优化下细节~

### 8.2. 初始化时，获取下Cookie并设置

在请求库初始化的时候，可以顺带获取下 **shared_preferences** 里保存的Cookie 并设置到请求头中：

```dart
void main() {
  // 确保Flutter框架初始化完成
  WidgetsFlutterBinding.ensureInitialized();
  DioClient.init("https://www.wanandroid.com/");
  SharedPreferencesUtil.getInstance().then((value) {
    List<String>? cookies = value.getStringList("cookies");
    DioClient().setCookies(cookies);
  });
  runApp(ChangeNotifierProvider(create: (context) => LoginStatus(), child: const MyApp()));
}
```

😑 侧滑导航就折腾到这吧，接着折腾底部Tab~

## 9. 底部Tab

直接CV**《实战：写个简陋的掘金静态首页》**里的代码改改~

### 9.1. **BottomNavigationBar** + **BottomNavigationBarItem**

```dart
class BottomBarWidget extends StatefulWidget {
  final int currentIndex;
  final Function(int) onItemSelected;

  const BottomBarWidget({
    Key? key,
    required this.currentIndex,
    required this.onItemSelected,
  }) : super(key: key);

  @override
  State<StatefulWidget> createState() => _BottomBarWidgetState();
}

class _BottomBarWidgetState extends State<BottomBarWidget> {

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      onTap: widget.onItemSelected,
      selectedItemColor: MyColors.leiMuBlue,
      // 选中时的颜色
      unselectedItemColor: Colors.grey,
      // 未选中时的颜色
      showSelectedLabels: true,
      // 选中的label是否展示
      showUnselectedLabels: true,
      // 未选中的label是否展示
      currentIndex: widget.currentIndex,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home), label: '首页'),
        BottomNavigationBarItem(icon: Icon(Icons.article), label: '公众号'),
        BottomNavigationBarItem(icon: Icon(Icons.heart_broken), label: '其它'),
      ],
    );
  }
}
```

### 9.2. PageView (切页)

点击切页，用到 **PageView** 组件：

```dart
import 'package:flutter/cupertino.dart';

/// 首页视图
class ContentPageView extends StatefulWidget {
  final PageController pageController;
  final Function(int) onPageChanged;

  const ContentPageView({
    super.key,
    required this.pageController,
    required this.onPageChanged,
  });

  @override
  State<StatefulWidget> createState() => _ContentPageViewState();
}

class _ContentPageViewState extends State<ContentPageView> {
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: PageView(
        controller: widget.pageController,
        onPageChanged: widget.onPageChanged,
        children: const <Widget>[
          Center(child: Text('首页')),
          Center(child: Text('公众号')),
          Center(child: Text('其它')),
        ],
      ),
    );
  }
}
```

### 9.3. 底部Tab + PageView 联动

两者切换时的联动，需要传入一个 **PageController**，在 **页面改变时更新下标状态** 以及 **点击Tab时切换页面**，具体实现代码如下：

```dart
class _MyHomePageState extends State<MyHomePage> {
  int _currentIndex = 0;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: _currentIndex);
  }

  @override
  void dispose() {
    // 组件销毁时要注销掉控制器
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    // 页面改变时更新下标状态
    setState(() {
      _currentIndex = index;
    });
  }

  void _onItemTapped(int selectedIndex) {
    // 点击Tab时切页
    _pageController.jumpToPage(selectedIndex);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          backgroundColor: MyColors.leiMuBlue,
          title: Text(widget.title, style: const TextStyle(color: Colors.white)),
        ),
        body: Container(
            color: Colors.white,
            child: Column(
              children: [
                ContentPageView(
                  pageController: _pageController,
                  onPageChanged: _onPageChanged,
                ),
                BottomBarWidget(
                  currentIndex: _currentIndex,
                  onItemSelected: _onItemTapped,
                )
              ],
            )),
        drawer: const DrawerScreen());
  }
}
```

运行看看效果：

🤣 效果还阔以哈，接着完善首页~

## 10. 首页

首页的要素稍微复杂点：**下拉刷新组件**、**ListView** (包裹Banner + 文章列表项)、以及需要支持 **滑动到底部加载更多**，一个个来~

### 10.1. 下拉刷新

Flutter 内置一个 **RefreshIndicator** 组件，可以用来包裹一个 **滚动组件**，**实现下拉刷新功能**。常用属性如下：

* **onRefresh**: **必要属性**，类型是Future Function()。当用户下拉可滚动组件触发刷新时调用，你需要在这个回调中进行数据加载的异步操作，并返回一个Future。RefreshIndicator会等待这个Future完成才消失。

* **child**: 要包裹的子widget，通常是可滚动的组件，如ListView、ScrollView。

* **displacement**: 控制RefreshIndicator圆圈图标开始显示时在垂直方向的偏移量，默认值是40.0像素。

* **color** & **backgroundColor**：前者用于设置圆形进度指示器的前景色，后者用于设置其背景色。

* **notificationPredicate**: 默认情况下，RefreshIndicator会关联界面上的第一个可滚动组件。如果你需要关联其他特定的可滚动组件，可以通过设置这个属性来提供自定义的决策逻辑。

* **triggerMode**: 确定RefreshIndicator是在用户下拉时触发 (RefreshIndicatorTriggerMode.onEdge)，还是任意位置下拉都会触发 (RefreshIndicatorTriggerMode.anywhere)，默认用户下拉时触发。

* **edgeOffset**: 控制RefreshIndicator被触发时滚动视图顶部的位置。

* **strokeWidth**: 设置圆形进度条的粗细。

### 10.2. Banner

Flutter没有内置的Banner控件，可以使用 **PageView** + **Timer**，实现一个 **无限循环**，**支持定时切换的Banner**。

```dart
class AutoScrollBannerWidget extends StatefulWidget {
  final List<String> imageUrls;
  final Function(int pos) onTap;

  const AutoScrollBannerWidget({super.key, required this.imageUrls, required this.onTap});

  @override
  State<StatefulWidget> createState() => _AutoScrollBannerWidgetState();
}

class _AutoScrollBannerWidgetState extends State<AutoScrollBannerWidget> {
  late PageController _pageController;
  late Timer _timer;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    // 为了无限轮播，把_currentPage设置在一个较大的值
    _currentPage = widget.imageUrls.length * 10000;
    // 初始化页面控制器
    _pageController = PageController(initialPage: _currentPage);
    // 启动定时器，每3秒切换页面
    _timer = Timer.periodic(const Duration(seconds: 5), (Timer timer) {
      //  计算下个页面索引
      int nextPageIndex = _pageController.page!.toInt() + 1;
      if (_pageController.hasClients) {
        _pageController.animateToPage(
          nextPageIndex,
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeIn,
        );
      }
    });
  }

  @override
  void dispose() {
    // 组件销毁时，取消定时器，释放资源
    _timer.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      width: double.infinity,
      child: PageView.builder(
        controller: _pageController,
        itemBuilder: (context, index) {
          // 取余获得真正有效的index
          var trueIndex = index % widget.imageUrls.length;
          return GestureDetector(
            onTap: () => widget.onTap(trueIndex),
            child: CachedNetworkImage(
                imageUrl: widget.imageUrls[trueIndex],
                placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                errorWidget: (context, url, error) => const Icon(Icons.error)),
          );
        },
        onPageChanged: (index) {
          _currentPage = index;
        },
      ),
    );
  }
}
```

 这部分的代码多看几遍就懂了~

### 10.3. 文章列表项

这里比较简单，就显示下文章标题、作者、分类及发布日期，预留了一个点击路由跳转 **文章阅读页**：

```dart
class ArticleItemWidget extends StatefulWidget {
  final ArticleInfo articleInfo;

  const ArticleItemWidget({Key? key, required this.articleInfo}) : super(key: key);

  @override
  State<StatefulWidget> createState() => _ArticleItemWidgetState();
}

class _ArticleItemWidgetState extends State<ArticleItemWidget> {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      child: Column(
        children: [
          Container(
              padding: const EdgeInsets.all(12.0),
              alignment: Alignment.topLeft,
              child: Text(
                widget.articleInfo.title,
                style: const TextStyle(fontSize: 16, color: Colors.black),
              )),
          const SizedBox(height: 4.0),
          Row(
            children: [
              const SizedBox(width: 12.0),
              Expanded(
                child: Text(
                  widget.articleInfo.author,
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ),
              Text(
                widget.articleInfo.superChapterName,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(width: 12.0),
              Text(
                widget.articleInfo.niceDate,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(width: 12.0),
            ],
          ),
          const SizedBox(height: 8.0),
          const Divider(height: 1, color: Colors.grey, thickness: 0.5),
        ],
      ),
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (context) {
          return Container(color: Colors.white, alignment: Alignment.center, child: const Text('文章阅读页'));
        }));
      },
    );
  }
}
```

### 10.4. 滑动到底部加载更多

可以为 **ListView.builder** 的 **controller** 属性设置一个 **ScrollController** 来监听是否滚动到底部，示例代码：

```dart
  _scrollController.addListener(() {
    // 滚动到底部时自动加载更多
    if (_scrollController.position.pixels == _scrollController.position.maxScrollExtent) {
      _requestArticleList();
    }
  });
```

### 10.5. 组合封装

接着把这几个东东都组合封装到一起：

```dart
class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<StatefulWidget> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentPage = 0; // 当前页数
  List<IndexBannerInfo> _bannerItems = []; // banner列表
  IndexArticleInfo? _indexData; // 文章列表项目
  List<ArticleInfo> _artcileItems = []; // 文章列表
  final ScrollController _scrollController = ScrollController(); // 滑动监听器

  @override
  void initState() {
    super.initState();
    _requestBanner();
    _requestArticleList(isRefresh: true); // 首次加载默认拉取一次
    _scrollController.addListener(() {
      // 滚动到底部时自动加载更多
      if (_scrollController.position.pixels == _scrollController.position.maxScrollExtent) {
        _requestArticleList();
      }
    });
  }

  @override
  void dispose() {
    super.dispose();
    _scrollController.dispose();
  }

  // 请求Banner接口
  Future<void> _requestBanner() async {
    DioClient().get("banner/json").then((value) {
      setState(() {
        _bannerItems =
            ListResponse<IndexBannerInfo>.fromJson(value.data, (json) => IndexBannerInfo.fromJson(json)).data ?? [];
      });
    }).catchError((e) {
      ToastUtil.show(msg: "请求失败：${e.toString()}");
    });
  }

  // 请求文章列表接口
  Future<void> _requestArticleList({bool isRefresh = false}) async {
    if (isRefresh) {
      _currentPage = 0;
      _artcileItems.clear();
    } else {
      ++_currentPage;
      // 请求时展示Loading对话框
      showLoadingDialog(context, canPop: false);
    }
    DioClient().get("article/list/$_currentPage/json").then((value) {
      // 加载更多需要关闭加载对话框
      if (!isRefresh) Navigator.pop(context);
      setState(() {
        _indexData =
            DataResponse<IndexArticleInfo>.fromJson(value.data, (json) => IndexArticleInfo.fromJson(json)).data;
        _artcileItems.addAll(_indexData!.datas);
      });
    }).catchError((e) {
      ToastUtil.show(msg: "请求失败：${e.toString()}");
    });
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
        onRefresh: () => _requestArticleList(isRefresh: true),
        child: ListView.builder(
          itemCount: _artcileItems.length,
          itemBuilder: (context, index) {
            // 两个接口都拉取成功，才加载页面
            if (_bannerItems.isNotEmpty && _artcileItems.isNotEmpty) {
              if (index == 0) {
                return AutoScrollBannerWidget(
                  imageUrls: _bannerItems.map((e) => e.imagePath).toList(),
                  onTap: (pos) => ToastUtil.show(msg: "点击了第${pos + 1}个banner"),
                );
              }
              int itemIndex = index - 1;
              return ArticleItemWidget(articleInfo: _artcileItems[itemIndex]);
            }
            return null;
          },
          controller: _scrollController,
        ));
  }
}
```

运行看下效果：

### 10.6. AutomaticKeepAliveClientMixin (保存页面状态)

😳 正在我准备继续写公众号页面，发现了问题，切去其它页，然后切回首页，**首页的内容都会重新加载**。查了下，貌似原因是介个：

> 在 Flutter 中，当一个 widget 不在视图中时，为了节约资源，Flutter 可能会卸载这个 widget，然后当它再次需要显示时重新创建它。

解法之一就是使用：**AutomaticKeepAliveClientMixin**，用法如下

* ① 对希望保持状态的页面的 **State** 通过 **with** 混入 **AutomaticKeepAliveClientMixin**；
* ② 重写 **wantKeepAlive()** 方法返回 **true**；
* ③ 在State的 **build()** 中调用 **super.build(context)** ；

关键代码示例如下：

```dart
class _HomeScreenState extends State<HomeScreen> with AutomaticKeepAliveClientMixin {
  @override
  Widget build(BuildContext context) {
    super.build(context);
    // ...
  }

 	@override
  bool get wantKeepAlive => true;
}
```

😁 通过上述配置，切去别的页面再切回来，页面内容也不会重新加载啦。

## 11. 公众号页

这部分同样可以直接CV**《实战：写个简陋的掘金静态首页》**里的代码改改~

### 11.1. TabBar + TabBarView

两者联动还需要用到 **SingleTickerProviderStateMixin** 提供一个选中的动画效果，具体实现代码：

```dart
class WxArticleScreen extends StatefulWidget {
  const WxArticleScreen({super.key});

  @override
  State<StatefulWidget> createState() => _WxArticleScreenState();
}

class _WxArticleScreenState extends State<WxArticleScreen> with SingleTickerProviderStateMixin, AutomaticKeepAliveClientMixin {
  late TabController _tabController;
  late List<WxArticleChapter> _chapterList = [];

  // 请求公众号列表
  Future<void> _wxArticleChapters() async {
    DioClient().get("wxarticle/chapters/json").then((value) {
      if(mounted) {
        setState(() {
          _chapterList =
              ListResponse<WxArticleChapter>.fromJson(value.data, (json) => WxArticleChapter.fromJson(json)).data ?? [];
          _tabController = TabController(length: _chapterList.length, vsync: this);
        });
      }
    }).catchError((e) {
      ToastUtil.show(msg: "请求失败：${e.toString()}");
    });
  }

  @override
  void initState() {
    super.initState();
    _wxArticleChapters();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if(_chapterList.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    } else {
      return Column(
        children: [
          BlogTabBarWidget(tabController: _tabController, chapterList: _chapterList),
          // 高度填满剩余空间
          Expanded(
            child: TabBarView(
              // 同样使用TabBarView
                controller: _tabController, // 关联同一个TabController
                children: _chapterList.map((chapter) => WxArticleListWidget(chapterId: chapter.id)).toList()),
          ),
        ],
      );
    }
  }

  @override
  bool get wantKeepAlive => true;
}
```

封装下 **TabBar** 写个组件：

```dart
class BlogTabBarWidget extends StatefulWidget {
  final TabController tabController;
  final List<WxArticleChapter> chapterList;

  const BlogTabBarWidget({Key? key, required this.tabController, required this.chapterList}) : super(key: key);

  @override
  State<StatefulWidget> createState() => _BlogTabBarWidgetState();
}

class _BlogTabBarWidgetState extends State<BlogTabBarWidget> {
  @override
  Widget build(BuildContext context) {
    return TabBar(
      controller: widget.tabController,
      isScrollable: true,
      tabs: widget.chapterList.map((chapter) => Tab(text: chapter.name)).toList(),
    );
  }
}
```

**TabBarView** 的子项同样封装成一个组件：

```dart
class WxArticleListWidget extends StatefulWidget {
  final int chapterId;

  const WxArticleListWidget({Key? key, required this.chapterId}) : super(key: key);

  @override
  State<StatefulWidget> createState() => _WxArticleListWidgetState();
}

class _WxArticleListWidgetState extends State<WxArticleListWidget> with AutomaticKeepAliveClientMixin {
  int _currentPage = 0; // 当前页数
  List<WxArticle> _articleList = []; // 文章列表
  final ScrollController _scrollController = ScrollController(); // 滑动监听器

  @override
  void initState() {
    super.initState();
    _requestArticleList(isRefresh: true);
    _scrollController.addListener(() {
      // 滚动到底部时自动加载更多
      if (_scrollController.position.pixels == _scrollController.position.maxScrollExtent) {
        _requestArticleList();
      }
    });
  }

  @override
  void dispose() {
    super.dispose();
    _scrollController.dispose();
  }

  // 请求文章列表
  Future<void> _requestArticleList({bool isRefresh = false}) async {
    if (isRefresh) {
      _currentPage = 0;
      _articleList.clear();
    } else {
      ++_currentPage;
      showLoadingDialog(context, canPop: false);
    }
    DioClient().get("wxarticle/list/${widget.chapterId}/$_currentPage/json").then((value) {
      if (!isRefresh) Navigator.pop(context);
      setState(() {
        var data = DataResponse<WxArticleRes>.fromJson(value.data, (json) => WxArticleRes.fromJson(json)).data;
        _articleList.addAll(data!.datas);
      });
    }).catchError((e) {
      ToastUtil.show(msg: "请求失败：${e.toString()}");
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return RefreshIndicator(
        onRefresh: () => _requestArticleList(isRefresh: true),
        child: ListView.builder(
          itemCount: _articleList.length,
          itemBuilder: (context, index) {
            // 文章列表不为空才显示
            if (_articleList.isNotEmpty) {
              return WxArticleItemWidget(articleInfo: _articleList[index]);
            } else {
              return null;
            }
          },
          controller: _scrollController,
        ));
  }

  @override
  bool get wantKeepAlive => true;
}
```

列表项的话，直接复用首页文章列表的组件，改下数据结构就完事了，运行看下效果：

😄 还凑合，最后再写一个文章阅读页~

## 12. 文章阅读页 (嵌套WebView)

如题，就是嵌套一个WebView，Flutter没有内置浏览器组件，这里用到三方库：[flutter_inappwebview](https://github.com/pichillilorenzo/flutter_inappwebview)，执行 **flutter pub add flutter_inappwebview** 添加依赖，然后就可以使用库里的 **InAppWebView** 来加载网页了。此页面结构：

* **顶部**：**AppBar**，蕾姆蓝背景，白色字体，左边一个回退按钮，右边一个 **复制URL** 和 **跳转手机浏览器** 按钮；
* **中间**：**Stack堆叠布局**，包含 **InAppWebView** 和 根据是否处于加载状态，显示圆形进度条或Container；

### 12.1. InAppWebView

定义一个标记 **_isLoading** 表示网页是否正在加载中，在 **InAppWebView** 的 **onLoadStart**(开始加载) 和 **onLoadStop**(结束加载) 中修改，并调用 **setState()** 更新状态；

```dart
class BrowserPageScreen extends StatefulWidget {
  final String url;

  const BrowserPageScreen({super.key, required this.url});

  @override
  State<StatefulWidget> createState() => _BrowserPageScreenState();
}

class _BrowserPageScreenState extends State<BrowserPageScreen> {
  bool _isLoading = true; // 网页是否正在加载中

  void _copyUrlToClipboard() {
     // 复制URL到剪切板
  }

  void _openBrowser() async {
    // 跳转手机浏览器
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: MyColors.leiMuBlue,
        title: const Text('Van ♂ Android'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.copy, color: Colors.white),
            onPressed: _copyUrlToClipboard,
          ),
          IconButton(
            icon: const Icon(Icons.open_in_browser, color: Colors.white),
            onPressed: _openBrowser,
          ),
        ],
      ),
      body: Stack(
        children: [
          InAppWebView(
            initialUrlRequest: URLRequest(url: WebUri(widget.url)),
            onLoadStart: (InAppWebViewController controller, Uri? url) {
              setState(() {
                _isLoading = true; // 页面开始加载，更新状态为 true
              });
            },
            // 页面停止加载时的回调
            onLoadStop: (InAppWebViewController controller, Uri? url) {
              setState(() {
                _isLoading = false; // 页面停止加载，更新状态为 false
              });
            },
          ),
          _isLoading
              ? const Center(child: CircularProgressIndicator()) // 如果正在加载，则显示圆形进度指示器
              : Container(), // 如果不是，则不显示任何内容
        ],
      ),
    );
  }
}
```

运行后可能会报错：

> Dependency 'androidx.webkit:webkit:1.8.0' requires libraries and applications that depend on it to compile against version 34 or later of the Android APIs.

**问题描述**：webkit:1.8.0 要求 compile SDK version 需要为 **Android API 34** 或更高的版本；

**解决方法**：打开 **android/build.gradle** 文件，找到 **compileSdkVersion** 修改为34或更高版本；

### 12.2. 复制Url到剪切板

**Flutter** 内置的 **services** 库中提供了 **Clipboard** 类用于操作 **系统剪切板，** 使用代码示例如下 **：**

```dart
import 'package:flutter/services.dart';

// 设置数据到剪切板
Clipboard.setData(ClipboardData(text: '这里是要复制的文字'));

// 读取剪切板数据
final ClipboardData data = await Clipboard.getData('text/plain');
String pastedText = data.text;
```

顺带完善下，上面的 **_copyUrlToClipboard()** 方法：

```dart
void _copyUrlToClipboard() {
  Clipboard.setData(ClipboardData(text: widget.url));
  // 底部弹出一个SnackBar告知用户
  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('链接已复制到剪贴板')));
}
```

### 12.3. 跳转手机浏览器

这个用到Flutter三方库 [url_launcher](https://pub.dev/packages/url_launcher)，支持跨平台（iOS、Android、Web等）的方式来打开 **外部网页**、发送邮件、拨打电话、发送短信等操作。执行 **flutter pub add url_launcher** 添加依赖，使用方法非常简单：

```dart
import 'package:url_launcher/url_launcher.dart';

void _openBrowser() async {
  Uri uri = Uri.parse(widget.url);
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri);
  } else {
    throw 'Could not launch $uri';
  }
}
```

运行看看最终效果：

## 13. 小结

 断断续续，总算把这篇堆出来了，勉强算是开发了一个简陋APP，毕竟还有一大堆 **待优化的BUG** 和 **待完善的功能**，不过也是 **Flutter入门** 了。😄 后面就是 **给这个项目添砖加瓦** 和 **各种Flutter知识点的专项学习**，敬请期待~