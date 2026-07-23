---
title: "Flutter入门到精通（二十）：状态管理之GetX使用详解"
pubDate: 2024-01-21
description: "GetX状态管理框架的使用详解，路由管理、依赖注入、国际化等。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: '/images/flutter-cover.png'
---

> 本文是Flutter系统学习系列的第二十篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

🤔 从写到「**状态管理**」那一章开始，就有人陆陆续续在评论区提到「**GetX**」，它的大名，我在刚学Flutter的时就有略有耳闻👂， 网上关于它的评价褒贬不一：

* **好**：语法简洁，易于学习上手，API功能丰富，大大简化Flutter应用的开发流程。
* **不好**：**封装过度+魔法化**，隐藏了许多Flutter框架的基本工作原理，可能导致新手开发者对Flutter的本身理解不足。过度依赖 **GetX全家桶** 可能导致项目与框架高度耦合，从而增加后期维护或迁移到其它状态管理方案 的难度。

😀 知道，但一直没去体验，前些天，同事往群里丢了一串代码：

😮 他觉得用 **Riverpod** 太麻烦了，每更新一个字段就得手写一个 **state = state.copyWith(xxx: yyy)** ，能不能搞成**GetX** 这样，套一个 **Obx**，里面的值发生改变了就自动刷新。思索片刻后，我给出了这样的回复：

🐶 em... 如果知道 Riverpod 的 **核心设计理念 → 通过强制使用不变性，来保证数据一致性**，就会觉得 **state = state.copy(xxx: yyy)** 这个写法其实是 **很合理** 的。Riverpod中的具体实现：每次状态更新都是通过创建一个新的状态对象来完成，避免由于直接修改状态导致的不一致问题。

🤷‍♀️ 当然，硬要偷懒，也可以想点方法，少写或不用写state=xxx，三个思路：

① 脚本或build_runner为每个属性自动生成一个setter，在更新值的同时state=xxx:

```dart
@riverpod
class UserVM extends _$UserVM {
  @override
  User build() => User();

  set name(String name) {
    state = state.copyWith(name: name);
  }

  set tags(List<String> tags) {
    state = state.copyWith(tags: tags);
  }
}
```

② 写个动态判断的方法，因为Flutter禁了反射，只能传属性的字符串，然后写if-else或switch判断。(🙂 复杂对象维护成本高)

```dart
@riverpod
class UserVM extends _$UserVM {
  @override
  User build() => User();

  void updateProperty<T>(String propertyName, T value) {
    var currentUser = state;
    var updatedUser = currentUser.copyWith(
      name: propertyName == 'name' ? value as String : currentUser.name,
      tags: propertyName == 'tags' ? value as List<String> : currentUser.tags,
      skill: propertyName == 'skill' ? value as Skill : currentUser.skill,
      // 添加其他属性的条件分支
    );
    state = updatedUser;
  }
```

③ **函数闭包**，抽取更新状态的行为作为函数传递：

```dart
@riverpod
class UserVM extends _$UserVM {
  @override
  User build() => User();

  void update(void Function(User) callback) {
    callback(state);
    state = state.copyWith();
  }
}

调用处：
vm.update((state) => state.name = getTimestamp("Name"))
```

😂 感觉「**③ 函数闭包**」应该是最优解了吧，有更好的答案欢迎评论区指出。😏 这周大部分时间是改BUG摸🐟，寻思着深度体验下 **GetX** 吧，毕竟亲身尝试是获取知识的最佳方式，也方便以后跟别人Battle。😄 本节学习路线：**强撸官方文档** (用自己喜欢的方式解读) + **项目实战** (用GetX重写之前的Van♂Android项目)。

## 2. GetX 文档速通

