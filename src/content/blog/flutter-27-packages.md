---
title: "Flutter入门到精通（二十七）：玩转Flutter库与插件"
pubDate: 2024-01-28
description: "Flutter包和插件开发指南，pub.dev发布流程、平台通道等。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: '/images/flutter-cover.png'
---

> 本文是Flutter系统学习系列的第二十七篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

 公司项目上个版本做的「Flutter重构数据表单录入模块」已经完结，又可以摸🐟，小组成员讨论着要补一补 **Flutter基建**，如：标准化UI组件、网络请求、图片选择/查看/处理/上传、地图、webView等。🐶 网络请求我之前就封装过了，CV下跑通就好，然后是 **图片选择上传**，现在是有做的，直接走的MethodChannel，然后写了三个 **MethodCall**，**await** 调完一个调下一个。对于这一块，我的建议是：前两个都抽取成独立的 **Flutter插件**，不用强侵入原生项目，而且可以 **复用**。

但组员可能不太了解Flutter插件，有点 **畏难情绪**，问出了诸如：怎么抽？怎么传私有仓库啥的问题。🤷‍♀️ em... 这也不是啥 **新和高深** 的东西，网上资料也挺多，个人觉得，折腾下顺带学下新东西挺好的，而 **不要老沉浸在搭Widget中**。本节就来讲讲 **Flutter** 中的 **库 & 插件** 的知识点，相信学完的你会这样说道：

## 2. 库 VS 插件

它俩是 **Flutter** 中的常见概念，都用于扩展程序的功能，在 **实现和用途** 上有些区别。先是「**库**」：

**纯Dart代码编写的包**，不依赖平台特定功能，所以不包含平台特定代码，用于提供 **通用功能和工具** (如：数据处理、UI组件等)，比如用于状态管理的 **provider** 就是一个库。

然后是「**插件**」：

**包含Dart代码 + 平台特定代码的包** (Java/Kotlin→Android、Swift/Objective-C→iOS)，**允许Flutter应用调用原生平台的功能** (如：相机、传感器等)，比如在Flutter应用中打开相机的 **camera** 就是一个插件。

😄 其实，这两者都可以统称为库，**插件** 是 **包含平台特定代码** 的库，**普通库** 则是 **纯Dart代码** 编写的库。

💡 插件如果细分下还有一种 **FFI插件**，通过 **Dart FFI** 直接调用 **本地(Native)代码**，如 C、C++、Rust等，而无需通过平台通道，通常用于需要 **高性能或特定功能** 的场景，🤷‍♀️ 目前还没涉及，暂且不讲~

## 3. 通过具体的库来发现差异

