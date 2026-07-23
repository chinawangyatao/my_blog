---
title: "Flutter入门到精通（十六）：网络请求封装"
pubDate: 2024-01-17
description: "Flutter中网络请求的封装实践，Dio配置、拦截器、错误处理等。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第十六篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

😀 之前写的 **《六、项目实战-非UI部分🤷‍♂️》**中关于 **Json解析** 和 **网络请求** 写得有些简陋，实际开发中非常不好用😡，恰逢上节**《十五、玩转状态管理之——Riverpod使用详解》**学了 状态管理库Riverpod，索性本节带着大伙来封装下 **网络请求**，让相关代码写起来稍微 "舒适" 一些。

 **封装无止境**，本节的封装思路和代码不一定足够好或通用，主要是 **授之以渔**，读者可以根据自己的实际情况进行调整或优化。一千个人眼里就有一千个哈姆雷特，**适合自己** 就好，也欢迎大佬评论区不吝赐教，感谢😆

## 2. 封装后的效果演示

1️⃣ 定义API接口处：

2️⃣ UI页面调用处：

运行输出结果：

**Demo下载地址**：[Flutter网络请求封装Demo【dio+riverpod】](https://pan.quark.cn/s/91814778de6f)

😄 如果你对 **Dart中常见的封装技巧** 或 **封装思路&实践过程** 感兴趣，可以往下阅读😏

## 3. 常见封装技巧

💁‍♂️ 捋一捋Flutter中常见的封装技巧，欢迎补充👏

### 3.1. 单例 & 多例

**单例** 是一种常见的 **设计模式**：确保 **一个类只有一个实例**，并提供一个 **全局访问点** 来获取该实例。用它一般是出于下述目的：

* **全局唯一**：多个对象需要访问 **相同的资源或数据**，单例可以保证 **所有对象共享同一份数据**，而且避免了重复创建实例导致的 **资源浪费**，如：数据库连接、配置管理等。
* **处理资源访问冲突**：确保对 **共享资源的访问是受控的**，如：日志工具类，如果有多个实例同时写入可能存在互相覆盖的情况。

然后，在Dart中实现一个单例类的核心步骤如下：

* ① **私有构造函数**：确保外部无法通过构造函数直接创建类实例。
* ② **定义静态私有实例**：在类内部声明一个静态实例变量，作为该类的唯一实例。
* ③ **定义获取实例的静态方法**：如果实例未创建，初始化后返回。

实现单例的简单代码示例如下：

```dart
class Singleton {
  // ① 私有构造函数
  Singleton._internal();

  // ② 定义静态私有实例
  static Singleton? _instance = Singleton._internal();

  // ③ 定义获取实例的静态方法，也可以用factory构造函数来创建
  static Singleton get instance => _instance ??= Singleton._internal();

  // 添加需要的变量或方法
  int _counter = 0;

  void incrementCounter() {
    _counter++;
  }

  int get counter => _counter;
}

void main() {
  var s1 = Singleton.instance;
  var s2 = Singleton.instance;
  print(identical(s1, s2)); // 输出：true，表示两个完全相等的对象
  s1.incrementCounter();
  print(s2.counter);  // 输出：1
}
```

**单例** 指的是 **一个类只能创建一个实例**，对应的 **多例** 则是：**一个类能创建多个实例**，**但数量是有限的**。实现方法很简单，核心就是用一个 **Map** 来存实例，每个实例对应一个 **特定的Key**，请求相同的Key返回同一个实例。实现多例的简单代码示例如下：

```dart
class Multiple {
  // 私有构造函数
  Multiple._internal();

  // 静态容器实例
  static final Map<String, Multiple> _instances = {};

  // 获取实例的静态方法，根据给定的key
  static Multiple getInstance(String key) {
    // 如果实例不存在，则创建一个新的实例并存储在映射中
    _instances.putIfAbsent(key, () => Multiple._internal());
    return _instances[key]!;
  }
}

// 测试代码
void main() {
  var m1 = Multiple.getInstance("a");
  var m2 = Multiple.getInstance("b");
  var m3 = Multiple.getInstance("a");
  print(identical(m1, m2)); // 输出结果：false
  print(identical(m1, m3)); // 输出结果：true
}
```

### 3.2. 编译时代码生成

😐 先提一嘴 **反射**，**Dart支持反射**！！！通过 **dart:mirrors** 库来提供此功能，但而在 **Flutter** 中禁用了 **运行时反射**，因为它会干扰Dart的 **tree shaking** (**摇树)** 过程 **：**

> tree shaking 是Dart编译器优化过程的一个术语，它会 **移除** 应用程序编译后的 **未被使用的代码**，以缩减应用的体积。而反射需要在运行时动态查询或调用对象的方法或属性，为此，**编译器必须保留应用中所有可能会被反射机制调用的代码**，即便这些代码在实际工作流程中可能永远不会被执行，这直接干扰到tree shaking，因为编译器无法确定哪些代码是"多余"的。因此，Flutter禁用了运行时反射 (不能用 **dart:mirrors库**)，鼓励开发者使用 **编译时代码生成** 的方式来代替反射。

而 **编译时代码生成** 一般是通过 **source_gen库** 和 **build_runner工具** 来实现的，简单介绍下：

* **source_gen库**：**编译时生成Dart代码**，通过 **自定义Generator类** 读取指定发 **输入信息** (类、函数、变量、注解等)，并根据这些信息生成新的代码。
* **build_runner**：**Dart命令行工具**，可以运行 source_gen 中的 Generator 并将生成的代码写入到文件中。还可以 **监视源代码变化**，并在代码变化时自动重新运行 Generator。

写个简单的 **自定义Generator代码示例** → 为每个带 **@ToString** 注解的类生成 **toString()** 方法，新建一个 Dart 库，命名为 **to_string_generator**，在库中定义两个文件，现实 **注解** → **lib/to_string_annotation.dart：**

```dart
class ToString {
  const ToString();
}
```

然后是 **生成器 → lib/to_string_generator.dart**：

```dart
// Dart语法分析器包，用于分析 Dart代码和提取元素信息。

// 导入的三个包，依次为：
// analyzer → Dart语法分析器，用于分析 Dart代码 & 提取元素信息。
// build → 提供构建步骤中使用的API与模型。
// source_gen → 生成Dart代码

import 'package:analyzer/dart/element/element.dart';
import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';

// 导入自定义注解类
import 'to_string_annotation.dart';

// 定义 ToStringGenerator 类继承 GeneratorForAnnotation<T>，用于为具有 @ToString 注解的类生成 toString()。

class ToStringGenerator extends GeneratorForAnnotation<ToString> {

  // 重写 generateForAnnotatedElement() 为每个使用 @ToString 注解的元素 (本例中为类) 生成代码
  @override
  Future<String> generateForAnnotatedElement(Element element, ConstantReader annotation, BuildStep buildStep) async {
    // 检查传递的元素是否为 ClassElement（一个类）。如果不是，抛出异常。
    if (element is! ClassElement) {
      throw InvalidGenerationSourceError('`@ToString()` can only be defined on classes.', element: element);
    }

    // 将 element 强制转换为 ClassElement 类型，以便访问类特有的属性和方法。
    ClassElement classElement = element;

    // 构建包含所有字段名称和对应值的字符串表示。
    // 遍历 classElement 的 fields，每个字段都生成 '${field.name}: $${field.name}' 的形式，
    // 然后使用 join 方法将它们连接成单一字符串，字段之间用逗号和空格分隔。
    String fieldsString = classElement.fields.map((field) {
      return '${field.name}: $${field.name}';
    }).join(', ');

    // 返回一个包含新生成的 toString 方法的字符串。
    // 这将为类定义一个扩展方法，覆写 toString 方法，返回类名和所有字段的值。
    return '''

extension ToString${classElement.name} on ${classElement.name} {
  @override
  String toString() {
    return '${classElement.name} { $fieldsString }';
  }
}
    ''';
  }
}
```

接着添加 **本地依赖**：

```dart
dev_dependencies:
  build_runner: ^2.1.4
  to_string_generator:
    path: ../to_string_generator
```

在 **build.yam**l 中配置下 **生成器**：

```yaml
builders:
  # 构建器标识符
  to_string_generator:
    # 构建器所在的库
    import: "package:to_string_generator/to_string_generator.dart"
    # 构建器工程名称
    builder_factories: ["ToStringGenerator"]
    # 输入和输出文件的扩展名映射
    build_extensions: {".dart": [".g.dart"]}
```

    # 控制构建器的应用范围，这里设置 dependents 表示将自动应用于依赖当前包的其他包中的文件

```yaml
    auto_apply: dependents
    # 生成文件的存储位置
    build_to: cache
    # 当前构建器依赖的其它构建器
    applies_builders: ["source_gen"]
```

然后给类添加上@ToString()注解：

```dart
import 'package:to_string_annotation/to_string_annotation.dart';

part 'person.g.dart';

@ToString()
class Person {
  final String name;
  final int age;

  Person(this.name, this.age);
}
```

最后，执行 **flutter pub run build_runner build** 即可生成代码~

### 3.3. 泛型 (Genetic)

😀 **泛型的本质**：**类型参数化** → **要操作的数据类型** 可以通过 **参数的形式** 来指定，就：**把数据类型变成参数**。

Dart 的泛型支持 **泛型类**、**泛型方法**、**泛型边界(extends)** ，没有像Java那样的 **通配符(?)** ，不指定泛型参数的话，默认为 **dynamic** 动态类型。😄 然后：

* **Java泛型** 是"**假泛型**"，通过 **类型擦除** 来实现，**泛型类型信息** 只在 **编译时存在**，一旦代码被编译了就会被擦除，转换为它们的 **边界类型** (如果指定了边界) 或 **Object类型**，这样做是为了 **向后兼容早期的Java版本**。
* 而 **Dart泛型** 的类型是 **具象化(reified)** 的，即：**在运行时保留了泛型的类型信息**，因此，你可以在运行时进行**类型检查**，比如使用 **is** 关键字判断对象是否为特定的泛型类型。除此之外，还可以使用 **Type对象** 和 **runtimeType属性** 来获取泛型的类型信息。

**运行时获取泛型参数类型** 的代码示例如下：

```dart
void main() {
  List<int> numbers1 = [1,2,3];
  print(numbers1 is List<int>); // 输出:true

  List<int?> numbers2 = [];
  print("${numbers1.runtimeType} == ${numbers2.runtimeType} → ${numbers1.runtimeType == numbers2.runtimeType}"); // 输出：List<int> == List<int?> → false

  // 定义变量赋值
  Type type = numbers1.runtimeType;

  // 格式化输出
  print("${numbers1.runtimeType} == ${type} → ${numbers1.runtimeType == type}");// List<int> == List<int> → true

  // 验证相同类型泛型参数不同是否相等
  List<String> stringList = ['a', 'b', 'c'];
  print("${stringList.runtimeType} == ${type} → ${stringList.runtimeType == type}"); // 输出：List<String> == List<int> → false

  // 运行时类型判定
  if(numbers1.runtimeType == List<int>) print("true");// 输出：true

  // 验证泛型嵌套是否能返回完整的泛型类型信息
  List<List<List<String>>> list = [];
  print("${list.runtimeType}"); // 输出：List<List<List<String>>>
}
```

除此之外，还可以通过 **显式传递类型信息** 来实现 **运行时获取泛型的类型信息**，简单代码示例：

```dart
void main() {
  var intBox = Box<int>(type: int);
  var stringBox = Box<String>(type: String);

  checkType(intBox);
  checkType(stringBox);
}

void checkType<T>(Box<T> box) {
  if (box.type == int) {
    print('Box contains int');
  } else if (box.type == String) {
    print('Box contains String');
  } else {
    print('Box contains unknown type');
  }
}

class Box<T> {
  final Type type;	// 显式传递类型信息
  Box({required this.type});
}
```

然后，在提下讲泛型必提的 "**三变**" 在Dart中的表现，以父类-Aniaml、子类-Dog 为例：

① **不变**：Dog 是 Aniaml的子类型，但 List 和 List 是不同的类型:

```dart
void main() {
  List<Animal> animals = [Animal(), Dog()];
  List<Dog> dogs = [Dog()];

  // List 类型是不变的，下面的代码会报错
  // dogs = animals; // 错误：类型 'List<Animal>' 不能赋值给 'List<Dog>'
}
```

② **协变**：**Dart中的函数返回类型**

```dart
Animal getAnimal() => Animal();
Dog getDog() => Dog();

void main() {
  // 函数返回类型的协变
  Animal Function() animalGetter = getDog; // 这是允许的
  print(animalGetter() is Dog); // 输出：true
}
```

③ **逆变**：**Dart中的函数参数**

```dart
class Animal {}
class Dog extends Animal {}

void takeAnimal(Animal animal) {}
void takeDog(Dog dog) {}

void main() {
  // 函数参数类型的逆变
  void Function(Dog) dogTaker = takeAnimal; // 这是允许的
  dogTaker(Dog()); // 实际调用 takeAnimal，但这里传递的是 Dog 类型
}
```

### 3.4. 函数闭包 (Closure)

**官方文档**：[《深入理解 Function & Closure》](https://flutter.cn/community/tutorials/deep-dive-into-dart-s-function-closure)😁 讨论闭包前，得先了解一个词 → **词法作用域** (Lexical scoping)，即每个变量都有它的作用域，在 **同一个词法作用域** 中 **不允许出现同名变量**，否则编译器会提示语法错误。

```dart
// ❎ 这样写编译器会报错
void main() {
  var a = 0;
  var a = 1; //  Error：The name 'a' is already defined
}

// ✅ 这样可以，因为「var a = 0」是「dart文件」的词法作用域中定义的变量
// 而「var a = 1」则是「main()」的词法作用域中定义的变量，两者不是同一空间，所以不会冲突
void main() {
  var a = 1;
  print(a); // => 1
}

 var a = 0;
```

然后，在一个词法作用域 **内部** 可以能访问到 **外部** 词法作用域中定义的变量：

```dart
void main() {
  var printName = (){
    var name = 'Vadaski';
  };
  printName(); // ✅ 内部可以访问外部

  print(name); // ❎ 外部不能访问内部，Error：Undefined name 'name'
}
```

报 **未定义该变量的错误警告**，说明 print() 中定义的变量对于 main() 中的变量是不可见的。Dart 和 JavaScript 一样具有 **链式作用域** → **子作用域** 可以访问 **父/祖先作用域** 中的变量，而反过来不行。

然后是变量的 **访问规则**，**近者优先**，先在当前Scope查找，找不到再到它的上一层Scope中查找，以此类推，如果整条Scope链上不存在该变量，提示 Undefined。😄 说完这些，接着说下 **闭包的定义**：

> **特殊的函数对象 (有状态的函数)** ，即使函数的调用对象在它原始作用域外，依然能访问它在词法作用域内的变量。

写个 **无状态** 和 **有状态函数** 的例子：

```dart
void main() {
  printNumber(); // 输出：1
  printNumber(); // 输出：1

  // ① 定义闭包/有状态函数，但未真正执行
  var numberPrinter = (){
    int num = 0;
    // 返回一个Function，它能拿到父级Scope中的num，让其自增并打印出来
    return (){
      ++num;
      print(num);
    };
  };

  // ② 创建该Fuction对象，真正执行「printNumber」
  var pb1 = numberPrinter();
  // ③ 访问 numberPrinter 中的闭包内容，这里间接访问了num变量，执行自增
  // printNumber() 作为一个闭包，保存了内部num的状态，只要它不被回收，其内部对象都不会被GC掉
  // 所以需要注意闭包可能造成内存泄露，或带来内存压力问题
  pb1(); // 输出：1
  pb1(); // 输出：2
  // 创建另外一个Fuction对象，所以num是从0开始的
  var pb2 = numberPrinter();
  pb2(); // 输出：1
  pb2(); // 输出：2
}

// 无状态函数
void printNumber(){
  int num = 0;
  num ++;
  print(num);
}
```

然后是 **闭包在Flutter中的应用** 示例：

① **在传递对象的地方执行方法**

```dart
// 通过闭包语法 (){}() 立即执行闭包内容，并将data返回
Text((){
    print(data);
    return data;
}())
```

② **实现策略模式**

```dart
void main(){
  var res = exec(select('sum'),1 ,2);
  print(res);
}

Function select(String opType){
  if(opType == 'sum') return sum;
  if(opType == 'sub') return sub;
  return (a, b) => 0;
}

int exec(NumberOp op, int a, int b){
  return op(a,b);
}

int sum(int a, int b) => a + b;
int sub(int a, int b) => a - b;

typedef NumberOp = Function (int a, int b);
```

③ **实现Builder模式/懒加载**

```dart
ListView.builder({
//...
    @required IndexedWidgetBuilder itemBuilder,
//...
  })

// 接收 BuildContext 和 int 作为参数，返回一个内部Widget，这样外部Scpoe也能访问
// IndexedWidgetBuilder 的scope内部定义的Widget，从而实现builder模式，而且还自带懒加载
typedef IndexedWidgetBuilder = Widget Function(BuildContext context, int index);
```

### 3.5. 混入 (Mixin)

**混入 (Mixin)** 是Flutter中的一种强大特性，允许在 **不继承某个类** 的情况下，让类使用另一个类的方法和属性。三个关键字：**mixin (声明混入类)** 、**with (使用混入类)** 、**on (限制混入只能应用于特定的字类)** 。混入的实现是依靠 **生成中间类** 的方式，生成伪代码如下：

```dart
class D with A, B, C {
  // D 类现在可以使用 A、B、C类的方法
}

// 生成的中间类(伪代码)：
class _Intermediate1 extends A { }

class _Intermediate2 extends _Intermediate1 with B { }

class _Intermediate3 extends _Intermediate2 with C { }

class D extends _Intermediate3 {
  // 可以添加自己的成员和方法
}
```

从伪代码不难看出 **混入是线性的**，优先级高于 **继承**，后面的混入类会覆盖前面的 **同名方法**，所以下面的代码：

```dart
mixin A { void printName() { print("A"); } }
mixin B { void printName() { print("B"); } }
mixin C { void printName() { print("C"); } }

class D with A,B,C {
  void printName() {super.printName(); }
}

void main(List<String> args) {
  D().printName();	// 输出：C
}
```

输出结果是"C"，如果想实现 **每个混入类的同名方法都被调用 (链式调用)** ，只需简单四步：

* ① **定义一个父类**；
* ② **每个混入类用on限定只能被父类的子类混入**；
* ③ **方法中调用super**；
* ④ **使用混入的类继承父类**；

然后每个mixin可以添加自己的逻辑，而不影响到其它mixin或基类，具体代码示例如下：

```dart
class Parent { void printName() { } }
mixin A on Parent {
  void printName() {
    super.printName();
    print("A");
  }
}

mixin B on Parent {
  void printName() {
    super.printName();
    print("B");
  }
}

mixin C on Parent {
  void printName() {
    super.printName();
    print("C");
  }
}

class D extends Parent with A,B,C {
  void printName() {super.printName();}
}

void main(List<String> args) {
  D().printName();  // 输出：ABC
}
```

> **Tips**：源码 **runApp()** → **WidgetsFlutterBinding** → **BaseBinding** 中对应的应用~

### 3.6. 扩展 (Extension)

Flutter 中的扩展，允许你在 **不修改原有类、枚举或接口源代码的前提下，为其添加新的方法、属性和操作符**。使用 **extension** 关键字来定义扩展，使用代码示例如下：

```dart
// 扩展基本类型
extension StringExtensions on String {
  // 检查字符串是否不为空
  bool get isNotEmpty => this.isNotEmpty;
}

// 扩展类
extension ColorExtensions on Color {
  // 为Color类添加一个生成半透明颜色的方法
  Color get semiTransparent => withOpacity(0.5);
}

// 扩展枚举
enum FileType { image, text, video }
// 为 FileType 枚举添加一个获取中文名称的方法
extension FileTypeExtensions on FileType {
  String get name {
    switch (this) {
      case FileType.image:
        return '图片';
      case FileType.text:
        return '文本';
      case FileType.video:
        return '视频';
      default:
        throw Exception('未知文件类型');
    }
  }
}
```

扩展本质上是通过 **静态方法** 来实现的，如果 **扩展属性/方法名与目标类现有同名**，扩展的定义不会被调用，**原始类的实现具有更高的优先级**。

### 3.7. .. 和 ...

这两个是Dart很常用的操作符，也顺带提下吧，先是 **级联操作符(..)** → 允许你对同一个对象进行一系列操作，而不需要重复引用该对象。在配置复杂对象时非常有用，它可以使得代码更简洁明了。代码示例：

```dart
class MyClass {
  String property = '';
  void method1() {
    print('method1 called');
  }
  void method2() {
    print('method2 called');
  }
}

void main() {
  var myObject = MyClass()
    ..property = 'value'
    ..method1()
    ..method2();

  print(myObject.property); // 输出: value
}
```

然后是 **展开操作符(...)** → 用于 **将一个集合中所有元素插入刀另一个集合中**。代码示例：

```dart
var list1 = [1, 2, 3];
var list2 = [0, ...list1];
print(list2);  // 输出: [0, 1, 2, 3]

Widget build(BuildContext context) {
  var list = <Widget>[
    Text('Item 1'),
    Text('Item 2'),
  ];

  return Column(
    children: [
      Text('Heading'),
      ...list, // 将list中的所有项作为子组件插入
    ],
  );
}
```

🤷‍♂️ 关于Flutter中的常用封装伎俩就介绍到这，欢迎评论区补充，接着着手思考下，网络请求这块具体怎么封装~

## 4. 封装思路 & 实践过程

### 4.1. 原始写法

😄 先用 **常规方式** 写个简单的网络请求示例，然后再思考如何封装：

```dart
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(home: HomePage());
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<StatefulWidget> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String? testGetResponse;
  String? testPostResponse;
  int curPage = 0;

  Future<void> testGet() async {
    var response = await Dio().get('https://mock.apifox.com/m1/4081539-3719383-default/flutter_article/testGet');
    setState(() {
      testGetResponse = "${response.data}";
    });
  }

  Future<void> testPost() async {
    // 获得当前毫秒时间戳
    curPage = 0;
    var response = await Dio().post('https://mock.apifox.com/m1/4081539-3719383-default/flutter_article/testPost',
        data: {'page': curPage, "keyword": "${DateTime.now().millisecondsSinceEpoch}"});
    setState(() {
      testPostResponse = "${response.data}";
      curPage++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: Center(
          child: SingleChildScrollView(
              child: Column(
        children: [
          Row(children: [
            ElevatedButton(
              onPressed: testGet,
              child: const Text('testGet'),
            ),
            const SizedBox(width: 20),
            Expanded(child: Text(testGetResponse ?? '')),
          ]),
          const SizedBox(height: 20),
          Row(children: [
            ElevatedButton(
              onPressed: testPost,
              child: const Text('testPost'),
            ),
            const SizedBox(width: 20),
            Expanded(child: Text(testPostResponse ?? '')),
          ]),
        ],
      ))),
    );
  }
}
```

点击两个按钮分别发起GET和POST请求，并将响应结果显示到Text上，**运行结果如下**：

🤔 不难看出这种原始写法存在的问题 → **数据层和UI层的耦合**，这让我想起了早期的Android开发，把什么代码都赛道 **Activity** 中，动辄上千甚至上万行的超大类，真丶令人害怕😱。

😄 所以，封装的核心就是这 **两者的解耦(分离)** ，把代码拆解到不同的包/类中，然后通过一个 **"桥梁"** 进行连接，即：**请求数据** → **状态管理** → **UI更新**。

### 4.2. ApiClient

😳 每次请求都创建一个Dio实例，大可不必，每个请求的 **配置项** 基本相同，无脑上 **单例**。

🤔 有些项目会做一层 **抽象**，抽取一些通用的方法，然后再由具体的请求库来实现，如：**api_client** → **dio_api_client**。搞它的目的，主要是为了 **解耦**，方便后面替换其它请求库时，无需改动大量代码，而且方便测试。

🤷‍♂️ 不过个人感觉，小项目搞这一层意义不大，我看过的绝大部分的Flutter项目，网络请求不是用内置的http，就是 dio，为了这个 **低频** 的 **方便替换**，得额外定义一些中间类，各种对字段 (互相赋值)，着实没必要。比如，你得创建一个 **RequestOptions** 传递下请求的参数：

然后子类实现这个类，需要对一遍字段：

🤷‍♂️ 所以啊，还不如直接就在 **api_client.dart** 对dio库进行封装：

```dart
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter/foundation.dart';
import 'interceptors.dart';

/// 请求操作封装
class ApiClient {
  late final Dio _dio;
  static ApiClient? _instance;

  // 私有命名构造函数
  ApiClient._internal(this._dio) {
    // 添加通用的默认拦截器
    _dio.interceptors.add(DefaultInterceptorsWrapper());
    if (kDebugMode) {
      // 添加请求日志拦截器，控制台可以看到请求日志
      _dio.interceptors.add(LogInterceptor(responseBody: true, requestBody: true));
      // 启用本地抓包代理，使用Charles等抓包工具可以抓包
      _dio.httpClientAdapter = IOHttpClientAdapter(createHttpClient: localProxyHttpClient);
    }
  }

  /// ！！！单例初始化方法，需要在实例化前调用
  /// [baseUrl] 接口基地址
  /// [requestHeaders] 请求头
  static Future<void> init(String baseUrl, {Map<String, String>? requestHeaders}) async {
    _instance ??= ApiClient._internal(
      Dio(
        BaseOptions(
          baseUrl: baseUrl,
          responseType: ResponseType.json,
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          headers: requestHeaders ?? await _defaultRequestHeaders,
          // 请求是否成功的判断，返回false，会抛出DioError异常，类型为 DioErrorType.RESPONSE
          // 默认接收200-300间的状态码作为成功的请求，不想抛出异常，直接返回true
          validateStatus: (status) => true,
        ),
      ),
    );
  }

  // 暴露实例供外部访问
  static ApiClient get instance {
    if (_instance == null) {
      throw Exception('APIService is not initialized, call init() first');
    }
    return _instance!;
  }

  /// 构造默认请求头
  static Future<Map<String, dynamic>?> get _defaultRequestHeaders async {
    Map<String, dynamic> headers = {};
    return headers;
  }

  /// 更新请求头
  void updateHeaders(Map<String, dynamic> headers) {
    _dio.options.headers.addAll(headers);
  }

  /// 执行GET请求
  ///
  /// [endpoint] 接口地址 例如：/api/v1/user
  /// [queryParameters] 请求参数
  /// [options] 请求配置
  /// [cancelToken] 取消请求的token
  Future<Response<T>> get<T>(String endpoint,
      {Map<String, dynamic>? queryParameters, Options? options, CancelToken? cancelToken}) {
    return _dio.get(endpoint, queryParameters: queryParameters, options: options, cancelToken: cancelToken);
  }

  /// 执行POST请求
  /// [endpoint] 接口地址
  /// [data] 请求数据
  /// [queryParameters] 请求参数
  /// [options] 请求配置
  Future<Response<T>> post<T>(String endpoint,
      {dynamic data, Map<String, dynamic>? queryParameters, Options? options, CancelToken? cancelToken}) {
    return _dio.post<T>(endpoint,
        data: data, queryParameters: queryParameters, options: options, cancelToken: cancelToken);
  }
}
```

然后是拦截器相关的代码 → **interceptors.dart**：

```dart
import 'dart:io';
import 'package:dio/dio.dart';

/// 默认拦截器
class DefaultInterceptorsWrapper extends InterceptorsWrapper {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // 如果是POST请求且请求体为null，设置一个空的json字符串避免后端解析异常
    if (options.method.toUpperCase() == "POST" && options.data == null) {
      options.data = "{}";
      options.headers['content-type'] = "application/json";
    }
    handler.next(options);
  }
}

/// 本地代理抓包拦截器
HttpClient localProxyHttpClient() {
  return HttpClient()
  // 将请求代理到 本机IP:8888，是抓包电脑的IP！！！不要直接用localhost，会报错:
  // SocketException: Connection refused (OS Error: Connection refused, errno = 111), address = localhost, port = 47972
    ..findProxy = (uri) {
      return 'PROXY 192.168.102.117:8888';
    }
  // 抓包工具一般会提供一个自签名的证书，会通不过证书校验，这里需要禁用下，直接返回true
    ..badCertificateCallback = (X509Certificate cert, String host, int port) => true;
}
```

接着调用下试试，修改 **main.dart** 的代码，先调 **init()** 初始化 **ApiClient**：

然后，发起请求的地方：

😄 还是挺简单的，读者可按需添加其它功能，如：**Cookie持久化** (配合dio_cookie_manager库)、**文件下载** (dio提供了download()，有下载进度回调) 等。

### 4.3. API请求接口 & UI自动刷新

😄 一种常见的玩法，会把所有 API接口单独抽到一个 **api_service.dart** 中：

调用处：

😄 抽完代码稍微少了一丢丢，但主要问题是：

> **发起异步请求获取数据后，需要手动调 setState() 来更新UI**

🤔 有点麻烦啊，这里可以想办法用上 **Riverpod**，利用它的 **watch()** 监听请求响应数据来 **自动更新UI**。🤷‍♂️ 然后又有一个问题 ，**Riverpod** 中定义的 **Provider** 的生命周期是全局的，没法在类内部定义，需要把 Provider 变量定义成 **顶层变量**。定义的 **ApiService** 好像变得没啥用🤣，直接使用 **@riverpod 注解** 来生成 Provider，POST请求需要传递一个page参数：

```dart
@riverpod
Future<Response> testGet(TestGetRef ref) => ApiClient.instance.get("/testGet");

@riverpod
Future<Response> testPost(TestPostRef ref, int page) =>
    ApiClient.instance.post("/testPost", data: {'page': page, "keyword": "${DateTime.now().millisecondsSinceEpoch}"});
```

执行 **flutter pub run build_runner build** 生成 Provider 变量，修改下调用处的代码：

可以，实现了 UI 自动刷新，但有个 **小坑**，点击 testPost 按钮发起异步请求，会显示 **null**，接口响应才显示 **返回数据**：

产生这种现象的原因：

> refresh() 会强制重新构建 **Provider**，重新执行与其关联的异步任务并更新Provider的状态。当任务未完成时获取 data，值自然为 null。

🤔 一种解法是定义一个变量 **暂存旧值**，在执行异步任务前赋值，在异步任务执行时显示旧值，完成时再显示新值。监听 **FutureProvider** 的返回值是 **AsyncValue** 类型，使用 **switch** 关键字处理不同的任务状态，具体代码如下：

得在外部 **额外维护一个变量**，有些麻烦，另一种解法是使用特殊的 **Provider** → **Notifier**，更精细地控制 **状态**：

调用处：

异步任务执行完才设置state，所以只会触发AsyncData，不会走其它逻辑，不需要switch判断，直接：

也不会现实null。另外，如果想走loading，可在异步任务执行前设置下state的值为 **AsyncLoading**()：

😄 可以对state进行多次设置，把Provider玩法弄明白了，接着说下 **代码组织方式**，有些项目会搞一个 **Repository** 的类用于获取数据，然后 **Provider** 类只用于提供数据，一个简单的代码样例如下：

```dart
// lib/repositories/user_repository.dart
class UserRepository {
  final ApiClient apiClient;

  UserRepository({required this.apiClient});

  Future<User> getUser(String id) async {
    final response = await apiClient.get('/user/$id');
    return User.fromJson(response.data);
  }
}

// lib/providers/user_providers.dart

// Tips：用于注入ApiClient，实现单例
final userRepositoryProvider = Provider<UserRepository>((ref) {
  final apiClient = ApiClient.instance; // Assuming ApiClient is a singleton
  return UserRepository(apiClient: apiClient);
});

final userProvider = FutureProvider.family<User, String>((ref, id) async {
  final userRepository = ref.watch(userRepositoryProvider);
  return userRepository.getUser(id);
});

// main.dart
class UserWidget extends ConsumerWidget {
  final String userId;

  UserWidget({required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsyncValue = ref.watch(userProvider(userId));

    return userAsyncValue.when(
      data: (user) => Text(user.name),
      loading: () => CircularProgressIndicator(),
      error: (error, stack) => Text('Error: $error'),
    );
  }
}
```

🤔 em... 从 **职责分离** 的角度，这样做确实有意义，而且可以建多个Repository来分离不同业务的 **API请求**，便于管理维护。当然，要不要这样搞看自己哈，反正我的小项目是直接Providre一把梭滴🤣~

### 4.4. 数据解析 & 异常处理

😄 就是将接口返回的 **Json字符串** 解析为具体的 **对象实例**，Flutter 禁了 **反射**，得手动或使用工具来生成Bean类的 **序列化-toJson()** 和 **反序列化-fromJson()** 代码，官方推荐使用 **json_serializable** 库来自动生成。这块内容可以查阅我之前写的**《十二、实战进阶-Json序/反序列化的最佳实践》**，这里不再复述。这里主要讨论两点：

* **数据解析的时机**：在 **请求方法** 中统一处理，还是在 **拦截器** 中处理？
* **异常处理**：请求或解析时发生错误，是直接 **抛异常**，还是返回一个 **默认值/错误对象**。

#### 4.4.1. 请求方法中统一解析 + 抛异常

先试下 **请求方法中统一解析** + **抛异常** 的写法，根据业务封装一个请求异常父类及相关子类 (**api_exceptions.dart**)：

```dart
import 'dart:io';

import 'package:dio/dio.dart';

/// 自定义请求异常父类
class ApiException implements Exception {
  final int? code;
  final String? message;
  String? stackInfo;

  ApiException([this.code, this.message]);

  factory ApiException.fromDioException(DioException exception) {
    switch (exception.type) {
      case DioExceptionType.connectionTimeout:
        return BadRequestException(-1, "连接超时");
      case DioExceptionType.sendTimeout:
        return BadRequestException(-1, "请求超时");
      case DioExceptionType.receiveTimeout:
        return BadRequestException(-1, "响应超时");
      case DioExceptionType.cancel:
        return BadRequestException(-1, "请求取消");
      case DioExceptionType.badResponse:
        int? errorCode = exception.response?.statusCode;
        switch (errorCode) {
          case 400:
            return BadRequestException(errorCode, "请求语法错误");
          case 401:
            return UnauthorisedException(errorCode, "没有权限");
          case 403:
            return UnauthorisedException(errorCode, "服务器拒绝执行");
          case 404:
            return UnauthorisedException(errorCode, "请求资源不存在");
          case 405:
            return UnauthorisedException(errorCode, "请求方法被禁止");
          case 500:
            return UnauthorisedException(errorCode, "服务器内部错误");
          case 502:
            return UnauthorisedException(errorCode, "错误网关");
          case 503:
            return UnauthorisedException(errorCode, "服务器异常");
          case 504:
            return UnauthorisedException(errorCode, "网关超时");
          case 505:
            return UnauthorisedException(errorCode, "不支持HTTP协议请求");
          default:
            return ApiException(errorCode, exception.response?.statusMessage ?? '未知错误');
        }
      case DioExceptionType.connectionError:
        if (exception.error is SocketException) {
          return DisconnectException(-1, "网络未连接");
        } else {
          return ApiException(-1, "连接错误");
        }
      case DioExceptionType.badCertificate:
        return ApiException(-1, "证书错误");
      case DioExceptionType.unknown:
        return ApiException(-1, exception.error != null ? exception.error.toString() : "未知错误");
    }
  }

  // 将各种异常转换为ApiException方便进行统一处理
  factory ApiException.from(dynamic exception) {
    if (exception is DioException) {
      return ApiException.fromDioException(exception);
    } else if (exception is ApiException) {
      return exception;
    } else {
      return ApiException(-1, "未知错误")..stackInfo = exception.toString();
    }
  }

  @override
  String toString() {
    return 'ApiException{code: $code, message: $message, stackInfo: $stackInfo}';
  }
}

/// 错误请求异常
class BadRequestException extends ApiException {
  BadRequestException(super.code, super.message);
}

/// 未认证异常
class UnauthorisedException extends ApiException {
  UnauthorisedException(super.code, super.message);
}

/// 未登录异常
class NeedLoginException extends ApiException {
  NeedLoginException(super.code, super.message);
}

/// 网络未连接异常
class DisconnectException extends ApiException {
  DisconnectException(super.code, super.message);
}

/// 应用需要强更
class NeedUpdateException extends ApiException {
  NeedUpdateException(super.code, super.message);
}

/// 错误响应格式异常
class ErrorResponseFormatException extends ApiException {
  ErrorResponseFormatException(super.code, super.message);
}

/// 未知响应类型异常
class NotKnowResponseTypeException extends ApiException {
  NotKnowResponseTypeException(super.code, super.message);
}
```

然后是请求方法 (**api_client.dart**)：

```dart
  /// 通用请求封装
  /// [R] data 对应的响应类型，[D] Model类对应的类型
  /// [dioCall] 异步请求，[fromJsonT] 响应实体类的fromJson()闭包
  Future<R?> _performRequest<R, D>(Future<Response> Function() dioCall, D Function(dynamic json)? fromJsonT) async {
    try {
      // 执行请求，获取响应
      Response response = await dioCall();
      // 如果没有设置fromJsonT或者R是dynamic类型，直接返回响应数据
      if (fromJsonT == null || R == dynamic || response.data is! Map<String, dynamic>) return response.data;
      Map<String, dynamic>? responseObject = response.data;
      if (response.statusCode == 200 && responseObject != null && responseObject.isEmpty == false) {
        switch (responseObject['errorCode']) {
          case 200:
            if (R.toString().contains("DataResponse")) {
              return DataResponse<D>.fromJson(responseObject, fromJsonT) as R?;
            } else if (R.toString().contains("ListResponse")) {
              return ListResponse<D>.fromJson(responseObject, fromJsonT) as R?;
            } else {
              throw NotKnowResponseTypeException(-1, '未知响应类型【${R.toString()}】，请检查是否未正确设置响应类型！');
            }
          case 105:
            throw NeedLoginException(-1, "需要登录");
          case 219:
            throw NeedLoginException(-1, "应用需要强更");
          default:
            throw ApiException(responseObject['errorCode'], responseObject['errorMsg']);
        }
      } else {
        throw ApiException(-1, "错误响应格式");
      }
    } catch (e) {
      var exception = ApiException.from(e);
      throw exception;
    }
  }

  /// 执行GET请求
  ///
  /// [endpoint] 接口地址 例如：/api/v1/user
  /// [fromJsonT] 响应实体类的fromJson()闭包
  /// [queryParameters] 请求参数
  /// [options] 请求配置
  /// [cancelToken] 取消请求的token
  /// [fromJsonT] 响应实体类的fromJson()闭包
  Future<R?> get<R, D>(String endpoint,
          {D Function(dynamic json)? fromJsonT,
          Map<String, dynamic>? queryParameters,
          Options? options,
          CancelToken? cancelToken}) =>
      _performRequest<R, D>(
          () => _dio.get(endpoint, queryParameters: queryParameters, options: options, cancelToken: cancelToken),
          fromJsonT);

  /// 执行POST请求
  ///
  /// [endpoint] 接口地址
  /// [fromJsonT] 响应实体类的fromJson()闭包
  /// [data] 请求数据
  /// [queryParameters] 请求参数
  /// [options] 请求配置
  /// [cancelToken] 取消请求的token
  Future<R?> post<R, D>(String endpoint,
          {D Function(dynamic json)? fromJsonT,
          dynamic data,
          Map<String, dynamic>? queryParameters,
          Options? options,
          CancelToken? cancelToken}) =>
      _performRequest<R, D>(
          () => _dio.post(endpoint,
              data: data is Map<String, dynamic> ? data : data?.toJson(),
              queryParameters: queryParameters,
              options: options,
              cancelToken: cancelToken),
          fromJsonT);
}
```

接着改下**provider**，主要是指定 **两个泛型**：

```dart
@riverpod
Future<DataResponse<IndexBanner>?> testGet(TestGetRef ref) =>
    ApiClient.instance.get("/testGet", fromJsonT: (json) => IndexBanner.fromJson(json));

@riverpod
class TestPost extends _$TestPost {
  @override
  DataResponse<Article>? build() => null;

  Future<void> testPost(curPage) async {
    state = await ApiClient.instance.post<DataResponse<Article>, Article>("/testPost",
        fromJsonT: (json) => Article.fromJson(json),
        data: {'page': curPage, "keyword": "${DateTime.now().millisecondsSinceEpoch}"});
  }
}
```

修改下调用处，因为是直接抛异常，所以需要 **捕获下异常**，不然报错直接 **崩(红屏)** ，UI界面一般会用到异常信息，如果直接在provider中捕获，抛异常不会奔溃，但信息没法向外传递，这种写法不太行🤷‍♂️：

😁 FutureProvider的返回类型是 **AsyncValue**，自带异常捕获，只需重写下异常处理的回调，两种写法：

比如，修改下后台返回的code字段，不为200时会抛出异常，这里拦截并显示出来了：

#### 4.4.2. 返回默认值/错误对象

😄 需要在每个使用异步Provider的地方都得这样写，有点繁琐，可以试下另外一个思路：返回一个 **默认值/错误对象**，然后按需处理，这里直接粗暴地在 **DataResponse** 和 **ListResponse** 里加个可空的 **ApiExcetion** 属性：

接着改下请求解析部分的catch代码块，根据泛型返回对应的默认对象：

调用处直接把值打印出来：

运行输出结果：

😄 异常返回默认值这种写法还有一个好处，**少写一堆判空**，毕竟保证有值返回，具体选哪种，看自己/团队偏好。

#### 4.4.3. 拦截器中统一处理 ❓

使用 **拦截器** 进行统一处理，返回解析后的对象数据，这种写法的好处 → **解耦**：

> 将数据解析的逻辑从请求方法中分离出来，使得请求方法只关注请求的发送，而不需要关心响应数据的处理。错误处理：在拦截器中处理响应数据，可以更好地进行错误处理。例如，如果服务器返回的数据格式不正确，可以在拦截器中捕获这个错误，并给出相应的错误提示。

🤷‍♂️ 理论上可以，实际上走不通，至少在Flutter用dio不行，这个坑我帮大伙踩了：

> dio的拦截器主要用于处理 **请求前的配置** 或 **响应后的数据**，而不是用于 **改变响应的数据类型** ❗️❗️❗️

 也记录下探索过程吧，先是难点 → **如何传递fromJson()❓**，这个简单，直接利用 **Options** 的 **extra字段** 传，这个字段在dio中是用来 **存储额外的请求信息** 的 **Map**，这些信息可在请求的生命周期内的任何地方被访问，在拦截器中，可以通过 **response.requestOptions.extra** 来获取。💡 不用担心请求处传递 **Options** 对象会覆盖原先的其它配置(入method、headers 等)，放心，除非你明确指定，否则不会覆盖其它字段。 🙁 直接手撕请求方法：

把fromJsonT和R的类型都传过去了，接着重写拦截器的 **onResponse()** ，完成数据解析，把结果赋值给 **response.data**：

最后是 **provider**：

 调用处改改，编译通过，程序跑起来了，正当我暗自窃喜的时候，直接报错：

类型转换失败，不能把结果塞到data中，断点看了下response.data的类型，em... Map类型：

🤔 另外加一个字段，专门拿来存结果？取的时候多一层而已，试试~

☹️ 然而触发了另一个报错：

**错误简述**：

> 将DataResponse实例转换为一个可编码的格式错误，这里指的是转换为Json字符串。

哈？我费尽心思从Json字符串转对象，搁这又让我转回Json字符串 ❓❓❓ 打扰了...

## 5. 小结

Flutter Ban了 **反射**，代码封装的可玩性真的是骤减啊，大部分Kotlin能耍的，都走不通，🤮了。本节的demo只是简单封装，读者可以自行拓展，如：结合 **retrofit** 库，拆成两层 → **网络请求层** 和 **状态管理层**，简易示例(Power by GPT4)：

```dart
@RestApi(baseUrl: "https://yourapi.com")
abstract class UserApi {
  factory UserApi(Dio dio, {String baseUrl}) = _UserApi;

  @GET("/users/{id}")
  Future<User> getUser(@Path("id") String id);

  @POST("/users")
  Future<User> createUser(@Body() User user);
}

final createUserProvider = FutureProvider.autoDispose<User>((ref) async {
  // 获取ApiService实例
  final apiService = ref.watch(apiServiceProvider);
  // 创建一个新用户对象
  User newUser = User(name: "John Doe", email: "johndoe@example.com");
  // 调用API发送POST请求
  return apiService.userApi.createUser(newUser);
});

// 监听createUserProvider的状态
final userState = ref.watch(createUserProvider);

// 获取状态值
Center(
  child: userState.when(
    data: (User user) {
      // 请求成功，显示用户信息
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Text('User Created!'),
          Text('Name: ${user.name}'),
          Text('Email: ${user.email}'),
        ],
      );
    },
    loading: () => CircularProgressIndicator(), // 请求中，显示加载指示器
    error: (error, stack) => Text('Error: $error'), // 请求失败，显示错误信息
  ),
)

// 刷新
ref.refresh(createUserProvider);
```