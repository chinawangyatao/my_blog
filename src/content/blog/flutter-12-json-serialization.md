---
title: "Flutter入门到精通（十二）：JSON序列化与反序列化的最佳实践"
pubDate: 2024-01-13
description: "Flutter中JSON数据处理方案对比，手动解析、json_serializable、freezed等。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: '/images/flutter-cover.png'
---

> 本文是Flutter系统学习系列的第十二篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

😀 之前写的 **《六、项目实战-非UI部分🤷‍♂️》**一文中关于 **Json序/反序列化** 和 **网络请求** 部分写得有些简陋，在实际开发中发现并不太好用，本节先来讲讲关于 **Flutter中的Json序/反序列化** 本人归纳出的最佳实践。😄 当然，有更好的实践方式也欢迎在评论区指出，谢谢~

> **QuickType** + **json_serializable库**，复制后端返回的Json字符串到QuickType生成Model类，直接复制粘贴到项目中。可以使用 **泛型** 减少重复Model的编写，利用 **build.yaml** 减少重复属性的设置，根据实际情况按需 **自定义字段的序列化/反序列化**。

**本节内容如下**：

## 2. **常识**

### 2.1. Json → 序列化 VS 反序列化

😊 温故知新，先区分下 **Json** 的 **序列化** 和 **反序列化**：

* **序列化**：对象或数据结构 → Json字符串 → **发起接口请求时用到，Dart对象 → Json字符串。**
* **反序列化**：Json字符串 → 对象或数据结构 → **解析接口响应时用到，Json字符串 → Dart对象**。

### 2.2. Flutter对Json序/反序列化的支持

Flutter中提供了 **dart:convert** 库来编码和解码各种数据格式，其中就包含了Json的 **解码(反序列化)** 和 **编码(序列化)** ，对应方法：**decode()** 和 **encode()** 。简单调用代码示例如下：

```dart
import 'dart:convert';

void main() {
  String jsonString = '{"name": "Jay", "age": 30}';
  // 解码 (反序列化)，Json字符串 → Dart对象
  Map<String, dynamic> userMap = jsonDecode(jsonString);
  print(userMap); // 输出：{name: John, age: 30}

  // 编码 (序列化)，Dart对象 → Json字符串
  Map<String, dynamic> userMap = {'name': 'Jay', 'age': 30};
  String jsonString = jsonEncode(userMap);
  print(jsonString); // 输出：{"name":"John","age":30}
}
```

当然，实际开发中很少这样直接解析Json，通常会根据字段写一个Model类，然后定义两个方法来 **序/反序列化**，通常命名为 **fromJson()** 和 **toJson()** 。注意！只是 **约定俗成** 的命名，非强制，你硬要定义成**decodeFromJson()** 和 **encodeToJson()** 也是可以的。但还是建议这样命名，特别是 **toJson()** ：

> Dart中json.encode()会 **自动查找并调用对象的toJson()** 方法来获取对象的Json表示，这是通过 dart:convert库中的 **JsonEncoder** 的约定来实现的。

来一段Json样本：

```dart
{
  "desc": "我们支持订阅啦~",
  "id": 30,
  "imagePath": "https://www.wanandroid.com/blogimgs/42da12d8-de56-4439-b40c-eab66c227a4b.png",
  "isVisible": 1,
  "order": 2,
  "title": "我们支持订阅啦~",
  "type": 0,
  "url": "https://www.wanandroid.com/blog/show/3352"
}
```

序列化和反序列化的代码示例如下：

```dart
import 'dart:convert';

class Banner {
  final String desc;
  final int id;
  final String imagePath;
  final int isVisible;
  final int order;
  final String title;
  final int type;
  final String url;

  Banner({
    required this.desc,
    required this.id,
    required this.imagePath,
    required this.isVisible,
    required this.order,
    required this.title,
    required this.type,
    required this.url,
  });

  // 反序列化
  factory Banner.fromJson(Map<String, dynamic> json) {
    return Banner(
      desc: json['desc'],
      id: json['id'],
      imagePath: json['imagePath'],
      isVisible: json['isVisible'],
      order: json['order'],
      title: json['title'],
      type: json['type'],
      url: json['url'],
    );
  }

  // 序列化
  Map<String, dynamic> toJson() {
    return {
      'desc': desc,
      'id': id,
      'imagePath': imagePath,
      'isVisible': isVisible,
      'order': order,
      'title': title,
      'type': type,
      'url': url,
    };
  }
}

// 调用方法
void main() {
  String jsonString = "上面的json字符串";
  // 反序列化
  Map<String, dynamic> jsonMap = json.decode(jsonString);
  Banner banner = Banner.fromJson(jsonMap);
  print(banner.title); // 输出: 我们支持订阅啦~

  // 序列化 (不需要手动调用toJson())
  String jsonString = json.encode(banner);
  print(jsonString);
}
```