在调研**Flutter图片压缩库** 时，刚好发现了两种不同的实现方式 [flutter_image_compress 插件](https://pub.dev/packages/flutter_image_compress) 和 [image库](https://pub.dev/packages/image)。简单看下代码，先是前者，直接定位到Android端实现 → **ImageCompressPlugin.kt**：

😁 还是走的 **MethodChannel** 啊，😏 然后不需要 **手动注册插件**，**FlutterActivity** 配置 Flutter Engine 时会调用 **configureFlutterEngine()** ：

点开 **registerGeneratedPlugins()** ：

🤔 就反射调 **GeneratedPluginRegistrant#registerWith()** ，这个类由 **Flutter工具** 在构建时 **自动生成**，包含所有插件的注册代码，以的项目为例，注册了下面这些插件：

😄 可以看到每个插件都会在 **registerWith()** 中注册，以便它们可以监听来自Dart的调用并通过PlatformChannel与原生代码进行交互。看下 **dart端** 实现，搜下 channel名称 **'flutter_image_compress'** ，过滤下 dart 文件：

😄 不变的配方，通过 **MethodChannel#invokeMethod()** 调用平台方法。接着看下 **image** 这个 **纯Dart库** 又是怎么做的。**图像压缩** 是 **计算密集型任务**，需要大量的CPU资源，在前面的 **《八、进阶-异步编程速通》**中提到过：

 为了不堵塞 **主isolate** 导致 UI 卡死，需要把任务丢到 **新的isolate** 中运行。Dart 中通过 **Isolate.spawn()或 Isolate.spawnUri()** 创建其它 isolate。搜下 **Isolate.spawn(** 在哪里用到，以及调用的流程：

😳 em... 果然是把 **处理图片的任务** 丢到 **新isoldate** 中，然后看它的 **issues**，很多人提到它的 **慢(slow)** ，特别是 **同时压缩多张图片**，就更慢了。🤔 为什么呢？这跟 **Flutter 线程模型** 有关，还是前面写的**《八、进阶-异步编程速通》**：

「**Flutter Engine**」并不创建和管理线程，而是抽象出「**Task Runner**」的概念，由对应的「**平台层**」来实现「**四个主要的Task Runner**」与「**对应系统线程的关联**」。**Task Runner** 用于 **任务的调度和管理**，如任务的优先级和执行顺序，确保任务在正确的线程上执行等。「**isolate(隔离)** 」则是Dart并发编程的执行单元，每个 isolate 拥有自己的 **内存空间 (堆栈)** 和 **单线程控制的运行实体 (保证代码顺序执行 → 消息队列+事件循环)** ，没有 **共享内存的并发**，无需在isolate内部管理 **同步和锁问题**，由此简化了并发模型。isolate 间只能通过 **消息传递(Port端口)** 进行通信，所以Dart中的消息传递总是 **异步** 的，可以看作「**轻量级的进程**」，Dart 本身抽象了**isolate** 和 **thread**，实际底层还是使用平台操作系统提供的 OS Thread。当 **Dart VM** 创建一个 isolate 时，底层会为其分配一个 **OS Thread** (新建或复用)。

😄 综上，个人猜测，慢的主要原因：

**isolate 启动开销** (独立内存空间，分配OS Thread、任务调度)、**数据传递开销** (需要序列化和反序列化)。

💁‍♂️ 行吧，关于这两个 **图片压缩-插件&库** 核心实现机制还是挺好懂的，总结下：

**插件**：本质上还是走的 **MethodChannel** 进行通信，平台端配置 **Flutter Engine** 时会 **自动注册插件**。**库**：**计算(CPU)密集型任务** 丢 **isolate** 里执行。

## 4. 包管理 & 构建工具

😐 说到 **插件/库**，自然涉及到 **包管理** & **代码自动生成**，网上关于这方面的资料比较零散，索性系统讲讲~

### 4.1. pub-包管理工具

类似于 **JavaScript** 的 **npm**、**Python** 的 **pip**，用于管理项目的 **依赖包**，对应 **配置文件**-**pubspec.yaml**，通常包含以下内容：

* **name**: 项目名称。
* **description**: 项目描述。
* **version**: 项目版本，如 1.0.0+1，**版本名 + 版本号**。
* **publish_to**: 默认为none，指定项目不发布到 pub.dev。
* **environment**: 项目所需的 Dart SDK 版本。
* **dependencies**: 项目运行所需依赖包，可以 **写死版本号** 或使用 **^** 表示 **兼容非重大版本更新** (如：cupertino_icons: ^1.0.2，可以 **自动升级** 到1.x.x的最新版本，但不会升级到 2.0.0)。
* **dev_dependencies**: 开发时使用的依赖包。
* **flutter**: Flutter 项目特有配置，如：uses-material-design (是否使用Material Design)、assets (项目中使用的资源文件，如图片和图标)、fonts (自定义字体配置) 等。

然后项目里还会有一个自动生成的 **pubspec.lock** 文件，作用如下：

* **锁定依赖版本**：确保每次构建项目时使用的依赖版本一致，避免由于依赖版本变化导致的构建问题。
* **记录依赖信息**：详细记录项目中所有依赖包的版本信息，包括直接依赖和间接依赖。

当你运行 **flutter pub get** 或 **dart pub get** 时，pub工具会根据 **pubspec.yaml** 文件中的依赖声明解析并下载依赖包，并将具体的版本信息记录在 **pubspec.lock** 文件中。运行 **flutter pub upgrade** 或 **dart pub upgrade** 时，pub工具会尝试更新依赖包到最新的兼容版本，并更新 **pubspec.lock** 文件。

😄 然后是可能会遇到的 **版本冲突** 问题，如：两个依赖包同时依赖了不同版本的同一个三方包。如果包作者在指定依赖项时使用 **版本范围** 而 **非特定版本**，**pub** 一般是能自动解决冲突问题的。但是，如果包声明了 不兼容的版本(如: 5.x.x 和 6.x.x)，可以在 **pubspec.yaml** 中通过 **dependency_overrides** 覆盖声明来 **强制使用特定版本**。

```dart
dependency_overrides:
  provider: ^6.0.0
```

对于 **特定平台库** 的冲突处理则需要遵循 **对应平台的构建系统的规则** 来更改，如 **Android端** 需要在 **android/build.gradle** 中通过 **resolutionStrategy** 强制指定版本，示例如下：

```dart
configurations.all {
    resolutionStrategy {
        force 'com.google.guava:guava:28.0-android'
    }
}
```

### 4.2. build-构建工具

用于处理 **代码生成、资源打包** 等任务，对应 **构建器(builders)配置文件-build.yaml**，文件结构如下：

```dart
targets:
  $default:
    builders:
      <builder_name>:
        options:
          <option_key>: <option_value>
```

* **targets**: 定义构建目标，通常使用 $default 作为默认目标。
* **builders**: 列出要使用的构建器。
* **`<builder_name>`** : 构建器的名称。
* **options**: 构建器的配置选项。

以 **json_serializable** 构建器为例：

```dart
targets:
  $default:
    builders:
      json_serializable:
        options:
          explicit_to_json: true  # toJson()时将嵌套的对象也转换为Map类型而非引用
          include_if_null: false  # toJson()时忽略值为null的字段
```

通过 **flutter pub run build_runner build** (或 **watch监听文件变化**) 命令来执行构建任务。

## 5. 写下例子🌰

😊 照惯例，先上 **官方文档**[《Developing packages & plugins》](https://docs.flutter.dev/packages-and-plugins/developing-packages)和 **官方插件代码仓库** [flutter/plugins](https://github.com/flutter/plugins)。

### 5.1. Toast 插件

执行下述命令创建一个 **带模板的插件项目**：

```dart
flutter create --template=plugin --platforms=android,ios cp_toast_plugin
```

打开后可以看到项目结构和普通Flutter项目基本一样：

默认实现了一个 **MethodCall** - **getPlatformVersion** 的处理逻辑，接着看下 **Dart** 端实现，**lib** 下有三个文件：

一一点开看看：

继承 **CpToastPluginPlatform**，初始化了一个 **MethodChannel** 实例，重写 **getPlatformVersion()** 来进行方法调用。

继承 **PlatformInterface** 抽象类，这样搞的主要意义 → **插件跨平台实现符合一定的规范和约定**，关键点：

* **统一接口**：不同平台间保持一致性，简化插件的使用与维护，定义抽象方法 (如getPlatformVersion()) 强制字类必须实现，确保所有平台实现类都提供了必要的功能。
* **实例验证**：提供了一个 **token** 机制用于验证平台实例的合法性，表现为通过构造函数传递，确保只有合法的平台实例才能被设置为当前平台实例。
* **动态替换**：静态属性 **_instance**，提供 **默认实现** (如MethodChannelCpToastPlugin)，还提供了getter和setter方便在运行时进行动态替换。

😄 **非强制**，只是 **推荐实现**，然后是：

调用处：

非常明了，然后 pubspec.yaml 中还需要定义下 Flutter 插件的跨平台支持：

😁 捋清楚了，接着参考 **getPlatformVersion()** 加一个 **showToast()** ，先改 **Dart** 端，依次加上：

然后是 **Android** 端，直接弹Toast，前面说过插件是 **会自动注册** 的，不需要额外的配置：

运行看看效果：

### 5.2. 自动生成toStr()代码的库

执行下述命令创建一个 **带模板的Dart库**：

```dart
dart create -t package-simple to_string_generator
```

打开看下项目结构：

吼，只有一个 **lib** 目录，没有android、ios那些了，看看文件内容：

模板非常简单，接着我们想搞下 **编译时代码生成**，就添加一个 **ToStr** 的注解，自动生成一个 **打印类属性** 的方法 **toStr()** ，需要用到 **source_gen** 库，通过它来 **分析和生成Dart代码**，通常配合 **build** 一起使用。

① **pubspec.yaml** 添加下依赖：

```yaml
dependencies:
  source_gen: ^1.5.0
  analyzer: ^6.2.0
  build: ^2.4.1

dev_dependencies:
  build_runner: ^2.4.7
```

① 定义下 **注解类**，用于标记需要生成 toString() 方法的类：

```dart
// 文件: lib/src/to_string_annotation.dart
class ToStr {
  const ToStr();
}
```

② 创建 **生成器类**，继承 **GeneratorForAnnotation**，并重写 **generateForAnnotatedElement**()：

```dart
import 'package:analyzer/dart/element/element.dart';
import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';

// 导入自定义注解类
import 'to_string_annotation.dart';

// 定义 ToStringGenerator 类继承 GeneratorForAnnotation<T>，用于为具有 @ToStr 注解的类生成 ToStr()。

class ToStrGenerator extends GeneratorForAnnotation<ToStr> {
  // 重写 generateForAnnotatedElement() 为每个使用 @ToStr 注解的元素 (本例中为类) 生成代码
  @override
  Future<String> generateForAnnotatedElement(
      Element element, ConstantReader annotation, BuildStep buildStep) async {
    // 检查传递的元素是否为 ClassElement（一个类）。如果不是，抛出异常。
    if (element is! ClassElement) {
      throw InvalidGenerationSourceError(
          '`@ToStr()` can only be defined on classes.',
          element: element);
    }

    // 将 element 强制转换为 ClassElement 类型，以便访问类特有的属性和方法。
    final classElement = element;
    final className = classElement.name;

    // 构建包含所有字段名称和对应值的字符串表示。
    // 遍历 classElement 的 fields，每个字段都生成 '${field.name}: $${field.name}' 的形式，
    // 然后使用 join 方法将它们连接成单一字符串，字段之间用逗号和空格分隔。
    String fieldsString = classElement.fields.map((field) {
      return '${field.name}: $${field.name}';
    }).join(', ');

    // 返回一个包含新生成的 toStr() 字符串的扩展方法，返回类名和所有字段的值。
    return '''
import '${classElement.source.uri.pathSegments.last}';

extension ${className}ToStr on $className {
  String toStr() {
    return '$className { $fieldsString }';
  }
}
    ''';
  }
}
```

③ 创建触发器的 **Builder**：

```dart
// file: lib/src/to_string_builder.dart
import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';
import 'to_string_generator.dart';

Builder toStrBuilder(BuilderOptions options) =>
    LibraryBuilder(ToStrGenerator());
```

④ 配置 **build.yaml**

没有此文件的话，直接新建一个，对 **生成器** 做下 **配置**：

```dart
builders:
  # 构造器名称
  to_string_generator:
    # 构建器的导入路径(dart文件)
    import: "package:to_string_generator/src/to_string_builder.dart"

    # 构建器工厂函数的名称列表
    builder_factories: ["toStrBuilder"]

```

    # 指定输入和输出文件扩展名映射关系

```dart
    build_extensions: {".dart": [".g.dart"]}

    # 构建器自定应用的范围：none(不自动应用)、dependents(依赖包)、root_package(当前包)、all_packages(所有包)
    auto_apply: all_packages

    # 构建输出的位置：source(源码目录)、cache(缓存目录)、local(本地目录)
    build_to: source

    # 应用的其它构建器列表
    applies_builders: ["source_gen"]
```

接着在保重随便建一个文件，如：

接着执行 **dart run build_runner build** 运行生成器，然后可以看到生成的代码：

😄 到此，我们就完成了一个 **编译时动态代码** 生成的🌰啦，想更深入了解这方面的知识，可以参考：

* **《闲鱼技术：详解Dart中如何通过注解生成代码》**
* **《Flutter 注解处理及代码生成》**
* **《Flutter 代码生成 source_gen 使用与原理分析》**

最后，我们来看看包的创建与发布~

## 6. 其它

我们平时的 **依赖方式** 都是依赖的Google官方 [Pub仓库](https://pub.dev/)，可以在上面查找需要的库，也可以发布自己的库。如何发布pub.dev可以参考：[《官方文档：Publishing packages》](https://dart.dev/tools/pub/publishing)还有视频讲解，非常细了。**私服** 搭建一般用的 [pub_server](https://github.com/dart-archive/pub_server) 或 [unpub](https://github.com/pd4d10/unpub)，有搭建需要的可以参考：**《Flutter 搭建私有 Pub 仓库 Docker 部署》**。提下另外两种常见的依赖方式：**本地包** & **Git**，示例如下：

```yaml
# 依赖本地包
dependencies:
  to_string_generator:
    path: ../to_string_generator

# 依赖Git
# ① 包位于Git仓库的根目录
dependencies:
  to_string_generator:
    git: git://github.com/配套示例源码.git

# ② 不是根目录，通过path参数指定位置
dependencies:
  to_string_generator:
    git: git://github.com/配套示例源码.git
    path: packages/to_string_generator
```

更多依赖方式可自行参阅：[《官方文档：Package dependencies》](https://dart.dev/tools/pub/dependencies)

## 7. 小结

本节我们系统了解了一下Flutter中 **库 & 插件** 的相关知识点，先是概念层面对两者进行区分，然后通过两个具体的图片压缩库来提现两者的差异。接着讲了下 **pub包管理工具** & **build构建工具** 的相关使用，再接着分别写了两个例子：**Toast 插件** & **自动生成toStr()代码的库**，最后一笔带过：**如何发布到pub**、**私服**、**另外两种常见的依赖方式** (**本地包 & git**)。相信学完的读者回头看 **Flutter 库 & 插件** 会是这样：

🏃 行吧，本节就到这，有问题欢迎评论区交流，谢谢🙏~