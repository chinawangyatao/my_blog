---
title: "Flutter入门到精通（三）：纯Flutter项目打包与混合开发"
pubDate: 2024-01-04
description: "Flutter项目打包流程，以及如何与原生Android项目进行混合开发。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第三篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

 在**《Flutter开发初体验》**里说过，为了后续公司APP能兼容鸿蒙，小组决定梭哈 **Flutter**，首先要面对的第一个问题就是 **开发模式的选型**。

**😏整个项目用Flutter重写**，等写得差不多了，再替换一波原生的Android项目？不出意外的话，测试会一拳打爆我们的🐶头，**船新的项目** 可以这样玩，有历史包袱的旧项目可不兴这样折腾。

**😁混合开发** 是正解，版本迭代过程中涉及到的功能模块用Flutter重写，测试测完没问题，再替换原生写的旧模块。咋替换？都是跳页面，配两套 **路由** 不就好了。

😀 接着是 **混合开发的具体实现** 方式，两种玩法：**源码集成** & **产物集成(AAR)** ，前者的优点 **方便Flutter代码修改和调试**，缺点是 **团队成员都要安装Flutter开发环境**。后者的优点是 **不需要接触代码** 和 **安装Flutter环境**，缺点是 **调试不方便**，每次都要先构建AAR上传，主项目再更新依赖，而且版本也不好管理。

🎉综上，我们选择了 **源码集成** 的方式，前面也说过自己想写一个信息流的APP，所以本节先简单过下 **纯Flutter项目打包** 的过程，再过下 **两种集成Flutter Module的方式**，以及了解下 **混合开发会遇到到的一些问题**。

> **Tips**：🐶目前是边学边实战的阶段，有些内容还没涉猎，后续实际开发遇到问题再来添砖加瓦~

## 2. 纯Flutter项目打包