### 2.3. 为啥Flutter中处理Json这么麻烦？

🤪 每次序列化和反序列化都自己抠字段，**重复劳动** 之余还容易引入 **人为错误** (如字段拼写错误)，肯定是得向南发 **自动生成** 代码的。在Java中，一般通过 **Gson/Jackson库** 来实现自动自动序列化，原理是 **运行时反射**。但在Flutter中，你却找不到这样的库。**Dart本身是支持反射的**！！！只是 **Flutter中禁用了反射，** 因为它会干扰Dart的 **Tree Shaking(摇树)** ：

> 摇树是Dart编译过程的一个术语， 它会 **移除** 应用程序编译后的 **未被使用的代码**，以缩减应用体积。而反射需要在运行时动态查询或调用对象的属性或方法，为此，**编译器必须保留应用中所有可能会被反射机制调用的代码**，即便这些代码在实际工作流程中可能永远不会被执行。这直接干扰到摇树，编译器无法确定那些代码是 **"多余"** 的。因此，Flutter直接禁掉了运行时反射(具体表现：不能使用 **dart:mirrors库**)，鼓励开发者使用 **编译时代码生成** 的方式来代替反射。

😉 官方推荐使用 [json_serializable](https://pub.dev/packages/json_serializable) 这个 **Flutter编译时工具** 来生成Json序/反序列化代码，过下它的详细用法~

## 3. json_serializable 库

😄 用库前，得之前这个库是用来解决什么问题的~

> 答：简化Json数据与Dart对象的转换，提供 **Json序列化和反序列化代码的自动生成**。

### 3.1. 添加依赖

它由三个部分组成：

* **json_annotation** → 定义注解。
* **json_serializable** → 使用这些注解来生成代码。
* **build_runner** → 执行生成代码的任务。

添加库依赖的方式二选一：

```yaml
# 方式一：终端直接键入下述命令安装
flutter pub add json_annotation dev:build_runner dev:json_serializable

# 方式2：打开 build.yaml文件手动添加依赖
dependencies:
flutter:
  sdk: flutter
json_annotation: ^4.8.1

dev_dependencies:
flutter_test:
  sdk: flutter
build_runner: ^2.4.7
json_serializable: ^6.7.1
```

### 3.2. 基本使用

定义Model类添加属性，给类加上 **@JsonSerializable** 注解，并添加 **fromJson()** 和 **toJson()** 方法：

```dart
import 'package:json_annotation/json_annotation.dart';

part 'banner.g.dart'; // 1.指定生成的文件，一般是当前文件.g.dart

@JsonSerializable() // 2.添加注解，告知此类是要生成Model类的
class Banner {
  @JsonKey(name: 'id') // 3.可选，添加注解，告知此属性对应的json key
  final int bid;
  final String desc;
  final String imagePath;
  final int isVisible;
  final int order;
  final String title;
  final int type;
  final String url;

  Banner({
    required this.bid,
    required this.desc,
    required this.imagePath,
    required this.isVisible,
    required this.order,
    required this.title,
    required this.type,
    required this.url,
  });

  // 4、反序列化，固定写法：_${类名}FromJson(json)
  factory Banner.fromJson(Map<String, dynamic> json) => _$BannerFromJson(json);

  // 5、序列化，固定写法：_${类名}ToJson(this)
  Map<String, dynamic> toJson() => _$BannerToJson(this);
}
```

编写完上述代码，编译器会报_BannerFromJson和_BannerToJson找不到，没关系，只要确定没拼写错误就行，直接执行下述命令生成对应的序列化代码：

```dart
flutter pub run build_runner build --delete-conflicting-outputs

# 后面的 --delete-conflicting-outputs 是可选的，作用是：
```

# 自动删除任何现存的，与即将生成的输出文件冲突的文件，然后继续构建过程。

# 这样可以清理由于老版本或不同构建配置造成的遗留文件

命令执行完，原先的报错就消失了，而且会在 **同级目录** 生成一个 **xxx.g.dart** 的文件：

然后跟前面一样调用fromJson()就行了，这里用到了这两个 **注解**，详细讲讲，加⭐的属性是比较常用的~

#### 3.2.1. @JsonSerializable

**用于**：指示生成器如何 **为类生成序/反序列化代码**，可选属性如下：

* **⭐explicitToJson** → 默认为false，涉及Model类嵌套时，赋值一个 **引用类型**，而不是 **显式调用嵌套类的toJson()** ！涉及对象嵌套时，建议设置为true。
* **⭐ignoreUnannotated** → 默认为false，如果设置为true时，生成器只序列化和反序列化用 **@JsonKey标记** 的字段。
* **⭐includeIfNull** → 序列化时是否包含值为null的字段，默认为true，即忽略为null的字段。
* **⭐genericArgumentFactories** → 用于 **泛型类的序列化和反序列化**，默认为false，如果设置为true，生成的fromJson()和toJson()将 **需要额外的类型参数的工厂函数**，以保证泛型类的正确序列化和反序列化。
* **anyMap** → 默认false，如果设置为true，生成的 fromJson() 方法将接受如何类型为Map的对象，而不仅仅是Map<String, dynamic>。
* **checked** → 默认为false，如果设置为true，生成的代码会包含对每个字段的类型检查，确保在反序列化期间的类型匹配，如果类型不匹配，会抛出一个有用的错误信息。
* **constructor** → 指定用于生成 fromJson() 工厂构造函数的名称，默认为空字符串，即使用无名构造函数。
* **createFieldMap** → 默认为true，生成器将为 **Map类型的字段** 生成额外的序列化逻辑。
* **createFactory** → 默认为true，当你需要自定义反序列化逻辑时，可以设置为false，生成器不会生成fromJson()。
* **createToJson** → 默认为true，需要自定义序列化逻辑时，可以设置为false，生成器不会生成 toJson()。
* **disallowUnrecognizedKeys** → 默认为false，设置为true时，如果输入的Json中包含Model中未定义的Key，fromJson() 将抛出一个异常。
* **fieldRename** → 控制如何将类字段的名称更改为Json键名称，枚举类FieldRename，可选值有：none(默认，不更改)、kebab(短横线命名a-b)、snak(蛇形命名a_b)、pascal(帕斯卡命名AxxBxx)。
* **converters** → 允许自定义转换器，这些转换器可以在序列化和反序列期间使用。
* **createPerFieldToJson** → 默认为false，是否为每个字段创建一个单独的 **_$[FieldName]ToJson()** 函数，当你需要对某些字段进行特殊处理时，如：自定义类型需要特殊的序列化逻辑、想根据字段的值改变输出的Json结构等，即复杂的自定义序列化，再考虑是否将这个属性设置为true，毕竟会增加代码的复杂性！

#### 3.2.2. @JsonKey

用于：定制 **单个字段的序/反序列化行为**，可选属性如下：

* **⭐disallowNullValue** → 如果设为true，序列化时字段为null，会抛出一个异常，通常用于确保某些字段在序列化时不为null的场景。
* **⭐ignore** → 如果设置为true，序列化和反序列化时会忽略这个字段。
* **⭐includeIfNull** → 如果设置为true，即便字段的值为null，仍然会被包含在序列化的Json中。
* **⭐name** → 用于对Json中Key指定一个不同于Dart字段名的名称。
* **defaultValue** → json中缺少这个字段或值为null时，反序列化过程中使用的默认值。
* **fromJson** → 允许为字段提供一个自定义的反序列化函数。
* **required** → 如果设置为 true，反序列化时，如果Json中缺少这个字段会抛出一个异常。
* **toJson** → 允许为字段提供一个自定义的序列化函数。
* **unknownEnumValue** → Json中的值无法映射到Dart枚举类型中的任何值时，可以指定一个枚举默认值。

### 3.3. 进阶玩法

#### 3.3.1. 泛型

😁 在实际开发中，接口返回的Json数据大都是有固定格式的，比如玩Android的接口就由这三部分组成：**data** + **errorCode** + **errorMsg**。变化的结构只有 **data** 部分，这次是Banner，得写个BannerResponse的类，下次是Article，得写个ArticleResponse的类... 完全可以使用 **泛型** 来减少这种 **重复劳动**~

🤔 这里提一嘴 **Dart泛型** 和 **Java泛型** 的区别：

> **Java泛型** 是"**假泛型**"，通过 **类型擦除** 来实现，**泛型类型信息** 只在 **编译时存在**，一旦代码被编译了就会被擦除，转换为它们的 **边界类型** (如果指定了边界) 或 **Object类型**，这样做是为了 **向后兼容早期的Java版本**。而**Dart泛型** 的类型是 **具象化(reified)** 的，即：**在运行时保留了泛型的类型信息**，因此，你可以在运行时进行**类型检查**，比如使用 **is** 关键字判断对象是否为特定的泛型类型。除此之外，还可以使用 **Type对象** 和 **runtimeType属性** 来获取泛型的类型信息。

**运行时获取泛型参数类型** 的简单代码示例如下：

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

💁‍♂️ 扯得有点远了，收一下。**data字段** 返回的数据类型可能是 **对象** 或 **列表**，需要定义两个Model类，让他们支持泛型只需两步：

* **@JsonSerializable** 设置 **genericArgumentFactories** 为 true。
* **fromJson()** 和 **toJson()** 中需要传递 **额外的函数参数** 指明如何将T类型的数据转换为Json，以及如何将Json转换为T。

具体代码示例如下：

```dart
import 'package:json_annotation/json_annotation.dart';

part 'base_response.g.dart';

// Data是对象
@JsonSerializable(genericArgumentFactories: true)
class DataResponse<T> {
  final T? data;
  final int errorCode;
  final String errorMsg;

  DataResponse({required this.data, required this.errorCode, required this.errorMsg});

  factory DataResponse.fromJson(Map<String, dynamic> json, T Function(dynamic json) fromJsonT) =>
      _$DataResponseFromJson(json, fromJsonT);

  Map<String, dynamic> toJson(dynamic Function(T value) toJsonT) => _$DataResponseToJson(this, toJsonT);
}

// Data是列表
@JsonSerializable(genericArgumentFactories: true)
class ListResponse<T> {
  final List<T>? data;
  final int errorCode;
  final String errorMsg;

  ListResponse({required this.data, required this.errorCode, required this.errorMsg});

  factory ListResponse.fromJson(Map<String, dynamic> json, T Function(dynamic json) fromJsonT) =>
      _$ListResponseFromJson(json, fromJsonT);

  Map<String, dynamic> toJson(dynamic Function(T value) toJsonT) => _$ListResponseToJson(this, toJsonT);
}
```

执行 **flutter pub run build_runner build** 生成完.g.dart文件后，写下简单的测试代码：

```dart
// 泛型的具体类型
class User {
  final int id;
  final String name;

  User({required this.id, required this.name});

  factory User.fromJson(Map<String, dynamic> json) => User(id: json['id'], name: json['name']);

  Map<String, dynamic> toJson() => {'id': id, 'name': name};

  @override
  toString() => "User{id: $id, name: $name}";
}

// 测试代码
void main() {
  var dataResponse = DataResponse<User>.fromJson(
    {
      "data": {"id": 1, "name": "张三"},
      "errorCode": 200,
      "errorMsg": "成功",
    },
    (json) => User.fromJson(json),
  );
  print("${dataResponse.runtimeType} → ${dataResponse.data}");

  var listResponse = ListResponse<User>.fromJson(
    {
      "data": [
        {"id": 1, "name": "张三"},
        {"id": 2, "name": "李四"},
      ],
      "errorCode": 200,
      "errorMsg": "成功",
    },
    (json) => User.fromJson(json),
  );
  print("${listResponse.runtimeType} → ${listResponse.data}");
}
```

运行输出结果如下：

非常简单，聪明的你可能发现了：两个泛型类的代码，除了data的类型不一样，其它代码都是一样的。能不能合并成一个呢？😏 **当然可以**，就是调用时的传参稍微麻烦点 (**需要和泛型类型保持一致**)，具体代码如下：

```dart
@JsonSerializable(genericArgumentFactories: true, explicitToJson: true)
class WanResponse<T> {
  final T? data;
  final int errorCode;
  final String errorMsg;

  WanResponse({required this.data, required this.errorCode, required this.errorMsg});

  factory WanResponse.fromJson(Map<String, dynamic> json, T Function(dynamic json) fromJsonT) =>
      _$WanResponseFromJson(json, fromJsonT);

  Map<String, dynamic> toJson(dynamic Function(T value) toJsonT) => _$WanResponseToJson(this, toJsonT);
}

// 测试代码
void main() {
  var dataResponse = WanResponse<User?>.fromJson(
    {
      "data": {"id": 1, "name": "张三"},
      "errorCode": 200,
      "errorMsg": "成功",
    },
    (json) => User.fromJson(json),
  );
  print("${dataResponse.runtimeType} → ${dataResponse.data?.name}");

  var listResponse = WanResponse<List<User>?>.fromJson({
    "data": [
      {"id": 1, "name": "张三"},
      {"id": 2, "name": "李四"},
    ],
    "errorCode": 200,
    "errorMsg": "成功",
  }, (json) => (json as List).map((e) => User.fromJson(e)).toList()); // ！！！返回类型需要与泛型一致
  print("${listResponse.runtimeType} → ${listResponse.data?[0].name}");
}
```

运行输出结果如下：

😁 每次解析List类型的data 都要写上一串 **(json) => (json as List).map((e) => User.fromJson(e)).toList())** 略显繁琐，抽取成一个 **全局方法**：

