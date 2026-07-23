---
title: "Flutter入门到精通（二十五）：Flutter Channel原理探秘"
pubDate: 2024-01-26
description: "Flutter三种Channel机制详解，MethodChannel、EventChannel、BasicMessageChannel。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第二十五篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言
 常说 **Flutter** 的本质是一套「**UI框架**」，解决的是「**一套代码在多端的渲染**」，而涉及到 跨平台，必然绕不过 **跨端通信**， Flutter 官方给开发者提供了 **Platform Channel**，用于实现 Dart 与 **不同平台** 间的相互通信。

**Channel** 的类型主要有三种，分别适用于不同的通信场景：
- **MethodChannel**：主要方式，**调用原生方法并接收返回值**，适合一次性调用。
- **EventChannel**：**事件流/数据流的持续通信**，如监听传感器数据。
- **BasicMessageChannel**：传递 **字符串或二进制信息**，适合 **双向通信**、**快速连续传递简单数据**。
🤔 实际开发中App业务很少是 **纯UI** 的，基本都会涉及到 **Flutter与原生平台的通信**，举个例子🌰 → 图片上传需要选择手机里的图片。所以了解 **Flutter Channel 相关的 API 用法** & **了解背后的实现原理** 还是很重要的，本节我们就来深入学习下相关的姿势。
## 2. API 使用详解
### 2.1. MethodChannel
#### 2.1.1. 使用示例
写个 **Flutter调原生弹Toast** 的例子，先是 **Flutter端**：
```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
void main() {
runApp(const MyApp());
}
class MyApp extends StatelessWidget {
// 💡 创建 MethodChannel 实例 (配置通道名称)
static const platform = MethodChannel('cn.coderpig.cp\_flutter\_anim\_demo');
const MyApp({super.key});
@override
Widget build(BuildContext context) {
return MaterialApp(
home: Scaffold(
appBar: AppBar(
title: const Text('MethodChannel Demo'),
),
body: Align(
alignment: Alignment.center,
child: ElevatedButton(
onPressed: \_showToast,
child: const Text('弹Toast'),
),
),
),
);
}
// 💡 MethodChannel使用的是异步通信
Future \_showToast() async {
// 💡 调用原生方法
final String result = await platform.invokeMethod('showToast', 'Flutter调原生弹Toast');
print(result);
}
}
```dart
**Android端**：
```kotlin
import android.widget.Toast
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
class MainActivity: FlutterActivity() {
companion object {
// 💡 通道名称
const val CHANNEL = "cn.coderpig.cp\_flutter\_anim\_demo"
}
// 💡 FlutterEngine配置
override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
super.configureFlutterEngine(flutterEngine)
// 💡 注册 MethodChannel
MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
// 💡 判断调用的方法名
if (call.method == "showToast") {
// 💡 获取参数
val message = call.arguments as? String
if (message != null) {
Toast.makeText(this, message, Toast.LENGTH\_SHORT).show()
// 💡 返回结果
result.success("Toast showed")
}
}
}
}
}
```dart
**运行结果如下**：

**梳理下使用流程**：
- ① **Flutter 端**：创建 **MethodChannel** 实例 (配置通道名称)，通过 **异步** 调用 **invokeMethod(方法名，参数) 来**调用平台方法，并对平台端的返回结果进行处理。
- ② **Android 端**：继承 **FlutterActivity**，重写 **configureFlutterEngine()** 在其中注册 **MethodChannel**，对调用的方法名进行判断，读取 **参数** 执行相关操作，然后通过 **result.success()** 返回结果给Flutter端。
😄 看完基本用法，接着讨论下封装，毕竟 MethodChannel 是用得最多的一种Channel~
#### 2.1.2. Flutter端-封装示例
**Flutter端** 一般很少直接把MethodChannel相关的代码写在 **UI层**，而是抽取到一个单独的 **服务类** 中，方便 **复用** 和 **维护**。然后是常规需要捕获的 **两个异常**：
- **PlatformException**：**平台插件调用失败异常**，包含以下属性：**code** (错误代码，用于标识错误类型)、**message** (错误信息, String)、**details** (错误详细信息，dynamic)、**stacktrace** (平台的堆栈跟踪信息)。
- **MissingPluginException**：**未找到相应平台插件异常**，包含属性：**message** (错误信息)。
😏 其实，还有一个 **TypeError(类型转换异常)** 也建议做下处理，比如这样的代码：

