---
title: "Flutter入门到精通（一）：Flutter开发初体验"
pubDate: 2024-01-02
description: "从零开始搭建Flutter开发环境，了解Flutter的基本概念、项目结构和第一个Hello World应用。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
---

> 本文是Flutter系统学习系列的第一篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

### 1.1. 学习Flutter的动机

> Flutter出了好些年头了，最早可以追溯到 **2015.6** 的Google I/O大会，会上首次公开介绍了Flutter，不过直到 **2017.5** 才正式发布首个 **Alpha版本**，于 **2018.12** 发布 **1.0版本**。而后Flutter为了尽快推出产品，减少开销、缩短开发周期、提高开发效率，一直在不断地改进和优化。随着 **Flutter 3** 的发布，Flutter已经实现了对6大主要平台的支持 → Android、iOS、Windows、Web、macOS(新增)、Linux(新增)。使用Flutter可以帮助开发者高效便捷地创建出跨平台的精美应用，截至目前 (2023.11) Flutter 在 [Github](https://github.com/flutter/flutter) 上已经获得158k+的Star⭐~

说来惭愧，Flutter出了这么久，却一直没有躬身入局 (🐶**懒**)，一直认为技术那么多，时间就那么点，学是肯定学不完的，要 **取舍**。我的策略就是 **学对自己有用的技术**，外面环境那么差，卷八股和源码意义不大，不如 **专注于当下的工作** 和 **自己感兴趣的东西**，所以今年写的文章大都是围绕着 **提高工作和生活效率** 写一些工具。

最近准备开始系统学下Flutter，得益于：

> **HarmonyOS NEXT** 最大的特点，就是系统底层全线自研，并 **剔除了Linux内核与安卓AOSP代码**，仅支持鸿蒙内核与对应应用。由于没有AOSP代码，HarmonyOS NEXT 只能安装 **Hap格式** 的应用。

而公司APP需要适配鸿蒙系统，年前刚好没啥大活，可以折腾一哈~

不明真相的吃🍉群众可以先看下郭佬的这四篇文章：

* **《鸿蒙终于不套壳了？纯血 HarmonyOS NEXT 即将到来》**
* **《鸿蒙剥离 AOSP 不兼容 Android 热门问题汇总，不吹不黑不吵》**
* **《Harmony 开始支持 Flutter ，聊聊 Harmony 和 Flutter 之间的因果》**
* **《【前端早早聊直播回顾】Harmony Next 与 Flutter 的不解之缘》**

提炼下文章的几个要点：

* Android Apk 无法在 HarmonyOS NEXT上安装运行，没了JVM和AOSP，目前看不到纯原生应用模式直接兼容的可能性。
* 鸿蒙应用使用 **ArkTs(语言)** 和 **ArkUI(框架)** 进行开发，可以通过 [ArkUI-X](https://gitee.com/arkui-x) 扩展ArkUI到多个OS平台，安装到Android系统不在话下。
* 针对 OpenHarmony 的 Flutter 版本已经开源 → [OpenHarmony-SIG / flutter\_flutter](https://gitee.com/openharmony-sig/flutter_flutter)，支持使用flutter tools指令编译和构建OpenHarmony应用程序。

适配鸿蒙的方案其实就两：

* **招人/Android崽自学 → ArkTs和ArkUI**
* **选一个跨平台框架等社区适配** (Flutter、ReactNative、Weex、Taro、uni-app、electron、qt 等)

所以适配方案其实就剩下 **选跨平台框架**，小组讨论后选择了 **Flutter**，考究的点有这些：

* 生态相对成熟一些，前人帮忙踩了不少坑，三方库较多，源码开源不黑盒，出问题好定位；
* 组内之前写过一个Flutter的小项目，团队算是有 **一丢丢的经验**，推起来也没那么费劲；
* Flutter支持**混合开发**，可以在不影响原有原生项目的基础上，进行重构迭代 (aar包集成)；
* 支棱起来后可以减少 **两端的工作量**，等等...

综上，我学Flutter的主要动机就是 **公司APP要适配鸿蒙**，另外自己也整个多端可用的信息流APP耍耍😁~

### 1.2. 个人推荐的学Flutter姿势

🤔个人觉得有Android经验的话，最快上手Flutter的学习方式：**用类比Android的方式来学Flutter**。先撸官方文档[《Flutter for Android developers》](https://docs.flutter.dev/get-started/flutter-for/android-devs)或[《给 Android 开发者的 Flutter 指南》](https://flutter.cn/docs/get-started/flutter-for/android-devs)，利用知识的可迁移，对比Android和Flutter中的差异点进行学习，对Flutter建立一个简单的 **基础认知**。

然后自己捣鼓一个Flutter APP，在开发过程中发现问题，然后带着问题对相关的知识点进行深入学习，等APP开发完了，你的Flutter也入门了~

## 2. Flutter开发环境搭建

照着官方文档[《安装和环境配置》](https://flutter.cn/docs/get-started/install)来就好了，这里顺带记录下我的 **实际搭建过程(Windows)** 及 **一些常见问题**~

> Tips：MAC搭建过程可以移步至：**MacOS Flutter 开发环境搭建**

### 2.1. Flutter环境搭建

#### 2.1.1. 下载Flutter SDK

我配环境时的最新版本 → [flutter\_windows\_3.13.9-stable.zip](https://storage.flutter-io.cn/flutter_infra_release/releases/stable/windows/flutter_windows_3.13.9-stable.zip)，如需过往版本 → [SDK版本列表](https://flutter.cn/docs/release/archive)，把压缩包解压到你想放的目录，比如我把它跟开发相关的IDE放到一起：D:\Coding\flutter。

#### 2.1.2. 更新PATH环境变量

官方文档有这样一段话：

> 自 Flutter 1.19.0 dev 版本开始，Flutter SDK 在 flutter 命令脚本的同级目录下增加了 dart 命令，你可以更方便地运行 Dart 命令行程序，下载 Flutter SDK 时也会下载对应版本的 Dart SDK。Flutter SDK 在 flutter 命令脚本的同级目录下增加了 **dart 命令**，你可以更方便地运行 Dart 命令行程序。

所以只需要把 **Flutter运行文件路径** 添加到 **PATH环境变量** 即可，不用像网上有些文章说的得配两个，当然配了也没啥影响🐶：

环境变量修改保存后，新开一个 **命令行/终端** 键入 **flutter --version** 验证环境变量是否配置成功：

#### 2.1.3. (备选) 替换安装源为国内镜像

如果 **没科学上网**，Flutter下依赖会有点慢，可以顺手 **把安装源替换为国内镜像**，只需 **新增两个环境变量**：

* **PUB\_HOSTED\_URL** → Dart依赖包地址
* **FLUTTER\_STORAGE\_BASE\_URL →** Flutter依赖文件地址

**一些国内镜像地址** (**记得在前面加上https://** )

* **Flutter社区**：pub.flutter-io.cn **&** storage.flutter-io.cn
* **清华大学TUNA协会**：mirrors.tuna.tsinghua.edu.cn/dart-pub **&** mirrors.tuna.tsinghua.edu.cn/flutter
* **CNNIC**：mirrors.cnnic.cn/dart-pub **&** [mirrors.cnnic.cn/flutter](http://mirrors.cnnic.cn/flutter)
* **腾讯云开源镜像站**：mirrors.cloud.tencent.com/dart-pub **&** mirrors.cloud.tencent.com/flutter
* **上海交大Linux用户组**：dart-pub.mirrors.sjtug.sjtu.edu.cn **&** mirrors.sjtug.sjtu.edu.cn

**配置示例如下**：

配置完镜像源，后续flutter编译都会有一个警告，不用理它：

> Flutter assets will be downloaded from [storage.flutter-io.cn](https://storage.flutter-io.cn). Make sure you trust this source!

#### 2.1.4. 运行 flutter doctor

PATH环境变量更新保存后，打开一个新的控制台窗口，键入 **flutter doctor** → 用于 **检查当前系统是否满足安装和运行Flutter开发工具所需的依赖**：

> 看信息 **缺啥装啥**，我的输出结果有两个 ✖，先是第一个 → **cmdline-tools component is missing**：

打开 **Android Studio**，依次打开：Settings → Apperance & Behavior → System Settings → Android SDK → SDK Tools → 找到 **Android SDK Command-line Tools** → 勾选安装

接着解决第二个 → **Android license status unknow**，以管理员权限起一个命令行，键入：**flutter doctor --android-licenses** ，来同意安卓协议，无脑y+回车，直到出现：**All SDK package licenses accepted**

再次输入 **flutter doctor** 检查是否正确配置了所有内容：

到此 Flutter环境就配置好啦，😳 接着选一个自己趁手的IDE(编辑工具)~

#### 2.1.5. (附) 不安装Android Studio 配置Flutter环境

我是搞Android的，预装了Android Studio，体积还挺大，有些读者不想装，可以直接下载配置下 [Command line tools](https://developer.android.google.cn/studio)，选中对应的系统版本：

创建一个类似于这样的目录层级 **D:\Coding\sdk\cmdline-tools\latest\bin**，把解压后的文件全复制到里面去。接着新建 **ANDROID\_HOME** 环境变量，值：**D:\Coding\sdk**，修改 **PATH** 环境变量，新增下述三个路径：

* **%ANDROID\_HOME%\cmdline-tools**
* **%ANDROID\_HOME%\build-tools**
* **%ANDROID\_HOME%\platform-tools**

保存后，新开一个命令输入 **sdkmanager.bat --list** 可以查看都有哪些包及版本：

直接下 **build-tools;30.0.2** + **platform-tools**，命令行键入：**sdkmanager.bat build-tools;30.0.2 platform-tools**，等待安装完成。然后运行 **flutter doctor** 验证，还是 **缺啥装啥** 😄~

接着终端执行 **open ~/.bash\_profile** 新增下述变量：

```dart
export ANDROID_HOME=/Users/pig/android_sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
export PATH=$ANDROID_HOME/build-tools:$PATH
export PATH=$ANDROID_HOME/platform-tools:$PATH
```dart

执行 **source ~/.bash\_profile** 刷新当前命令行窗口，键入 **sdkmanager --list** 可以查看都有哪些包及版本。这里直接下 **build-tools;30.0.2** + **platform-tools + platforms;android-30**，终端键入：**sdkmanager "build-tools;30.0.2" "platform-tools" "platforms;android-30"** ，等待安装完成。

此时再执行 flutter doctor，估计就剩这个错误或警告了：

* **flutter doctor --android-licenses** → 终端键入此命令，回车，一直y回车同意即可；
* **sudo xcodebuild -license** → 终端键入此命令，回车，q，输入 **agree** 回车同意即可；
* **CocoaPods not installed (三方库文件管理工具)** → 终端直接运行 → **sudo gem install cocoapods -V，** 输入密码回车等安装；需要科学上网 (不要用HK的鸡场)，试了下换国内镜像源，不太行，直接报Https错误。

### 2.2. 选个趁手的IDE

Flutter 的常用IDE有两个 [Visual Studio Code](https://code.visualstudio.com/) \*\*\*\*和 \*\*\*\*[Android Studio/IntelliJ IDEA](https://developer.android.google.cn/studio)，用哪个看自己喜欢，这一步就是给原IDE安装两个插件而已：**Flutter** + **Dart**。先是 **Visual Studio Code** ，点击图标 **Extensions** 直接装：

安装完依次：点击View → 点击Command Palette… → 输入doctor → 选择 **Flutter: Run Flutter Doctor**：

运行后看下OUTPUT面板，没错误，说明安装成功。

接着是 **Android Studio**，Plugins → Marketplace 直接搜插件名，安装即可：

### 2.3. 开发初体验

**命令行、Android Studio** 创建Flutter项目时可以 **配置平台**，而 **VS Code中** 不支持配置，默认 **全平台**。依次演示下这三个玩意如何 **新建项目和运行Flutter项目**。

#### 2.3.1. 命令行

打开命令行/终端，cd到想放flutter项目的位置，键入下述命令创建项目（故意写得很复杂）：

```dart
flutter create --project-name hello_flutter --org cn.coderpig --platforms=android,ios --android-language java --ios-language objc hello_flutter
```dart

上述参数解析 (更多参数可以键入 **flutter create --help** 查看更多详细参数 )：

* **--project-name** → **项目名称**，只能由 **小写字母、下划线 和 数字** 组成，不然会报错：xxx is not a valid Dart package name
* **--org** → 项目包名
* **--platforms** → 限定支持的平台，这里限定只支持 android 和 ios
* **--android-language** → 设定安卓端项目语言，可选值：java, kotlin(默认)
* **--ios-language** → 设置iOS端项目语言，可选值：objc, swift(默认)

执行后，可以看到项目创建成功：

因为我们通过 --platforms参数 限定只支持android和ios，所以只有这两个文件夹：

如果想搞桌面端，可以cd到项目中，运行下述命令启用你想支持的平台：

```dart
flutter config --enable-macos-desktop
flutter config --enable-linux-desktop
flutter config --enable-windows-desktop
```dart

接着cd回上级目录，执行：**flutter create 项目名**，再打开项目目录可以看到其它平台也添加了支持：

键入 **flutter devices** 可以查看可供运行的设备：

键入 **flutter run -d 设备名称** 即可在对应的设备上运行程序，比如这里选择的是手机：

接着可以手机看到：这个计数器Demo运行效果，还会生成一个Flutter开发性能和调试工具的URL~

#### 2.3.2. Android Studio

先是 **创建Flutter项目**，打开Android Studio，依次：点击New → 选中New Flutter Project → 选中Flutter → 选择Flutter SDK Path的路径 → Next

输入Flutter项目的配置信息，可以这里是可以选择支持平台的：

创建后静待项目编译完成，接着可以 **选择要运行的设备**，点击 **绿色箭头**(Shirt+F10) 可以直接 **运行项目**~

#### 2.3.3. Visual Studio Code

先是 **创建Flutter项目**，打开Visual Studio Code，依次：点击View → 点击Command Palette… → 输入flutter → 选择 Flutter: New Project，然后选中项目存储路径，输入项目名称，直接创建项目。

可以看到默认生成全平台，接着点击底部状态栏，**选择要运行的设备**：

接着依次：点击Run → Start Debugging 运行程序，也可以直接按 **F5**，等待应用启动，启动进度会在Debug Console 中展示。

#### 2.3.4. 热重载

Flutter支持 **在程序运行的状态下重载代码**，**无需重新启动应用程序**，官网给出一个修改 **lib/main.dart** 中字符串的例子，具体演示如下：**保存修改后**，运行中的应用程序上的字符串也随即刷新：

### 2.4. (附) 安装时的其它问题

欢迎评论区补充~

#### 2.4.1. Android SDK 无法找到

Android SDK安装成功，flutter却无法找到，直接使用下述命令配置Android SDK的绝对路径

```dart
flutter config --android-sdk "D:\Android\Sdk"
```dart

#### 2.4.2. flutter Error: Unable to find git in your PATH

**解法：将flutter sdk目录加入git安全目录**，如：git config --global --add safe.directory C:/src/flutter

#### 2.4.3. A problem was found with...

```dart
A problem was found with the configuration of task':app:processDebugResources' (type 'LinkApplicationAndroidResourcesTask').
```dart

构建版本和SDK版本不一致，flutter doctor -v 查看 Android SDK version，修改项目中的 **build.gradle** 文件里的 **compileSdkVersion** 与其一致。

#### 2.4.4. 运行项目报错：Error:Connection timed out: connect

如图，就是gradle.zip文件下载超时了：

打开项目里 **gradle\wrapper\gradle-wrapper.properties** 查看需要的gradle版本，比如我的7.6.1：

到 **tencent/gradle** 下载对应版本的gradle.zip，下载后放到 **.gradle\wrapper\dists\gradle-xxx-bin\xxxx** 中，比如我的：

然后重新运行就好了。

## 3. 逐行解读Demo里的**main.dart**

当初刚学C语言的时候，老师就让我们一行行品Hello world，弄懂每行代码的作用，还挺有意思，所以这里简单过下官方Demo，不难看出核心文件 → **lib/main.dart** → 应用程序的 **入口文件**，直接打开文件读源码，遇到不懂的直接ChatGPT + 搜索：

### 3.1. 导包

```dart
import 'package:flutter/material.dart';
```dart

导入Flutter自带的 **Material UI组件库** (提供了大量用于构建Material Design风格用户界面的组件和工具)，导包语法：**import 'package:包名/文件路径.dart'** 。还支持 **相对路径导入** 和 **使用别名进行命名空间控制**

```dart
// 相对路径导入
import '../utils/helper.dart';

// 支持使用别名进行命名空间控制
import 'package:http/http.dart' as http;
```dart

### 3.2. main()函数

```dart
void main() {
  runApp(const MyApp());
}
```dart

**应用程序的入口函数**，负责创建和运行应用程序，通常包含一个 **runApp()函数** 调用，用于启动应用程序。上述代码调用了runApp()函数，并创建了一个 **MyApp的常量对象** 作为参数传递给它。

### 3.3. MyApp类

MyApp是一个自定义的Widget类，代表了整个应用程序的 **根组件**：

```dart
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: 'Flutter Demo Home Page😳'),
    );
  }
}
```dart

MyApp继承了 **StatelessWidget** 类 → **没有状态改变的Widget**，一般用作展示。

与之对应的 **StatefulWidget** 类 → **需要保存状态**，**且可能出现状态改变的Widget**。

继续往下走，重写了 **build()** 函数，此函数用来构建和描述 **Widget的UI界面** (根据Widget的状态生成新的Widget树)，第一次创建Widget或状态发生变化时，Flutter框架会自动调用此方法。

因此，为了提高性能，应尽量避免在此方法中进行耗时的操作，如网络请求，大量计算等。

在这段代码中，build() 返回了一个 **MaterialApp** 对象 (继承StatefulWidget) ，定义了组件的标题，主题，以及应用程序首页 **MyHomePage**。

### 3.4. MyHomePage类

```dart
class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}
```dart

继承StatefulWidget类，说明它是一个 **有状态的组件**。构造函数接受了两个参数：

* key：用于确定widget在widget树中的唯一性的，前面的super表示从父类继承；
* title：构建UI时所需要的数据，这里明显是用来存储界面标题数据。

重写了 **createState()** 函数，返回类型为 State，使用 **箭头函数的简写形式(函数体只有一行)** ，将返回的State对象与具体实现类 **\_MyHomePageState** 进行关联。

### 3.5. \_MyHomePageState类

类名前的 **下划线\_** 用于标识类是一个私有类，不能在其它文件中访问：

```dart
class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    setState(() {
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text(
              'You have pushed the button this many times:',
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ), // This trailing comma makes auto-formatting nicer for build methods.
    );
  }
}
```dart

解读下build()前的代码：

* 定义了私有变量 **\_counter**，用于记录按钮被点击的次数；
* 定义了私有函数 **\_incrementCounter**，在按钮按下的时候触发，函数 **内部代码块** 被包裹在 **setState()** 中；
* **setState()** 是StatefulWidget类提供的函数，用于 **通知Flutter框架有状态发生改变**，Flutter收到通知后，会执行 **build()** 函数来 **根据新的状态重新构建页面**；

所以这部分的逻辑就是：

> 点击按钮调用\_incrementCounter() → counter自增 → setState() 通知Flutter框架状态发生变化 → Flutter框架调用 build() 函数以新的状态重新构建UI → 显示到设备屏幕上。

再往下走，**build()** 函数返回一个 **Scaffold** 组件 **(页面脚手架)** ，提供了 appBar(顶部栏)、body(内容部分)、floatingActionButton(悬浮按钮)、bottomNavigationBar(底部导航栏)、drawer(侧边栏) 等属性。

😳 到此，算是把main.dart中的代码过完了，不难看出Flutter Widget的核心玩法：

* **没状态改变** 只是展示的继承 **StatelessWidget**，**有状态改变** 的继承 **StatefulWidget**；
* 重写 **build()** 返回一个具体的Widget或复杂的Widget组合；
* 有状态变化的Widget，重写 **createState()** 返回一个 **具体的状态实现类**，该类继承 **State<组件类名>** ，类中可调用 **setState()** 通知Flutter框架，有状态改变，需要调用build()重新构建页面。

### 3.6. 动手加个数字减少的按钮

😆 知道Flutter Widget的上述玩法后，可以尝试在原Demo的基础上加功能：**添加一个数字减少的按钮**

```dart
class _MyHomePageState extends State<MyHomePage> {
	//... 新增一个减少计数的方法
	void _decrementCounter() {
    setState(() {
      _counter--;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(...),
      body: AppBar(...)
      /// 返回一个 Column(效果和Android里的垂直LinearLayout一样)
  		/// FloatingActionButton(增加) + SizeBox间距 + FloatingActionButton(减少)
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          FloatingActionButton.extended(
            onPressed: _incrementCounter,
            icon: Icon(Icons.add),
            label: Text('Increment'),
          ),
          SizedBox(height: 10),
          FloatingActionButton.extended(
            onPressed: _decrementCounter,
            icon: Icon(Icons.remove),
            label: Text('Decrement'),
          )
        ],
      ));
    );
}
```dart

运行看看效果：

### 3.7. 补充：项目结构简述

简述下项目中各个文件夹的作用：

```dart
hello_flutter/
│── .dart_tool/								- Flutter自动生成的配置和构建输出，一般不需要开发者去修改
│── .idea/										- IDEA的配置信息，不用管
├── android/                  - Android 原生项目文件夹
├── build/                    - 存放构建产物的文件夹，不用管
├── ios/                      - iOS 原生项目文件夹
├── lib/                      - ⭐存放Flutter源代码，大部分开发会在这个目录下进行
│   ├── main.dart             - ⭐Flutter 应用程序的主要入口
├── linux/										- Linux平台相关代码及配置文件
├── macos/										- Mac平台相关代码及配置文件
├── test/											- 测试文件
├── web/											- Web平台相关代码及配置文件
├── windows/									- Windows平台相关代码及配置文件
├── .metadata									- Dart编译器生成的元数据文件，包含有关项目的编译和依赖，metadata报错？报错直接删除让Dart重新编译
├── analysis_options.yaml			- 配置静态代码分析工具，可在此定义代码风格、禁用和启用特定警告和错误检查
├── hello_flutter.iml					- IntelliJ IDEA 项目文件文件，描述模块项目和依赖项，及其它配置信息，用于确保项目可以在 IntelliJ IDEA 或 Android Studio 中正确加载和编译。
├── pubspec.lock							- 项目依赖项的锁定信息，由pubspec.yaml自动生成，用于确保项目在不同环境使用相同的依赖项版本
└── pubspec.yaml              - ⭐ Flutter项目配置文件，包括依赖、插件、资源等
```dart

打开其中的 **pubspec.yaml** → Flutter项目的配置文件：

```dart
name: hello_flutter # 项目名称
description: A new Flutter project..  #项目描述
publish_to: 'none' # 防止上传到pub.dev   这个类似与maven

version: 1.0.0+1  # 版本号 → 前面是版本名字 +1是第一个版本

environment:	# 定义程序所需的环境
  sdk: '>=3.1.5 <4.0.0' # 程序所需Dart SDK的版本范围

dependencies: # 程序所依赖的外部库
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2
  http: ^1.1.0  # 添加http依赖库

dev_dependencies: # 开发时的依赖包，一般是测试框架之类
  flutter_test:
    sdk: flutter

  flutter_lints: ^2.0.0

flutter:  # Flutter特定字段，比如配置
  uses-material-design: true  # 是否启用 Material Design 风格
  assets:
  - assets/
```dart

👏有点意思，本节就先到这吧，下节我们将用 **类比Android的方式来学Flutter**，敬请期待~