```dart
List<T> parseList<T>(dynamic json, T Function(Map<String, dynamic>) fromJson) =>
    (json as List).map((e) => fromJson(e)).toList();

// 调用处
(json) => parseList(json, User.fromJson));
```

#### 3.3.2. 用 build.yaml 减少重复属性设置

* **实例场景**：后端要求值为null的字段不要提交。
* **如何解决**：在每个Model类的 **@JsonSerializable** 注解中都设置属性 **includeIfNull: false** 生成器生成toJson()方法时忽略掉值为null的字段。
* **又比如**：涉及Model类嵌套，需要设置 **explicitToJson: true**，让其显式调用嵌套类的toJson()，而不是复制一个引用类型。
* **发现问题**：需要手动对所有的Model进行 **重复的属性设置**。
* **更好解法**：使用 **build.yaml** 文件进行 **全局配置**，该文件会被 **build_runner** 和 **项目中使用的构建插件** (如 json_serializable、source_gen 等) 所使用。

在项目中右键新建一个 **build.yaml** 文件，按需配置下就可：

```dart
targets:
  $default:
    builders:
      # 全局配置json_serializable库省去重复设置属性
      json_serializable:
        options:
          explicit_to_json: true  # toJson()时将嵌套的对象也转换为Map类型而非引用
          include_if_null: false  # toJson()时忽略值为null的字段
```

