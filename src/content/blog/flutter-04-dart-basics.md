---
title: "Flutter入门到精通（四）：Dart基础语法速通"
pubDate: 2024-01-05
description: "快速过一遍Dart语言的基础语法，包括变量、函数、类、异步编程等核心概念。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
---

> 本文是Flutter系统学习系列的第四篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

花一点时间快速过下Dart的基础语法，以便提高Flutter开发时 **书写/阅读代码的流畅性**，不至于三步一查。没啥好说的，直接冲官方文档就完事了：[Introduction to Dart](https://dart.dev/language)(英文) OR [《Dart简介》](https://dart.cn/language)(中文)。推荐使用 **Dart在线编辑器** → [DartPad](https://dartpad.dev/) 来写和跑测试Demo。

## 1. 常识

* **main()** 函数：Dart程序的运行入口，一种特殊且必须的 **顶层函数**。
* **print()** 函数：将文本输出到控制台，支持 **字符串插值**，使用 **$变量名** 将变量嵌入到字符串中；
* **注释**：Dart 支持三种类型的注释：**单行注释** (//)、**块级注释** (/\* 注释内容 \*/)、**文档注释** (///)，使用建议 **：块级注释只用来临时注释一段代码，其它所有的注释都应该用单行注释**。**文档注释** 用于 **dart doc** 生成代码的API文档。更多注释建议可查阅[《Effective Dart: Documentation》](https://dart.dev/effective-dart/documentation)。

## 2. 变量

* Dart是 **强类型语言**，可以直接用 **var** 关键字来声明变量，如：var a = 1，Dart会 **自动推导出数据类型**，而 **不用显式指定类型**，如：int a = 1。
* 但是赋值类型一旦确定了就不能更改了，如：把字符串复制给int类型的变量，编译器会直接报错。
* 如果需要 **在运行时更改类型**，可以使用 **dynamic** 关键字来声明变量。

**Flutter的基本数据类型如下**：

* **Numbers**（数值）→ **int**、**double**
* **Booleans**（布尔）→ **bool**，只有两个值 true 或 false；
* **Strings**（字符串）→ **String**、Runes(UTF-32编码的字符串，可以通过文字转换成表情或代表特定文字)，可以用单引号(')或双引号(")来包裹字符串。
* **Lists**（列表）→ Dart中的数组等于列表，var list = [] 和 List list = new List() 可以简单看做一样；】
* **Sets**（集）→ 无序，元素唯一的集合。
* **Maps**（字典）→ 键值对的形式表示一组值；

**简单使用代码示例如下**：

```dart
void main() {
  /// 显式指定类型、var类型推导
  int a = 1;
  double b = 0.3;
  var c = a / b;
  print(
    "a / b = $c\t向上取整 → ${c.floorToDouble()}\t向下取整 → ${c.ceilToDouble()}\t保留两位小数 → ${double.parse(c.toStringAsFixed(2))}");
  // 输出：a / b = 3.3333333333333335	向上取整 → 3.0	向下取整 → 4.0	保留两位小数 → 3.33

  /// 声明动态类型
  dynamic d = 1;
  d = "test";
  print("d = $d"); // 输出：test

  /// 定义列表
  var numbers = [2]; // 初始化列表
  numbers.add(3); // 添加元素到列表末尾
  print(numbers); // 输出：[2, 3]
  numbers.insert(0, 1); // 添加元素到指定下标
  print(numbers); // 输出：[1, 2, 3]
  // for循环遍历
  for (var i = 0; i < numbers.length; i++) {
    print(numbers[i]);
  }
  // 增强for循环遍历
  for (var number in numbers) {
    print(number);
  }
  // forEach方法遍历
  numbers.forEach((number) {
    print(number);
  });
  // 迭代器遍历
  var iterator = numbers.iterator;
  while (iterator.moveNext()) {
    print(iterator.current);
  }
  print(numbers.length); // 获取列表长度，输出：3
  print(numbers[2]); // 获取列表元素，输出：3
  // 遍历列表
  numbers.remove(1); // 删除列表元素
  print(numbers); // 输出：[2, 3]
  numbers.removeAt(1); // 删除指定下标元素
  print(numbers); // 输出：[2]
  var temps = [5, 3, 7, 1];
  var mergeList = numbers + temps; // 合并两个列表，也可以调用其中一个的addAll()
  mergeList.sort(); // 排序
  print(mergeList); // 输出：[1, 2, 3, 5, 7]
  print(mergeList.reversed.toList()); // 列表反转转List，输出：[7, 5, 3, 2, 1]

  /// 字典
  var headers = {}; // 初始化字典
  headers['Content-Type'] = 'application/json; charset=utf-8'; // 添加/更新元素
  print(headers['Content-Type']); // 访问元素，输出：application/json; charset=utf-8
  print(headers.containsKey('User-Agent')); // 判断是否包含特定键，输出：false
  print(headers.length); // 字典中的键值对数量，输出：1
  // for循环键值
  for (var key in headers.keys) {
    print('$key: ${headers[key]}');
  }
  // 使用forEach方式遍历键值
  headers.forEach((key, value) {
    print('$key: $value');
  });
  headers.remove('Content-Type'); // 删除键值对
}
```dart

**补充**：

* Dart支持 **扩展运算符(...)** ，可以便捷地将一个可迭代对象(列表、集合或字符串)元素快速展开到另一个可迭代对象中。如：var list1 = [1,2,3]; var list2 = [4,5,6]; var combinedList = [...list1, ...list2];
* Dart支持在集合中使用 **if** 和 **for** 运算符来初始化集合，如：var nav = ['Home', 'Furniture', 'Plants', if (promoActive) 'Outlet']; 和 var listOfStrings = ['#0', for (var i in listOfInts) '#$i'];
* 如果想定义 **常量**，可以使用 **const** 或 **final** 关键字来修饰，两者有些区别：

```dart
final int x = 5;  // 可以在声明时就赋值
final String name;  // 可以延迟赋值，但只能赋值一次
name = 'test';

const int y = 10; // 编译时常量，声明时就要赋值
```dart

## 3. 流程控制语句

跟Java那套基本一致，没啥好说的：if-else if-else、for、while、do-while、switch、break、continue~

## 4. 函数/方法

### 4.1. 函数定义

在Dart中，函数被视为 **一等公民**，可以作为对象传递给其它参数，也可以作为返回值返回。**函数定义** 示例如下：

```dart
// 返回值 (不写任何返回类型也可以，但不建议)、函数名、参数列表、函数体
void printMessage(String message) {
  print(message);
}
```dart

### 4.2. 可选参数

Dart中的参数可以是 **必须** 的(默认要传)，也可以是 **可选** 的，可选参数又分为两种：

* **位置参数**：使用方括号[]表示，按照位置传递给函数；
* **命名参数**：使用大括号表示，通过名称传递给函数；

使用代码示例如下：

```dart
// []位置参数
void greet(String name, [String? gender]) {
  // 判断gender参数是否有传递
  if (gender != null) {
    print("Hello $gender $name");
  } else {
    print("Hello $name");
  }
}

// {}命名参数，required 用于修饰可选参数，表示该参数是必须的
void introduce({required String name, int? age}) {
  print("My name is $name, and I'm $age years old");
}
```dart

上述用到的 **?** 问号修饰符，简称 **nullable** 修饰符，用于修饰可选参数，表示此参数是可选的。在处理 **空值场景**，经常和 **??** 、 **??=** 这两个操作符一起出现：

```dart
// ? 操作符：可选调用，如果不为null才执行，避免空指针
int? a;
int b = a?.length;

// ?? 操作符：空值合并，表达式值为空时，提供一个默认值
int b = a ?? 0;

// ??= 操作符：赋值，在变量为null时，给它赋予一个默认值
a ??= 0
```dart

另外，**可选参数** 还支持设置 **默认值**。

### 4.3. 箭头/匿名函数

一种简洁的函数定义方式，用于定义单行函数，用 **箭头符号(=>)** 分隔参数和函数体，并省略了函数体的大括号：

```dart
int add(int a, int b) => a + b;
```dart

### 4.4. 函数作为参数

代码示例如下：

```dart
void performOperation(int a, int b, Function operation) {
  var result = operation(a, b);
  print("The result is $result");
}
```dart

### 4.5. 函数作为返回值

代码示例如下：

```dart
Function calculator(String operator) {
  if (operator == '+') {
    return (int a, int b) => a + b;
  } else if (operator == '-') {
    return (int a, int b) => a - b;
  } else {
    return null;
  }
}
```dart

## 5. 类

Dart里所有的对象都继承自 **Object** 类，支持 **单继承**。Dart没有public、private、protected这类修饰符，即默认是 **public** 的，通过在属性名、方法名前加 \_**下划线** 来定义私有。定义了私有属性和方法的类需要 **抽离放到一个单独的文件/模块中**，才能真正起到私有的效果！！！如：写在同一个文件中，可以访问私有属性：

```dart
class Test {
  String _name = "Test";
}

void main() {
  var test = Test();
  print(test._name);	// 输出：Test
}
```dart

**Tips**：Dart有 **@protected** 注解，但仅用于标记和文档化，不会真正限制访问。

### 5.1. 类定义及使用

直接使用 **class** 关键字定义，简单代码示例如下：

```dart
class Account {
  // 定义两个成员变量
  late String name;
  late int age;

  // 添加构造函数
  Account(this.name, this.age);

  void showInfo() {
    print("$name → $age")
  }
}

// 可以使用new关键字创建对象，也可以省略
var account = Account("","35");
account.showInfo();
```dart

### 5.2. 构造函数

有四种形式的构造函数：**类名构造函数**、**命名构造函数**、**常量构造函数** 及 **工厂构造函数**。

定义一个类，没定义构造函数，默认会有一个 **无参构造函数**，如果有父类，还会调用父类的无参构造函数。

先说说 **类名构造函数**， 就是和类同名的函数，可以参数化，但不能有返回值，如：

```dart
Account(this.name, this.age);
```dart

上述代码用 **语法糖** 简化了成员变量的赋值。然后是 **命名构造函数**，就是用 **类名.修饰符** 定义的函数：

```dart
Account.simple(String name): this(name, 18)
```dart

可以使用命名构造函数为类提供多个构造函数，不过有一点要记住：**命名构造函数不可继承**。

接着是 **常量构造函数**，如果类创建的对象永远不会改变，可以在编译期就创建这个常量实例，并定义一个常量构造函数，并且确保所有成员变量都是final的。

```dart
class Circle {
  final double radius; // 常量成员变量
  const Circle(this.radius); // 常量构造函数
  double get area => 3.14 * radius * radius; // 计算圆的面积
}
```dart

最后是 **工厂构造函数**，就是定义私有构造函数，然后使用 **factory** 关键字进行定义，根据不同情况创建不同的对象返回，简易代码示例如下：

```dart
lass MyClass {
  final String name;

  // 私有构造函数
  MyClass._(this.name);

  // 工厂构造函数 (没有权限访问this)
  factory MyClass(String name) {
    // 在构造对象之前可以进行一些逻辑处理
    if (name == 'invalid') {
      return null; // 返回null表示构造失败
    }

    // 调用私有构造函数创建对象
    return MyClass._(name);
  }
}

void main() {
  var obj1 = MyClass('John');
  print(obj1.name); // 输出: John

  var obj2 = MyClass('invalid');
  print(obj2); // 输出: null
}
```dart

### 5.3. get/set修饰符

就是可以在 **获取值** 和 **等号赋值时** 进行一些方法调用，简单代码示例如下：

```dart
class Example {
  DateTime? launchDate;
  int _value = 0;

  // 定义一个只读的非final属性launchYear
  int? get launchYear => launchDate?.year;

  set value(int newValue) {
    _value = newValue;
  }
}
```dart

### 5.4. 对象操作符

三个主要的操作符：**as** → **类型强转**，**is** → **类型判断**， **..** → **级联操作(链式)** ，简单代码示例：

```dart
var account = Account("", 35);
// 强转
(account as Account).printInfo();

// 类型判断
if(account is Account) {
  print("当前对象为Account类型")
}

// 链式调用
account
  ..name = "小猪"
  ..age = 18;
```dart

### 5.5. 继承

子类使用 **extends** 关键字来继承父类，子类会继承父类里的属性和方法 (构造方法除外)，可以使用 **super** 关键字调用父类属性/方法，或者给父类构造方法传参，贴下官方例子：

```dart
/// 使用 extends 关键字声明继承的父类
class Orbiter extends Spacecraft {
  double altitude;
	/// 定义一个构造函数，用于初始化时从父类继承的属性
  Orbiter(super.name, DateTime super.launchDate, this.altitude);
}
```dart

### 5.6. 接口和抽象类

Dart里的接口跟Java有些不同，我们先思考下，引入接口是为了解决什么问题？

抽象出一类事物的功能，以便更灵活地进行扩展？

这是接口的作用，更深层次的目的是：**解决多继承的二义性问题**。这里的二义性问题，指的是多继承中 **方法和属性名称的冲突**，使得编译器无法确定该使用哪个父类的方法和属性。Java中是这样限制的：

**接口中只能定义抽象成员和方法**，不进行实现，强制子类必须实现。代码示例如下：

```dart
interface A {
	public void test();
}

interface B {
	public void test();
}

class C implements A,B {
	@Override
	public void test() {
		System.out.println("Test");
	}
}

public class HelloWorld {
    public static void main(String []args) {
       C c = new C();
		c.test();
    }
}
```dart

回到Dart这边，没有 **interface** 关键字，**所有类都被隐式定义成一个接口**，**任何类都可以作为接口被实现**。那Dart是如何解决多继承/实现的二义性问题的？**子类必须将父类中所有属性和方法全部重写**。代码示例如下：

```dart
class A {
  String name;
  A(this.name);
  void printTest() => print("A");
}

class B {
  String name;
  B(this.name);
  void printTest() => print("B");
}

class C implements A, B {
  @override
  String name = "C";

  @override
  void printTest() => print("C");
}

void main() {
  C c = C();
  c.printTest();
}
```dart

如果想实现Java中那种 **通过接口来定义标准** 的方式，可以使用 **抽象类 (使用abstract修饰)** 来实现。Dart中的抽象类不能被实例化，可以包含 **抽象方法** (没有方法体) 和 **非抽象方法** (有方法体)，代码示例如下：

```dart
abstract class PlayerController {
  String playerName;
  PlayerController(this.playerName);
  void play();
  void pause();
  void destory() {
    print("播放器销毁了");
  }
}

abstract class VolumeController {
  int currentVolume = 0;
  void increase();
  void reduction();
}

class MusicPlayer implements PlayerController, VolumeController {
  @override
  int currentVolume = 30;

  @override
  String playerName = "音乐播放器";

  @override
  void play() {
    print("音乐播放器开始播放...");
  }

  @override
  void pause() {
    print("音乐播放器暂停了...");
  }

  @override
  void destory() {
    print("播放器销毁了");
  }

  @override
  void increase() {
    print("音量增加，当前音量：${++currentVolume}");
  }

  @override
  void reduction() {
    print("音量减少，当前音量：${--currentVolume}");
  }
}

void main() {
  var player = MusicPlayer();
  player.play();  // 输出：音乐播放器开始播放...
  player.increase();  // 输出：音量增加，当前音量：31
  player.reduction(); // 输出：音量减少，当前音量：30
  player.pause(); // 输出：音乐播放器暂停了...
  player.destory(); // 输出：播放器销毁了
}
```dart

不难看出上述代码并不够优雅，destory() 方法体内容一样的，应该进行 **复用**，使用 **继承extends** 即可解决：

```dart
class MusicPlayer extends PlayerController implements VolumeController { /* ... */ }
```dart

### 5.7. Mixins（混入）

Dart中允许使用 **with** 关键字，**将其它类的功能添加到另一个类中** (该类可以复用其中的方法和属性)，从而能实现多继承。使用 **mixin** 关键字来定义一个混入类，使用代码示例如下：

```dart
mixin Swim {
  void swim() => print("能游泳");
}

class Animal {}

// 使用 on子句 指定该mixin可以混入的类类型，只能混入到继承了Animal的类中
mixin Fly on Animal {
  void fly() => print("能飞翔");
}

class Fish with Swim {}

// 混入Fly类，需要继承Animal类
class Duck extends Animal with Swim, Fly {}

void main() {
  var fish = Fish();
  fish.swim();  // 输出：能游泳
  var duck = Duck();
  duck.fly();   // 输出：能飞翔
  duck.swim();  // 输出：能游泳
}
```dart

### 5.8. 枚举和密封类

Dart中使用 **enum** 关键字定义枚举类型，枚举中的成员都有一个对应的索引值，从0开始，简单使用示例如下：

```dart
enum TimeSlot { morning, afternoon, evening }

void main() {
  for (var element in TimeSlot.values) {
    print(element); // 输出：TimeSlot.morning
    print("${element.index}=${element.name}");  // 输出：0=morning
  }
}
```dart

枚举支持 **扩展方法**，如给定索引值，获取对应的枚举类型，代码示例如下：

```dart
extension TimeSlotType on TimeSlot {
  static TimeSlot getTypeFormIndex(int index) => TimeSlot.values[index];
}

void main() {
  var type = TimeSlotType.getTypeFormIndex(1);
  print(type); // 输出：TimeSlot.afternoon
}
```dart

**增强型枚举**，就是让枚举包含其它数据类型，代码示例如下：

```dart
enum Week {
  monday(cnStr: "周一", count: 1),
  tuesday(cnStr: "周二", count: 2),
  wednesday(cnStr: "周三", count: 3),
  thursday(cnStr: "周四", count: 4),
  friday(cnStr: "周五", count: 5),
  saturday(cnStr: "周六", count: 6),
  sunday(cnStr: "周日", count: 7);  // 最后一个成员要用分号;结尾！！！

  // 构造方法需要用const修饰
  const Week({required this.cnStr, required this.count});
  // 属性是不可变的，需要使用final修饰
  final String cnStr;
  final int count;
}

void main() {
  print(Week.friday.cnStr); // 输出：周五
}
```dart

😄 Dart竟然和Kotlin一样有 **密封类**：**限制类的结构层次**，确保所有子类都被显示列出，在处理复杂状态、模式匹配和不处理不完整数据时非常有用。使用 sealed 关键字进行修饰，使用代码示例如下：

```dart
// sealed修饰的类是抽象类，无法被实例化！
sealed class RequestStatus {}

class RequestSuccess extends RequestStatus {}

class RequestFailure extends RequestStatus {}

String getStatusString(RequestStatus status) {
  return switch (status) {
    RequestSuccess() => "请求成功",
    RequestFailure() => "请求失败"
  };
}

void main() {
  print(getStatusString(RequestSuccess())); // 输出请求成功
}
```dart

## 6. 异步

😄 这里直接CV上一节**《二、从 Android ✈ Flutter 的知识迁移》**异步UI部分的内容~

### 6.1. Future-异步任务

Dart 为事件队列的任务提供了一层封装 → **Future**，表示 **一个在未来时间才会完成的任务**。把一个函数体放入 Future，就完成了 **同步任务到异步任务的包装**。Future还提供 **链式调用**，可在异步任务完成后依次执行链路上的其它函数体。异步函数返回时，内部执行动作未结束，有两种选择：

* **异步处理**：在返回的 Future 对象上注册一个 **then**，等Future执行体结束后，再进行异步处理；
* **同步等待**：同步等待 Future 执行体结束，需在调用处使用 **await**，调用处的函数体使用 **async**，因为Dart里的await不是堵塞等待，而是 **异步等待。**

官方代码示例：

```dart
import 'package:http/http.dart' as http;

// 异步等待请求加载完毕，注意async和await关键字的位置
Future<void> loadData() async {
  var dataURL = Uri.parse('https://jsonplaceholder.typicode.com/posts');
  http.Response response = await http.get(dataURL);
  setState(() {
    widgets = jsonDecode(response.body);
  });
}
```dart

### 6.2. Isolate-多线程

Dart 也提供了多线程机制 → **Isolate**，每个 Isolate 都有自己的 **EventLoop** 与 **EventQueue**，Isolate 间 **不共享任何资源**，只能依靠 **消息机制 (SendPort发送管道)** 通信，所以 **不存在资源抢占问题**。Isolate的创建非常简单，只要给定一个 **函数入口**，创建时再 **传入一个参数** 就可以启动了。简单代码示例如下（将数据分享给主线程来更新UI）：

```dart
/// 加载数据并更新页面
Future<void> loadData() async {
	/// 创建一个ReceivePort → 用于接收来自Isolate的消息
  ReceivePort receivePort = ReceivePort();
  /// 创建一个新的Isolate，并将dataLoader 和 发送端口传给它
  /// 将在新的Isolate里执行dataLoader函数
  await Isolate.spawn(dataLoader, receivePort.sendPort);
	/// 等待从 Isolate 中获取第一个消息(SendPort)，用于与 Isolate 进行通信
  SendPort sendPort = await receivePort.first;
	/// 向SendPort发消息
  List msg = await sendReceive(
    sendPort,
    'https://jsonplaceholder.typicode.com/posts',
  );
	/// 更新UI
  setState(() {
    widgets = msg;
  });
}

/// 在Isolate里执行的具体异步操作
static Future<void> dataLoader(SendPort sendPort) async {
  /// 创建一个ReceivePort → 用来接收主线程的消息
  ReceivePort port = ReceivePort();
  /// 通过 sendPort 向主线程发送当前 Isolate 的 port.sendPort，用于通信
  sendPort.send(port.sendPort);
  /// 等待从主线程接收消息，并使用 for-in 循环来处理接收到的消息
  await for (var msg in port) {
    // 获取数据的URL地址、回复信息的SendPort
    String data = msg[0];
    SendPort replyTo = msg[1];
    String dataURL = data;
    /// 发起HTTP GET请求，并等待响应
    http.Response response = await http.get(Uri.parse(dataURL));
    /// 将解析后的Json发送会主线程
    replyTo.send(jsonDecode(response.body));
  }
}

/// 向指定SendPort发送消息，并返回一个Future对象用于接收响应
Future sendReceive(SendPort port, msg) {
  ReceivePort response = ReceivePort();
  port.send([msg, response.sendPort]);
  return response.first;
}
```dart

**总结一下**：

> 执行 **I/O任务**，如存储访问、网络请求，可以放心使用 **async/await**，要执行 **消耗CPU的计算密集型** 工作，可以将其转移到一个 **Isolate** 上以避免阻塞事件循环。

🐶 后续会有专门章节学这个，实在感兴趣的可以先查阅官方文档：[《Asynchrony support》](https://dart.dev/language/async)

## 7. 异常

使用 **throw** 关键字抛出一个异常，使用 try 语句配合 **on**(指定要捕获的异常类型) 或 **catch**(捕获异常并存储在一个变量中) 关键字来捕获异常，使用代码示例如下：

```dart
class IntegerDivisionByZeroException implements Exception {
  final String message;
  IntegerDivisionByZeroException(this.message);
}

int divide(int a, int b) {
  if (b == 0) throw IntegerDivisionByZeroException("除数不能为0");
  return a ~/ b;
}

void main() {
  try {
    var result = divide(1, 0);
  } on IntegerDivisionByZeroException catch (e) {
    print("捕获到异常：${e.message}");  // 输出：捕获到异常：除数不能为0
  } finally {
    print("执行结束");  // 输出：执行结束
  }
}
```dart

 感觉基础的语法就这些，过完应该可以比较流畅地开发Flutter了，实际开发中遇到不懂的知识点再突击下~