如果原生端返回的数据不是 **String**，是会报错的：

😁 当然，也可以对 **其它异常** 也做下捕获 **兜底**，简单封装代码示例如下：
```dart
import 'package:flutter/services.dart';
class PlatformService {
static const MethodChannel \_platform = MethodChannel('cn.coderpig.cp\_flutter\_anim\_demo');
// 调用原生方法通用处理方法
static Future invokeMethod(String method, [dynamic arguments]) async {
try {
final T? result = await \_platform.invokeMethod(method, arguments);
return result;
} on PlatformException catch (e) {
print("PlatformException 通用处理: ${e.code} - ${e.message} - ${e.details} - ${e.stacktrace}");
return null;
} on MissingPluginException catch (e) {
print("MissingPluginException 通用处理: ${e.message}");
return null;
} on TypeError catch (e) {
print("TypeError 通用处理: ${e}");
return null;
} catch (e) {
print("未知异常 通用处理: $e");
return null;
}
}
// 调用原生弹Toast
static Future showToast(String message) => invokeMethod('showToast', message);
// 调用原生弹Dialog
static Future showDialog(String message) => invokeMethod('showDialog', message);
// 获取原生设备信息
static Future getDeviceInfo() => invokeMethod('getDeviceInfo');
}
```dart
**调用处**：

**Android** 端：

**运行结果如下**：

😆 根据错误提示，把 **getDeviceInfo()** 的泛型改成 **Map?** 就能获取到正确的结果啦：

#### 2.1.3. Android端-封装示例
😄 Android 端也可以做下封装，先是把 **MethodChannel** 相关逻辑从 **FlutterActivity** 抽取出来：

随着项目开发，**method** 会越来越多，一长串的判断，可能会导致代码的 **可读性降低**，可以把具体的逻辑抽取成单个 **方法**：

😊 当然，也可以抽得更彻底，直接定义 **接口**，然后每个 **Method** 各自实现接口：

 如果想再折腾的话，可以搞下 **枚举** 或 **密封类(scaled)** ，把 **when** 判断逻辑转移到内部，通过 **遍历/反射** 的方式来进行 **动态条件匹配**，增删 **Method** 就不用改判断逻辑了。
💁‍♂️ MethodChannel 这种玩法有点像 **网络调用**，Flutter 是 **客户端**，平台端是 **服务端**，可以借鉴后端那一套，统一制定 **通信协议**，如：消息传输都走Json，然后无论调用成功与否，都返回 **Rest API** 风格的响应格式，类似这样：
```json
// 成功
{
"code": 200,
"msg": "Success",
"data": {
"id": 1,
"version": "12",
"email": " Mi MIX 2S"
}
}
// 异常
{
"code": 400,
"msg": "错误请求参数",
"data": {}
}
```dart
这样做的好处是，**Flutter 端** 可以对响应结果进行 **统一解析处理**。
#### 2.1.4. Android 调 Flutter 端
💁‍♂️ 有时可能有 **Android端主动调Flutter端** 的需求，也顺带写下代码示例，先是 **Android** 端：

然后是 **Flutter** 端：

运行后，点击按钮，**Android** 端收到 **Flutter** 端返回的数据：

