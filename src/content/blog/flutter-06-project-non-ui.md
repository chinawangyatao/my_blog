---
title: "Flutter入门到精通（六）：项目实战：非UI部分"
pubDate: 2024-01-07
description: "Flutter项目实战中的非UI部分，包括路由配置、网络请求、数据模型等。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第六篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

前两节分别速通了**《Dart基础语法》**和**《Flutter UI基础》**，各位读者应该都手痒痒想写点什么了😆，本节就来实战一波，写个简单的 **Flutter APP** 练练手，接口源 [WanAndroid](https://www.wanandroid.com/blog/show/2)，把App的开发要点笼统地分为两个部分：

* **UI部分**：**APP门面**，用哪些UI控件，自带或者第三方，布局该怎么堆叠；
* **非UI部分**：**功能相关**，如：网络请求、Json解析、路由跳转、全局状态管理、配置选项等；

😁 本节先过下非UI部分，看下都会涉及到哪些点~

## 1. 网络请求

### 1.1. 自带HttpClient

Dart中的 **dart:io** 库提供了各种用于IO操作的功能，包括：文件、套接字、HTTP客户端和服务器等。库中的**HttpClient** 类用于发起HTTP请求。简单使用代码示例如下：

```dart
import 'dart:io';
import 'dart:convert';

void testHttpClient() async {
  var url = Uri.parse('http://www.baidu.com');
  // 1、创建HttpClient对象
  var httpClient = HttpClient();
  try {
    // 2、构建请求
    var request = await httpClient.getUrl(url);
    // 3、设置请求头
    request.headers.add('User-Agent', 'MyDartApp/1.0');
    // 4、发起请求，等待响应
    var response = await request.close();
    // 5、检查响应和读取数据
    if (response.statusCode == HttpStatus.ok) {
      var responseBody = await response.transform(utf8.decoder).join();
      print('Response Body:\n$responseBody');
    } else {
      // 处理错误
      print('${response.statusCode}');
    }
  } catch (exception) {
    // 处理异常
    print('Failed getting IP address');
  } finally {
    // 6、关闭HttpClient，释放所有资源
    httpClient.close();
  }
}
```dart

运行后可以看到控制台输出请求信息：

### 1.2. dio库

HttpClient 还支持请求配置、代理设置、证书校验等高级功能，但用起来确实麻烦。哈哈，跟Android原生自带的HttpUrlConnection一样不受待见，Android中比较流行的网络请求库是okhttp，Dart社区里也有好些第三方http请求库，其中人气最多的莫过于 [cfug/dio](https://github.com/cfug/dio) 库了，而且它的 [API文档](https://github.com/cfug/dio/blob/main/dio/README-ZH.md) 非常友好😁~

命令行走下 **flutter pub add dio** 装下库，写个简单访问WanAndroid首页的例子：

```dart
import 'package:dio/dio.dart';

testDio(Dio());

void testDio(Dio dio) async {
  Response response = await dio.get('https://www.wanandroid.com/banner/json');
  print(response.data.toString());
}
```dart

运行后可以看到控制台输出请求信息：

### 1.3. 简易请求封装

dio库确实简洁，官方文档这样写道：

> 建议在项目中使用Dio单例，这样便可对同一个dio实例发起的所有请求进行一些统一的配置， 比如设置公共header、请求基地址、超时时间等。

简单点说就是：**使用单例来方便请求的统一配置**，文档给出的示例是 **定义顶层变量** 的方式：

```dart
import 'package:dio/dio.dart';

final dio = Dio(
  BaseOptions(
    connectTimeout: Duration(seconds: 3),
  ),
);
```dart

这里直接抄[《Flutter实战·第二版》](https://book.flutterchina.club/chapter15/network.html#_15-5-1-%E7%BD%91%E7%BB%9C%E6%8E%A5%E5%8F%A3%E7%BC%93%E5%AD%98)里的封装思路，然后加点东西：

```dart
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter/material.dart';
import 'global.dart';

class WanAndroid {
  // 网络请求过程可能需要使用当前的上下文信息，如打开一个新路由
  WanAndroid([this.context]) {
    _options = Options(extra: {"context": context});
  }

  BuildContext? context; // 上下文
  late Options _options; // 附加选项
  static const bool enableProxy = true; // 是否设置代理方便调试阶段抓包

  static Dio dio = Dio(BaseOptions(
    baseUrl: 'https://www.wanandroid.com/',
    connectTimeout: const Duration(seconds: 30), // 请求超时
    receiveTimeout: const Duration(seconds: 30), // 响应超时
    // 自定义请求头，ua不设置默认是：Dart/3.2 (dart:io)
    headers: {HttpHeaders.userAgentHeader: 'partner/7.8.0(Android;12;1080*2116;Scale=2.75;Xiaomi=Mi MIX 2S)'},
  ));

  static void init() {
    // 调试阶段开启抓包调试
    if (isDebug) {
      // 使用代理
      dio.httpClientAdapter = IOHttpClientAdapter(
        createHttpClient: () {
          return HttpClient()
            // 将请求代理到 本机IP:8888，是抓包电脑的IP！！！不要直接用localhost，会报错:
            // SocketException: Connection refused (OS Error: Connection refused, errno = 111), address = localhost, port = 47972
            ..findProxy = (uri) {
              return 'PROXY 192.168.102.125:8888';
            }
            // 抓包工具一般都会提供一个自签名的证书，会通不过证书校验，这里禁用下
            ..badCertificateCallback = (X509Certificate cert, String host, int port) => true;
        },
      );
    }
    // 初始化拦截器
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (option, handler) {
        // 在请求发起前做一些事情
        return handler.next(option);
      },
      onResponse: (response, handler) {
        // 在返回响应数据前做一些预处理
        return handler.next(response);
      },
      onError: (error, handler) {
        // 请求失败时做一些预处理
        return handler.next(error);
      }
    ));
  }

  /// 首页Banner
  Future<String> getBanner() async {
    var resp = await dio.get<String>('banner/json');
    return resp.data.toString();
  }
}

// 调用处
WanAndroid.init();
WanAndroid().getBanner().then((value) => print(value));
```dart

读者看完上述代码，估计会有一个疑惑：**为啥要配置代理**🙂？简单答下疑：

在APP调试阶段，一般会利用一些 **抓包工具** (如Charles、Fidder) 来抓取网络请求接口，以方便接口联调。然后你会发现 **原生APP可以抓包**，**Flutter App却抓不了包**，这是咋回事😳？这是因为 **Flutter APP的网络请求是不走手机的系统代理的**，它不走，自然抓不到，想抓的话需要我们 **手动给它设置一个http代理**，而**DefaultHttpClientAdapter** 提供了 **onHttpClientCreate()** 的回调用于设置 **底层HttpClient的代理**。

通过上述配置，Charles就可以Flutter App的请求包啦😁~

## 2. Json 序列化 & 反序列化

😊 先区分清楚Json序列化和反序列化：

* **序列化**：对象或数据结构 → Json格式的字符串，**发起接口请求时用到**，**Dart对象 → Json**。
* **反序列化**：Json格式的字符串 → 对象或数据结构，**解析接口响应时用到，Json → Dart对象。**

### 2.1. 抠脚实现方案

**dart:convert** 库内置了两个方法来实现Json的 **序列化-json.encode()** 与 **反序列化-json.decode()。** 试下用它来解析上面返回的Json：

```dart
{
	"data": [{
		"desc": "我们支持订阅啦~",
		"id": 30,
		"imagePath": "https://www.wanandroid.com/blogimgs/42da12d8-de56-4439-b40c-eab66c227a4b.png",
		"isVisible": 1,
		"order": 2,
		"title": "我们支持订阅啦~",
		"type": 0,
		"url": "https://www.wanandroid.com/blog/show/3352"
	}, {
		"desc": "",
		"id": 6,
		"imagePath": "https://www.wanandroid.com/blogimgs/62c1bd68-b5f3-4a3c-a649-7ca8c7dfabe6.png",
		"isVisible": 1,
		"order": 1,
		"title": "我们新增了一个常用导航Tab~",
		"type": 1,
		"url": "https://www.wanandroid.com/navi"
	}, {
		"desc": "一起来做个App吧",
		"id": 10,
		"imagePath": "https://www.wanandroid.com/blogimgs/50c115c2-cf6c-4802-aa7b-a4334de444cd.png",
		"isVisible": 1,
		"order": 1,
		"title": "一起来做个App吧",
		"type": 1,
		"url": "https://www.wanandroid.com/blog/show/2"
	}],
	"errorCode": 0,
	"errorMsg": ""
}
```dart

根据Json结构手写对应的 **Model** 类：

```dart
class Banner {
  int id;
  String desc;
  String imagePath;
  int isVisible;
  String title;
  String url;

  Banner(this.id, this.desc, this.imagePath, this.isVisible, this.title, this.url);

  @override
  String toString() {
    return "标题：$title - 封面图：$imagePath - 跳转URL：$url";
  }
}
```dart

调用 json.decode() 来解码接口返回的Json：

```dart
var resp = await dio.get<String>('banner/json');
var respJson = json.decode(resp.data.toString());
List dataList = respJson['data'];
for (dynamic data in dataList) {
  print(Banner(data['id'], data['desc'], data['imagePath'], data['isVisible'], data['title'], data['url']));
}
```dart

运行后控制台输出结果如下：

可以看到值都取到了，当然，这里只是为了演示才这样写，常规操作是在Model中定义两个方法来转换：

```dart
class Banner {
  int id;
  String desc;
  String imagePath;
  int isVisible;
  String title;
  String url;

  // 序列化
  Banner.formJson(Map<String, dynamic> json)
      : id = json['id'],
        desc = json['desc'],
        imagePath = json['imagePath'],
        isVisible = json['isVisible'],
        title = json['title'],
        url = json['url'];

  // 反序列化
  Map<String, dynamic> toJson() =>
      <String, dynamic>{
        'id': id,
        'desc': desc,
        'imagePath': imagePath,
        'isVisible': isVisible,
        'title': title,
        'url': url,
      };
}

// 调用处
 List bannerList = [];
for (dynamic data in json.decode(resp.data.toString())['data']) {
  bannerList.add(Banner.formJson(data));
}

// 调用json.encode()序列化
for (Banner banner in bannerList) {
  print(json.encode(banner));
}
```dart

运行输出结果如下：

这里不需要我们手动调用 **toJson()** ，json.encode() 方法内部会自动调用。每次序列化和反序列化都要自己抠字段，**重复劳动** 之余还容易会引入 **人为错误**(如字段拼写错误)，🤪 肯定得想办法 **自动化** 的。

Android原生开发时，一般是通过 **Gson/Jackson** 来自动序列化的，原理是 **运行时反射**。而在Flutter中却 **禁用** 了运行时反射，因为它会干扰Dart的 **tree shaking**(摇树) 过程。简单解释下：

> tree shaking 是Dart编译器优化过程的一个术语，它会 **移除** 应用程序编译后的 **未被使用的代码**，以缩减应用的体积。而反射需要在运行时动态查询或调用对象的方法或属性，为此，**编译器必须保留应用中所有可能会被反射机制调用的代码**，即便这些代码在实际工作流程中可能永远不会被执行，这直接干扰到tree shaking，因为编译器无法确定哪些代码是"多余"的。因此，Flutter禁用了运行时反射 (不能用 **dart:mirrors库**)，鼓励开发者使用 **编译时代码生成** 的方式来代替反射。

官方推荐我们使用 [json_serializable](https://pub.dev/packages/json_serializable) 这个 **Flutter编译时工具** 来自动生成Json序列化代码~

### 2.2. json_serializable库

#### 2.2.1. 添加依赖

直接命令键入下述命令自动添加最新依赖：

```dart
flutter pub add json_annotation dev:build_runner dev:json_serializable
```dart

或者打开 **pubspec.yaml** 文件手动添加依赖：

```dart
dependencies:
  flutter:
    sdk: flutter
	json_annotation: ^4.8.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.7
  json_serializable: ^6.7.1
```dart

**Tips**: 版本号前的^，用于 **指定版本约束**，只要主版本号不变，可以接受你指定的版本或更高版本。如：build_runner: ^2.1.7 表示项目可以使用2.1.7或2.x.x的更新版本，但不能是3.0.0或更高的版本，因为此版本可能包含了大的变更，不兼容现有的代码。当你 **第一次运行(flutter pub get)** 或 **显式更新依赖(flutter pub upgrade)** 时，Dart的包管理器会根据版本约束解析并下载符合条件的 **最新版本(主版本号不变)** 。如果想**写死特定版本不更新**，**去掉^符号** 即可。

#### 2.2.2. 基本使用

先创建Model类，添加属性，给类加上 **@JsonSerializable()** 注解，并添加 **fromJson()** 和 **toJson()** 方法：

```dart
import 'package:json_annotation/json_annotation.dart';

part 'model.g.dart'; // 1、指到生成的文件，当前文件.g.dart

@JsonSerializable(explicitToJson: true) // 2.添加注解，告知此类是要生成Model类的
class BannerResponse {
  final List<Banner>? data;
  final int? errorCode;
  final String? errorMsg;

  BannerResponse(this.data, this.errorCode, this.errorMsg);

  // 3、_${类名}FromJson(json) json转对象固定写法
  factory BannerResponse.fromJson(Map<String, dynamic> json) => _$BannerResponseFromJson(json);

  // 4、_${类名}ToJson(json)  对象转json固定写法 }
  Map<String, dynamic> toJson() => _$BannerResponseToJson(this);
}

@JsonSerializable()
class Banner {
  @JsonKey(name: 'id') // 使用此注解可以对变量进行重命名
  final int bid;
  final String desc;
  final String imagePath;
  final int isVisible;
  final String title;
  final String url;

  Banner(this.bid, this.desc, this.imagePath, this.isVisible, this.title, this.url);

  factory Banner.fromJson(Map<String, dynamic> json) => _$BannerFromJson(json);

  Map<String, dynamic> toJson() => _$BannerToJson(this);
}
```dart

上述代码，编译器会报错 _XxxFromJson() 和 _XxxToJson() 找不到，没关系，确定拼写没错误，直接执行下述命令生成对应的序列化代码：

```dart
flutter pub run build_runner build --delete-conflicting-outputs

# 后面的--delete-conflicting-outputs是可选的，作用是：
# 自动删除任何现存的，与即将生成的输出文件冲突的文件，然后继续构建过程。
# 这样可以清理由于老版本或不同构建配置造成的遗留文件
```dart

命令执行完，原先的报错就消失了，点进去可以看到动态生成的序列化代码啦：

提下代码中两个容易忽视的要点：

**explicitToJson: true**

BannerResponse 中 **嵌套** Banner，不添加此设置，data会赋值一个 **引用类型**，而不是 **嵌套类的json**，去掉上述代码中的设置。

执行命令重新生成：

**@JsonKey**：对单个类字段定制序列化行为：

* **name**: 指定Dart字段隐射到Json对象中的键名，如：@JsonKey(name: 'id') final int bid;
* **ignore**：忽略此字段，不进行序列化和反序列化，如：@JsonKey(ignore: true)；
* **defaultValue**：反序列化时缺少键或值为null时的默认值，如：@JsonKey(defaultValue: 'anonymous')；
* **includeIfNull**：序列化Json时，如果值为null，是否进行处理，如：@JsonKey(includeIfNull: false) final String? bio; 如果bio为null，它将不会出现在生成的Json中；
* **fromJson** 和 **toJson**：使用自定义函数来处理字段序列化和反序列化的过程，如：@JsonKey(fromJson: _dateTimeFromEpochUs, toJson: _dateTimeToEpochUs) final DateTime timestamp;

#### 2.2.3. 泛型处理

很多时候，接口返回的Json都是有固定格式的，以WanAndroid为例，变化的只有 **data** 部分。这次是Banner，得写个BannerResponse的类，下次是 Article，得写个ArticleResponse的类... 这些XxxResponse 其实只有data的类型是不同的，完全可以使用 **泛型** 来减少减少这种重复劳动。而Dart的类型会在编译时被擦除，需要做一些特殊处理，其中一种方法 **是直接传递类型的toJson()及fromJson()方法**，创建一个泛型Model类：

```dart
// 让生成的fromJson()和toJson()中包含额外的函数参数，用于指明：
// 如何将泛型类型T的数据转换为Json，以及如何将Json转换为T
@JsonSerializable(genericArgumentFactories: true)
class DataResponse<T> {
  final T data;
  final int errorCode;
  final String errorMsg;

  DataResponse({required this.data, required this.errorCode, required this.errorMsg});

  // 使用泛型方法的工厂构造方法来创建一个响应实例
  factory DataResponse.fromJson(
    Map<String, dynamic> json, T Function(dynamic json) fromJsonT) => _$DataResponseFromJson(json, fromJsonT);

  // 使用泛型方法将实例转换为Json
  Map<String, dynamic> toJson(dynamic Function(T value) toJsonT) => _$DataResponseToJson(this, toJsonT);
}

// 如果Data是列表类型用这个
@JsonSerializable(genericArgumentFactories: true)
class ListResponse<T> {
  final List<T> data;
  final int errorCode;
  final String errorMsg;

  ListResponse({required this.data, required this.errorCode, required this.errorMsg});

  // 使用泛型方法的工厂构造方法来创建一个响应实例
  factory ListResponse.fromJson(
    Map<String, dynamic> json, T Function(dynamic json) fromJsonT) => _$ListResponseFromJson(json, fromJsonT);

  // 使用泛型方法将实例转换为Json
  Map<String, dynamic> toJson(dynamic Function(T value) toJsonT) => _$ListResponseToJson(this, toJsonT);
}
```dart

此时就不需要BannerResponse了，直接：

```dart
var respDataList = ListResponse<BannerData>.fromJson(json.decode(resp.toString()), (json) => BannerData.fromJson(json));
print(respDataList.data[0].title);
```dart

运行输出结果如下：

对了，如果觉得每次都要手动执行命令 flutter pub run build_runner 麻烦的话，可以执行下述命令启动一个_watcher_，当你保存更改了带有 json_serializable 注释的类时，它会自动更新相应的 .g.dart 文件：

```dart
flutter packages pub run build_runner watch
```dart

😁 好了，关于 **json_serializable库** 为 **Model类自动生成序列化和反序列化** 的玩法就讲到这，接着说说如何根据后台返回的Json数据直接生成Model类。

### 2.3. Json自动生成Model类

#### 2.3.1. 在线工具

👍 [json2dart_for_json_serializable](https://caijinglong.github.io/json2dart/index_ch.html)，打开站点，把后台返回的Json直接粘贴到左侧输入框，右侧会自动生成对应的Dart Model类：

可选操作：

* 顶部可以选择 json_serializable 的版本，v0.x.x 或 v1.x.x；
* 点击下方 **格式化** 可以对Json进行格式化；
* 支持类名自定义，默认为Enity；
* jsonKey annotation：是否为变量生成 @JsonKey 注解；
* use camelCase：变量名是否使用驼峰命令法，如：字段名-fav_list → 变量名-favList；

使用起来非常简洁方法，类似的转换站点还有 [quicktype](https://app.quicktype.io/)，功能更强大，还支持不同编程语言Model类的生成：

#### 2.3.2. IDEA插件

AS的插件商店搜下 **JsonToDart** 下载安装：

安装后，选定要存放Model类的目录，右键，依次选中：New → Json To Dart：

接着粘贴接口Json，写个类名，点击Generate生成就完事了~

类似的插件还有 **FlutterJsonBeanFactory**，用法大同小异~

#### 2.3.3. 其它工具

* [fluttercandies/JsonToDart](https://github.com/fluttercandies/JsonToDart/)：号称功能最全面的 Json 转换 Dart 的工具，支持 Windows，Mac，Web；
* [flutterchina/json_model](https://github.com/flutterchina/json_model)：一行命令，将Json文件转为Dart model类；

## 3. 路由跳转

在**《二、从 Android ✈ Flutter 的知识迁移》**中提到过，Flutter 中并没有 Activity 和 Fragment 的对应概念，可以利用，**Navigator** (管理路径的工具) 对 **PageRoute** (应用内屏幕和页面的抽象+转换动画&过渡效果) 进行 **压栈(push)** 和 **弹栈(pop)** 操作实现 **页面的跳转**，这个路由可以是任意的 **Widget(组件)** 。

### 3.1. 简单示例

写个点击按钮跳转新路由页的简单例子：

```dart
class _MyHomePageState extends State<MyHomePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ElevatedButton(
          child: const Text('打开新路由页'),
          onPressed: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) {
              return Container(color: Colors.white, alignment: Alignment.center, child: const Text('新路由页'));
            }));
          },
        ),
      ),
    );
  }
}
```dart

运行效果如下：

接着讲讲具体的API细节~

### 3.2. MaterialPageRoute

**PageRoute** 是一个抽象类，很少直接用，一般使用它的子类 **MaterialPageRoute**，material库提供的组件，针对不同的平台，实现与平台页面切换动画风格一致的路由切换动画。该类构造方法中各个参数的意义如下：

* **builder**： **WidgetBuilder**类型的回调参数，用于构建路由页面内容，当导航到路由时，该回调被执行，构建并返回一个新的Widget；
* **settings**：**RouteSettings**，包含路由的配置信息，如：路由名称；
* **maintainState**：默认为true，即入栈了一个新路由，原路由仍然会被保存在内存中。设置为false，则会销路由释放其占用的资源；
* **fullscreenDialog**：默认为true，表示新路由页是否是一个全屏模态对话框；

### 3.3. Navigator

**路由管理组件**，通过一个 **栈来管理活动路由集合**，它提供了一系列管理路由栈的方法，先说下最常用的两个：

* **push** (context, route)：路由入栈，返回值是一个Future对象，用于接收新路由出栈 (关闭) 时的返回数据；
* **pop** (context,[result])：栈顶路由出栈，result为可选值，页面关闭时返回给上一个页面的数据；

然后，是两个偶尔有用的方法：

* **Navigator.replace** (context, oldRoute, new Rounte)：替换当前路由而不是跳转新页面；
* **Navigator.removeRoute(context, route)** ：移除路由；

再然后，下面这两种调用方法功能是一样的，喜欢用哪种都可以 (我更喜欢第二种~)：

* **Navigator.push** (BuildContext context, Route route) → 静态方法调用，隐藏了查找Navigator的过程；
* **Navigator.of(context).push**(Route route) → 实例方法调用，通过给定的BuildContext查找树上最近的Navigator状态，然后在得到的NavigatorState实例上调用push()方法。

最后，顺带提一嘴 **路由传值：**

* **push (旧 → 新)** ：新路由类定义一个传递数据的变量，在调用 **构造方法** 实例化路由时传参；
* **pop(新 → 旧)** ：**设值** pop(context, 返回值)，**拿值** final result = await Navigator.push()；

### 3.4. 命名路由

Flutter支持通过 **路由名** 来管理导航，即：给路由指定一个名字，然后可以通过名字来进行页面跳转。这种 **路由名称** 与 **页面构建逻辑** 关联的方式，比起匿名路由直接传递 WidgetBuilder函数 更为清晰和可维护。

#### 3.4.1. 定义路由

需要为 **MaterialApp** 的 **routes** 参数提供一个 **路由表**，保存 **路由名** 和 **WidgetBuilder函数** 的 **映射关系**，代码示例如下：

```dart
MaterialApp(
  // ...
  routes: {
    '/': (context) => HomeScreen(),
    '/about': (context) => AboutScreen(),
  },
);
```dart

#### 3.4.2. 导航到路由

```dart
Navigator.pushNamed(context, '/about');
```dart

#### 3.4.3. 传递参数

如果需要传递参数的话，可以添加一个 **arguments** 的参数，传递和获取参数 的代码示例如下：

```dart
Navigator.pushNamed(
  context,
  "/second",
  arguments: YourObjectHere(),
);

class SecondScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context).settings.arguments;

    return Scaffold(
      appBar: AppBar(
        title: Text('第二个屏幕'),
      ),
      body: Center(
        // 使用参数
        child: Text(args.toString()),
      ),
    );
  }
}
```dart

#### 3.4.4. 动态生成路由

有时可能需要在运行时根据某些条件或参数动态生成路由，此时可以使用 **onGenerateRoute**，当 **指定的路由名没有在路由表中注册**，会调用此方法来生成路由。使用代码示例如下：

代码示例如下：

```dart
MaterialApp(
  // ...
  onGenerateRoute: (settings) {
    if (settings.name == '/second') {
      final String args = settings.arguments;
      return MaterialPageRoute(
        builder: (context) => SecondPage(data: args),
      );
    }
    // 定义其他路由生成规则...
  },
);
```dart

## 4. 数据共享

 实际开发场景中，有时需要 **全局共享一些属性** 或实现 **跨组件间的数据传递**。

### 4.1. 顶层属性 & 静态属性

前者很好解决，使用这两个中的一个就能解决：

* **顶层属性**：定义在所有类之外，在Dart文件的顶层作用域中；
* **静态属性**：绑定一个类，只能通过类名访问，不依赖类的实例；

这两种属性都是 **惰性加载，** 不会在程序加载时立即初始化 (**const修饰的变量**除外，它们会在编译时就确定并初始化)，而是在 **首次调用时才初始化**，并且将 **在整个应用程序的生命周期内存活**。简单使用代码示例如下：

```dart
// 顶层属性，记录饭馆的总服务次数
int totalServeCount = 0;

// 顶层方法，每次服务一个顾客时，服务次数就增加
void serveCustomer() {
  totalServeCount++;
  print('服务了一个顾客。现在一共服务了$totalServeCount 个顾客。');
}

// 厨师类
class Chef {
  // 静态属性，记录厨师做了多少道菜
  static int dishesCooked = 0;

  // 静态方法，每次厨师做完一道菜，这个数字就增加
  static void cookDish() {
    dishesCooked++;
    print('厨师做了一道菜。到现在一共做了$dishesCooked 道菜。');
  }
}

// 主函数
void main() {
  // 使用顶层方法服务顾客
  print('欢迎来到饭馆!');
  serveCustomer(); // 输出：服务了一个顾客。现在一共服务了1个顾客。
  serveCustomer(); // 输出：服务了一个顾客。现在一共服务了2个顾客。

  // 让厨师做菜
  print('让我们的厨师开始工作吧！');
  Chef.cookDish(); // 输出：厨师做了一道菜。到现在一共做了1道菜。
  Chef.cookDish(); // 输出：厨师做了一道菜。到现在一共做了2道菜。
}
```dart

### 4.2. EventBus (事件总线)

在原生Android里，有时需要横跨几个Activity传递数据，一层层传，写起来非常繁琐，一种简单的解法是引入：基于 **订阅者模式的EventBus(事件总线)** ，核心原理就：**单例** + **Map<事件Key，订阅者列表>** + **列表遍历**，一个简单的实现代码示例如下（代码来源：[《Flutter实战·第二版》](https://book.flutterchina.club/chapter8/eventbus.html)）：

```dart
//订阅者回调签名
typedef void EventCallback(arg);

class EventBus {
  //私有构造函数
  EventBus._internal();

  //保存单例
  static EventBus _singleton = EventBus._internal();

  //工厂构造函数
  factory EventBus()=> _singleton;

  //保存事件订阅者队列，key:事件名(id)，value: 对应事件的订阅者队列
  final _emap = Map<Object, List<EventCallback>?>();

  //添加订阅者
  void on(eventName, EventCallback f) {
    _emap[eventName] ??=  <EventCallback>[];
    _emap[eventName]!.add(f);
  }

  //移除订阅者
  void off(eventName, [EventCallback? f]) {
    var list = _emap[eventName];
    if (eventName == null || list == null) return;
    if (f == null) {
      _emap[eventName] = null;
    } else {
      list.remove(f);
    }
  }

  //触发事件，事件触发后该事件所有订阅者会被调用
  void emit(eventName, [arg]) {
    var list = _emap[eventName];
    if (list == null) return;
    int len = list.length - 1;
    //反向遍历，防止订阅者在回调中移除自身带来的下标错位
    for (var i = len; i > -1; --i) {
      list[i](arg);
    }
  }
}

//定义一个top-level（全局）变量，页面引入该文件后可以直接使用bus
var bus = EventBus();
//页面A中，监听登录事件
bus.on("login", (arg) {
  // do something
});

//登录页B中，登录成功后触发登录事件，页面A中订阅者会被调用
bus.emit("login", userInfo);
```dart

也可以用 **dart:async** 里的 **Stream(流**) 来实现：

```dart
import 'dart:async';

class EventBus {
  // 使用多订阅流的形式，这种流可以有多个监听器监听（
  final _streamController = StreamController.broadcast();

  // 定义一个单例
  static final EventBus _instance = EventBus._internal();

  factory EventBus() {
    return _instance;
  }

  EventBus._internal();

  // 发布事件
  void fire(event) {
    _streamController.add(event);
  }

  // 订阅事件
  StreamSubscription on<T>(void Function(T) onData) {
    return _streamController.stream.where((event) => event is T).listen(onData);
  }
}

// 调用处：
var eventBus = EventBus();
// 发布一个事件
eventBus.fire(UserLoggedInEvent('Alice'));
// 在其他地方订阅这个事件：
StreamSubscription subscription = eventBus.on<UserLoggedInEvent>((event) {
  print('User logged in: ${event.username}');
});
//在合适的地方取消订阅
subscription.cancel();
```dart

当然，懒得自己写，可以用第三方库 [event_bus](https://pub.dev/packages/event_bus)，直接执行 **flutter pub add event_bus** 添加依赖，具体使用代码示例如下：

```dart
// 自定义事件
class UserLoggedInEvent {
  String username;

  UserLoggedInEvent(this.username);
}

// 1、创建EventBus实例
import 'package:event_bus/event_bus.dart';

EventBus eventBus = EventBus();

// 发布事件
eventBus.fire(UserLoggedInEvent('Alice'));

StreamSubscription loginSubscription;

@override
void initState() {
  super.initState();
  // 订阅事件
  loginSubscription = eventBus.on<UserLoggedInEvent>().listen((event) {
    // Do something with event.
  });
}

@override
void dispose() {
  // 一般在StatefulWidget的dispose()中调用取消订阅的方法
  loginSubscription?.cancel();
  super.dispose();
}
```dart

🐶 用哪个EventBus都可以，但切记别忘了在合适的时候 **取消订阅**，以避免引起内存泄漏~

### 4.3. 状态共享-Provider

**状态 (State)** 可以理解为应用的当前情况或配置，它包含了用于可能与之交互的所有信息，**状态管理** 就是对这些状态的变化进行管理，以确保用户界面(UI) 能够适时地反映出这些变化。Flutter中的状态管理一般分为两类：

* **局部状态**：**与单一Widget相关的状态**，通常情况下无需与应用中的其它部分分享，如：一个CheckBox是否勾选就是一个局部状态，可以通过 **StatefulWidget** 和 它的 **State对象** 来管理。
* **全局状态**：**跨多个Widget或整个应用共享的状态**，如：用户登录信息，需要在多个屏幕上进行访问和修改。Flutter社区提供了多种状态管理解决方案，如Provider，Riverpod，Bloc，Redux，GetX等。

😁 觉得郭佬这句总结一针见血，贴一下：

> 本质上 Flutter 里的 **状态管理** 就是 **传递状态** 和 **基于setState()** 的 **封装**，**状态管理框架** 解决的是 **如何更优雅地共享状态和调用 setState**。

官方推荐使用 **Provider** 来实现状态共享，底层是对 **InheritedWidget(数据发生改变时，可以自动更新依赖的子孙组件)** 的封装与改进，使其更易于使用，再往下共享状态的同时，可以通过 ChangeNotifier 、 Stream 、Future 配合 Consumer 组合出多样的更新模式。🐶 先不探究具体的代码实现，后面会有章节专门研究，这里知道怎么用就好~

#### 4.3.1. 添加依赖

直接执行 **flutter pub add provider**

#### 4.3.2. 创建Model类继承ChangeNotifier

```dart
import 'package:flutter/foundation.dart';

// 继承 ChangeNotifier
class Counter with ChangeNotifier {
  int _count = 0;

  int get count => _count;

  void increment() {
    _count++;
    notifyListeners();	// 通知观察者更新
  }

  void decrement() {
    _count--;
    notifyListeners();
  }
}
```dart

#### 4.3.3. 使用ChangeNotifierProvider实例化Model

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (context) => Counter(),
      child: MyApp(),
    ),
  );
}
```dart

#### 4.3.4. 访问和监听状态变化

在UI中，可以使用 **Consumer组件** 或 **Provider.of()** 来访问Counter实例：

```dart
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: Text('Provider Example'),
        ),
        body: Center(
          // 使用Consumer组件来监听Counter的对象变化
          child: Consumer<Counter>(
            builder: (context, counter, child) => Text('Value: ${counter.count}'),
          ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () {
            // 访问实例的increment()方法
            Provider.of<Counter>(context, listen: false).increment();
          },
          child: Icon(Icons.add),
        ),
      ),
    );
  }
}
```dart

以上是监听单个状态变化的写法，如果想同时监听多个，可以使用 MultiProvider 来实现~

🐶 对了，提一嘴 **不用EventBus实现跨组件状态共享** 原因：

> **不好用**！需要显示定义各种事件，不好管理，需要显式注册状态改变回调，而且需要在组件销毁时手动解绑，避免内存泄露问题。

## 5. 配置选项

App中有些需要保存一些配置选项，如账号密码、Token、设置状态等，在原生Android中常常用**SharedPreference** 来保存，Flutter 社区有也有类似的库 **shared_preferences**，执行 **flutter pub add shared_preferences** 添加依赖 **，** 使用代码示例如下：

```dart
import 'package:shared_preferences/shared_preferences.dart';

// 1、创建SharedPreferences实例
SharedPreferences prefs = await SharedPreferences.getInstance();

// 2、存储数据
await prefs.setInt('counter', counter); // 存储整数
await prefs.setBool('repeat', true); // 存储布尔值
await prefs.setDouble('decimal', 1.5); // 存储浮点数
await prefs.setString('userEmail', 'user@example.com'); // 存储字符串
await prefs.setStringList('nameList', ['John', 'Doe']); // 存储字符串列表

// 3、读取数据
int counter = prefs.getInt('counter') ?? 0; // 获取整数，如果不存在则返回0
bool repeat = prefs.getBool('repeat') ?? false; // 获取布尔值，不存在则返回false
double decimal = prefs.getDouble('decimal') ?? 0.0; // 获取浮点数，不存在则返回0.0
String userEmail = prefs.getString('userEmail') ?? ''; // 获取字符串，不存在则返回空字符串
List<String> nameList = prefs.getStringList('nameList') ?? []; // 获取字符串列表，不存在则返回空列表

// 4、移除数据
await prefs.remove('counter'); // 移除'counter'键及其值

// 5、检查key是否存在
bool hasKey = prefs.containsKey('counter'); // 检查'counter'键是否存在

// 6、清空数据
await prefs.clear();
```dart

shared_preferences 的使用场景：**轻量级数据**，**简单键值对**，**不频繁读写** 的存储场景。如果是 **复杂数据结构**、**大量数据**、**复杂查询**、**频繁读写** 的存储场景 就要考虑数据库啦~

## 6. 图片缓存

Flutter中可以使用 **Image.network()** 来加载网络图片，但是图片是不会缓存的，下次请求同样的图片还是需要下载一遍。Android原生开发一般会用 **Glide** 或 **Fresco** 开源库来实现图片加载，Flutter社区中也有类似功能的开源库，这里介绍下其中比较流行的库 [cached_network_image](https://github.com/Baseflow/flutter_cached_network_image)。

执行 **flutter pub add cached_network_image** 添加依赖，使用代码示例如下：

```dart
import 'package:cached_network_image/cached_network_image.dart';

// 使用 CachedNetworkImage 组件来展示一个网络图片，它会自动处理缓存机制
CachedNetworkImage(
  // 图片URL
  imageUrl: "http://via.placeholder.com/350x150",

  // 图片加载过程的占位Widget
  placeholder: (context, url) => CircularProgressIndicator(),

  // 图片加载出错时显示的Widget
  errorWidget: (context, url, error) => Icon(Icons.error),
),
```dart

还支持 **图片加载进度获取**、**设置显示图片的Widget**、**图片缩放**、**自定义缓存行为** 等设置，具体看官方文档吧~

## 7. WebView

😀 WanAndroid接口很大部分是返回文章的URL，点击 **跳转手机浏览器** 去阅读文章显然不太合理，而Flutter内置的库并没有浏览器组件，那就需要用到第三方库了，比较流行的WebView库：[flutter_inappwebview](https://github.com/pichillilorenzo/flutter_inappwebview)，执行 **pub add flutter_inappwebview** 添加依赖，然后用里面的 **InAppWebView** 组件就好啦，使用代码示例如下：

```dart
InAppWebViewController _webViewController;

InAppWebView(
  // 加载请求
  initialUrlRequest: URLRequest(url: Uri.parse("https://flutter.dev")),

  // 配置选项
	initialOptions: InAppWebViewGroupOptions(
    crossPlatform: InAppWebViewOptions(
      debuggingEnabled: true,
      ),
  ),

  // 浏览器创建后调用
  onWebViewCreated: (InAppWebViewController controller) {
  	_webViewController = controller;	// 可以保存WebViewController以便后面使用
  },

  // 当网页开始加载时调用
  onLoadStart: (controller, url) { },

  // 当网页加载停止时调用
  onLoadStop: (controller, url) { },

  // 权限请求
  onPermissionRequest: (controller, permissionRequest) async {
    return PermissionRequestResponse(
        permission: permissionRequest.permission,
        resources: permissionRequest.resources,
        action: PermissionRequestResponseAction.GRANT);
  },

  // 稍后执行 JavaScript
	_webViewController?.evaluateJavascript(source: "javascriptFunction();");

  // 处理来自 JS 的消息
  _webViewController?.addJavaScriptHandler(handlerName: 'handlerFoo', callback: (args) {
    // 对消息进行处理
  });

);
```dart

 感觉这个实战项目，非UI部分的东西就这些了吧，开发中途不够用再来补吧，下节带着兄弟们来 **堆UI页面**，敬请期待~

**参考文献**：

* [《GSY：Flutter完整开发实战详解》](https://guoshuyu.cn/home/wx/Z2.html)
* [杜文《Flutter实战·第二版》](https://book.flutterchina.club/)