官方文档 → [《构建和发布为 Android 应用》](https://flutter.cn/docs/deployment/android)，执行 **flutter build apk** 就可以进行APK打包啦，灰常简单😁。打包失败最常见的问题 → **Java、Kotlin、Groovy 和 AGP 的版本问题** → [Compatibility Matrix (兼容矩阵)](https://docs.gradle.org/current/userguide/compatibility.html#android) 。然后是一些可选的常规配置：

### 2.1. 修改-应用名称

定位到 **android/app/src/main/AndroidManifest.xml**，修改  标签里的 **android:label** 属性值为你想要的名称，可以 **直接写字符串**，也可以定义 strings.xml 然后字符串资源引用的方式(如：android:label="@string/app_name")。

### 2.2. 修改-应用图标

就是替换所有 **android/app/src/main/res/mipmap-xxx** 里的图标文件 → **ic_launcher.png** (默认)

可以让设计按照一个个分辨率出图，也可以TA给个高清大图 (如1024*1024)，然后用工具自动生成，三个常用生成工具：

① **使用flutter_launcher_icons插件 (推荐，还能自动修改AndroidManifest.xml里的图标名)**

打开 pubspec.yaml 引用 [flutter_launcher_icons](https://pub.dev/packages/flutter_launcher_icons) 插件：

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_launcher_icons: ^0.13.1	# 图标生成插件

flutter_icons:
  image_path: "assets/images/icon.png"
  android: "ic_launcher"	# 指定生成的图标名
  ios: true
```

保存后，终端键入下述命令 **生成及替换图标**：

```dart
flutter pub get
flutter pub run flutter_launcher_icons:main
```

注：源图 → 格式：32-bit PNG，分辨率：1024x1024

② **使用Icon Factory**

打开 [**Icon Factory**](https://icon.wuruihong.com/) 直接传大图，支持多平台多分辨率图片的自动生成，还可以进行一些动态配置：

③ **Android Studio 自带 Asset Studio**（🐶不太好用~）

右键Flutter项目 → Flutter → Open Android module in Android Studio → 等待AS加载完毕 → 右键android/app项目 → New → **Image Asset**

### 2.3. 修改-启动图

定位到 **app/src/main/res/drawable/launch_background.xml** 按需修改，也可以使用 [flutter_native_splash](https://pub.dev/packages/flutter_native_splash)插件进行配置。

### 2.4. 修改-版本号

定位到 **pubspec.yaml** 的 **version** 字段 → 1.0.0+1 → +号可以看做 **分隔符**，前面是给用户看的版本名 (Version Name)，后面是给我们看的版本号 (Version Code)，**每次发版必须增加**，可用于判断软件新旧。

### 2.5. APK签名

**手动签名**：先打Release包，然后签名，两种可选方式：

* ① **Android Studio 手动签名**：Build → Generated Signed Bundle/APK → APK
* ② **Java keytool 手动签名**：

```dart
# Mac/Linux
keytool -genkey -v -keystore ~/key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias key

# Windows
keytool -genkey -v -keystore c:\Users\USER_NAME\key.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias key
```

**自动签名**：android 目录下新建 **keystore.properties** 文件 (不是规定，习惯性命名) 填入秘钥相关信息：

```dart
keyAlias=xxx
storeFile=../xxx.jks
keyPassword=123456
storePassword=123456
```

打开 **build.gradl**e 文件，在 **android代码块前** 添加下述代码，用于加载 keystore.properties 文件：

```dart
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

android {
	//...
}
```

在 **signingConfigs** 代码块中定义签名对象存储签名信息，然后在release打包时引用：

```dart
android {
	signingConfigs {
      release {
          storeFile file(keystoreProperties['storeFile'])
          keyAlias keystoreProperties['keyAlias']
          keyPassword keystoreProperties['keyPassword']
          storePassword keystoreProperties['storePassword']
      }
  }

  buildTypes {
       release {
            signingConfig signingConfigs.release
       }
  }
}
```

配置完毕，键入 **flutter build apk --release** 打包，然后可以使用 jarsigner 检查签名状态 → **jarsigner -verify -verbose -certs xxx.apk**，来验证是否签名成功：

这种配置玩法跟原生Android自动签名一模一样，举一反三，可以直接加上熟悉的配置来启用 **代码缩减**、**混淆等功能**：

```dart
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
    ...
}
```

另外，还可以指定APK支持的CPU指令集 ([ABI](https://developer.android.com/ndk/guides/abis?hl=zh-cn)) 来减少apk体积，Flutter 默认支持arm和x86两种ABI：

可以添加参数 **--split-per-abi** 为每种架构单独生成一个apk：

也可以指定只打特定ABI的APK，如：**flutter build apk --target-platform android-arm64**

其它可选值：android-arm、android-x86、android-x64，想支持多种ABI，可以用 **逗号** 隔开。

### 2.6. 多渠道打包

Flutter 提供了 **--dart-define** 参数，该参数可以传递到 **Flutter dart层**，也可以传递到 **android.gradle** 层。比如传递两个参数：

```dart
flutter run --dart-define=APP_NAME=hello_flutter_遥遥领先 --dart-define=APP_CHANNEL=Huawei
```

在 Dart 代码中可以这样拿到参数：

```dart
// main.dart
class EnvironmentConfig {
  static const APP_NAME = String.fromEnvironment('APP_NAME');
  static const APP_CHANNEL = String.fromEnvironment('APP_CHANNEL');
}

// 获取值显示
const Text('${EnvironmentConfig.APP_NAME} = ${EnvironmentConfig.APP_CHANNEL}')
```

运行结果如下：

接着是在 **android.gradle** 中获取 **渠道命令参数** 的示例：

```dart
// 渠道参数，设置下默认值
def dartEne = [
    APP_NAME: 'hello_flutter',
    APP_CHANNEL: 'dev',
]

// 判断读取dart-defines属性
if (project.hasProperty('dart-defines')) {
    dartEne = dartEne + project.property('dart-defines')
        .split(',')
        .collectEntries { entry ->
            def pair = new String(entry.decodeBase64(), 'UTF-8').split('=')
            [(pair.first()): pair.last()]
        }
}

// 打印看下能否获取到属性
println project.hasProperty('dart-defines')
println dartEne
```

键入下述命令，将编译日志输出到文件中：

```dart
flutter run --dart-define=APP_NAME=hello_flutter_遥遥领先 --dart-define=APP_CHANNEL=Huawei -v > log.txt
```

打开log.txt，搜索 huawei，可以看到 **渠道命令参数** 都已经拿到啦~

然后是 AS和 VS **配置快速启动参数** 的 方法，就是多渠道调试时，不用每次都敲一大串命令：

**AS** 点 main.dart → Edit Configurations.. → 修改下 Additional run args 把 flutter run 后面的参数丢丢进去。还可以点击左侧 + 号配置不同的渠道包命令行参数~

VS 点左侧运行的小图标 → 点 **create a launch.json file** → 选中 **Dart & Flutter...**

会生成一个 launch.json 运行配置文件，加个args的字段，稍微改一下保存，右上角就可以选择不同渠道运行：

## 3. 混合开发-源码集成

官方文档：[add-to-app](https://docs.flutter.dev/add-to-app)，混合开发的两种集成方式都需要 **先创建Flutter Module**！！！

郭佬[《混合开发打包 Android 篇》](https://guoshuyu.cn/home/wx/Flutter-14.html)里提到的修改项目gradle脚本，让Flutter Project既能以 apk形式单独运行调试，又能打包为aar形式对外提供支持：

在新版本的Flutter亲测行不通！！！你执行 **flutter build aar** 直接报错：

> AARs can only be built for plugin or module projects。

新版Flutter新建的 **Flutter Module**，直接就支持以APK的形式运行，也可以打包AAR。

### 3.1. Android Studio 新建 Flutter Module

有安装AS的话，依次点击 File → New → New Flutter Project... → 输入模块名，选择路径，添加描述 → **Project type 下拉选中 Module** → 确定，即可新建 Flutter Module：

### 3.2. 原生项目集成 Module

创建完，打开原生Android项目的 **setting.gradle** 文件添加下述代码用于集成Flutter模块：

```dart
// 创建一个Binding对象并将该对象的gradle属性设置为当前脚本
setBinding(new Binding([gradle: this]))
// 执行include_flutter.groovy脚本
// 运行groovy文件，它运行在一个Scipt对象中，其中有一个binding属性，存储了当前环境的变量
// evaluate执行时会把当前脚本的binding传入下一个脚本
evaluate(new File(
    settingsDir.parentFile, // flutter_module和原生项目处于同一层级，这里获取父层级
    'flutter_module/.android/include_flutter.groovy'
))
```

这段代码的作用：**将gradle环境传到include_flutter.groovy中**，打开看下脚本文件：

```dart
// 获得脚本所在位置（文件的URL形式）
def scriptFile = getClass().protectionDomain.codeSource.location.toURI()
// 获得Flutter项目的根目录
def flutterProjectRoot = new File(scriptFile).parentFile.parentFile

// 指定Gradle项目要包含的子项目，即Flutter模块
gradle.include ":flutter"
// 设置Flutter模块的项目目录
gradle.project(":flutter").projectDir = new File(flutterProjectRoot, ".android/Flutter")

// 获取local.properties文件
def localPropertiesFile = new File(flutterProjectRoot, ".android/local.properties")
// 新建一个空的Properties对象，用来存储local.properties里的键值对
def properties = new Properties()

// 断言判断local.properties是否存在，不存在指引用户执行 flutter pub get 命令
assert localPropertiesFile.exists(), "❗️The Flutter module doesn't have a `$localPropertiesFile` file." +
                                     "\nYou must run `flutter pub get` in `$flutterProjectRoot`."
// 读取local.properties文件内容加载到properties对象中
localPropertiesFile.withReader("UTF-8") { reader -> properties.load(reader) }

// 从properties对象获取Flutter SDK的路径
def flutterSdkPath = properties.getProperty("flutter.sdk")
// 断言判断路径是否存在，不存在指示用户在local.properties文件中设置flutter.sdk属性
assert flutterSdkPath != null, "flutter.sdk not set in local.properties"
// 通过apply语句引入 module_plugin_loader.gradle 脚本
gradle.apply from: "$flutterSdkPath/packages/flutter_tools/gradle/module_plugin_loader.gradle"
```

这段代码的作用：**添加 flutter module到Android主工程** + **导入 module_plugin_loader.gradle 脚本**，打开看下导入的脚本文件：

```dart
import groovy.json.JsonSlurper

def moduleProjectRoot = project(':flutter').projectDir.parentFile.parentFile

def object = null;
String flutterModulePath = project(':flutter').projectDir.parentFile.getAbsolutePath()
// 添加所有插件Module到Android项目
def pluginsFile = new File(moduleProjectRoot, '.flutter-plugins-dependencies')
if (pluginsFile.exists()) {
    object = new JsonSlurper().parseText(pluginsFile.text)
    assert object instanceof Map
    assert object.plugins instanceof Map
    assert object.plugins.android instanceof List
    // 遍历plugins.android属性中的每个androidPlugin对象
    object.plugins.android.each { androidPlugin ->
        assert androidPlugin.name instanceof String
        assert androidPlugin.path instanceof String
        // 判断插件是否有native_build字段，即是否需要Gradle构建，不需要直接返回(比如Dart写的插件)
        def needsBuild = androidPlugin.containsKey('native_build') ? androidPlugin['native_build'] : true
        if (!needsBuild) {
            return
        }
        def pluginDirectory = new File(androidPlugin.path, 'android')
        assert pluginDirectory.exists()
        // 包含该插件到Gradle的构建中
        include ":${androidPlugin.name}"
        project(":${androidPlugin.name}").projectDir = pluginDirectory
    }
}

// 当Gradle项目加载完后执行
gradle.getGradle().projectsLoaded { g ->
    // 根项目评估前，遍历所有子项目
    g.rootProject.beforeEvaluate { p ->
        p.subprojects { subproject ->
            // 如果是包含名为android的插件，创建plugins_build_output目录并作为子项目的构建输出目录
            if (object != null && object.plugins != null && object.plugins.android != null
                    && object.plugins.android.name.contains(subproject.name)) {
                File androidPluginBuildOutputDir = new File(flutterModulePath + File.separator
                        + "plugins_build_output" + File.separator + subproject.name);
                if (!androidPluginBuildOutputDir.exists()) {
                    androidPluginBuildOutputDir.mkdirs()
                }
                subproject.buildDir = androidPluginBuildOutputDir
            }
        }
        // 如果存在名为mainModuleName的变量，将其设置为根目录的mainModuleName属性
        def _mainModuleName = binding.variables['mainModuleName']
        if (_mainModuleName != null && !_mainModuleName.empty) {
            p.ext.mainModuleName = _mainModuleName
        }
    }
    // 在根目录评估后，遍历子项目名字是否等于，是将其评估依赖于flutter项目
    g.rootProject.afterEvaluate { p ->
        p.subprojects { sp ->
            if (sp.name != 'flutter') {
                sp.evaluationDependsOn(':flutter')
            }
        }
    }
}
```

**Tips**：上面提到的评估阶段，发生在项目构建前，这个阶段Gradle会对根项目进行一系列的检查和计算，已确定项目的构建顺序、依赖关系和其它配置信息。

这段代码的作用：

* 遍历flutter插件Module，把需要本地构建的include到Gradle的构建中；
* 在根项目评估前，遍历子项目，设置Android插件输出目录，指定根项目的 **mainModuleName** 属性；
* 在根目录评估后，遍历子项目，设置所有子项目的评估阶段都依赖于flutter项目，即它最先执行评估阶段；

通过这个脚本把所有的Module都加进来了，那Dart代码和Flutter引擎是啥时候加入到Android主项目中的呢？打开flutter Module里的 build.gradle，可以看到 apply 了一个 **flutter.gradle** 文件：

```dart
def flutterRoot = localProperties.getProperty('flutter.sdk')
apply from: "$flutterRoot/packages/flutter_tools/gradle/flutter.gradle"

// 打开flutter.gradle文件
def pathToThisDirectory = buildscript.sourceFile.parentFile
apply from: "$pathToThisDirectory/src/main/groovy/flutter.groovy"
```

这个 flutter.groovy 中的代码有点长，就不贴了，后续会专门读下源码，大概知道Flutter引擎和Dart代码是在这里加到Android主项目就行了。

扯得有点远了，添加了前面的设置后，点Sync直接报错：

```dart
Caused by: org.gradle.api.internal.plugins.PluginApplicationException: Failed to apply plugin class 'FlutterPlugin'.
```

解法：**setting.gradle** 里的 **RepositoriesMode** 模式从 **FAIL_ON_PROJECT_REPOS** 改为 **PREFER_PROJECT**

```dart
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_PROJECT)
    repositories {
        google()
        mavenCentral()
    }
}