更多可选配置可见： [json_serializable build configuration](https://pub.dev/packages/json_serializable#build-configuration)

#### 3.3.3. 自定义字段序/反序列化逻辑

有时我们需要对某些字段的序/反序列化做下 **特殊处理**，可以通过为 **@JsonKey** 注解设置 **toJson** 和 **fromJson** 属性来进行自定义。比如：**提交(序列化)的时候是时间戳字符串**，**解析(反序列化)的时候是Datetime** 的代码示例：

```dart
@JsonSerializable()
class User {
  String name;

  @JsonKey(fromJson: _timeStampFromJson, toJson: _timeStampToJson)
  DateTime timestamp;

  User({required this.name, required this.timestamp});

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  Map<String, dynamic> toJson() => _$UserToJson(this);

  // 自定义fromJson和toJson逻辑
  static DateTime _timeStampFromJson(String timestamp) => DateTime.fromMillisecondsSinceEpoch(int.parse(timestamp));

  static String _timeStampToJson(DateTime date) => date.millisecondsSinceEpoch.toString();
}

// 测试代码
void main() {
  var user = User(name: 'Jay', timestamp: DateTime.now());
  print(user.toJson());
  print(User.fromJson(user.toJson()).timestamp);
}
```

运行输出结果如下：

#### 3.3.4. 自定义转换器 (JsonConverter)

除了上面这种 **设置属性** 的方式来 **自定义fromJson和toJson逻辑** 外，还可以 **自定义转换器(JsonConverter)** 来处理特定类型的转换。一个把Json中星期几 (如Monday、Tuesday等) 转换为枚举类型的代码示例：

```dart
// 枚举类
enum DayOfWeek { monday, tuesday, wednesday, thursday, friday, saturday, sunday }

// 自定义转换器
class DayOfWeekConverter implements JsonConverter<DayOfWeek, String> {
  const DayOfWeekConverter();

  @override
  DayOfWeek fromJson(String json) {
    switch (json.toLowerCase()) {
      case 'monday':
        return DayOfWeek.monday;
      case 'tuesday':
        return DayOfWeek.tuesday;
      case 'wednesday':
        return DayOfWeek.wednesday;
      case 'thursday':
        return DayOfWeek.thursday;
      case 'friday':
        return DayOfWeek.friday;
      case 'saturday':
        return DayOfWeek.saturday;
      case 'sunday':
        return DayOfWeek.sunday;
      default:
        throw ArgumentError('Invalid day of the week: $json');
    }
  }

  @override
  String toJson(DayOfWeek object) => object.toString().split('.').last; // DayOfWeek.monday，只取后面的monday
}

@JsonSerializable()
class MyModel {
  // 使用自定义转换器
  @DayOfWeekConverter()
  DayOfWeek dayOfWeek;

  MyModel(this.dayOfWeek);

  factory MyModel.fromJson(Map<String, dynamic> json) => _$MyModelFromJson(json);

  Map<String, dynamic> toJson() => _$MyModelToJson(this);
}

// 测试代码
void main() {
  MyModel model = MyModel(DayOfWeek.monday);
  print(model.toJson());
  print(MyModel.fromJson(model.toJson()).dayOfWeek);
}
```

运行输出结果如下：

### 3.4. 常见问题

#### 3.4.1. .g.dart 是否需要提交到Git？

> 答：没有绝对的标准答案，可以提交，也可以不提交，只要 **开发团队统一** 就行了😁。**个人倾向于不提交**，首先这个文件是 **自动生成** 的，你项目能跑起来它肯定是得生成的，它经常会发生变化 (改下字段就得重新生成)，这可能导致 **Git合并冲突**，而这完全是可以避免的。

#### 3.4.2. 执行生成序/反序列化代码的命令真烦~！

如题，每次新建或修改Model类，都需要执行 **flutter pub run build_runner** 来生成序/反序列化代码，觉得麻烦可以执行下述命令启动一个 **watcher**，当带有 **json_serializable** 注解的类发生改变时，它会自动更新对应的.g.dart文件：

```dart
flutter packages pub run build_runner watch
```

如果你使用的IDE是 **VSCode** 的话，可以在 **tasks.json** 文件中配置下这个命令，方便快速执行：

```dart
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Flutter Build Runner Watch",
            "type": "shell",
            "command": "flutter packages pub run build_runner watch",
            "isBackground": true,
            "presentation": {
                "reveal": "always",
                "panel": "shared"
            },
            "problemMatcher": []
        }
    ]
}
```

然后就可以在命令行面板找到这个任务啦，你还可以为其设置一个快捷键，打开命令面板，输入 **Preferences: Open Keyboard Shortcuts (JSON)** 并选中，在打开的 **keybindings.json** 文件中新增一个绑定，如：

```dart
{
    "key": "ctrl+shift+b", // 快捷键
    "command": "workbench.action.tasks.runTask",
    "args": "Flutter Build Runner Watch"	// 任务名称
}
```

保存后，使用你设置的快捷键就能快速执行上述任务啦~

## 4. Json 生成 Model类 的一些工具

**json_serializable库** 解决的是 **自动生成Json序/反序列化代码**，Model类的 **属性** 还是得 **手动抠Json字段**，可以通过一些工具来自动生成，喜欢哪个用哪个哈~

### 4.1. 网页

#### 4.1.1. QuickType (⭐推荐)

[QuickType](https://app.quicktype.io/)，直接复制Json到左侧，右侧会自动生成Model类的代码，复制粘贴到项目里就好了：

默认生成的代码是 **不包含json_serializable注解相关**，直接生成对应的toJson() 和 fromJson() 方法。需要点击 **Options-Other** 勾选下左图的选项。点击 **Language** 可以进行 **编程语言的细节设置** (如这里选中Dart)：

#### 4.1.2. json2dart

[json2dart](https://caijinglong.github.io/json2dart/index_ch.html)，也是左边复制json右侧生成代码的玩法：

### 4.2. 插件 & 其它

AS的插件商店搜下 **JsonToDart** 下载安装：

安装后，选定要存放Model类的目录，右键，依次选中：New → Json To Dart：

接着粘贴接口Json，写个类名，点击Generate生成就完事了~

😭 不支持生成json_serializable注解，类似的插件还有 **FlutterJsonBeanFactory**，用法大同小异。其它工具：

* [fluttercandies/JsonToDart](https://github.com/fluttercandies/JsonToDart/)：号称功能最全面的 Json 转换 Dart 的工具，支持 Windows，Mac，Web；
* [flutterchina/json_model](https://github.com/flutterchina/json_model)：一行命令，将Json文件转为Dart model类；

😆 个人还是更倾向于 **QuickType** 或 **json2dart**，简单易用，通过工具生成绝大部分代码后，还需要进行微调，比如类名修改，添加属性注释等。😏 也可以根据自己的实际情况 **编写自动生成脚本/插件**，比如之前就写过一个py脚本，输入接口文档的URL：

自动提取出json里的字段并自动添加字段注释~