### 2.2. EventChannel
#### 2.2.1. 使用示例
写个 **Flutter监听Android陀螺仪数据** 的例子，先是 **Android** 端：
```kotlin
// 💡继承 EventChannel.StreamHandler 接口，实现 onListen 和 onCancel 方法
class GyroscopeEventChannelHandler(private val context: Context) : EventChannel.StreamHandler, SensorEventListener {
private var sensorManager: SensorManager? = null
private var gyroscope: Sensor? = null
private var eventSink: EventChannel.EventSink? = null // 事件通道
// 💡 Flutter 端开始监听EventChannel 时调用
override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
eventSink = events
// 获得传感器管理器
sensorManager = context.getSystemService(Context.SENSOR\_SERVICE) as SensorManager
// 获得陀螺仪传感器
gyroscope = sensorManager?.getDefaultSensor(Sensor.TYPE\_GYROSCOPE)
// 注册监听器
sensorManager?.registerListener(this, gyroscope, SensorManager.SENSOR\_DELAY\_NORMAL)
}
// 💡 Flutter 端停止监听EventChannel 时调用
override fun onCancel(arguments: Any?) {
// 取消监听器
sensorManager?.unregisterListener(this)
// 释放资源
eventSink = null
}
// 传感器数据变化时调用
override fun onSensorChanged(event: SensorEvent?) {
event?.let {
val gyroscopeData = mapOf(
"x" to it.values[0],
"y" to it.values[1],
"z" to it.values[2]
)
eventSink?.success(gyroscopeData)
}
}
override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
class MainActivity : FlutterActivity() {
companion object {
// 💡 通道名称
const val GYROSCOPE\_CHANNEL = "cn.coderpig.cp\_flutter\_anim\_demo/gyroscope"
}
// 💡 FlutterEngine 配置
override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
super.configureFlutterEngine(flutterEngine)
EventChannel(
flutterEngine.dartExecutor.binaryMessenger,
GYROSCOPE\_CHANNEL
).setStreamHandler(GyroscopeEventChannelHandler(this))
}
}
```dart
**Flutter** 端：
```dart
// 💡 初始化监听Channel + 监听原生端传过来的数据
class GyroscopeStreamHandler {
// 💡 初始化监听陀螺仪的MethodChannel
static const EventChannel \_eventChannel = EventChannel('cn.coderpig.cp\_flutter\_anim\_demo/gyroscope');
static Stream> get gyroscopeStream {
// 💡 监听陀螺仪数据
return \_eventChannel.receiveBroadcastStream().map((event) => Map.from(event));
}
}
import 'package:flutter/material.dart';
import 'gyroscope\_stream\_handler.dart';
void main() {
runApp(const MyApp());
}
class MyApp extends StatelessWidget {
const MyApp({super.key});
@override
Widget build(BuildContext context) {
return const MaterialApp(
home: GyroscopePage(),
);
}
}
class GyroscopePage extends StatefulWidget {
const GyroscopePage({super.key});
@override
State createState() => \_GyroscopePageState();
}
class \_GyroscopePageState extends State {
Map? \_gyroscopeData;
@override
void initState() {
super.initState();
// 💡 监听陀螺仪数据
GyroscopeStreamHandler.gyroscopeStream.listen((data) {
setState(() {
\_gyroscopeData = data;
});
},
onDone:(){
// 流关闭时回调
},
onError:(error) {},
// 流中发生错误时回调
);
}
@override
Widget build(BuildContext context) {
return Scaffold(
appBar: AppBar(
title: const Text('陀螺仪数据'),
),
body: Center(
// 💡 显示陀螺仪数据
child: \_gyroscopeData == null
? const Text('无数据')
: Text('X: ${\_gyroscopeData!['x']}\nY: ${\_gyroscopeData!['y']}\nZ: ${\_gyroscopeData!['z']}'),
),
);
}
}
```dart
**运行结果如下**：