# 三种模式解释
# FAIL_ON_PROJECT_REPOS → 工程或工程的插件设置了仓库，构建直接报错抛异常
```

# PREFER_PROJECT → 工程设置了仓库优先使用工程配置的，忽略settings

# PREFER_SETTINGS → 通过工程单独设置或插件设置的仓库，都会被忽略

点Sync Now，跑完会自动生成引用信息：

打开 **app层级的build.gradle** 添加依赖：

```dart
implementation project(':flutter_module')
```

再点Sync Now，跑完，打开 **AndroidManifest.xml** 清单文件加下 **FlutterActivity**：

```dart
<activity
    android:name="io.flutter.embedding.android.FlutterActivity"
    android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
    android:hardwareAccelerated="true"
    android:windowSoftInputMode="adjustResize" />
```

接着在原生MainActivity.kt加个按钮点击跳转Flutter模块：

```dart
import io.flutter.embedding.android.FlutterActivity;

myButton.setOnClickListener {
    startActivity(
        FlutterActivity.createDefaultIntent(this)
    )
}
```

附：Gradle Build 下东西很慢又没代理，可以在settings.gradle添加这几个镜像源：

```dart
maven { url 'https://maven.aliyun.com/nexus/content/groups/public/' }
maven { url 'https://maven.aliyun.com/nexus/content/repositories/jcenter' }
maven { url 'https://maven.aliyun.com/nexus/content/repositories/google' }
maven { url 'https://maven.aliyun.com/nexus/content/repositories/gradle-plugin' }
```

## 4. 混合开发-产物(AAR)集成

这里直接用 **命令行创建Flutter模块**，命令如下：

```dart
flutter create -t module <module_name>
```

然后可以在Android Studio中依次点击 **Build → Flutter → Build AAR** 来生成AAR，也可以执行下述命令：

```dart
flutter build aar

