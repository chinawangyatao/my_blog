---
title: "Flutter入门到精通（十九）：Flutter混编杂谈"
pubDate: 2024-01-20
description: "Flutter与原生Android混合开发中的各种问题和解决方案。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第十九篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

 好一阵子没更 **Flutter** 的文章了，主要是在忙公司项目，🐔 团队练习Flutter大半年🏀，一直都是各写各的 Demo。😄 恰逢本季度APP业务需求不多，决定练练兵，把其中一个核心但功能简单的「**数据表单录入**」模块用 Flutter 重构一波。 踩坑不少，趁着本期开发接近尾声进入提测，花点时间梳理下「**混编-Android**」相关的知识点，以及实际开发中遇到的问题，自己沉淀知识之余，也希望对各位读者有所启发😊

## 2. 混编方案

#### 2.1.1. 三端分离

🤷‍♀️ 大部分产品都是有历史包(💩)袱(⛰️) 的，用 **Flutter** 完全重写不太现实，大多数情况都是作为 **库或模块** 集成到现有的应用程序中，一般会采用「**三端分离**」的模式进行混编开发：

即：**不改变App原生项目的管理方式，把Flutter项目作为它的子项目**。

😄 对此，官方有详细的集成文档 → [《Add Flutter to an existing app》](https://docs.flutter.dev/add-to-app)，照着操作就行好了。当然，实际集成过程大概率会些幺蛾子的🤣，这里把「**Android集成Flutter子项目的两种方式**」拎出来讲一哈：

* **AAR集成**：将Flutter模块打包成 **AAR文件**，可以执行 **flutter build aar** 命令 或者在 **Android Studio** 中依次点击 **Build → Flutter → Build AAR** 进行打包。这种集成方式的好处：**不需要安装Flutter SDK**，坏处是：每次修改Flutter模块都需要重新编译打包上传，而且如果Flutter用到其它三方库或插件，可能需要处理 **将多个AAR合并成一个** 的问题。
* **源码集成**：将Flutter模块作为 **子项目**，添加到原生项目中，这种集成方式的好处：开发调试方便，支持Hot reload，当然，**需要安装Flutter SDK**。

#### 2.1.2. Android-源码集成

**😄开发阶段**，改动频繁，自然是采取「**源码集成**」的方式，在原生项目的 **settings.gradle** 中添加下 **Flutter项目** 的配置：

```dart
// 创建一个新的Binding，并将当前的Gradle对象绑定到变量gradle上
setBinding(new Binding([gradle: this]))

// 执行 include_flutter.groovy 脚本，它可以访问到当前脚本中所有变量
//
// 注：这里是假设 flutter项目 和 app主项目 处于同一目录/层级
// settingsDir → 获取settings.gradle文件的所在目录，parentFile → 获得父目录
// 可以按需调整，比如 flutter项目和原生项目处于同一层级，可以这样写：settingsDir.parentFile.parentFile
evaluate(new File(
    settingsDir.parentFile,
    'flutter模块/.android/include_flutter.groovy'
))
```dart

😄 就执行下 **include_flutter.groovy** 脚本，打开看看做了啥：

```dart
// ① 获取脚本所在目录与Flutter项目的根目录
def scriptFile = getClass().protectionDomain.codeSource.location.toURI()
def flutterProjectRoot = new File(scriptFile).parentFile.parentFile

// ② 在gradle中包含名为flutter的项目，路径为根目录下的：.android/Flutter
gradle.include ":flutter"
gradle.project(":flutter").projectDir = new File(flutterProjectRoot, ".android/Flutter")

// ③ 读取 .android/local.properties 文件，获得flutter sdk的路径
def localPropertiesFile = new File(flutterProjectRoot, ".android/local.properties")
def properties = new Properties()
assert localPropertiesFile.exists(), "❗️The Flutter module doesn't have a `$localPropertiesFile` file." +
                                     "\nYou must run `flutter pub get` in `$flutterProjectRoot`."
localPropertiesFile.withReader("UTF-8") { reader -> properties.load(reader) }
def flutterSdkPath = properties.getProperty("flutter.sdk")
assert flutterSdkPath != null, "flutter.sdk not set in local.properties"

// ④ 应用其中的 module_plugin_loader.gradle 脚本，完成Flutter插件的加载
gradle.apply from: "$flutterSdkPath/packages/flutter_tools/gradle/module_plugin_loader.gradle"
```dart

😀 include包含Flutter项目，读取 **.android/local.properties** 获取flutter sdk路径，应用其中的 **module_plugin_loader.gradle** 脚本。代码懒得贴了，直接描述下这个脚本的大概逻辑：

* 读取 **.flutter-plugins-dependencie** 文件，此文件包含了项目中用到的所有Flutter插件信息。
* 对于支持Android平台的插件执行下述操作：

  + 断言保证插件名称和路径是String类型。
  + 如果插件不需要本地构建(如：只有Dart实现的插件)，跳过该插件。
  + 创建新的文件对象 **pluginDirectory** 作为插件的Android子目录，断言保证目录存在。
  + include包含到Gradle项目中，并设置插件的项目目录。
* 在项目加载后，根项目 **beforeEvaluate** 时，对每个 **subproject** 进行配置，如果为插件，创建一个新目录 **androidPluginBuildOutputDir** 作为子项目的构建目录。
* 如果存在主模块名称 **mainModuleName**，则将其设置为项目的扩展属性。
* 在根项目 **afterEvaluate** 时确保所有子项目都在 **:flutter** 项目配置后进行。

😊 简单点说就是：**管理和构建Flutter向后中的Android插件**，接着原生项目的 **app/build.gradle** 需要添加下 Flutter模块的依赖：

```dart
dependencies {
    implementation project(':flutter')
}
```dart

⚠️ 另外，新版Android Studio创建的Android项目默认使用 **gradle.kts** 作为构建语言，没法直接添加上述的Flutter项目配置，要么删掉它改为 **settings.gradle**。要么新建一个脚本文件，如：**flutter_settings.gradle**，把配置内容丢里头，然后 **settings.gradle.kts** 使用 apply 进行引入：

```dart
apply { from("flutter_settings.gradle") }
```dart

⚠️ 还有，如果编译过程报下下述错误：

```dart
Caused by: org.gradle.api.InvalidUserCodeException: Build was configured to prefer settings repositories over project repositories but repository ‘maven’ was added by plugin class ‘FlutterPlugin’
Caused by: org.gradle.api.internal.plugins.PluginApplicationException: Failed to apply plugin class ‘FlutterPlugin’.
```dart

打开 **settings.gradle** (或kts)，把：**RepositoriesMode.FAIL_ON_PROJECT_REPOS** 改为 **RepositoriesMode.PREFER_PROJECT** 就好了~

前者仅从 **settings.gradle** 中定义的仓库解析依赖项，如果项目级别的 **build.gradle** 中定义任何仓库，构建会失败并抛出错误。后者会先尝试从项目级别的 build.gradle 中定义的仓库解析依赖项，找不到才使用 settings.gradle 中定义的仓库。

```dart
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_PROJECT)
    repositories {
        google()
        mavenCentral()
    }
}
```dart

然后 **项目级别的build.gradle** 加下仓库配置 (🤫阿里云镜像源是可选的哈~)：

```dart
allprojects {
        maven(uri("https://maven.aliyun.com/repository/public"))
        maven(uri("https://maven.aliyun.com/repository/google"))
        maven(uri("https://maven.aliyun.com/repository/gradle-plugin"))
        maven(uri("https://maven.aliyun.com/nexus/content/groups/public/"))
        maven(uri("https://maven.aliyun.com/nexus/content/repositories/jcenter"))
        google()
        mavenCentral()
    }
}
```dart

搞完，**Gradle Sync** 没报错，就可以在原生中使用Flutter啦，打开 **AndroidManifest.xml** 注册下 **FlutterActivity**：

```dart
<activity
  android:name="io.flutter.embedding.android.FlutterActivity"
  android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
  android:hardwareAccelerated="true"
  android:windowSoftInputMode="adjustResize"/>
```dart

接着整个Button点击跳 **FlutterActivity**：

```dart
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        findViewById<Button>(R.id.bt_open_flutter_activity).setOnClickListener {
            startActivity(FlutterActivity.createDefaultIntent(this))
        }
    }
}
```dart

🤣 然后你会发现，点击按钮后，得等一会儿才跳转FlutterActivity，这是因为：

默认情况下，每个FlutterActivity都会创建自己的 **Flutter Engine**，涉及到 **Dart VM 的启动** 和 **Flutter 框架的初始化**，所以需要一点时间。

一种解法是 → 使用 **预热的FlutterEngine缓存**，在应用启动时 (如 **自定义的Application类**) 创建并启动一个 **FlutterEngine**，将其缓存起来，然后在启动FlutterActivity时，获取并使用这个已预热的FlutterEngine实例：

```dart
class MyApp : Application() {
    lateinit var flutterEngine: FlutterEngine

    override fun onCreate() {
        super.onCreate()
        // ① 创建Flutter引擎实例
        flutterEngine = FlutterEngine(this)

        // 启动Flutter的代码执行，从默认的入口点 (通常是main()函数) 开始。
        flutterEngine.dartExecutor.executeDartEntrypoint(DartExecutor.DartEntrypoint.createDefault())

        // 将预热好的 FlutterEngine实例 放入缓存，使用 my_engine_id 作为其标识符
        FlutterEngineCache.getInstance().put("my_engine_id", flutterEngine)
    }
}
```dart

接着调用处 **withCachedEngine()** 使用 "my_engine_id" 对应的已预热Flutter引擎实例：

```dart
startActivity(FlutterActivity.withCachedEngine("my_engine_id").build(this))
```dart

编译运行，再次启动 **FlutterActivity**，页面打开速度快了不少。另外，**withNewEngine()** 使用新引擎，可以通过 **initialRoute()** 设置 **初始路由 (Flutter应用启动时显示哪个页面)** ：

```dart
startActivity(
  FlutterActivity
    .withNewEngine()
    .initialRoute("/my_route") //设置初始路由
    .build(this)
)
```dart

改为 **withCachedEngine()** 使用缓存引擎后，就不能设置初始路由了，因为已经在引擎预热时设置过了，默认为 **"/"** 。如果Flutter项目中没有显式设置路由表 (使用 **MaterialApp** 的 **routes** 或 **onGenerateRoute** 参数)，将会加载 **MaterialApp** 的 **home** 参数所指定的页面，如：**MaterialApp(home: MyHomePage())** ，运行后会加载 **MyHomePage**。可以通过下述代码来设置初始路由：

```dart
flutterEngine.navigationChannel.setInitialRoute("your/route/here");
```dart

然后是 **FlutterFragment**，需要添加到 **宿主Activity** 中才能使用：

```dart
class MyActivity : FragmentActivity() {
  companion object {
    private const val TAG_FLUTTER_FRAGMENT = "flutter_fragment"
  }

  private var flutterFragment: FlutterFragment? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.my_activity_layout)

    val fragmentManager: FragmentManager = supportFragmentManager
    flutterFragment = fragmentManager
      .findFragmentByTag(TAG_FLUTTER_FRAGMENT) as FlutterFragment?
    if (flutterFragment == null) {
      // 创建FlutterFragment实例
      var newFlutterFragment = FlutterFragment.createDefault()
      flutterFragment = newFlutterFragment
      fragmentManager
        .beginTransaction()
        .add(
          R.id.fragment_container,
          newFlutterFragment,
          TAG_FLUTTER_FRAGMENT
        )
        .commit()
    }
  }

  // 有时可能需要对宿主Activity转发一些信号，如回退、权限等。
  override fun onBackPressed() {
    flutterFragment!!.onBackPressed()
  }

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String?>,
    grantResults: IntArray
  ) {
    flutterFragment!!.onRequestPermissionsResult(
      requestCode,
      permissions,
      grantResults
    )
  }
}
```dart

新建 **FlutterFragment** 实例默认会创建新的引擎实例，同样可以调用 **withCachedEngine()** 使用缓存引擎。默认使用 **SurfaceView** 来渲染Flutter内容，也可以切换为 **TextureView** 进行渲染 (前者性能更优)。注：**SurfaceView** 不能交错再View层次结构的中间，要么最底部，要么最顶部，不然会导致视觉的异常，如遮挡问题或渲染顺序问题。

```dart
val flutterFragment = FlutterFragment.withNewEngine()
    .renderMode(FlutterView.RenderMode.texture) // 使用TextureView渲染
    .build()
```dart

最后，还有一个 **FlutterView**，相比 **FlutterActivity** 和 **FlutterFragment** 的用法要复杂多了，得手动创建一系列的自定义绑定，如：

* **Activity**：确保能收到宿主Activity的生命周期事件，实现 **FlutterActivityAndFragmentDelegate** 转发，特定生命周期处理，如：Activity可见调用appIsResumed()，不可见调用appIsInactive()或 appIsPaused()，销毁时调用detachFromFlutterEngine()等。
* **关联FlutterEngine**：这样Dart代码才能与本地平台代码进行交互，通常通过调用FlutterView.attachToFlutterEngine(flutterEngine) 和FlutterEngine.getLifecycleChannel().appIsResumed() 等方法来完成。
* **其它自定义交互**：剪贴板、系统 UI 覆盖、插件等其他交互。

🤷‍♀️ 感兴趣的可以看下官方Demo：[flutter/samples/add_to_app/android_view](https://github.com/flutter/samples/tree/main/add_to_app/android_view)，关于源码集成方式就说到这~

#### 2.1.3. Android-AAR集成

😄 直接执行命令 **flutter build aar** 来生成AAR文件，不过会打三个包：

* **debug**：会打开所有断言，包括debugging信息、debugger aids（比如observatory）和服务扩展。优化了快速develop/run循环，但是没有优化执行速度、二进制大小和部署。等价于：**flutter run**。
* **release**：会关闭所有断言和debugging信息，关闭所有debugger工具。优化了快速启动、快速执行和减小包体积。禁用所有的debugging aids和服务扩展。等价于：**flutter run --release**
* **profile**：和release基本一致，除了启用了服务扩展和tracing，以及一些为了最低限度支持tracing运行的东西 (如：可以连接observatory到进程)。等价于：**flutter run --profile**

可以添加参数限制打包产物，比如：只打release、只支持arm和arm64平台，构建版本号为0.01：

```dart
flutter build aar --no-debug --no-profile --target-platform android-arm,android-arm64 --build-number 0.0.1
```dart

打包完成，控制台会输出AAR的路径信息，以及如何集成：

**build.gradle** 照着复制粘贴就行了，如果是 **build.gradle.kts** 的话，要稍微改改：

```dart
val storageUrl: String = System.getenv("FLUTTER_STORAGE_BASE_URL") ?: "https://storage.googleapis.com"
repositories {
    maven(uri("E:\Code\Android\hybrid_flutter\build\host\outputs\repo"))
    maven(uri("$storageUrl/download.flutter.io"))
}
```dart

添加完aar依赖，Sync Projct不报错，就可以正常运行了~

## 3. 混合栈管理

说完混编方案，接着说下「**混合栈管理**」，即：如何处理交替出现的 **Native页面** 和 **Flutter页面**，市面上的常见方案主要分为两类：

* **单引擎**：App中只创建和维护一个Flutter Engine实例，所有Flutter页面都共享这个引擎实例，
* **多引擎**：为每个Flutter页面都创建一个独立的引擎实例。

每个 **Flutter Engine** 都运行在自己的 **Dart VM** 中，拥有自己的 **主Isolate** (或者叫UI Isolate，它负责运行Dart代码，包括UI渲染和事件处理)。**每个Isolate都有自己的内存堆和事件循环**，即 Isolate间 **不共享内存**，它们需要通过 **消息传递** 来进行通信。对 Isolate 不了解的同学可以先看下我之前写的💁‍♂️**《八、进阶-异步编程速通🧨》**。

🧐 经过前面的学习，我们知道Flutter项目实际上是绘制在一个 **SurfaceView** 上的，FlutterActivity 和 FlutterFragment 只是「**承载SurfaceView的容器**」，Flutter页面间的跳转，本质上只是「**切换Surface渲染显示**」。🤔 问：那 **Flutter页面怎么跳原生页面**？答：通过 **平台通道**。写个简单示例：

```dart
// ① Flutter端 → 创建MethodChannel，定义一个函数传递方法调用
import 'package:flutter/services.dart';

class NativeCodeRunner {
  // 创建一个MethodChannel，通道名称需要与原生端匹配
  static const MethodChannel _channel = MethodChannel('cn.coderpig.channel/native');

  // 定义一个函数用于打开原生Activity
  static Future<void> openNativeActivity() async {
    try {
      final String result = await _channel.invokeMethod('openActivity');
      print(result);
    } on PlatformException catch (e) {
      print("Failed to open native activity: '${e.message}'.");
    }
  }
}

// ② Android原生 → 自定义FlutterActivity，重写configureFlutterEngine处理Flutter发送过来的方法调用
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    private val CHANNEL = "cn.coderpig.channel/native"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                if (call.method == "openActivity") {
                    // 在这里启动你的Activity
                    val intent = Intent(this, YourNativeActivity::class.java)
                    startActivity(intent)

                    // 可选：向Flutter返回结果
                    result.success("Activity opened")
                } else {
                    result.notImplemented()
                }
            }
    }
}

// ③ Flutter端调用
ElevatedButton(
  onPressed: () {
    NativeCodeRunner.openNativeActivity();
  },
  child: Text('Open Native Activity'),
)
```dart

😄 了解完页面怎么互跳，接着捋下市面上的常见混合栈管理方案~

### 3.1. 官方 FlutterEngineGroup (多引擎方案)

[《Multiple Flutter screens or views》](https://docs.flutter.dev/add-to-app/multiple-flutters)中提到在Android和iOS中添加多个Flutter实例，主要使用API「**FlutterEngineGroup**」来构造Flutter引擎实例，而非前面使用的 **FlutterEngine的构造函数**。原因：

> 使用 FlutterEngineGroup 时，多个FlutterEngine 实例可以共享一些底层资源和配置 (如 GPU 上下文、字体度量(font mertics)、隔离的现场快照)，性能更佳，更快的首次渲染速度，更低的内存占用。

官方给了一个Demo → [multiple_flutters](https://github.com/flutter/samples/tree/main/add_to_app/multiple_flutters)

打开看看具体的玩法，看下Android原生端，自定义Application类初始化了一个 **FlutterEngineGroup** 实例：

```dart
import android.app.Application
import io.flutter.embedding.engine.FlutterEngineGroup

class App : Application() {
    lateinit var engines: FlutterEngineGroup

    override fun onCreate() {
        super.onCreate()
        engines = FlutterEngineGroup(this)
    }
}
```dart

接着定义了一个 **Flutter和Android共享** 的单例/可观察的DataModel：

```dart
interface DataModelObserver { fun onCountUpdate(newCount: Int) }

class DataModel {
    companion object { val instance = DataModel() }

    private val observers = mutableListOf<WeakReference<DataModelObserver>>()

    public var counter = 0
        set(value) {
            field = value
            for (observer in observers) {
                observer.get()?.onCountUpdate(value)
            }
        }

    fun addObserver(observer: DataModelObserver) { observers.add(WeakReference(observer)) }

    fun removeObserver(observer: DataModelObserver) {
        observers.removeIf {
            if (it.get() != null) it.get() == observer else true
        }
    }
}
```dart

然后是最核心的 **EngineBindings** ，在Android和Flutter端搭一个条"**桥**"，使得两端能够互相通信和数据同步：

```dart
import android.app.Activity
import io.flutter.FlutterInjector
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.engine.dart.DartExecutor
import io.flutter.plugin.common.MethodChannel

interface EngineBindingsDelegate {
    fun onNext()
}

class EngineBindings(activity: Activity, delegate: EngineBindingsDelegate, entrypoint: String) :
    DataModelObserver {
    val channel: MethodChannel
    val engine: FlutterEngine
    val delegate: EngineBindingsDelegate

    init {
        val app = activity.applicationContext as App
        // ① 创建 DartEntrypoint 实例，需要延迟加载，避免在FlutterEngineGroup创建前就创建它
        val dartEntrypoint =
            DartExecutor.DartEntrypoint(
                FlutterInjector.instance().flutterLoader().findAppBundlePath(), entrypoint
            )
        // ② 使用App中的FlutterEngineGroup实例-engines创建并运行一个Flutter Engine实例
        engine = app.engines.createAndRunEngine(activity, dartEntrypoint)
        this.delegate = delegate
        // ③ 初始化MethodChannel实例，通道名称为：multiple-flutters
        channel = MethodChannel(engine.dartExecutor.binaryMessenger, "multiple-flutters")
    }

    // 设置平台通道和 DataModel 的消息连接
    fun attach() {
        DataModel.instance.addObserver(this)
        channel.invokeMethod("setCount", DataModel.instance.counter)
        channel.setMethodCallHandler { call, result ->
            when (call.method) {
                "incrementCount" -> {
                    DataModel.instance.counter = DataModel.instance.counter + 1
                    result.success(null)
                }
                "next" -> {
                    this.delegate.onNext()
                    result.success(null)
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    // 移除平台通道和 DataModel 的消息连接
    fun detach() {
        engine.destroy();
        DataModel.instance.removeObserver(this)
        channel.setMethodCallHandler(null)
    }

    // DataModel 中的计数更新时，通过MethodChannel发送新的计数值，就通知Flutter端
    override fun onCountUpdate(newCount: Int) {
        channel.invokeMethod("setCount", newCount)
    }
}
```dart

接着是使用 **FlutterActivity** 来展示 Fluttre页面 → **SingleFlutterActivity**：

```dart
class SingleFlutterActivity : FlutterActivity(), EngineBindingsDelegate {
    private val engineBindings: EngineBindings by lazy {
        EngineBindings(activity = this, delegate = this, entrypoint = "main")
    }

    // 创建时建立与Flutter引擎的链接
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        engineBindings.attach()
    }

    // 销毁时断开与Flutter引擎的链接
    override fun onDestroy() {
        super.onDestroy()
        engineBindings.detach()
    }

    // 重写此方法确使用的是EngineBindings 创建的 FlutterEngine实例
    override fun provideFlutterEngine(context: Context): FlutterEngine? {
        return engineBindings.engine
    }

    // 接收Flutter端命令，原生端执行的操作，比如这里是打开MainActivity
    override fun onNext() {
        val flutterIntent = Intent(this, MainActivity::class.java)
        startActivity(flutterIntent)
    }
}
```dart

接着是使用两个垂直显示的 **FlutterFragment** 来展示Flutter页面 → **DoubleFlutterActivity**

```dart
class DoubleFlutterActivity : FragmentActivity(), EngineBindingsDelegate {
    // ① 定义两个EngineBindings来管理两个不同的Flutter引擎，懒加载初始化
    // 并指定定了不同的入口点 (加载并运行不同的Dart代码)
    private val topBindings: EngineBindings by lazy {
        EngineBindings(activity = this, delegate = this, entrypoint = "topMain")
    }
    private val bottomBindings: EngineBindings by lazy {
        EngineBindings(activity = this, delegate = this, entrypoint = "bottomMain")
    }
    private val numberOfFlutters = 2 // 显示Flutter视图的数量
    private val engineCountStart : Int	// 当前Activity的引擎计数起始值
    private companion object {
        var engineCounter = 0
    }

    init {
        engineCountStart = engineCounter
        engineCounter += numberOfFlutters
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this)
        root.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.MATCH_PARENT
        )
        root.orientation = LinearLayout.VERTICAL
        root.weightSum = numberOfFlutters.toFloat()

        val fragmentManager: FragmentManager = supportFragmentManager

        setContentView(root)

        for (i in 0 until numberOfFlutters) {
            val engineId = engineCountStart + i
            val containerId = 12345 + engineId
            val flutterContainer = FrameLayout(this)
            root.addView(flutterContainer)
            flutterContainer.id = containerId
            flutterContainer.layoutParams = LinearLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
                1.0f
            )
            // ② 根据不同的索引，把不同的引擎实例存储到FlutterEngineCache中，以便通过ID访问
            val engine = if (i == 0) topBindings.engine else bottomBindings.engine
            FlutterEngineCache.getInstance().put(engineId.toString(), engine)
            // ③ 使用缓存ID创建一个FlutterFragment实例
            val flutterFragment =
                FlutterFragment.withCachedEngine(engineId.toString()).build<FlutterFragment>()
            fragmentManager
                .beginTransaction()
                .add(containerId,flutterFragment)
                .commit()
        }
        // ④ 与两个Flutter引擎建立连接
        topBindings.attach()
        bottomBindings.attach()
    }

    override fun onDestroy() {
        // ⑤ 循环，通过引擎ID，从 FlutterEngineCache 移除引擎，调用deatch() 断开与引擎的连接。
        for (i in 0 until numberOfFlutters) {
            val engineId = engineCountStart + i
            FlutterEngineCache.getInstance().remove(engineId.toString())
        }
        super.onDestroy()
        bottomBindings.detach()
        topBindings.detach()
    }

    // 接收Flutter端命令，原生端执行的操作，比如这里是打开MainActivity
    override fun onNext() {
        val flutterIntent = Intent(this, MainActivity::class.java)
        startActivity(flutterIntent)
    }
}
```dart

MainActivity启动这两个Activity就不用说了，看下Flutter端打开Activity的相关代码：

```dart
// ① 三个不同的入口点
void main() => runApp(const MyApp(color: Colors.red));

@pragma('vm:entry-point')
void topMain() => runApp(const MyApp(color: Colors.green));

@pragma('vm:entry-point')
void bottomMain() => runApp(const MyApp(color: Colors.blue));

//
class _MyHomePageState extends State<MyHomePage> {
  int? _counter = 0;
  late MethodChannel _channel;

  @override
  void initState() {
    super.initState();
    // ① 初始化MethodChannel实例，设置原生调Flutter方法的具体实现，比如这里刷新值
    _channel = const MethodChannel('multiple-flutters');
    _channel.setMethodCallHandler((call) async {
      if (call.method == "setCount") {
        setState(() {
          _counter = call.arguments as int?;
        });
      } else {
        throw Exception('not implemented ${call.method}');
      }
    });
  }

  // ② 值+1，刷新原生的计数器 (执行方法调用)
  void _incrementCounter() {
    _channel.invokeMethod<void>("incrementCount", _counter);
  }

  @override
  Widget build(BuildContext context) {
    //...
    TextButton(onPressed: _incrementCounter,child: const Text('Add')),
    // ③ 调用原生跳页面的方法
    TextButton(
        onPressed: () {
          _channel.invokeMethod<void>("next", _counter);
        },
        child: const Text('Next'),
      ),
    }
    //...
}
```dart

🤔 然后有个问题：Flutter通过Channel与原生通信，每个端都需要维护一套 **协议规范**，多端协作容易出问题，比如某个MethodCall，Android实现了，iOS没实现，Flutter端调用就会报平台方法未定义的异常。对此，官方发布了 [pigoen](https://pub-web.flutter-io.cn/packages/pigeon/install) 库来帮我们解决这个问题 → **通过一套协议生成多端协议代码**。

😄 集成方法也很简单，键入命令：**dart pub add --dev pigeon** 装下库，或者打开 **pubspec.yaml** 添加库依赖：

```dart
dev_dependencies:
  pigeon: ^20.0.2
```dart

然后创建一个 **桥配置文件**，如 **pigeons/messages.dart**：

```dart
import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(PigeonOptions(
  /// Dart端
  dartOut: 'lib/pigeons/pigeon.dart',
  dartOptions: DartOptions(),
  // dart文件包名
  // dartPackageName: 'pigeon_example_package',
  // 文件头
  // copyrightHeader: 'pigeons/copyright.txt',

  /// Android端
  kotlinOut: './android/app/src/main/kotlin/cn/coderpig/plugins/CPFlutterBridget.kt',
  kotlinOptions: KotlinOptions(),
  // javaOut: 'android/app/src/main/java/cn/coderpig/plugins/CPFlutterBridget.java',
  // javaOptions: JavaOptions(),

  /// iOS端
  // objcHeaderOut: '../xxx/Flutter/CPFlutterBridget.h',
  // objcSourceOut: '../xxx/Flutter/CPFlutterBridget.m',
  // objcOptions: ObjcOptions(),
  // swiftOut: 'ios/Runner/CPFlutterBridget.g.swift',
  // swiftOptions: SwiftOptions(),

  /// Windows端
  /// cppOptions: CppOptions(namespace: 'pigeon_example'),
  //  cppHeaderOut: 'windows/runner/messages.g.h',
  //  cppSourceOut: 'windows/runner/messages.g.cpp',
))

/// 传递参数类型
class CommonParams {
  String? pageName;
  Map<String?, Object?>? arguments;
}

class ApiParams {
  String? url;
  Map<String?, Object?>? arguments;
}

/// 原生端提供的方法
@HostApi()
abstract class MessageHostApi {
  /// push至原生页面，参数：页面名称、参数
  void pushNativePage(CommonParams params);

  /// pop出当前页面，预留参数，可通过params.pageName pop到指定页面
  void popPage(CommonParams? params);

  /// 通过Key获取本地化文本数据（同步）
  String getLocalizedText(String? key);

  /// Flutter通过URL和arguments调用原生端接口，异步返回数据给Flutter端
  @async
  Map requestNativeApi(ApiParams apiParams);

  /// 是否允许开启Native页面的原生手势返回效果
  void enablePopRecognizer(bool enable);

}

/// Flutter端提供的方法
@FlutterApi()
abstract class MessageFlutterApi {
  String flutterMethod(String? aString);
}
```dart

执行 **dart run pigeon --input pigeons/message_api.dart** 生成相关文件，比如上面配置的Kotlin文件：

打开看下Android原生端，自动生成了一个接口：

flutter端：

pigeon自动帮我们实现了桥接方法，Android端实现MessageFlutterApi接口，按需重写对应方法即可，具体使用可以自行查阅下 [《Pigeon Examples》](https://github.com/flutter/packages/blob/main/packages/pigeon/example/README.md)。

😏 我们并没有采用官方的多引擎方案，主要是网上关于它的实践文章不多，怕踩坑，小团队写业务的人都不够用，哪还敢给自己挖坑啊。在掘金看到这篇踩坑记录的文章**《Flutter 多引擎渲染，在稿定 App 的实践（三）：躺坑篇》**，感兴趣可以看看~

### 3.2. 闲鱼 flutter_boost (单引擎方案)

😊 [flutter_boost](https://github.com/alibaba/flutter_boost) 是我们最终采用的混合栈管理方案，原因如下：

* 组内之前写的Flutter项目，就是用 **flutter_boost**，有踩过下小坑，但问题不大。
* 此次混编业务不复杂：**Flutter只用做渲染UI和处理交互逻辑，数据都来源于Native端(MethodChannel)** 。
* **flutter_boost** 代码开源透明，用户基数大，网上相关资料比较多，虽然有点issues，但一直有在迭代更新。

🤷‍♀️ 集成直接撸官方文档[《各平台安装》](https://github.com/alibaba/flutter_boost/blob/main/docs/install.md)，路由跳转得用它这套[《基本路由API部分》](https://github.com/alibaba/flutter_boost/blob/main/docs/routeAPI.md)，后续有时间扒下源码，贴个网上摘录的原理片段：

> 在页面切换时，Flutter View 与 Flutter Engine 进行attach和detach操作。页面导航由Native端驱动，根据其生命周期事件，通过 **Channel** 通知Flutter端响应页面上屏等逻辑。对于每个Flutter页面，Native端都会有一个 **FlutterViewContainer** 实例与之对应，Dart端则对应一个 **BoostContainer** 实例，两者由 **FlutterContainerManager** 进行管理，通过通信机制保持生命周期一致。哪个页面需要显示，Native端就将对应的 **FlutterViewContainer** Push进导航栈，同时将Flutter引擎attach上。

😑 说个自己在实际开发中踩的坑吧，也是弄了大半天才定位到问题... 就我们的表单录入，需要一个 **定时保存** 的功能，每隔5s，保存下用户录入的数据。😄 这不简单：

> **MethodChannel** 写个调原生读写文件的方法，定时器定时执行就好了

😊 不用五分钟就把代码写出来了：

```dart
/// 保存草稿
static Future<bool> saveDraft(int category, Map<String, dynamic> draftJson) async =>
    await _channel.invokeMethod('saveDraft', {'category': category, 'draftJson': draftJson});

/// 读取草稿
static Future<String> readDraft(int category) async =>
    await _channel.invokeMethod('readDraft', {'category': category});

/// 定时器混入类
mixin TimerMixin<T extends StatefulWidget> on State<T> {
  Timer? _timer;

  // Widget移除时取消定时器
  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void startTimer(Future<void> Function() callback) {
    if (_timer != null) {
      hblog("定时器初始化过了");
      return;
    }
    _timer = Timer.periodic(const Duration(seconds: 10), (Timer t) async {
      try {
        hblog("【${identityHashCode(_timer)}】执行异步任务");
        await callback();
      } catch (e) {
        hblog("定时任务执行异常：$e");
      }
    });
  }
}

/// 定时器混入类
mixin TimerMixin<T extends StatefulWidget> on State<T> {
  Timer? _timer;

  // 当Widget移除时取消定时器
  @override
  void dispose() {
    _timer?.cancel();
    _timer = null;
    super.dispose();
  }

  void startTimer(Future<void> Function() callback) {
    if (_timer != null) return;
    _timer = Timer.periodic(const Duration(seconds: 5), (Timer t) async {
      try {
        await callback();
      } catch (e) {
        print("定时任务执行异常：$e");
        t.cancel();
      }
    });
  }
}

/// 调用处
class _TestWidgetState extends State<TextWidget> with TimerMixin {
  @override
  initState() {
    super.initState();
    startTimer(() => saveData());
  }
}
```dart

 然后 **主项目** 一运行，BUG就来了：

* 刚打开APP，定时器就开始计时，TM，Flutter页面都还没打开啊😳？？？
* 而且有 **多个定时器** 实例在那里计时。

😥 em... 尝试下写个 **单例**？

```dart
/// 单例计时器
class SingletonTimer {
  static SingletonTimer? _instance;
  Timer? _timer;

  SingletonTimer._();

  static SingletonTimer get instance => _instance ??= SingletonTimer._();

  void startTimer(Future<void> Function() callback) {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 10), (Timer t) async {
      try {
        await callback();
      } catch (e) {
        print("Error in singleton timer: $e");
      }
    });
  }

  void cancelTimer() {
    _timer?.cancel();
  }
}
```dart

🤷‍♀️ 再次运行，还是同样的结果，然后单独运行 **Flutter模块**，定时器又能正常工作，em... 那大概率就是 **flutter_boost** 的坑了，在它的Github仓库搜了下issues，关键词：timer、定时器等，没有找到相关的话题，自己又改Flutter代码、断点、打Log，折腾了好一阵子都没定位到原因。

🤔 此时脑海突然想过一个念头💡，会不会是flutter_boost的使用方法不对，意外创建了多个对象？于是我又看回主项目的 **自定义Application** 类，集成方式和官方文档一模一样啊... 然后看到了云信SDK的初始化代码：

😳 判断主进程才初始化？卧槽，难不成是因为 **多进程导致onCreate()执行多次**，间接导致 **FlutterBoost.instance().setup()** 执行了多次？直接AS打开apk文件，定位到AndroidManifest.xml，搜索： **android:process="**

擦，给flutter_boost初始化部分的代码加上 **是否处于主进程的判断** 试试看：

```dart
// 判断当前进程是否为主进程
fun Context.isMainProcess() = this.packageName == this.getCurrentProcessName()

// 获取当前进程名称
fun Context.getCurrentProcessName(): String? {
    val pid = android.os.Process.myPid()
    val activityManager = this.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    for (appProcess in activityManager.runningAppProcesses) {
        if (appProcess.pid == pid) {
            return appProcess.processName
        }
    }
    return null
}

// 判断处于主进程才执行flutter_boost的初始化
if(this.isMainProcess()) {
  // 执行flutter_boost的初始化
}
```dart

😐 这样改，**创建多个定时器实例** 的问题是解决了，但 **刚打开App计时** 的问题依旧存在。一时也没啥方向，于是翻起了官方issues，然后看到了这个：[为什么应用初始化的时候默认会先生成一个空路由呢](https://github.com/alibaba/flutter_boost/issues/1521)：

❗️❗️❗️ 立马看下Flutter项目里路由出计划部分的代码，卧槽，在这里就创建了？

在这里打个Log，运行看日志，果然是App启动后就创建了，return改为返回另一个页面，运行再试试。😳 打开App时定时器没有开始计时，打开数据录入页面才开始计时，😂 就是这里的锅，真的坑 ❗️ 后面同事遇到一个页面退出Riverpod的Provider依旧存在的BUG也是这个原因...

### 3.3. flutter_thrio (单/多引擎)

[foxsofter/flutter_thrio](https://github.com/foxsofter/flutter_thrio)，亮点是 **支持Flutter混合栈跨栈路由**，与 **flutter_boost** 每次 **页面切换** Native端都会创建一个新的页面放入导航栈不同，**flutter_thrio** 的 Flutter页面内部的切换由 **Flutter** 自带的Navigator 来管理，Native 端导航栈不创建对应的页面容器，这样做的好处是节省部分内存。**flutter_thrio** 的 **三端的页面切换** 逻辑非常统一，均采用基于url进行页面跳转。工作模式既支持单引擎，也支持多引擎，而且不存在对引擎带代码的侵入式更改。目前有再更新，💁‍♂️ 库的优劣，README.md 已经说得很详细了，感兴趣的读者可自行测试~

### 3.4. 其它

* [《即将开源 | 让Flutter真正支持View级别的混合开发》](https://mp.weixin.qq.com/s/-vyU1JQzdGLUmLGHRImIvg)🌚 2019的文章，现在也没看到开源...
* [《Flutter混合栈路由实践与优化》](https://cloud.tencent.com/developer/article/1805711)🌚 腾讯心悦的TRouter方案，同样没开源...
* [gtbluesky/fusion](https://github.com/gtbluesky/fusion)：单引擎，亮点是：应用在后台被系统回收，所有Flutter页面均可正常恢复，而且适配了HarmonyOS 5.0(12)+🐂。
* [wangkunhui/min_stack_manager](https://github.com/wangkunhui/min_stack_manager)：单引擎，混合栈的最小实现，代码稍微简单点，想自己折腾可以借鉴~

## 4. 架构 & 状态管理

😄 个人感觉，**Flutter** 天然适合 **MVVM** 架构，Flutter 的架构设计就强调了组件(Widget)的 **声明式UI** 和 **响应式编程模型**，这与 MVVM 中的 **数据绑定** 和 **UI自动更新** 非常契合。

* **Model**：数据层，**负责数据/状态的管理** (如数据的获取、存储、修改等操作)。
* **View**：视图层，Flutter中由一系列的Widget组成，负责展示应用UI，并接收用户操作，但不直接处理业务逻辑，而是将用户操作转发给ViewModel来处理。
* **ViewModel**：连接View和Model的桥梁，从Model层获取数据，处理业务逻辑，然后以合适的形式提供给View。通过 **数据绑定**，可以使得 Model 的变化自动反应到View上，同时也处理来自View的用户操作。Flutter中，通常是一个以 **ChangeNotifier** 或其它状态管理方案(如Riverpod、Bloc 等)实现的类。

😁 Talk is cheap, show you the code. 基于 **MVVM模式** 写个最简单的计数器例子，让大伙感受下 **业务逻辑** 和 **UI** 的分离，先是 **Model** → 存储数据/状态和业务逻辑：

```dart
class CounterModel {
  int _counter = 0;

  int get counter => _counter;

  void increment() {
    _counter++;
  }
}
```dart

接着是 **ViewModel**，这里不使用 **ChangeNotifier**，而是手动管理监听器：

```dart
import 'counter_model.dart';

class CounterViewModel {
  final CounterModel _model = CounterModel();
  Function()? _onChanged;

  int get counter => _model.counter;

  void increment() {
    _model.increment();
    _onChanged?.call();
  }

  // 添加监听器
  void addListener(Function() listener) {
    _onChanged = listener;
  }

  // 移除监听器
  void removeListener() {
    _onChanged = null;
  }
}
```dart

最后是 **View** → 用 StatefulWidget 来管理 ViewModel实例，并在合适的时机调用 **setState()** 来更新 UI：

```dart
import 'package:flutter/material.dart';
import 'counter_view_model.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(home: CounterPage());
  }
}

class CounterPage extends StatefulWidget {
  @override
  _CounterPageState createState() => _CounterPageState();
}

class _CounterPageState extends State<CounterPage> {
  final CounterViewModel _viewModel = CounterViewModel();

  @override
  void initState() {
    super.initState();
    _viewModel.addListener(() {
      // 当 ViewModel 通知更新时，调用 setState 更新 UI
      setState(() {});
    });
  }

  @override
  void dispose() {
    _viewModel.removeListener();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('MVVM without Provider')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text('您点击按钮的次数:'),
            Text(
              '${_viewModel.counter}',
              style: Theme.of(context).textTheme.headline4,
            ),
            ElevatedButton(
              onPressed: () => _viewModel.increment(),
              child: Text('增加'),
            ),
          ],
        ),
      ),
    );
  }
}
```dart

当然，上述代码只是用于演示，实际开发中妥妥得上 **状态管理库**，这里我们选的 [Riverpod](https://riverpod.dev/)，主要还是组员更熟悉这个库🐶，虽然官方文档写得有点乱，但不妨碍这个库的好用，前提是你弄清楚具体怎么用🤷‍♀️。想了解这个状态管理库的童鞋，墙裂建议阅读下我之前些的**《十五、玩转状态管理之——Riverpod使用详解》**和 **《十七、实战进阶-用 ViewModel 来分离 UI & 逻辑》**。😄 分享两个遇到的UI问题，感觉读者也可能会遇到~

### 4.1. Q1：Riverpod + ListView 数据改变UI刷新

🤔 数据改变可细分为 **列表长度** 和 **列表项内容** 的变化，随手写个简单Demo：

```dart
/// test_list_model.dart
class TestListModel {
  List<ListItemModel> list;

  TestListModel({required this.list});
}

class ListItemModel {
  String title;
  String subTitle;

  ListItemModel({required this.title, required this.subTitle});
}

/// test_list_vm.dart
import 'package:xxx/test/list/test_list_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'test_list_vm.g.dart';

@riverpod
class TestListVM extends _$TestListVM {
  @override
  TestListModel build() => TestListModel(list: [
        ListItemModel(title: 'title1', subTitle: 'subTitle1'),
        ListItemModel(title: 'title2', subTitle: 'subTitle2'),
        ListItemModel(title: 'title3', subTitle: 'subTitle3'),
        ListItemModel(title: 'title4', subTitle: 'subTitle4'),
        ListItemModel(title: 'title5', subTitle: 'subTitle5'),
        ListItemModel(title: 'title6', subTitle: 'subTitle6'),
        ListItemModel(title: 'title7', subTitle: 'subTitle7'),
        ListItemModel(title: 'title8', subTitle: 'subTitle8'),
        ListItemModel(title: 'title9', subTitle: 'subTitle9'),
        ListItemModel(title: 'title10', subTitle: 'subTitle10')
      ]);

  // 移除列表项
  void removeItem(int index) {
    if(index < 0 || index >= state.list.length) return;
    state.list.removeAt(index);
  }

  // 更新列表项内容
  void updateItem(int index) {
    if(index < 0 || index >= state.list.length) return;
    state.list[index].subTitle = "${DateTime.now().millisecondsSinceEpoch}";
  }
}

/// test_list_page.dart
import 'package:flutter/material.dart';
import 'package:xxx/flutter_riverpod.dart';
import 'package:xxx/test/list/test_list_model.dart';
import 'package:xxx/test/list/test_list_vm.dart';

void main() {
  runApp(const ProviderScope(child: TestListRefreshPage()));
}

class TestListRefreshPage extends ConsumerStatefulWidget {
  const TestListRefreshPage({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _TestListRefreshState();
}

class _TestListRefreshState extends ConsumerState<TestListRefreshPage> {
  late TestListModel model;
  late final vm = ref.read(testListVMProvider.notifier);

  @override
  Widget build(BuildContext context) {
    model = ref.watch(testListVMProvider);
    return MaterialApp(
        title: 'TestListRefresh',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
          useMaterial3: true,
        ),
        home: Scaffold(
          appBar: AppBar(
            title: const Text('TestListRefresh'),
          ),
          body: Column(
            children: [
              Expanded(
                child: ListView.builder(
                  itemCount: model.list.length + 1,
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      return _buildHeader();
                    } else {
                      return _buildItem(index - 1);
                    }
                  },
                ),
              )
            ],
          ),
        ));
  }

  // 构建表头
  Widget _buildHeader() {
    return Container(alignment: Alignment.center, child: const Text("表头"));
  }

  // 构建列表项
  Widget _buildItem(index) {
    return ListTile(
      title: Text(model.list[index].title),
      subtitle: Text(model.list[index].subTitle),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              // 更新列表项
              vm.updateItem(index);
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: () {
              // 移除列表项
              vm.removeItem(index);
            },
          ),
        ],
      ),
    );
  }
}
```dart

运行效果如下：

此时点击列表项的 **编辑和删除按钮** 却没任何变化，因为没有赋予 **.state属性** 一个 **新值**，Riverpod 通过 **等值比较** 来判断 **新旧值是否相等**，从而决定 **是否通知监听器并触发UI重建**。**基本数据类型** int、double、String等)，==比较的是 **值的相等**，而 **自定义对象**，默认比较的是 **两个对象是否为同一个实例**。当然，你可以 **重写==操作符和hashCode属性** 来定制自定义对象的等值比较。所以，修改下上述代码，给 **.state** 赋一个新值即可解决：

😄 OK了，点击删除和编辑都能正常刷新列表，不过这种直接创建新对象的方法，你需要指定所有字段的值，即便大多数字段的值没发生变化。一种常规解法是，定义 **copyWith()** 方法创建当前对象的一个副本，并修改需要变化的属性。

```dart
class TestListModel {
  List<ListItemModel> list;

  TestListModel({required this.list});

  // 定义copyWith()
  copyWith({List<ListItemModel>? list}) => TestListModel(list: list ?? this.list);
}

// 调用处
state = state.copyWith(list: state.list);
```dart

😆 当对象属性很多时，手写copyWith()同样会写到头皮发麻🤣，建议搭配 [freezed](https://pub.dev/packages?q=freezed) 库来简化Model类的定义，它可以自动生成==、hashCode()、toString()、copyWith() 等方法，极大减少了样板代码的数量。改改Model类：

执行 **flutter pub run build_runner build --delete-conflicting-outputs** 生成相关代码，回到 **TestListVM**，代码却报错了：

错误信息：

点进去发现freezed只生成了属性的get方法，并没有生成set方法：

🤷‍♀️ 因为 **freezed** 的核心设计理念是 **帮助开发者创建不可变的数据模型**，强制使用 **copyWith()** 来更新对象，以增强代码的安全性和可维护性。😏 如果希望使用 **freezed** 生成相关代码，**属性是可变的**，可以使用 [@unfreezed](https://github.com/rrousselGit/freezed/blob/master/resources/translations/zh_CN/README.md) 注解，对于不可变的属性可以标记为 **final**，生成的代码不会重写==和hashCode。修改后的代码：

修改完运行，编辑可以，删除又报错了：

原因很清楚：**试图从一个不可修改的列表中删除元素**，state.list 是一个不可修改的列表，我们可以新建一个包含原列表所有元素的列表，然后在新列表上进行修改操作。修改后的代码：

😀 然后点击删除也能正常刷新啦，功能虽然实现了，但并不是最优，在构建列表项的 **_buildItem()** 加个打印日志，可以发现对 **单个列表项** 的编辑操作，触发了整个ListView的重建：

其中一种解法是为 **每个列表项定义一个Provider**:

```dart
@riverpod
class ListItemVM extends _$ListItemVM {
  @override
  ListItemModel build(String title, String? subTitle) => ListItemModel(title: title, subTitle: subTitle ?? '');

  void updateItem() {
    state = state.copyWith(subTitle: "${DateTime.now().millisecondsSinceEpoch}");
  }
}
```dart

修改下构建列表项处的代码：

😄 运行后，点击编辑，只有对应的列表项会触发刷新，在长列表的场景有助于提高性能。

### 4.2. Q2：ListView中的同类型Widget错误关联State

**场景**：页面ListView中有多个相同类型的自定义多选组件 (每行最多三个)，根据状态变化，需要控制控制显示隐藏。没有使用Visibilty组件包裹，直接 if(xxx) 条件成立，创建对应多选组件。

**结果**：A组件有3个选项，B组件有6个选项，状态改变列表刷新，条件不成立，不创建A组件，创建B组件。然后发现，B组件只有前3个选项能点击，后面3个选项没法点击。

💁‍♂️ **《十、进阶-玩转各种Key🔑》**已经说过这个问题，给组件定义一个Key即可解决~

简述下 **Widget树重建** 涉及到的方法调用流程：

* **更新Element**：Flutter框架会遍历Widget树，对于每个Widget，通过调用 **Element.update()** 来决定是否需要更新该Widget对应的Element。
* **Widget比较**：**Element.update()** 中会调用 **Widget.canUpdate()** 来比较新旧Widget是否相同，判断依据是新旧Widget的 **key和runtimeType**，两者都相同，**canUpdate()** 返回true，表示 **复用旧的Element**，只更新下关联的Widget。

## 5. 调试

### 5.1. Flutter模块-热重载

**关闭应用 (需要杀进程)** ，在「**Flutter模块**」终端输入命令「**flutter attach**」出现如下输出：

打开应用，稍等片刻会出现下述内容：

😄 修改完flutter代码，输入r就能使用flutter的热重载啦：

### 5.2. Flutter模块-断点调试

Android Studio 打开「**Flutter模块**」的代码，下断点，然后点击「**Flutter Attach**」的按钮：

执行到断点代码就会弹出调试相关的信息啦~

## 6. 打包APK

### 6.1. 源码集成

😆 这种集成方式，如果能在手机上运行，**本地手动打包** 基本是没问题的，就是麻烦，可以安排下 **CI(持续集成)** 自动打包，在编译主项目前，先拉取下最新的 **flutter模块代码** 执行相关进行构建，最后再编译主项目。大概的脚本如下：

```dart
# 获取当前脚本的绝对路径及父目录
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PARENT_DIR=$(dirname "$SCRIPT_PATH")

if [ ! -d "$SCRIPT_PARENT_DIR/flutter项目" ]; then
    echo "Flutter子项目不存在，开始Clone"
    git clone http://git.xxx.xxx.com/xxx/xxx/flutter项目.git "$SCRIPT_PARENT_DIR/flutter项目"
    echo "Fluter子项目Clone完毕"
fi
# CD到项目中，拉取最新代码
cd "$SCRIPT_PARENT_DIR/flutter项目"
git checkout .
git checkout develop
git pull --rebase origin develop

# flutter sdk 的路径
FLUTTER_CMD="/Users/xxx/flutter/bin/flutter"
# 执行flutter构建相关命令，后面是我用到的 build_runner 来生成.g.dart等文件
$FLUTTER_CMD pub get && $FLUTTER_CMD  pub run build_runner build --delete-conflicting-outputs

# 主项目构建
cd "$SCRIPT_PATH/主项目"
bash gradlew clean
bash gradlew assemble
```dart

### 6.2. AAR集成

先明确一点：

> **Android Library** 依赖了其它三方库，对于 **project** 和 **远程依赖** 只会打包引用而不会打包源码和资源 ❗️

比如我们的项目执行 **flutter build aa**r 后就生成了4个AAR：

#### 6.2.1. 多AAR依赖

就是批量把生成的AAR都Push到Maven仓库，然后 **原生主项目** 再添加上第三方依赖(远程或本地)，有需要的可以借鉴下这个脚本自由发挥，比如：变化的aar其实只有 **flutter模块**，其它aar版本号没变就不push~

```dart
flutter build aar

# 项目根目录
ROOT_PROJECT_PATH=$(cd "$(dirname "$0")"; pwd)
# repo目录
REPO_DIR=$ROOT_PROJECT_PATH/build/host/outputs/repo
# 初始化一个空数组来存储匹配的文件路径
aar_files=()

# 查找并处理匹配的文件
while IFS= read -r aar_file; do
    aar_files+=("$aar_file")
done < <(find "$REPO_DIR" -type f -name "*.aar" | grep 'release-[0-9.]*.aar$')

# Maven仓库信息，可以单独为每个aar文件设置
GROUP_ID="cn.coderpig"
ARTIFACT_ID="mylibrary"
VERSION="1.0.0"
LOCAL_REPO_PATH="$ROOT_PROJECT_PATH/repo"

# 遍历aar上传到Maven仓库
for aar_file in "${aar_files[@]}"; do
    mvn deploy:deploy-file \
        -Dfile="$aar_file" \
        -DgroupId="$GROUP_ID" \
        -DartifactId="$ARTIFACT_ID" \
        -Dversion="$VERSION" \
        -Dpackaging=aar \
        -Durl=file://$LOCAL_REPO_PATH
done
```dart

#### 6.2.2. 把多个AAR包打成一个

😄 不用搜了，全网都是教你用 [kezong/fat-aar-android](https://github.com/kezong/fat-aar-android) 来打一个完整的AAR：

作者已弃坑，最新一次commit也是2年前了，相关文章很多，就不赘述了，感兴趣可以参考下这几篇：

* [《Android 多个aar包合并成一个》](https://blog.csdn.net/weixin_37961937/article/details/131609738)
* [《Android多设备多module打包（fat-aar）》](https://blog.csdn.net/ppss177/article/details/129692888)
* **《多个AAR打包成一个AAR》**

## 7. 小结

😫 断断续续写了一周，总算把这篇文章写完了，看完应该会对想搞混编的童鞋有帮助。当然，实际开发中踩的远不止这些，收集下比较典型的，后续再整理下跟大家分享吧，就酱，感谢🙏~

**参考文献**：

* **《Flutter混编方案在起点客户端的实践之路》**
* **《Flutter 多引擎渲染，在稿定 App 的实践》**
* [《混合开发打包Android篇》](https://guoshuyu.cn/home/wx/Flutter-14.html)
* **《flutter和原生利用pigeon建立通道》**
* [《Flutter混合栈管理方案对比》](https://blog.csdn.net/holyli1134516796/article/details/136434006)
* [《Flutter Boost3.0初探》](https://zhuanlan.zhihu.com/p/362662962)
* **《一款零侵入的高效Flutter混合栈管理方案，你值得拥有！》**
* [《Flutter混合栈管理》](https://blog.csdn.net/u013038616/article/details/126547880)
* [《{已开源} 阅文 Flutter 混合开发利器 MixStack》](https://julis.wang/2021/02/26/MixStack/)