**梳理下使用步骤**：
- ① **Flutter** 端：创建 **EventChannel** 实例，通过 **receiveBroadcastStream** 接收原生平台的数据流，并转换为Dart 中的 **Stream**。
- ② **Android** 端：实现 **EventChannel.StreamHandler** 接口，来处理数据流的 **创建(onListen)** 和 **销毁(onCancel)** 。
- ③ **FlutterActivity子类** 或 **插件注册类** 中 **注册EventChannel**，然后通过 **EventSink** 实例发送数据，三个可选方法：成功-**success**(Object)，错误-**error**(errorCode, errorMessage, errorDetails) 和 **流结束**-endOfStream() Flutter端会触发 **onDone()** 回调，不再接收任何新事件。
### 2.3. BasicMessageChannel
#### 2.3.1. 使用示例
写个 **Flutter端点击按钮向原生端发消息，原生端计数并返回** 的例子，先是 **Flutter端** 代码：
```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
void main() {
runApp(const MyApp());
}
class MyApp extends StatelessWidget {
const MyApp({super.key});
@override
Widget build(BuildContext context) {
return const MaterialApp(
home: MyHomePage(),
);
}
}
class MyHomePage extends StatefulWidget {
const MyHomePage({super.key});
@override
State createState() => \_MyHomePageState();
}
class \_MyHomePageState extends State {
late BasicMessageChannel \_channel;
String? \_response;
@override
void initState() {
super.initState();
// 💡 初始化 Channel
\_channel = const BasicMessageChannel('basic\_channel', StringCodec());
}
void \_sendMessage() async {
// 💡 给原生端发送消息，并获取返回值刷新
final String? reply = await \_channel.send('increment');
setState(() {
\_response = reply;
});
}
@override
Widget build(BuildContext context) {
return Scaffold(
appBar: AppBar(
title: const Text('BasicMessageChannel 示例'),
),
body: Center(
child: Column(
mainAxisAlignment: MainAxisAlignment.center,
children: [
Text('原生端响应: ${\_response ?? '暂无数据'}'),
const SizedBox(height: 20),
ElevatedButton(
onPressed: \_sendMessage,
child: const Text('发送消息'),
),
],
),
),
);
}
}
```dart
**Android** 端：
```kotlin
class MainActivity : FlutterActivity() {
private lateinit var messageChannel: BasicMessageChannel // 懒加载BasicMessageChannel
private var counter = 0 // 计数器
override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
super.configureFlutterEngine(flutterEngine)
// 💡 创建 BasicMessageChannel
messageChannel =
BasicMessageChannel(flutterEngine.dartExecutor.binaryMessenger, "basic\_channel", StringCodec.INSTANCE)
// 💡 设置消息处理器
messageChannel.setMessageHandler { message, reply ->
// 处理来自 Flutter 的消息
if (message == "increment") {
counter++
Toast.makeText(this, "收到Flutter端的信息，当前计数器值: $counter", Toast.LENGTH\_SHORT).show()
reply.reply("计数器值: $counter")
} else {
reply.reply("未知消息")
}
}
}
}
```dart
**运行结果如下**：

**梳理下使用步骤**：
- ① **Flutter** 端：创建 **BasicMessageChannel** 实例 (指定 **通道名称 & 编码器**)，通过该实例的 **send()** 向原生端发送消息，并处理返回结果。
- ② **Android** 端：创建 **BasicMessageChannel** 实例 (指定 **通道名称** & **编码器**)，调用 **setMessageHandler** 设置 **消息处理器**，处理来自 Flutter 端的消息，并调用 **reply.reply()** 返回结果给 **Flutter** 端。
## 3. MethodChannel 源码探秘
😁 **Channel** 的 使用 **API** 还是比较简单的，通信过程涉及到多个层，在 **跟源码** 前，先复习下 **《十一、Flutter UI框架🦐聊》**中提到的 **Flutter 架构层次图**：

对每层的职责有个基本的认识，阅读起源码来更利索，OK，直接开扒🏃‍♀️~
### 3.1. Framework 层
#### 3.1.1. MethodChannel
点开 **MethodChannel** 的源码，看下 **Structure** (类结构)：