# 只打release aar
# flutter build aar --no-debug --no-profile

# 顺带设置构建版本
# flutter build aar --build-number=2.0

# 指定目标平台(支持的abi架构，用逗号分隔)
flutter build aar --target-platform android-arm64
```

执行后，控制台会输出aar的生成路径，还贴心地给出了如何引用生成aar的示例：

怎么上传aar到maven，网上教程一堆，就不展开说了。这里提一嘴打AAR最常碰到的一个问题：

打包AAR时，引用的 **本地依赖和远程依赖只会打包引用**，不会打包源码和资源，引用这个AAR的时候，可能会报错 class not found。

两个常规解法：

* ① **创建本地/远程Maven仓库**，使用upload/uploadArchives生成aar及其它文件，然后 **引用依赖**。注：放libs里的aar包是加载不到的，也得改成先upload再引用依赖的方式！！！
* ② 使用 [fat-aar插件](https://github.com/kezong/fat-aar-android)，将引用代码和资源合并到一个aar中。

## 5. 混合开发-要考虑的问题

### 5.1. 路由选择

引入混合开发后 **，** 会存在 **混合栈管理的问题**，如何处理交替出现的Native页面和Flutter页面。两个比较流行的方案：[alibaba/fluter_boost (单引擎)](https://github.com/alibaba/flutter_boost) 和 [官方/FlutterEngineGroup (多引擎)](https://flutter.cn/docs/development/add-to-app/multiple-flutters)。

### 5.2. 数据通信

官方文档：[撰写双端平台代码（插件编写实现）](https://flutter.cn/docs/development/platform-integration/platform-channels)，Flutter和Native的通信是通过 **Channel(平台通道)** 来完成的。消息传递流程图如下：

Flutter定义了三种不同类型的Channel：

* **BasicMessageChannel**：双向，持续通信，接收到信息后可回复此消息，用于传递字符串和半结构信息；
* **EventChannel**：单向，native → flutter，用于native向flutter发送实时数据，如电量变化、传感器等；
* **MethodChannel**：双向，方法互调传参，常用于访问原生设备信息、拍照、定位等；

🐶 暂时就写这么多吧~

**参考文献**：

* [《官方文档：Integrate a Flutter module into your Android project》](https://docs.flutter.dev/add-to-app/android/project-setup?tab=with-android-studio)
* [《官方文档：add-to-app》](https://docs.flutter.dev/add-to-app)
* [《Flutter完整开发实战详解》](https://guoshuyu.cn/home/wx)
* **《Flutter Android 打包保姆式全流程 2023 版》**
* **《Flutter 中如何优雅的实现多渠道打包（埋点统计系列）》**
* **《『全网独一份』Flutter混合工程一键打aar上传Artifactory》**
* [《Flutter混合架构方案探索》](https://mp.weixin.qq.com/s/Vsivr3nVMovhIHqIMCxDXg)