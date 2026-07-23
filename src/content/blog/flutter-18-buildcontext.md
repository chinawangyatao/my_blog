---
title: "Flutter入门到精通（十八）：探探BuildContext"
pubDate: 2024-01-19
description: "深入理解BuildContext的本质和作用，它在Widget树中的角色。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第十八篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

😄 上节**《十七、实战进阶-用 ViewModel 来分离 UI & 逻辑》**中提到在逻辑层 **弹窗** 或 **页面跳转**，拿不到当前的 **BuildContext**， 如果在 **异步操作** 中传递，会显示 "**Don't use 'BuildContext's across async gaps.** " 的 **警告**：

上述例子，如果在5s内，用户跳转到别的页面，可能会导致原先的 **BuildContext** 所对应的Widget不在Widget树中，此时尝试使用这个 **BuildContext** 将会引发运行时错误。建议先调用下 **BuildContext** 对象的 **mounted** 属性，为 **true** 才使用 BuildContext 进行操作。因为，当 **Widget** 从 **Widget树** 移除时，**mounted** 会变为 **false** 😁。 一种常见的解法：

> 定义一个 **GlobalKey** 类型的 **顶层变量**，在创建 **MaterialApp** 时，通过 **navigatorKey** 属性传入，然后就可以在应用的 任何地方 使用 **navigatorKey.currentContext** 来获取 **BuildContext**。然后需要注意下，它可能会返回 **null** 值，你能确保它不会空的话就用 **!** ，否则还是老老实实 **判空** 🤷‍♀️。

然后，就可以定义 **全局** 的 showSnackBar() 和 pop() 方便代码复用了：

 Demo 可以，CV到公司项目上，一调 pop() 就 **黑屏**，改回Button里直接 **Navigator.pop(context)** 又正常。

感觉是 **BuildContext** 不对，分别 **断点** 了一下 Demo 和 公司项目中 BuildContext 的值进行对比：

好像看不出个所以然来...