各个 **invokeXxxMethod** 最终调用的都是 **_invokeMethod()** ：
```dart
Future \_invokeMethod(String method, { required bool missingOk, dynamic arguments }) async {
// 💡 根据传入的【method】和【arguments】创建一个【MethodCall】实例
// 💡 使用【codec.encodeMethodCall】将其编码为【ByteData】格式。
final ByteData input = codec.encodeMethodCall(MethodCall(method, arguments));
// 💡【kProfilePlatformChannels】变量用于控制是否启用平台通道的性能分析和统计
// 💡 判断此变量的值，true → \_ProfiledBinaryMessenger.sendWithPostfix()
// 💡 false -> binaryMessenger.send()
final ByteData? result =
kProfilePlatformChannels ?
await (binaryMessenger as \_ProfiledBinaryMessenger).sendWithPostfix(name, '#$method', input) :
await binaryMessenger.send(name, input);
// 💡 如果平台端返回结果为null，判断 missingOk 参数的值
// 💡 true 返回 null，💡 否则抛出 MissingPluginException 异常
if (result == null) {
if (missingOk) {
return null;
}
throw MissingPluginException('No implementation found for method $method on channel $name');
}
// 💡 平台端返回结果不为null，调用【codec.decodeEnvelope】解码结果，并转换为期望类型T?
return codec.decodeEnvelope(result) as T?;
}
```dart
🤔 逻辑还是比较清晰的，依次看看涉及到的类~
#### 3.1.2. MethodCall
从类结构不难看出它的作用 → **封装方法调用的信息 (方法名+参数)** ：

#### 3.1.3. MethodCodec
🙂 就 **方法调用 & 封装结果的编解码**：

抽象类，搜下 **codec =** 看下它的 **具体实现类**。
#### 3.1.4. StandardMethodCodec

调用 **StandardMessageCodec#writeValue()** 往 **buffer** 里写数据，点开源码：

🤔 em... 就是将 **Dart对象序列化** 并 **写入到WriteBuffer** 中，这是 **编码**，也看下 **解码** → **decodeEnvelope()** ：

跟下 **StandardMessageCodec#readValue()** ：

判断缓冲区是否有剩余数据，没有抛FormatException异常，表示消息已损坏。从缓存区读取一个 **无符号的8位整数** 作为 **类型标识**，然后调 **readValueOfType()** 根据这个 **类型标识** 从缓冲区中读取 **相应类型的值** 并返回。
#### 3.1.5. BinaryMessenger-信使
😄 了解完 **方法调用和封装结果的编解码**，接着就到具体怎么 **发送消息** 了，调的 **binaryMessenger.send()** ，跟下这个get方法：

不考虑性能分析，那就是调的 **_findBinaryMessenger()** 获取实例：

🤔 判断是否为 **Web环境** 且 **ServicesBinding.rootIsolateToken** 为 **null** (当前处于main isolate)，是-返回 BackgroundIsolateBinaryMessenger.instance 否-返回**ServicesBinding.instance.defaultBinaryMessenger**。我们通信的平台是 **移动端**，所以只关注后者。
😏 而这个 **ServicesBinding** 在前面的**《十一、Flutter UI框架🦐聊》**的 Flutter App 启动流程中就提到过了：

依次跟下代码：**ServicesBinding#initInstances()** → **createBinaryMessenger()** → **_DefaultBinaryMessenger._()** ：

前面调的是 **send()** 方法，跟一跟，最后定位到了 **__sendPlatformMessage()** ：