**Github仓库地址**：[jonataslaw/getx](https://github.com/jonataslaw/getx/blob/master/README.zh-cn.md)：

🐂🍺，**最受欢迎** 的 **Flutter库**，提供了各种语言的API文档，三个主要功能：**状态管理**、**路由管理**、**依赖管理**。

### 2.1. GetX 初体验——"计算器Plus"

文档开始就写了一个Demo秀了下GetX的💪，**Flutter** 默认创建的「**计数器Demo**」100多行 (含注释)，用 **GetX** 重写一个「**计数器Plus**」只需26行 (含注释)，不仅实现了 **每次点击都能改变状态**，而且还实现了 **不同页面间的切换**，**数据共享**，**业务逻辑与界面分离**。执行 **futter pub add get** 添加下库依赖，具体代码如下 ( 加了点东西，方便读者理解和直接运行体验)：

```dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';

// 自定义 Controller 类
class CounterController extends GetxController {
  var count = 0.obs; // 使用GetX提供的obs扩展，将普通变量转换为响应式变量
  increment() => count++; // 响应式变量count的值变化会自动通知监听该变量的UI组件进行更新
}

// GetMaterialApp 是一个预先配置好的Widget，子控件默认是MaterialApp，会自动创建和注入路由。
// 如果只是用GetX进行状态管理，可以不使用GetMaterialApp，但它在下述场景是必要的：
// 路由管理、Snackbar、BottomSheet、Dialog、国际化、没有Context
void main() => runApp(const GetMaterialApp(home: HomePage()));

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(context) {
    // 实例化Controller并注入到内存中
    final CounterController c = Get.put(CounterController());

    return Scaffold(
        // 使用Obx(()=>)来监听变量，当变量改变时，Obx会自动重建Widget
        appBar: AppBar(title: Obx(() => Text("Clicks: ${c.count}"))),
        // 通过Get.to()方法来导航到其他页面
        body: Center(child: ElevatedButton(child: const Text("Go to Other"), onPressed: () => Get.to(const OtherPage()))),
        // 点击时调用CounterController实例的increment()
        floatingActionButton: FloatingActionButton(onPressed: c.increment, child: const Icon(Icons.add)));
  }
}

class OtherPage extends StatelessWidget {
  const OtherPage({super.key});

  @override
  Widget build(context) {
    // 通过Get.find()来获取已经存在的Controller实例
    final CounterController c = Get.find();

    // 访问更新后的计数变量
    return Scaffold(body: Center(child: Text("${c.count}")));
  }
}
```

**运行结果如下**：

👍 确实 **简洁**，不需要 **StatefulWidget**，也没看到 **Context** 的影子，接着详细看下GetX的三个主要功能~

### 2.2. 状态管理

**文档**：[state_management.md](https://github.com/jonataslaw/getx/blob/master/documentation/zh_CN/state_management.md)，口号：**使用Get的响应式编程就像使用setState一样简单**。文中把 **响应式/可观察变量** 称为Rx，并提供了三种不同的定义方式：

#### 2.2.1. 定义响应式变量的三种方式

```dart
// ① 推荐，添加.obs作为value的扩展属性
final strRx1 = "初始值".obs;
final intRx1 = 1.obs;
final boolRx1 = true.obs;
final doubleRx1 = 0.01.obs;
final listRx1 = ["字符串"].obs;
final mapRx1 = {"key": 1}.obs;
final objRx1 = User("CoderPig").obs;

// ② Rx<泛型>
final strRx2 = Rx<String>("初始值");
final intRx2 = Rx<int>(1);
final boolRx2 = Rx<bool>(true);
final doubleRx2 = Rx<double>(0.01);
final listRx2 = Rx<List<String>>(["字符串"]);
final mapRx2 = Rx<Map<String,int>>({"key": 1});
final objRx2 = Rx<User>(User("CoderPig"));

// ② Rx{Type}，不支持自定义类
final strRx3 = RxString("初始值");
final intRx3 = RxInt(1);
final boolRx3 = RxBool(true);
final doubleRx3 = RxDouble(0.01);
final listRx3 = RxList<String>(["字符串"]);
final mapRx3 = RxMap<String,int>({"key": 1});
```

通过调用 **.value** 来获取值，如：**strRx1.value**，但，有一点要注意：

响应式变量即使在 **初始化时** 设置与之前 **相同的值**，第一次对这个变量的修改也会触发监听器(如ever)的回调。因为GetX认为第一次赋值操作是一个重要的变化，需要通知监听器，即便赋予的值没有变化。如果不需要这样的行为，可以调用 **响应式变量.firstRebuild = false** 关闭。

然后，**List** 和 **自定义类** 不使用 **.value** 可以直接获取值：

```dart
// ✨ 列表
final list = List<User>().obs;
ListView.builder (
  itemCount: controller.list.length // List不需要.value
)
// 语法🍬-assign：清除List，并添加单个对象
homeController.list.assign(User("CoderPig", 30));
// 语法🍬-assignAll：清除List，并添加任何可迭代对象
homeController.list.assignAll([User("CoderPig", 30), User("Jay", 18)]);

/// ✨ 自定义类
final user = User().obs;
// 更新自定义对象的两种方式，方式①：
user.update( (user) { // 这个参数是你要更新的类本身。
    user.name = 'Jonny';
    user.age = 18;
});
// 方式②：
user(User(name: 'João', age: 35));

// 访问自定义对象的属性值
Obx(()=> Text("Name ${user.value.name}: Age: ${user.value.age}"));
// 不使用.value
user().name;
```

还有，自定义类实例是响应式的，但里面的属性却不是，修改属性不会触发Widget重建，你需要手动通知改变：

```dart
final user = User(name: 'John', last: 'Doe', age: 33).obs;
user.value.name = 'Roi';
// 使用refresh()通知
user.refresh()

// 也可以使用update()方法更新
user.update((value){
  value.name = "Roi";
})
```

定义了 **响应式变量**，还需要在 **响应式组件** 中使用，变量更新才会触发UI的重建~

#### 2.2.2. 响应式组件-Obx Widget & GetX Widget

这两个Widget用于 **监听响应式变量的变化**，并重新构建UI，Obx 是一个简化版的GetX，不需要传递Controller实例，但你要确保使用变量前已经有一个Controller实例。如果没使用 **Bindings** 来自动创建控制器实例，你可能需要手动创建一个Controller实例来使用变量，或者使用 **Get.find<Controller$gt;().value** 或 **Controller.to.value** 来检索值。

**使用代码示例**：

```dart
class MyController extends GetxController {
  var count = 0.obs;

  void increment() {
    count++;
  }
}

void main() {
  Get.put(MyController()); // 创建并注册MyController实例
  runApp(MyApp());
}

/// 💡 Obx → 不需要显式地传递控制器实例，确保已经在合适位置初始化了实例
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: Text('Obx Demo')),
        body: Center(
          child: Obx(() {
            // 💡 直接使用Get.find来获取MyController实例
            final count = Get.find<MyController>().count.value;
            return Text('点击次数: $count');
          }),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => Get.find<MyController>().increment(),
          child: Icon(Icons.add),
        ),
      ),
    );
  }
}

/// 💡 GetX → 可以更灵活控制其它属性，如init
class MyAppWithGetX extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: Text('GetX Demo')),
        body: Center(
          child: GetX<MyController>(
            // 可以在这里初始化MyController，如果它还没有被创建
            init: MyController(),
            builder: (controller) {
              return Text('点击次数: ${controller.count.value}');
            },
          ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => Get.find<MyController>().increment(),
          child: Icon(Icons.add),
        ),
      ),
    );
  }
}
```

#### 2.2.3. 更精细的更新控制-GetBuilder

允许开发者在 **不依赖响应式变量** 的情况下，手动控制何时更新UI。适用于状态变化不频繁或不需要全局监听的场景，通过调用Controller中的 **update()** ，可以精确控制哪个 GetBuilder 组件需要重建。

不需要使用 **ChangeNotifier** 和 **StatefulWidget**，提供了 **initState** 和 **dispose** 属性，允许你在Widget初始化和销毁时执行相关操作。内部通过存储 创建者ID 来更新小部件，低内存消耗，即便是大量的GetBuilder实例也不会对性能造成影响。😄 写个简单的用户增删商品时更新总价和数量的代码示例：

```dart
class CartController extends GetxController {
  var itemCount = 0;
  var totalPrice = 0.0;

  void addItem(double price) {
    itemCount++;
    totalPrice += price;
    update(); // 通知 GetBuilder 更新 UI
  }

  void removeItem(double price) {
    if (itemCount > 0) {
      itemCount--;
      totalPrice -= price;
      update(); // 通知 GetBuilder 更新 UI
    }
  }
}

GetBuilder<CartController>(
  init: CartController(),
  builder: (cartController) {
    return Column(
      children: [
        Text("商品数量: ${cartController.itemCount}"),
        Text("总价: ${cartController.totalPrice}"),
        ElevatedButton(
          onPressed: () => cartController.addItem(10.0),
          child: Text("添加商品"),
        ),
        ElevatedButton(
          onPressed: () => cartController.removeItem(10.0),
          child: Text("移除商品"),
        ),
      ],
    );
  },
)
```

#### 2.2.4. 局部状态组件-ObxValue & ValueBuilder

**ObxValue**：简化版的Obx，用于快速将单个 **Rx变量** 绑定到Widget，使其在变量更新时自动重建，使用代码示例如下：

```dart
ObxValue(
  // 构造子Widget的函数
  (data) => Switch(value: data.value, onChanged: (flag) => data.value = flag),
  // 要监听的Rx变量
  false.obs
),
```

**ValueBuilder**：像ObxValue一样管理局部状态，但基于 **setState回调** 实现，而非Rx变量，使用代码示例如下：

```dart
ValueBuilder<bool>(
  // 初始值，用于初始化内部状态
  initialValue: false,
  // 构建ValueBuilder的子Widget，接收两个参数：当前值和更新该值的回调函数
  builder: (value, update) => Switch(
  value: value,
  onChanged: (flag) {
     update( flag );
  },),
  // 每当ValueBuilder的值通过updater函数更新时回调此函数，value是新的值
  onUpdate: (value) => print("Value updated: $value"),
  // 当ValueBuilder从Widget树中移除并开始销毁过程时回调
  onDispose: () => print("Widget unmounted"),
),
```

不理解？就一个简化版的StatefulWidget而已，看下它的实现代码就懂了：

#### 2.2.5. 其它小组件-GetView & GetWidget & GetxService

**GetView**：简化的StatelessWidget，提供了一个 controller，用于直接访问与当前页面关联的Controller实例。使用代码示例如下：

```dart
class HomeController extends GetxController {
  var count = 0.obs;
  void increment() => count++;
}

class HomeScreen extends GetView<HomeController> {
  @override
  HomeController get controller => Get.put(HomeController());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Home")),
      body: Center(
        child: Obx(() => Text("Clicks: ${controller.count}")),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: controller.increment,
        child: Icon(Icons.add),
      ),
    );
  }
}
```

**GetWidget**：类似于GetView，但它是为了与 **Get.create()** 一起使用，每次都创建一个新的Controller实例。使用代码示例如下：

```dart
class UniqueHomeController extends GetxController {
  var count = 0.obs;
  void increment() => count++;
}

class UniqueHomeScreen extends GetWidget<UniqueHomeController> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Unique Home")),
      body: Center(
        child: Obx(() => Text("Clicks: ${controller.count}")),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: controller.increment,
        child: Icon(Icons.add),
      ),
    );
  }
}
```

**GetxService**：创建 **在应用的整个生命周期中持续存在的类**，它不会像控制器那样随着页面销毁而销毁，适用于需要跨页面共享或持久存在的功能，如用户认证、主题管理等，使用代码实例如下：

```dart
class AuthService extends GetxService {
  Future<AuthService> init() async {
    // 初始化逻辑，比如从本地存储加载用户状态
    return this;
  }

  final RxBool _loggedIn = false.obs;
  bool get loggedIn => _loggedIn.value;

  void login() => _loggedIn.value = true;
  void logout() => _loggedIn.value = false;
}

// 在应用启动时初始化
void main() {
  runApp(MyApp());
  Get.putAsync(() async => await AuthService().init());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final AuthService authService = Get.find();
    return MaterialApp(
      home: authService.loggedIn ? HomePage() : LoginPage(),
    );
  }
}
```

#### 2.2.6. 变量变化回调-Workers

在某些事件发生时执行回调函数，常用的有这些：

* **ever**: 监听的变量每次发生变化时，都会执行回调。
* **once**: 变量第一次变化时执行回调。
* **debounce**：**防抖**，在指定时间内，如果变量的值再次改变，则重新计时，直到过了指定时间没有新的变化，才执行回调。
* **interval**: 在指定时间内，无论变量改变多少次，只执行一次回调。

除 debounce 外，每个Worker都有一个名为 **condition(bool)** 的参数来控制回调函数的执行条件。使用 Workers 时，通常在 Controller 中的 **onInit()** 中设置，以确保它们能正确初始化。简单使用代码示例：

```dart
import 'package:get/get.dart';

class CounterController extends GetxController {
  var count = 0.obs;

  @override
  void onInit() {
    super.onInit();
    // 每次count变化时调用
    ever(count, (_) => print("count has been changed to $_"));

    // count第一次被改变时调用
    once(count, (_) => print("count was changed once to $_"));

    // 防DDos - 用户停止输入1秒后调用
    debounce(count, (_) => print("debounce $_"), time: Duration(seconds: 1));

    // 忽略1秒内的所有变化
    interval(count, (_) => print("interval $_"), time: Duration(seconds: 1));
  }

  void increment() => count++;
}
```

允许开发者在 **不依赖响应式变量** 的情况下，手动控制何时更新UI。适用于状态变化不频繁或不需要全局监听的场景，通过调用Controller中的 **update()** ，可以精确控制哪个 **GetBuilder** 组件需要重建。

#### 2.2.7. 管理状态和逻辑-Controller

常用回调方法如下：

* **update**([List<Object>? ids, bool condition = true]): 用于通知监听器 (通常是Widget)，控制器的状态已更改，需要重新构建。可以传递一个id列表来更新指定的监听器。
* **onInit**(): 控制器初始化时调用的方法，可以在这里执行一些初始化逻辑。
* **onReady**(): 当控制器的依赖项被注入且Widget树构建完成时调用，适合执行一些异步操作，如数据加载。
* **onClose**(): 控制器被销毁时调用的方法，适合进行资源释放、监听器移除等清理工作。
* **refresh**(): 强制更新UI，即使状态没有变化。
* **delete**(): ❗️ 不能访问这个API，因为它实际是将Controller从内存中删除了。

写个 **传递id列表** 来更新指定监听器的代码示例：

```dart
class HomeController extends GetxController {
  var count = 0.obs;

  void increment() {
    count++;
    // 更新指定ID的监听器，这里的ID是一个示例，需要根据实际使用场景定义
    update(["countListener"]);
  }
}

// 在UI中使用指定ID的监听器
class CountWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // 使用GetBuilder并指定id来监听特定的更新
    return GetBuilder<HomeController>(
      id: "countListener",
      builder: (controller) => Text("计数: ${controller.count}"),
    );
  }
}
```

🤷‍♀️ 感觉关于GetX状态管理的API大概就这些了，接着刷下路由管理~

#### 2.2.8. **页面绑定-Bindings**

配合 **路由** 使用，通过GetX路由进入页面，会自动调用 **dependencies()** ，可在此进行依赖关系的注册。

**使用代码示例**：

```dart
class HomeBindings extends Bindings {
  @override
  void dependencies() {
    // 💡 懒加载，在首次请求时才创建
    Get.lazyPut<HomeController>(() => HomeController());
  }
}

void main() {
  runApp(GetMaterialApp(
    home: HomePage(),
    initialBinding: HomeBindings(), // 使用HomeBindings
  ));
}

class HomePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // 使用Get.find<>()获取HomeController实例
    final HomeController controller = Get.find<HomeController>();

    return Scaffold(
      appBar: AppBar(title: Text("Getx Bindings Demo")),
      body: Center(
        child: Obx(() => Text("点击次数: ${controller.count}")),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: controller.increment,
        child: Icon(Icons.add),
      ),
    );
  }
}
```

### 2.3. 路由管理

**文档**：[route_management.md](https://github.com/jonataslaw/getx/blob/master/documentation/zh_CN/route_management.md)，需要把 **MaterialApp** 改为 **GetMaterialApp** 才能使用路由相关的API。

#### 2.3.1. 普通/匿名路由

```dart
// 跳新页面
Get.to(OtherPage());

// 关闭SnackBars、Dialogs、BottomSheets 或你通常用 Navigator.pop(context)关闭的东西
Get.back();

// 跳新页面的同时关闭上个页面
Get.off(OtherPage());

// 跳新页面并关闭之前所有页面
Get.offAll(OtherPage());

// 跳新页面，关闭时回传数据
var result = await Get.to(OtherPage());
Get.back(result: "success");

// GetX 还提供了一个全局属性「navigator」允许你使用标准导航「Navigator」的写法
// 默认的Flutter导航
Navigator.of(context).push(
  context,
  MaterialPageRoute(
    builder: (BuildContext context) => HomePage();
  ),
);

// 使用Flutter语法获得，而不需要context。
navigator.push(
  MaterialPageRoute(
    builder: (_) => HomePage();
  ),
);

// 😄 对比之下的
Get.to(HomePage());
```

#### 2.3.2. 别名路由

```dart
/// 定义路由
void main() {
  runApp(
    // 💡 使用「GetMaterialApp」替换 MaterialApp
      GetMaterialApp(
        // 💡 未定义路线的导航(404)默认跳转页
        unknownRoute: GetPage(name: '/notfound', page: () => UnknownRoutePage()),
        // 💡 初始路由
        initialRoute: '/',
        // 💡 定义路由页面列表
        getPages: [
          GetPage(name: '/', page: () => MyHomePage()),
          // 💡 可以为有无参数的路由定义两个不同的页面，对于不接收参数的路由，必须使用斜杠"/"
          GetPage(name: '/second/', page: () => SecondPage()),
          GetPage(name: '/second/:user', page: SecondPage())
          GetPage(
              name: '/third',
              page: () => Third(),
              transition: Transition.zoom
          ),
        ],
      )
  );
}

// 跳转页面
Get.toNamed("/second");

// 跳转页面的同时关闭上一个页面
Get.offNamed("/second");

// 跳转页面的同时关闭之前所有页面
Get.offAllNamed("/second");

// 跳转页面传参
Get.toNamed("/second", arguments: 'Get is the best');
// 新页面获取传递过来的参数
print(Get.arguments);

/// 💡 GetX还支持高级动态URL

// URL跳转传参
Get.toNamed("/second?device=phone&id=354&name=Enzo");
print(Get.parameters['id']);

Get.toNamed("/second/34954?flag=true")
print(Get.parameters['user']);
print(Get.parameters['flag']);
```

#### 2.3.3. 中间件/监听

```dart
/// 方式一：如果使用了 GetMaterialApp，可以设置下 routingCallback 实现监听
GetMaterialApp(
  routingCallback: (routing) {
    if(routing.current == '/second'){
      openAds();
    }
  }
)

/// 方式二：如果没使用 GetMaterialApp，可以手动附加「Middleware」观察器

// ① 创建MiddleWare类：
class MiddleWare {
  static observer(Routing routing) {
    ///你除了可以监听路由外，还可以监听每个页面上的SnackBars、Dialogs和Bottomsheets。
    if (routing.current == '/second' && !routing.isSnackbar) {
      Get.snackbar("Hi", "You are on second route");
    } else if (routing.current =='/third'){
      print('last route called');
    }
  }
}

// ② MaterialApp 的 navigatorObservers 进行附加
void main() {
  runApp(
    MaterialApp(
      onGenerateRoute: Router.generateRoute,
      initialRoute: "/",
      navigatorKey: Get.key,
      navigatorObservers: [
        GetObserver(MiddleWare.observer), // 在这里添加监听
      ],
    ),
  );
}
```

#### 2.3.4. 免context导航

😁 使用GetX，无需Context即可便捷地显示SnackBars、Dialogs、BottomSheets

```dart
/// 💡 SnackBars

// Flutter
final snackBar = SnackBar(
  content: Text('Hi!'),
  action: SnackBarAction(
    label: 'I am a old and ugly snackbar :(',
    onPressed: (){}
  ),
);

// Get，如果想自行订制SnackBar，可以使用Get.rawSnackbar()，它提供了建立Get.snackbar的原始API
Get.snackbar('Hi', 'i am a modern snackbar');

/// 💡 Dialogs

// 打开 Dialogs：
Get.dialog(YourDialogWidget());

// 打开默认Dialogs：
Get.defaultDialog(
  onConfirm: () => print("Ok"),
  middleText: "Dialog made in 3 lines of code"
);

// 对于其它FlutterDialogs小部件，可以使用「Get.overlayContext」来代替context
// 对于不使用Overlay的小组件，可以使用「Get.context」
// 这两个context在大多数情况下都能替代你的UIcontext，除了在没有导航context的情况下使用inheritedWidget的情况。

/// 💡 BottomSheets

// Get.bottomSheet类似于showModalBottomSheet，但不需要context
Get.bottomSheet(
  Container(
    child: Wrap(
      children: <Widget>[
        ListTile(
          leading: Icon(Icons.music_note),
          title: Text('Music'),
          onTap: () {}
        ),
        ListTile(
          leading: Icon(Icons.videocam),
          title: Text('Video'),
          onTap: () {},
        ),
      ],
    ),
  )
);
```

#### 2.3.5. 嵌套导航

**嵌套导航** (Nested Navigation) 指的是：

在一个 **导航栈内部** 再创建一个或多个 **独立的导航栈**，可以进行内部跳转而不影响外部的导航状态。常见使用场景：底部导航栏 (Bottom Navigation Bar)、抽屉导航 (Drawer)、标签页 (Tabs)。嵌套导航的实现通常依赖于 **Navigator** 组件，它允许你在应用的任何地方创建一个新的导航栈。

纯Flutter定义一个Navigator的代码示例如下：

```dart
final GlobalKey<NavigatorState> nestedNavigatorKey = GlobalKey<NavigatorState>();

Navigator(
  key: nestedNavigatorKey, // 设置一个全局的Key方便访问Navigator实例
  initialRoute: '/',
  onGenerateRoute: (settings) {
    if (settings.name == '/') {
      return MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: Text("Main"),
          ),
          body: Center(
            child: TextButton(
              style: TextButton.styleFrom(
                backgroundColor: Colors.blue,
                primary: Colors.white,
              ),
              onPressed: () {
                // 使用嵌套导航的Key进行导航
                nestedNavigatorKey.currentState?.pushNamed('/second');
              },
              child: Text("Go to second"),
            ),
          ),
        ),
      );
    } else if (settings.name == '/second') {
      return MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: Text("Second"),
          ),
          body: Center(
            child: Text("Second page"),
          ),
        ),
      );
    }
  },
)
```

而使用Get来实现嵌套导航的话，无需context，直接通过ID可以找到特定的导航栈：

```dart
Navigator(
  key: Get.nestedKey(1), // create a key by index
  initialRoute: '/',
  onGenerateRoute: (settings) {
    if (settings.name == '/') {
      return GetPageRoute(
        page: () => Scaffold(
          appBar: AppBar(
            title: Text("Main"),
          ),
          body: Center(
            child: TextButton(
              color: Colors.blue,
              onPressed: () {
                Get.toNamed('/second', id:1); // navigate by your nested route by index
              },
              child: Text("Go to second"),
            ),
          ),
        ),
      );
    } else if (settings.name == '/second') {
      return GetPageRoute(
        page: () => Center(
          child: Scaffold(
            appBar: AppBar(
              title: Text("Main"),
            ),
            body: Center(
              child:  Text("second")
            ),
          ),
        ),
      );
    }
  }
),
```

😊 GetX的路由管理API也很简洁啊，再往下刷下依赖管理~

### 2.4. 依赖管理

[dependency_management.md](https://github.com/jonataslaw/getx/blob/master/documentation/zh_CN/dependency_management.md)，一行代码即可检索到注入实例。

#### 2.4.1. Get.put()

依赖注入的最常见方式，方法定义如下：

```dart
/// [dependency] → 必须，注入的实例对象，put()不需要写泛型，会自动从这个属性推导出来。
/// [tag] → 可选，为注入实例提供唯一标签，注入多个同类型实例时，用于检索特定实例。
/// [permanent]  → 可选，默认为false，Get会在实例不再使用后自动销毁，如果设置为true，注入的实例不会自动销毁。
/// [builder] → 可选，已弃用，传递一个返回实例<S>的函数，早期版本的GetX懒加载用到，现在推荐使用lazyPut()来实现相同功能。
S put<S>(
  S dependency, {
  String? tag,
  bool permanent = false,
  @Deprecated("Do not use builder, it will be removed in the next update")
  InstanceBuilderCallback<S>? builder,
}) {
  _insert(
      isSingleton: true,
      name: tag,
      permanent: permanent,
      builder: builder ?? (() => dependency));
  return find<S>(tag: tag);
}
```

#### 2.4.2. Get.lazyPut()

**延迟注入(懒加载)** ，在使用到时才实例化依赖，方法定义如下：

```dart
/// [builder] → 返回类型为<S>的函数，用于创建和返回依赖项实例，只有在依赖项首次请求时才调用
/// [tag] → 可选，为注入实例提供唯一标签，注入多个同类型实例时，用于检索特定实例。
/// [fenix] → 可选，默认值取决于「Get.smartManagement」的配置，为true的话即使依赖项被删除
/// 					它的构建函数还会保留在内存中，下次请求时依赖项可以背重新创建。
/// [permanent]  → 可选，默认为false，Get会在实例不再使用后自动销毁，如果设置为true，注入的实例不会自动销毁。
void lazyPut<S>(
  InstanceBuilderCallback<S> builder, {
  String? tag,
  bool? fenix,
  bool permanent = false,
}) {
  _insert(
    isSingleton: true,
    name: tag,
    permanent: permanent,
    builder: builder,
    fenix: fenix ?? Get.smartManagement == SmartManagement.keepFactory,
  );
}
```

#### 2.4.3. Get.putAsync()

**异步依赖注入**，适用于需要异步操作创建实例的场景 (如网络请求获取数据)，方法定义如下：

```dart
/// [builder] → 异步实例构建的函数，Get会等待函数执行完毕后，对返回的依赖项实例进行注入
/// [tag] → 可选，为注入实例提供唯一标签，注入多个同类型实例时，用于检索特定实例。
/// [permanent]  → 可选，默认为false，Get会在实例不再使用后自动销毁，如果设置为true，注入的实例不会自动销毁。
Future<S> putAsync<S>(
  AsyncInstanceBuilderCallback<S> builder, {
  String? tag,
  bool permanent = false,
}) async {
  return put<S>(await builder(), tag: tag, permanent: permanent);
}
```

#### 2.4.4. Get.create()

适用于需要每次都是 **全新实例** 的场景，与 put() 和 lazyPut() 不同，它通过 **Get.find()** 检索时都会创建一个新的实例。方法定义如下：

```dart
/// [builder] → 返回类型为<S>的函数，用于创建和返回依赖项实例，每次调用Get.find()请求实例时都会调用。
/// [tag] → 可选，为注入实例提供唯一标签，注入多个同类型实例时，用于检索特定实例。
/// [permanent]  → 可选，默认为false，Get会在实例不再使用后自动销毁，如果设置为true，注入的实例不会自动销毁。
void create<S>(
  InstanceBuilderCallback<S> builder, {
  String? tag,
  bool permanent = true,
}) {
  _insert(
    isSingleton: false,
    name: tag,
    builder: builder,
    permanent: permanent,
  );
}
```

#### 2.4.5. 获取 & 使用注入的实例

```dart
/// 💡 获取注入实例

// 方法一：通过泛型指定要查找具体的实例类型
final controller = Get.find<Controller>();
// 方法二：依赖变量的类型声明来推断出泛型参数
Controller controller = Get.find();

/// 💡 使用注入实例
Text(controller.textFromApi);
int count = Get.find<SharedPreferences>().getInt('counter');
print(count); // out: 12345

/// 💡 移除注入实例，一般不用这样做，GetX会自动移除没使用的实例
Get.delete<Controller>();

// 如果想修改销毁模式，可以使用「SmartManagement」设置不同的行为，三个可选值
// full → 默认，销毁没被使用且没设置为永久的实例。
// onlyBuilder → 只有在init:方法中初始化、通过Get.lazyPut()加载到binding中的实例会被销毁。
// keepFactory → 同full，但它的构建函数还会保留在内存中，下次请求时依赖项可以背重新创建
GetMaterialApp(
  smartManagement: SmartManagement.onlyBuilders // 修改销毁模式
  home: Home(),
)
```

#### 2.4.6. Bindings

在上面的 **状态管理** 中已经提到过Bindings了：

配合 **路由** 使用，通过GetX路由进入页面，会自动调用 **dependencies()** ，可在此进行依赖关系的注册。

除了可以在 **GetMaterialApp** 的 **initialBinding** 属性传递外，还可以在 **别名路由** 和 **正常路由** 处使用，代码示例如下：

```dart
// 别名路由
getPages: [
  GetPage(
    name: '/',
    page: () => HomeView(),
    binding: HomeBinding(),
  ),
];

// 正常路由
Get.to(Home(), binding: HomeBinding());
Get.to(DetailsView(), binding: DetailsBinding())
```

不想自定义Bindings类，也可以使用「**BindingsBuilder**」 回调函数来实例化实例，代码示例如下：

```dart
getPages: [
  GetPage(
    name: '/',
    page: () => HomeView(),
    binding: BindingsBuilder(() {
      Get.lazyPut<ControllerX>(() => ControllerX());
      Get.put<Service>(()=> Api());
    }),
  ),
]
```

### 2.5. 其它

#### 2.5.1. 国际化

GetX提供了多语言国际化的处理，方便你在项目中进行多语言的管理和切换，玩法如下：

```dart
/// 💡 1、创建翻译类

// 继承「Translations」类实现get keys，返回一个多语言的配置
// key 为语言标识，格式为语言代码_国家代码，如zh_CN、en_US，value 为对应的文字资源
class StringRes extends Translations {
  @override
  Map<String, Map<String, String>> get keys => {
        'zh_CN': {'hello': '你好 世界'},
        'en_US': {'hello': 'Hello World'}
      };
}

/// 💡 2、配置GetMaterialApp。
void main() => runApp(GetMaterialApp(
    home: HomePage(),
    translations: StringRes(), // 应用翻译
    locale: Locale('zh', 'CN'), // 默认使用语言，也可以调用 ui.window.locale 获得系统语言环境
    fallbackLocale: Locale('en', 'US'), // 默认语言资源没找到时另外使用的语言
));

/// 💡 3、切换语言
Get.updateLocale(Locale('en', 'US')); // 切换到英文

/// 💡 4、使用翻译：通过'键名'.tr来获取当前语言下对应的翻译文本
Text('hello'.tr) // 根据当前语言显示对应的文本
```

#### 2.5.2. 改变主题

❗️ 不要使用比GetMaterialApp更高级别的widget来更新主题，这可能会造成键重复，玩法如下：

```dart
/// 💡 1、定义主题
final ThemeData lightTheme = ThemeData.light().copyWith(
  // 自定义亮色主题的属性
);

final ThemeData darkTheme = ThemeData.dark().copyWith(
  // 自定义暗色主题的属性
);

/// 💡 2、切换主题
ElevatedButton(
  onPressed: () {
    Get.changeTheme(Get.isDarkMode? ThemeData.light(): ThemeData.dark());
  },
  child: Text("切换主题"),
)
```

#### 2.5.3. GetConnect (http & websocket)

🐂🍺，连网络请求都有，继承「**GetConnect**」就能与RestAPI 或 Websockets通信了，支持多种自定义配置，如：BaseURL、相应请求、权限认证，甚至是尝试认证的次数，还可以定义一个解码器将把您的所有请求转换为您的模型。代码示例如下：

```dart
class MyApiClient extends GetConnect {
  @override
  void onInit() {
    // 设置解码器，就是json转Model调哪个类的fromJson()
    httpClient.defaultDecoder = CasesModel.fromJson;

    // 设置BaseUrl
    httpClient.baseUrl = 'https://yourapi.com';

    // 请求拦截器
    httpClient.addRequestModifier((request) {
      request.headers['apikey'] = '12345678';
      return request;
    });

    // 响应拦截器
    httpClient.addResponseModifier<CasesModel>((request, response) {
      CasesModel model = response.body;
      if (model.countries.contains('Brazil')) {
        model.countries.remove('Brazilll');
      }
    });

    // 如果请求需要认证，这里会自动获取 token 并设置请求头
    httpClient.addResponseModifier<CasesModel>((request, response) {
      CasesModel model = response.body;
      if (model.countries.contains('Brazil')) {
        model.countries.remove('Brazilll');
      }
    });

    // 如果返回的 HTTP 状态码是 HttpStatus.unauthorized，认证器会被调用最多 3 次
    httpClient.maxAuthRetries = 3;
  }

  // 发起一个GET请求，用于获取指定id的用户信息
  Future<Response> getUser(int id) => get('http://youapi/users/$id');

  // 发起一个POST请求，用于提交用户数据
  Future<Response> postUser(Map data) => post('http://youapi/users', body: data);

  // 发起一个POST请求，这次请求包含了文件，例如上传用户头像和封面
  Future<Response<CasesModel>> postCases(List<int> image) {
    final form = FormData({
      'file': MultipartFile(image, filename: 'avatar.png'), // 用户头像文件
      'otherFile': MultipartFile(image, filename: 'cover.png'), // 用户封面文件
    });
    return post('http://youapi/users/upload', form);
  }

  // 使用WebSocket连接，用于实时接收用户消息
  GetSocket userMessages() {
    return socket('https://yourapi/users/socket');
  }

}
```

#### 2.5.4. GetPage中间件-GetMiddleware

**GetPage** 是GetX中用来定义路由的一个组件，它现在支持一个新的参数，允许你添加一个 **中间件列表**，并为每个中间件设置一个 **priority(优先级)** ，这些中间件是一些特殊的代码块，可以在页面跳转发生之前或之后执行，用于执行如认证检查、日志记录等任务。优先级数字越小，执行顺序越靠前。使用代码示例如下：

```dart
// 中间件会按照这样的顺序执行：-8 → 2 → 4 → 5
final middlewares = [
  GetMiddleware(priority: 2),
  GetMiddleware(priority: 5),
  GetMiddleware(priority: 4),
  GetMiddleware(priority: -8),
];
```

接着是 **GetMiddleware** 的几个 **生命周期回调函数**：

```dart
class MyPageMiddleware extends GetMiddleware {
  @override
  RouteSettings? redirect(String? route) {
    // 尝试跳转到另一个页面时调用，检查是否需要重定向，
    // 允许基于条件(如用户认证状态)决定是否需要重定向到另一个页面，返回null则不会发生重定向
    final authService = Get.find<AuthService>();
    return authService.isAuthenticated ? null : RouteSettings(name: '/login');
  }

  @override
  GetPage? onPageCalled(GetPage? page) {
    // 页面被实际调用前调用，可在此修改页面属性或决定显示另一个页面
    final authService = Get.find<AuthService>();
    return page?.copyWith(title: 'Welcome ${authService.userName}');
  }

  @override
  List<Bindings>? onBindingsStart(List<Bindings>? bindings) {
    // 在绑定初始化前调用，可在此更改页面的绑定
    final authService = Get.find<AuthService>();
    if (authService.isAdmin) {
      bindings?.add(AdminBinding());
    }
    return bindings;
  }

  @override
  GetPageBuilder? onPageBuildStart(GetPageBuilder? page) {
    // 在绑定初始化后调用，可在此完成创建绑定后和创建页面Widget前执行一些操作
    print('Page build is starting');
    return page;
  }

  @override
  Widget onPageBuilt(Widget page) {
    // 页面构建完成后的操作
    print('Page has been built');
    return page;
  }

  @override
  void onPageDispose() {
    // 页面销毁时的清理操作
    print('Page is being disposed');
  }
}
```

🤷‍♀️ 关于GetX的文档暂且撸到这里，剩下的API就懒得CV了，GetX 给我的感觉就一个字——**全**，瑞士军刀式护航的Flutter开发体验果然不是吹的， 这也让我想起以前很火的Android开发的脚手架 → [xUtils3](https://github.com/wyouflf/xUtils3)。😏 只撸文档可不行，接着用GetX写个项目实战下，毕竟 **实践才是检验真理的唯一标准**~

## 3. 项目实战：用GetX重写Van♂Android

😄 在这个系列的**《六、项目实战-非UI部分🤷‍♂️》**和**《七、项目实战-UI部分🤷‍♀️》**中带着大伙用WanAndroid的开放API写了一个简陋的APP，本节试着用GetX来重写一波。UI啥的照旧，主要用到GetX的状态管理、路由 和 GetConnect，代码结构的话还是 **MVVM**，**VM层** 继承 GetxController，在这里写业务逻辑。代码示例如下：

```dart
class TestVM extends GetxController {
   final TestState state = TestState();
}

class TestPage extends StatelessWidget {
  final logic = Get.put(TestLogic());	// 逻辑
  final state = Get.find<TestLogic>().state;	// 状态

  @override
  Widget build(BuildContext context) => Container();
}
```

🤷‍♀️ 懒得自己每次重复创建相关文件的还，可以试下 [Idea插件-GetX](https://plugins.jetbrains.com/plugin/15919-getx)，使用指南 → **《GetX插件功能讲解》**，就自动创建模板文件，以及输入关键字生成快捷代码片段，应该能提高不少的开发效率~

### 3.1. 网络请求封装

还是**《十六、实战进阶-网络请求封装一条🐲》**里的封装思路，请求库从 **dio** 变成了 **GetConnect**，需要进行一些调整。网上关于它的资料不多，大部分是直接CV官方文档那一点点介绍， 所以踩了一些小坑...

#### 3.1.1. 坑：设置本地代理无效

就想设置下本地带来，然后Charlse上可以抓包看到请求，直接搜proxy，定位到这个issues：[Feature about Setting a Proxy for the GetConnect](https://github.com/jonataslaw/getx/issues/1030)，CV了里面提到的两行代码：

```dart
class ApiClient extends GetConnect {
  @override
  void onInit() {
    httpClient.baseUrl = "https://www.wanandroid.com/";
    httpClient.timeout = const Duration(seconds: 30);
    // ❎ 走本地代理，方便Charles上抓包查看，没有生效
    allowAutoSignedCert = true;
    httpClient.findProxy = (url) => "PROXY 192.168.102.117:8888";
    super.onInit();
  }
```

 结果抓不到包，之前用dio时类似的配置确实正常的，暂时没找到解法，先用 **Flutter DevTools** 应付下：

打开 **Network** 面板可以看到发起的请求：

#### 3.1.2. 坑：Unable to set the baseUrl

测试接口报错，定位到issues：[GetConnect onInit() - Unable to set the baseUrl/AddAuthenticator](https://github.com/jonataslaw/getx/issues/894)，作者回复如下：

Just to make it clear, if you have not read the entire documentation, onInit is called whenever a dependency is placed in memory.
You must inject this dependency with Get.put or Get.lazyPut for it to be called.

In case you don't want to do that, you should call onInit in your class's constructor (ugly solution, but work, I wouldn't go that way), as if it were an initialization function, in the same way.

简单翻译下：

**onInit()** 会在注入到内存时自动调用，需要你使用 **Get.put()** 或 **Get.lazyPut()** 注入实例才会生效。不想这样做的话，也可以在类的构造函数中手动调用 onInit()。

#### 3.1.3. 坑：添加响应拦截器报错

🤷‍♀️ **GetConnect** 没有像 **dio** 直接添加拦截器的API：

只能添加调用 **addResponseModifier** 拦截响应自行处理，直接把响应内容直接给打印出来：

```dart
httpClient.addResponseModifier((request, response) => {LogUtil.e("${response.body}")});
```

然后一请求，控制台就报错：

点进报错未知，就是这里强转导致的异常：

明显是需要指定一个泛型，然后需要有一个Response的 **返回值**，然后文档是这样写的 (没有返回值)：

😭 翻了好一会儿，发现了这个issues：[Exception when use httpClient.addResponseModifier after upgrade from getx 4.1.4](https://github.com/jonataslaw/getx/issues/1720)，作者给出的解决方法 → **指定泛型类型** + **返回response**：

照着改下试试，顺带打印下请求和响应的日志：

试了下登录接口，日志都打印出来了~

#### 3.1.4. 封装效果

**json的序列化和反序列化**，还是用的 **json_serializable** 库，直接CV之前的 **DataResponse** 和 **ListResponse**：

```dart
import 'package:json_annotation/json_annotation.dart';
import 'package:van_android_getx/core/services/api/exceptions.dart';

part 'base_response.g.dart';

@JsonSerializable(genericArgumentFactories: true)
class DataResponse<T> {
  final T? data;
  final int errorCode;
  final String errorMsg;
  @JsonKey(includeFromJson: false, includeToJson: false)
  ApiException? error;

  DataResponse({required this.data, required this.errorCode, required this.errorMsg, this.error});

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
  @JsonKey(includeFromJson: false, includeToJson: false)
  ApiException? error;

  ListResponse({required this.data, required this.errorCode, required this.errorMsg, this.error});

// 使用泛型方法的工厂构造方法来创建一个响应实例
  factory ListResponse.fromJson(Map<String, dynamic> json, T Function(dynamic json) fromJsonT) =>
      _$ListResponseFromJson(json, fromJsonT);

// 使用泛型方法将实例转换为Json
  Map<String, dynamic> toJson(dynamic Function(T value) toJsonT) => _$ListResponseToJson(this, toJsonT);
}
```

然后是请求返回响应数据的 **统一解析+异常处理**，继承 **GetConnect**，里面有同名函数，所以在函数名后加个X：

```dart
class ApiClient extends GetConnect {
  @override
  void onInit() {
    httpClient.baseUrl = "https://www.wanandroid.com/";
    httpClient.timeout = const Duration(seconds: 30);
    // 添加拦截器打印日志
    httpClient.addResponseModifier<dynamic>((request, response) {
      request.bodyBytes.bytesToString().then((value) => {
            LogUtil.d("Request headers: ${request.headers}"),
            LogUtil.d("Request Url: ${request.url}"),
            LogUtil.d("Request Body: $value"),
            LogUtil.d("Response headers: ${response.headers}"),
            LogUtil.d("Response Body: ${response.body}")
          });
      return response;
    });
    super.onInit();
  }

  // 请求响应的通用处理封装
  Future<R> _performRequestX<R, D>(Future<Response> Function() requestCall, D Function(dynamic json)? fromJsonT) async {
    try {
      Response response = await requestCall();
      // 如果没设置fromJsonT或R是动态类型，直接返回响应数据
      if (fromJsonT == null || R == dynamic || response.body is! Map<String, dynamic>) return response.body;
      Map<String, dynamic>? responseObject = response.body;
      if (response.statusCode == 200 && responseObject != null && responseObject.isNotEmpty) {
        switch (responseObject['errorCode']) {
          case 0:
            if (R.toString().contains("DataResponse")) {
              return DataResponse<D>.fromJson(responseObject, fromJsonT) as R;
            } else if (R.toString().contains("ListResponse")) {
              return ListResponse<D>.fromJson(responseObject, fromJsonT) as R;
            } else {
              throw ApiException(-1, "未知响应类型：$R");
            }
          default:
            throw ApiException(responseObject['errorCode'], responseObject['errorMsg']);
        }
      } else {
        throw ApiException(-1, "错误响应格式");
      }
    } catch (e) {
      final error = ApiException.from(e);
      if (R.toString().contains("DataResponse")) {
        return DataResponse<D>(data: null, errorCode: -1, errorMsg: error.message ?? "未知异常", error: error) as R;
      } else if (R.toString().contains("ListResponse")) {
        return ListResponse<D>(data: null, errorCode: -1, errorMsg: error.message ?? "未知异常", error: error) as R;
      } else {
        rethrow;
      }
    }
  }

  /// 发起Post请求
  Future<R> postX<R, D>(String? url,
          {dynamic body,
          String? contentType,
          Map<String, String>? headers,
          Map<String, dynamic>? query,
          D Function(dynamic json)? fromJsonT}) =>
      _performRequestX(
          () => post(url, body ?? "{}", contentType: contentType, headers: headers, query: query), fromJsonT);

  /// 发起Get请求
  Future<R> getX<R, D>(String url,
          {Map<String, String>? headers,
          String? contentType,
          Map<String, dynamic>? query,
          D Function(dynamic json)? fromJsonT}) =>
      _performRequestX(() => get(url, contentType: contentType, headers: headers, query: query), fromJsonT);
}
```

接着是注入这个 **ApiClient** 实例，自定义一个 **Bindings**：

```dart
class HomeBindings extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut(() => ApiClient());
  }
}
```

直接通过 **GetMaterialApp** 的 **initialBinding** 属性传入：

```dart
void main() {
  runApp(GetMaterialApp(
    theme: leiMuBlueTheme,
    initialBinding: HomeBindings(),
    home: const MyHomePage())
  );
}
```

👏 而且，通过注入保证了 **单例**，为了利用Dart的 **类型推导**，不用写繁琐的类型转换，定义一个API类：

```dart
class AccountApi {
  // 请求登录
  static Future<DataResponse<AccountInfo?>> login(AccountLoginReq req) =>
      Get.find<ApiClient>().postX(
          "user/login",
          query: req.toJson(), fromJsonT: (json) => AccountInfo.fromJson(json)
      );
}
```

写下登录页的VM：

```dart
class LoginVM extends GetxController {
  var userNameController = TextEditingController();
  var passwordController = TextEditingController();
  var apiClient = Get.find<ApiClient>();

  // 登录
  Future<bool> login() async {
    final username = userNameController.text;
    final password = passwordController.text;
    if (username.isNotEmpty && password.isNotEmpty) {
      var result = await AccountApi.login(AccountLoginReq(username, password));
      if (result.error == null) {
        ToastUtil.show(msg: "${result.data?.toJson()}");
        return true;
      } else {
        ToastUtil.show(msg: result.errorMsg);
        return false;
      }
    } else {
      ToastUtil.show(msg: "用户名或密码不能为空");
    }
    return false;
  }

  @override
  void dispose() {
    super.dispose();
    userNameController.dispose();
    passwordController.dispose();
  }
}
```

然后登录页UI：

```dart
class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    final LoginVM loginVM = Get.put(LoginVM());
    return Scaffold(
      appBar: AppBar(
        title: const Text('登录页', style: TextStyle(color: Colors.white)),
        backgroundColor: Get.theme.primaryColor,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            TextField(
              controller: loginVM.userNameController,
              decoration: const InputDecoration(
                labelText: '用户名',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20.0),
            TextField(
              controller: loginVM.passwordController,
              decoration: const InputDecoration(
                labelText: '密码',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 20.0),
            MaterialButton(
              onPressed: loginVM.login,
              color: Get.theme.primaryColor,
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
                  Get.to(const RegisterPage());
                })
          ],
        ),
      ),
    );
  }
}
```

运行看下效果：

OK，成功和失败都能正确解析，网络请求的基本框架搞定 👏~

#### 3.1.5. 优化：加一个Loading Dialog

网络请求是耗时的异步操作，网不好的时候点完按钮，一点反应没有，用户体验不太好，一般会加个Loading对话框。😊 Flutter 原生可以通过 **showDialog()** 进行弹窗，但它需要传递一个 **BuildContext**，而使用GetX，无需操心Context去哪里获取，直接 **Get.dialog(YourDialogWidget())** 即可弹窗，写一个弹窗的全局函数：

```dart
/// 展示一个Loading对话框
void showLoadingDialog({bool canPop = true}) {
  Get.dialog(
      WillPopScope(
          onWillPop: () async => canPop, // 根据canPop参数决定是否允许关闭对话框
          child: Center(
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
                    CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(Get.theme.primaryColor)),
                  ],
                ),
              ),
            ),
          )),
      barrierDismissible: false);
}
```

**调用处**：

、

😏 不需要传递Context，直接整到网络请求那里，减少重复的CV工作：

👏 Nice，现在发起网络请求会自动显示和关闭Loading对话框了~

#### 3.1.6. 免登录cookie持久化

就登录后会在 **响应头** 里 **set-cookie** 里返回 **Cookie**，在请求头中添加这个Cookie，就处于登录态了，做下 **持久化** (保存到本地)，就不用每次都登录了。😄 这里直接用基于 **GetX** 实现的 纯Dart文件级key-value存储 → [get_storage](https://pub.dev/packages/get_storage) 库来保存。执行 **flutter pub add get_storage** 添加下依赖，在 **runApp()** 前调下 **init()** 进行初始化：

在 **Bindings** 那里注入下：

接着在初始化的时候读本地的Cookie，拦截请求添加上这个请求头：

登录成功时保存下Cookie：

登录成功后，干掉APP再进来，可以看到打印的日志：

## 4. 小结

😄 本节花了亿点时间，把GetX的官方文档完整过了一遍，然后用它来重写之前写的 **Van♂Android** 项目，不得不说写起来是真的「**爽**」，什么都给你组合封装好了，你无脑堆业务就可以了。 实战部分只写了比较核心的网络请求封装和登录页的大概逻辑，其它页面其实也是类似，就不赘述了，感兴趣的可以查看完整项目：[van_android_getx](https://github.com/配套示例源码)，谢谢🙏~

**参考文献**：

* [《Flutter 工程化框架选择 — 状态管理何去何从》](https://guoshuyu.cn/home/wx/Z2.html)
* [《解决GetX Controller 生命周期方法调用异常的BUG》](https://blog.csdn.net/qq_26439323/article/details/129484608)