直觉告诉我很大概率是因为搞 **混合开发** 集成了 [flutter_boost](https://github.com/alibaba/flutter_boost)，它接管 **路由** 管理导致的，翻了下文档，看到关闭页面的API → **BoostNavigator.instance.pop()** ，尝试把pop() 部分的代码改成这句，然后就不会黑屏了...

🤔 问题是解决了，但引起问题的具体原因却还没定位到，直接去扒 **flutter_boost** 有点自不量力了🤷‍♀️，毕竟连 **Flutter** 本身那套 **路由** 的机制都还没摸透，还是先搞点基础。本节来探探 **BuildContext**，它在Flutter开发中扮演着极其重要的角色，几乎贯穿整个 Flutter应用的开发周期，应该是本系列最轻松的一节了🤣~

## 2. BuildContext 简介

🔍 直接点开 **BuildContext** 的源码，一段注释映入眼帘 👀：

> /// [BuildContext] objects are actually [Element] objects. The [BuildContext]
>
> /// interface is used to discourage direct manipulation of [Element] objects.

**简单翻译**：

> **BuildContext** 实际上就是 **Element** 对象，定义 **BuildContext** 接口是为了防止开发者直接操作 **Element**。

点开 **Element** 类，可以看到它实现了 **BuildContext** 接口：

```dart
abstract class Element extends DiagnosticableTree implements BuildContext
```

往上看 **BuildContext** 的其它注释，还能了解到这些信息：

* **BuildContext** → 一个指向 **Widget树** 中 **Widget** 的 **位置引用**，提供一系列 **访问和操作** 与 **当前Widget相关** 的 **环境和数据** 的方法，可以在 **StatelessWidget#build()** 和 **State** 对象的方法中使用。
* 有些 **静态方法** 也需要用到 BuildContext，如：**showDialog()** → 通过上下文确定在哪个Widget树中弹出对话框，**Theme.of()** → 通过上下文查找最近的 **ThemeWidget** 来获得当前上下文中的主题信息。
* 调用 **Widget#build()** 时传递的 BuildContext参数 代表当前正在构建的 **Widget** 在 **Widget树** 中的位置。当构建返回的 **Widget** 被插入到 **Widget树** 时，它就有了 **自己的BuildContext**，和上面build()传入的上下文不同，因为它代表返回的Widget在树中的 **新位置**！
* 写了一个 **ScaffoldState.showBottomSheet()** 通过 **Builder** 组件的 **builder()** 获取 **BuildContext** 来查找到正确的 **Scaffold** 代码示例：

```dart
 @override
 Widget build(BuildContext context) {
   // 在这里这行 Scaffold.of(context) 会返回 null
   return Scaffold(
     appBar: AppBar(title: const Text('Demo')),
     // Builder 会提供一个新的 BuildContext，即当前Widget在Widget树中的位置
     body: Builder(
       builder: (BuildContext context) {
         return TextButton(
           child: const Text('BUTTON'),
           onPressed: () {
             Scaffold.of(context).showBottomSheet<void>(
               (BuildContext context) {
                 return Container(
                   alignment: Alignment.center,
                   height: 200,
                   color: Colors.amber,
                   child: Center(
                     child: Column(
                       mainAxisSize: MainAxisSize.min,
                       children: <Widget>[
                         const Text('BottomSheet'),
                         ElevatedButton(
                           child: const Text('Close BottomSheet'),
                           onPressed: () {
                             Navigator.pop(context);
                           },
                         )
                       ],
                     ),
                   ),
                 );
               },
             );
           },
         );
       },
     )
   );
 }
```

然后是 **常用的属性与方法**：

* **widget**：返回与当前BuildContext关联的Widget实例。
* **size**：返回与当前BuildContext关联的Widget实例大小，此属性在 build() 中不可用，因为构建过程中 Widget 的大小还未确定。
* **mounted**：与当前BuildContext关联的Widget实例是否挂载在Widget树中。

* **findAncestorWidgetOfExactType** ：查找最近的 **祖先Widget**，Widget类型是T。
* **findAncestorStateOfType** ：查找最近的 **祖先State**，State类型是T。
* **findRootAncestorStateOfType** ：查找 **最顶层的祖先State**，State类型是T。
* **findRenderObject()** ：返回与当前Widget相关联的 **RenderObject**。
* **visitChildElements()** ：遍历当前Element的所有子Element。
* **visitAncestorElements()** ：遍历当前Element的所有祖先Element。
* **dependOnInheritedWidgetOfExactType**()：查找最近的父级InheritedWidget，**并注册依赖关系**，Widget类型是T。
* **getElementForInheritedWidgetOfExactType**()：查找最近的父级InheritedWidget，**不注册依赖关系，Widget类型是T**。

最后再提一点，在[《郭佬GSY博客》](https://guoshuyu.cn/home/wx/Flutter-N8.html)看到的 **BuildContext使用小技巧**：

> 在异步操作里使用 **of(context)** 可以先 **提前获取** 再做 **异步操作**，这样可以尽量保证流程完整执行。另外，建议把 **of(context)** 相关的操作逻辑放到 **didChangeDependencies()** 中处理。

## 3. BuildContext 使用场景

😄 还挺多，不过在知道下面的原理后，就很好理解了，简单过一下吧~

> **BuildContext** ≈ **Element** ≈ **Widget在Widget树上的位置引用**

### 3.1. 导航

使用 **Navigator** 进行页面跳转时，需要 **BuildContext** 来获取当前的导航状态。

```dart
Navigator.of(context).push(MaterialPageRoute(builder: (context) => NewPage()));
Navigator.of(context).pop()
```

调用 **Navigator.of(context)** 实际上是请求当前 BuildContext 所在位置向上查找最新的 **NavigatorState**：

它提供了操作路由堆栈的相关方法，如：push()、pop()、pushNamed()、pushReplacement() 等。

**WidgetsApp**、**MaterialApp** 和 **CupertinoApp** 内部会自动创建一个 **顶层的Navigator** 来管理应用的顶层路由堆栈。定义 **GlobalKey** 传递分配给它们的 **navigatorKey** 属性，就是让其它创建的**Navigator** Widget使用这个 **GlobalKey**，从而实现全局访问。

### 3.2. 主题

访问当前主题信息，如颜色、字体等，需要使用 **BuildContext** 来获取 **最近的Theme**。

```dart
ThemeData theme = Theme.of(context);
Color primaryColor = Theme.of(context).primaryColor;
Color accentColor = Theme.of(context).colorScheme.secondary;
```

### 3.3. 媒体查询

获取设备的屏幕尺寸、方向、像素密度等信息。

```dart
// 获得屏幕尺寸
Size screenSize = MediaQuery.of(context).size;
double screenWidth = screenSize.width;
double screenHeight = screenSize.height;

// 获取屏幕方向
Orientation orientation = MediaQuery.of(context).orientation;

// 获取设备像素密度
double devicePixelRatio = MediaQuery.of(context).devicePixelRatio;

// 获取顶部安全区域的高度：对于有刘海屏或圆角的设备，顶部安全区域指的是不被刘海遮挡且可用于显示内容的区域的高度。
double topPadding = MediaQuery.of(context).padding.top;

// 获得底部安全区域的高度：对于一些设备，底部可能有虚拟按键或者圆角，底部安全区域指的是不被这些元素遮挡且可用于显示内容的区域的高度。
double bottomPadding = MediaQuery.of(context).padding.bottom;
```

**注**：需要确保MediaQuery.of()用到的context是在 **MaterialApp/WidgetsApp/CupertinoApp** 构建的Widget树中，因为它依赖到这些顶层Widget提供的 **MediaQueryData**，找不到会抛 **NoSuchMethodError**。

### 3.4. 局部化和国际化

获取当前的区域设置信息，用于国际化。

```dart
// 获取当前Locale
Locale locale = Localizations.localeOf(context);

// 使用获取的Locale信息
Text('Current Locale: ${myLocale.languageCode}-${myLocale.countryCode}')
```

### 3.5. 弹窗和对话框

显示弹窗、底部表单等需要 BuildContext 来标识从哪个部分的界面弹出。

```dart
// 弹窗
showDialog(
  context: context,
  builder: (BuildContext context) {
    return AlertDialog(
      title: Text("Title"),
      content: Text("Content"),
    );
  },
);

// 弹出底部表单
showBottomSheetExample(BuildContext context) {
  showModalBottomSheet(
    context: context,
    builder: (BuildContext context) {
      return Container(
        height: 200,
        color: Colors.amber,
        child: Center(
          child: Text('这是一个底部表单'),
        ),
      );
    },
  );
}
```

### 3.6. 状态管理

在使用 Provider、InheritedWidget 等状态管理工具时，BuildContext 用于获取最近的状态或数据。

```dart
// Provider
final myModel = Provider.of(context);

// InheritedWidget
InheritedMyModel data = context.dependOnInheritedWidgetOfExactType();
```

### 3.7. 访问 Scaffold

如，显示一个 **SnackBar** 需要 BuildContext 来查找最近的 **Scaffold**。

```dart
ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Hello")));
```

### 3.8. 获取 Form 状态

在使用 Form Widget 时，BuildContext 用于获取 FormState，进而对表单进行操作，如验证表单。

```dart
FormState formState = Form.of(context);
```

### 3.9. 资源读取

如读取图片、加载文本文件等，可以通过 BuildContext 来获取当前的 AssetBundle。

```dart
DefaultAssetBundle.of(context).loadString('assets/config.json');
```