使用 **@Native注解**，说它是 **native方法**，即调用到 **Flutter引擎层**，**symbol** 是 native代码对应的 **函数名**，引擎层将 **底层C++代码** 包装成Dart代码，通过 **dart:ui** 暴露给 **Flutter框架层** 调用。🤿 好，**Framework层** 就跟到这，接下来我们往下游到 Engine 层～
### 3.2. Engine 层
[Github仓库-flutter/engine](https://github.com/flutter/engine)，🤷‍♀️ 源码几十个G，没有编译和调试引擎的需求，懒得clone了，直接在网页傻瓜硬看，先搜下 **symbol** 参数对应的函数名，发现👣，路径：**lib/ui/dart_ui.cc**：

通过阅读源码，不难知道这个文件的主要作用：
> 初始化 **dart:ui** 库，设置 **FFI** (外部函数接口) 本地函数解析器。
#### 3.2.1. **SendPlatformMessage()**
又搜了下 **SendPlatformMessage**，在 **lib/ui/window/platform_configuration.cc** 发现了它的具体实现：

> 💡 **注**：上面的 **GetTaskRunners().GetUITaskRunner()** 用于获取执行 **UI任务** 的 **Task Runner**，为的是保证回调函数在 **UI线程** 上执行，以避免线程安全问题，确保用户界面的更新操作在正确的线程上进行。
#### 3.2.2. **HandlePlatformMessage()**
它是一个 **函数**，看下定义部分的代码：

调的 **UIDartState** 对象的 **HandlePlatformMessage**()，跟一下 **lib/ui/ui_dart_state.cc**：

双击方法名检索引用处，第一个名字有 **embedder** 应该跟 **平台层** 有关，还没到，直接看第二个：

点开代码：

这个 **delegate_** 是 **Engine** 类的一个成员变量，用于引用 **Engine::Delegate** 的接口实现，它在构造函数中完成初始化，搜下 **OnEngineHandlePlatformMessage()** ，很明显就是这个 **shell/common/shell.cc**：

#### 3.2.3. OnEngineHandlePlatformMessage()

💡 获取 **platform_message_handler_** 的 **弱引用** 是为了避免 **异步任务中持有强引用**，导致潜在的内存泄露或悬挂指针问题。看下它是在哪完成赋值的：

**platform_view** 是在 **Shell::Setup** 函数中赋值的，在 Flutter Engine 启动时，**Shell** 实例会被创建，**Setup()** 会被调用以初始化所有必要的组件：

**PlatformView** 在 **Android** 端的实现是 **PlatformViewAndroid**，路径：**shell/platform/android/platform_view_android.cc**：

搜下 **platform_message_handler_** ，在 **构造函数** 中进行了设置：

搜下 **PlatformMessageHandlerAndroid**，路径：**shell/platform/android/platform_message_handler_android.cc**：

🤔 em... 再搜下 **FlutterViewHandlePlatformMessage**，路径：**shell/platform/android/platform_view_android_jni_impl.cc**：

搜下 **g_handle_platform_message_method**：

🤷‍♀️ 行吧，最终调用的 Java 层的 **FlutterJNI.java** 里的 **handlePlatformMessage()** ，🤿 跟完 **Engine层**，接着再来看下 Embedder层-Android的相关实现。
### 3.3. Embedder 层 (Android)
#### 3.3.1. MethodChannel

参数和上面 **Dart** 的 **MethodChannel** 基本一致，多了个 **taskQueue**，关注点在 **BinaryMessenger**(信使) 上，Demo 中通过重写 **FlutterActivity** 的 **configFlutterEngine()** ，调用 **flutterEngine.getDartExecutor().getBinaryMessenger()** 拿到 **BinaryMessenger实例**，然后创建了 **MethodChannel**。
#### 3.3.2. **FlutterActivityAndFragmentDelegate**
🤔 而 **configureFlutterEngine()** 是在 **FlutterActivityAndFragmentDelegate** 的内部接口 **Host** 中定义的，**FlutterActivity** 实现了这个接口，并定义了一个 **FlutterActivityAndFragmentDelegate** 类型的成员变量 **delegate**，然后在 **onCreate()** 中进行了初始化：

而后调用的 **onAttach()** ，会触发 **FlutterEngine** 的初始化方法 **setUpFlutterEngine()** ：

em... 就是为 **FlutterActivityAndFragmentDelegate** 设置一个 **FlutterEngine** 实例，然后是 **dartExecutor**，它在 **FlutterEngine** 的构造方法中进行了初始化：

点开其中的 **onAttachedToJNI()** ：

这里调用 **setPlatformMessageHandler()** 将 **dartMessenger** 设置为 **平台消息处理器**，这使得 **DartExecutor**开始处理与 **Dart执行上下文** 的 **双向通信**。而 **binaryMessenger** 也是在 **DartExecutor** 的构造方法中进行的初始化：

再跟下上面调用的 **setMethodCallHandler**：

本质上调用的 **DefaultBinaryMessenger#setMessageHandler()** 。
#### 3.3.3. DefaultBinaryMessenger

这里的 **messenger** 是 **DartMessenger**，也是在 **DartExecutor** 的构造方法中初始化的，跟下 **setMessageHandler()** ：

看下 **messageHandlers**：

呕吼，就是定义了一个map，来存每个 **channel** 对应的 **handler**，然后这个handler的类型是 **IncomingMethodCallHandler**：

#### 3.3.4. DartMessenger
上面的 **Engine** 层，最后跟到了调 **FlutterJNI.java** 中的 **handlePlatformMessage()** ：

根据前面的代码，我们可以知道这个 **platformMessageHandler** 其实就是 **DartMessenger**，跟下它的 **handleMessageFromDart()** ：

跟下 **dispatchMessageToQueue()** ：

跟下 **invokeHandler()** ：

这个 **handler** 是 **IncomingMethodCallHandler**，调的也是里面的 **onMessage()** 方法。

到此从 **Dart** 端发送消息到 Android 端的流程就走完了，接着就是 **回传结果** 给 **Dart** 端了。
### 3.4. 回传结果
都调的 **BinaryReply#reply()** ，跟下：

跟下 **FlutterJNI#invokePlatformMessageResponseCallback()** ：

点开发现是 **native** 方法：

直接在 **flutter/engine** 仓库搜 **InvokePlatformMessageResponseCallback**，路径：**shell/platform/android/platform_view_android_jni_impl.cc**：

这里获取 **GetPlatformMessageHandler()** 获取的消息处理器自然是 **PlatformMessageHandlerAndroid**，路径：**shell/platform/android/platform_message_handler_android.cc**：

#### 3.4.1. Complete
由注释得知 **message_response** 的类型为 **PlatformMessageResponseDart**，跟下 **Complete()** ，路径：**lib/ui/window/platform_message_response_dart.cc**：

跟下 **PostCompletion**，看下怎么处理的 **转换后的Dart数据**：

这个 **tonic** 是用于 **Dart** 和 **C++** 间交互的库，几个常见API：
- **DartInvoke**：用于在 C++ 代码中调用 Dart 函数。
- **DartByteData**：用于在 Dart 和 C++ 之间传递字节数据。
- **DartState**：管理 Dart 虚拟机的状态。
- **DartPersistentValue**：用于在 C++ 代码中持有 Dart 对象的引用。
#### 3.4.2. DartInvoke
路径：**third_party/tonic/logging/dart_invoke.cc**：

溯源后，可以发现，这个闭包其实就是在 **_DefaultBinaryMessenger#send()** 中设置的 **回调**：

👏 到此，我们总算把 **从Dart端发送消息 → Android端**，**Android端处理后回传结果 → Dart端** 的代码调用流程走通了。😄 接着画下图，帮助大家缕清整个调用流程~
### 3.5. 调用流程图解
#### 3.5.1. Embedder层-Android端

#### 3.5.2. Framework层-Flutter端

#### 3.5.3. Engine层

## 4. 小结
 花了亿点时间，终于把 **MethodChannel** 的底层实现原理搞清楚了，😏 真的搞清楚了吗？问个问题：
Android端是在 **主线程** 中接收方法调用 & 数据回传，如果我开个 **耗时异步任务**，过好一阵子才调 **success()** 会怎样？会出现ANR？返回值丢失啥的吗？
比如这样的代码：

**答**：🤷‍♀️ 都不会，回传消息调的 **BinaryReply#reply()** ，**JNI** 调的 **Engine层(C++)** 的方法，通过 **tonic** 调 **Dart** 里设置的 **回调函数(闭包)** 。一分钟后，Flutter端依旧会收到回传的结果。

**运行结果**：

😄 同理，也不用担心快速触发相同的MethodCall会不会出现结果不匹配的问题 (毕竟传服不同闭包)，唯一要担心的可能是：Dart 中使用 **await** 关键字会 **等待异步任务执行完毕** 后才继续往下执行，这种写法，没有返回，代码就不会一直往下走。如果对异步结果不关心，就不要用await，当然，也可以使用 **then()** 、**whenComplete()** 来避免堵塞后续代码。
😁 至于另外两个Channel → EventChannel 和 BasicMessageChannel 目前用得不多，后续有必要再另外扒一扒原理吧，本节就说到这，谢谢🙏~
**参考文献**
- [深入理解Flutter的Platform Channel机制](https://gityuan.com/2019/08/10/flutter_channel/)
- **《Flutter Engine 编译与调试（2023）》**