---
title: "Flutter入门到精通（二十一）：用GetX重构项目"
pubDate: 2024-01-22
description: "使用GetX框架重构现有Flutter项目的实践。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第二十一篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言
 上节**《二十、玩转状态管理之——GetX使用详解》**介绍了大名鼎鼎的Flutter库 **GetX** 的详细用法，文尾用它重构了之前VanAndroid的 **网络请求封装**，简单写了下登录页面，把基本的流程走通了。
🤔 然后，有读者私聊我，希望我能像**《七、项目实战-UI部分🤷‍♀️》**那样从头到尾写一篇完整的实战文章。 说实话，这种实战类的文章，最费时间了，不过既然有读者需要，那就安排一波吧，😏 谁让宠粉呢，也当是自己顺便学下没用过的组件，踩踩坑吧～
## 2. 项目结构
😏 写项目前的第一件事，肯定是先定「**项目的组织结构**」，分享一个我自己总结的 **适合中小型Flutter项目的通用目录结构**，不用严格按照我的来哈，参考下就好，读者可以根据自己的实际情况进行调整～

## 3. 登录逻辑完善
#### 3.1.1. 未登录访问需要登录的接口
[WanAndroid](https://www.wanandroid.com/blog/show/2) 的API接口，有些是需要的 **登录** 才能够访问的，处于「**未登录态**」访问会返回 **-1001** 的errorCode，此时需要用户重新登录才能访问。
😄 常规的处理逻辑是跳转到登录页，让用户重新登录，这里只需要修改下 **ApiClient** 的 **_performRequestX()** ，对 errorCode 不为 0 的处理前加个判定：errorCode == -1001，关闭加载弹窗、清空Cookie，然后跳转到登录页，具体代码如下：

😁 随便跳啊，GetX的 **无Context** 导航就是爽~(¯▽¯~)
#### 3.1.2. 登录跳注册，注册成功后关闭登录页
😄 如题，实际开发中常有这样的需求，对于 **页面关闭同时关闭相邻页面** 的 **简单场景**，直接在 **前置页面** **await** 等待 **跳转页面** 的返回值做判断，**跳转页面** 出栈时 **回传参数**。具体示例如下：

注册页调用 **Get.back()** 时回传一个true：

👏 简单两步，轻松实现，而对于 **多个页面的关闭的复杂场景**，则可以通过 **注入共享的自定义GetxController + 监听可观察变量** 来实现。
## 4. 侧滑
想实现 **侧滑** 的UI效果如下 (登录前后)：

如何判断是否处于 **登录态**？可以用上面的 **Cookie** 作为标识，因为接口返回errorCode为-1001时表示需要登录，跳登录页的同时会将Cookie置空，不过得把 **Cookie** 修改为 **可观察变量**。
🤔 em... 查询积分接口，有返回用户名，但却是加密后的数据，而 **登录/注册** 后，返回的数据里其实也有积分，还有，这两接口返回数据格式其实是一样的，索性整合到一个 VM 里，然后暴露一个 **accountInfo** 可观察变量作为登录态的标识，还能拿到积分，具体实现代码如下：
```dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get\_storage/get\_storage.dart';
import 'package:van\_android\_getx/core/services/api/api\_client.dart';
import 'package:van\_android\_getx/core/services/api/van\_api.dart';
import 'package:van\_android\_getx/core/utils/toast\_utils.dart';
import 'package:van\_android\_getx/data/model/account\_info.dart';
import 'package:van\_android\_getx/data/model/account\_login.dart';
import 'package:van\_android\_getx/data/model/account\_register.dart';
import 'package:van\_android\_getx/data/model/base\_response.dart';
class AccountVM extends GetxController {
var apiClient = Get.find();
// 用户信息
var accountInfo = Rx(null);
// 登录文本编辑控制器
var loginUserNameController = TextEditingController();
var loginPasswordController = TextEditingController();
// 注册文本编辑控制器
var registerUserNameController = TextEditingController();
var registerPasswordController = TextEditingController();
var registerReUserNameController = TextEditingController();
// 登录
Future login() async {
final username = loginUserNameController.text;
final password = loginPasswordController.text;
if (username.isNotEmpty && password.isNotEmpty) {
var result = await VanApi.login(AccountLoginReq(username, password));
parseAccountInfo(result);
} else {
showToast(msg: "用户名或密码不能为空");
}
}
// 注册
Future register() async {
final username = registerUserNameController.text;
final password = registerPasswordController.text;
final rePassword = registerReUserNameController.text;
if (username.isNotEmpty && password.isNotEmpty && rePassword.isNotEmpty) {
if (password == rePassword) {
var result = await VanApi.register(AccountRegisterReq(username, password, rePassword));
parseAccountInfo(result, isLogin: false);
} else {
showToast(msg: "两次输入的密码不一致");
}
} else {
showToast(msg: "用户名或密码不能为空");
}
}
// 退出登录
void logout() {
accountInfo.value = null;
apiClient.updateCookies(null);
showToast(msg: "退出登录成功");
}
// 解析用户信息的通用处理方法
void parseAccountInfo(DataResponse result, {bool? isLogin = true}) {
if(result.error == null) {
// 更新用户状态
accountInfo.value = result.data;
var cookies = result.headers?['set-cookie'];
if (null != cookies) {
VanApi.updateCookies(cookies);
Get.find().write("Cookie", cookies);
}
if (isLogin == true) {
showToast(msg: "【${result.data!.nickname}】登录成功");
Get.back();
} else {
showToast(msg: "【${result.data!.nickname}】注册成功");
// 注册成功登录页面也关闭
Get.back(result: true);
}
} else {
showToast(msg: result.errorMsg);
}
}
@override
void onClose() {
super.onClose();
loginUserNameController.dispose();
loginPasswordController.dispose();
registerUserNameController.dispose();
registerPasswordController.dispose();
registerReUserNameController.dispose();
}
}
```
接着是侧滑页，获取AccountVM实例，给需要观查登录状态的Widget套个「**Obx**」就完事了：
```dart
class DrawerPage extends StatelessWidget {
const DrawerPage({super.key});
@override
Widget build(BuildContext context) {
final AccountVM accountVM = Get.find();
final DrawerVm drawerVm = Get.put(DrawerVm());
return Drawer(
child: ListView(
padding: EdgeInsets.zero,
children: [
DrawerHeader(
decoration: const BoxDecoration(
color: Color(0xFF5A78EA),
),
child: Column(
children: [
Image.asset("assets/images/ic\_nav\_icon.png", width: 64, height: 64),
const SizedBox(height: 10),
// 用户名
Obx(() {
return GestureDetector(
child: Text(
accountVM.accountInfo.value?.nickname ?? "去登录",
style: const TextStyle(
color: Colors.white,
fontSize: 24,
),
),
onTap: () {
if (accountVM.accountInfo.value == null) {
Get.to(const LoginPage());
}
},
);
})
],
),
),
// 积分
Obx(() => ListTile(
leading: const Icon(Icons.score),
title: Text('我的积分：【${accountVM.accountInfo.value?.coinCount ?? "点击刷新"}】'),
onTap: drawerVm.fetchCoin,
)),
const ListTile(
leading: Icon(Icons.settings),
title: Text('系统设置'),
),
Obx(() => Visibility(
visible: accountVM.accountInfo.value != null,
child: ListTile(
leading: const Icon(Icons.logout),
title: const Text('退出登录'),
onTap: accountVM.logout,
))),
],
),
);
}
}
```
**代码运行效果如下**：

😏 不知道细心的读者有没有发现一个问题：
退出登录后，点击跳转登录页，**默认填充了账号密码**？
这是因为VM持有的 **TextEditingController** 实例没有被销毁，为啥没被销毁？因为 **GetxController#onClose()** 的调用时机是这样的：
> 当使用 **Get.put()** 或 **Get.lazyPut()** 等方式注册的 **GetxController** 不再被任何Widget或其他Controller所依赖，并从内存中移除时调用。Getx会自动检测 GetxController实例 的使用情况，一旦发现不再被需要，就会调用 **onClose()** 来进行资源释放。
🤷‍♀️ 这里的侧滑和登录页都依赖 **AccountVM**，登录页关闭，侧滑页还在，自然不会触发 **AccountVM#onClose()** ，所以登录页用的**TextEditingController** 实例依旧存在。
😄 这算是共享GetxController的 **副作用** 吧，不过不用担心内存泄露的问题，因为最终还是会调用 dispose() 的，如果不喜欢默认填充，可以在登录成功时置空下TextEditingController实例的 text。
😊 当然，也可以把TextEditingController实例从 **AccountVM** 挪到 **LoginPage**，把登录方法的传参改为文本。
## 5. 主页
😄 沿用**《七、项目实战-UI部分🤷‍♀️》**的「**页面结构草图**」：

**主页** 划分为两个区域：**内容区域** (PageView) 和 **底部选项卡** (BottomNavigationBar)，简单写下首页、关注、其它页，用一个不同的Text区分，基本框架搭好：

🤔 接着要做的第一件事就是实现这两者的联动，滑动页面切Tab，点击Tab切页面~
### 5.1. PageView 与 BottomNavigationBar 切换联动
😏 用GetX实现很简单，定义一个共享的 **GetxController**，包含一个的 **TabIndex** 可观察变量 和**PageController** 实例：
```dart
class MainVM extends GetxController {
var tabIndex = 0.obs; // 当前tab下标
var mainPageController = PageController(initialPage: 0); // Page页面切换控制器
@override
void onClose() {
mainPageController.dispose();
super.onClose();
}
}
```
**IndexBottomBarWidget** 代码改动如下：

**IndexContainerWidget** 代码如下：

**运行看下效果**：

👏 Nice，接着完善下首页～
### 5.2. 首页 Banner + 文章列表
😄 这里复用之前VanAndroid的代码，只是逻辑放到 **HomeVM** 中，代码比较简单，就是设置 Banner列表 和 文章列表 两个可观察变量：
```dart
class HomeVM extends GetxController {
// Banner
var bannerItems = List.empty(growable: true).obs;
// 文章
var homeArticleInfoItems = List.empty(growable: true).obs;
var currentPage = 0; // 当前页数
// 拉取Banner
Future fetchHomeBanner() async {
var result = await VanApi.homeBanner();
if (result.error == null) {
bannerItems.value = result.data ?? [];
} else {
showToast(msg: result.errorMsg);
}
}
// 拉取文章
Future fetchArticleList({bool? isRefresh = false}) async {
if (isRefresh == true) {
currentPage = 0;
homeArticleInfoItems.clear();
} else {
currentPage++;
}
var result = await VanApi.homeArticleList(currentPage);
if (result.error == null) {
homeArticleInfoItems.addAll((result.data?.datas ?? []));
} else {
showToast(msg: result.errorMsg);
}
}
@override
void onInit() {
super.onInit();
// 页面初始化的时候拉下数据
WidgetsBinding.instance.addPostFrameCallback((\_) {
fetchHomeBanner();
fetchArticleList(isRefresh: true);
});
}
}
```
然后是 **HomePage** 的代码：
```dart
class HomePage extends StatelessWidget {
const HomePage({super.key});
@override
Widget build(BuildContext context) {
final vm = Get.put(HomeVM());
return RefreshIndicator(
onRefresh: () => vm.fetchArticleList(isRefresh: true),
// 包裹一个可观察组件
child: Obx(() {
// ScrollController 实例必须写在这里，写在VM里，会导致无法下拉刷新
var scrollController = ScrollController();
scrollController.addListener(() {
// 列表滑动到底部加载更多
if (scrollController.position.pixels == scrollController.position.maxScrollExtent) {
vm.fetchArticleList();
}
});
return ListView.builder(
controller: scrollController,
// 列表长度为数据长度+1,0用来显示Banner
itemCount: vm.homeArticleInfoItems.length + 1,
itemBuilder: (context, index) {
if (index == 0) {
return AutoScrollBannerWidget(
imageUrls: vm.bannerItems.map((element) => element.imagePath).toList(),
onTap: (pos) {
Get.to(BrowserPage(url: vm.bannerItems[pos].url));
});
} else {
return ArticleItemWidget(articleInfo: vm.homeArticleInfoItems[index - 1]);
}
});
}));
}
}
```
**运行效果如下**：

### 5.3. PageView 切换页面后重新加载的问题
😑 首页写完，刚准备写公众号页，结果发现了一个BUG：
> 首页滑动一段距离，点击Tab或者滑动切换页面，回到首页，每次都是从顶部开始。
😐 感觉大概率是切回首页时 **页面重建** 了，打个log看看：

果然，切换页面就会重建，这个问题其实之前就遇到过了：
> 在 Flutter 中，当一个 widget 不在视图中时，为了节约资源，Flutter 可能会卸载这个 Widget，然后当它再次需要显示时重新创建它。
当时的解法：

😥 但这个解法没法直接套，**AutomaticKeepAliveClientMixin** 得配合 **StatefulWidget** 使用，而得益于 GetX，项目里都是 **StatelessWidget** 一把梭。网上搜了圈，看到有人说可以通过为每个 Page设置一个 **PageStorageKey** 来解决，简单介绍下它：
> 特殊类型的Key，用于保存页面 (通常是滚动位置) 的状态，当使用 PageView、ListView 或其它滚动Widget时，它可以帮助Flutter记住用户滚动到的位置。
修改后代码如下：

😳 运行后，首页滑动一段距离后，切去其它页面切回来，确实没有从顶部开始，但实际上页面还是重建了：

🤷‍♀️ 而且如果你上拉加载多次导致列表很长时，切换会有明显的卡顿，还是得另寻他法啊。
😮 在 **GetX** 的 **issues** 搜了下 **PageView**，发现不少人也遇到同样的问题 → [[Feature Request] Mixin equivalent to AutomaticKeepAliveClientMixin](https://github.com/jonataslaw/getx/issues/822)，看到一个赞最多的评论：

em... 就是外面套了一层 **StatefulWidget**，然后混入 **AutomaticKeepAliveClientMixin** 啊，直接CV：

👍 完美解决，说到 **列表过长**，滑动到顶部挺费劲的，顺手加个 **悬浮按钮** 吧，点击自动滑动到顶部：

**运行效果如下**：

### 5.4. 公众号页
😄 **Tab + 列表页** 的页面结构，可以使用 **TabBar + TabBarView** 来实现，一般有两种常规用法，一一介绍下~
#### 5.4.1. DefaultTabController
**DefaultTabController** Widget 提供了一个 **默认的TabController**，可以自动处理Tab视图的初始化和更新，使用代码示例如下：
```dart
import 'package:flutter/material.dart';
class WxPage extends StatelessWidget {
const WxPage({super.key});
@override
Widget build(BuildContext context) {
return const DefaultTabController(
length: 3, // Number of tabs
child: Column(children: [
TabBar(
tabs: [
Tab(icon: Icon(Icons.directions\_car)),
Tab(icon: Icon(Icons.directions\_transit)),
Tab(icon: Icon(Icons.directions\_bike)),
],
),
Expanded(
child: TabBarView(children: [
Icon(Icons.directions\_car),
Icon(Icons.directions\_transit),
Icon(Icons.directions\_bike),
]),
),
]),
);
}
}
```
代码运行效果如下：

用法非常简单，不过没有暴露 **Tab点击监听** 的属性，如果需要监听，得做下改动，代码示例如下：

#### 5.4.2. SingleTickerProviderStateMixin
🤷‍♀️ 需要 **State** 对象作为 **TickerProvider**，也就是需要 **StatefulWidget**，相比 **DefaultTabController**，可以实现更细粒度的动画控制。使用代码示例如下：
```dart
class WxPage extends StatefulWidget {
const WxPage({super.key});
@override
State createState() => \_WxPageState();
}
// ① 混入 SingleTickerProviderStateMixin
class \_WxPageState extends State with SingleTickerProviderStateMixin {
late TabController \_tabController;
@override
void initState() {
super.initState();
// ② 初始化TabController实例
\_tabController = TabController(length: 3, vsync: this);
}
@override
Widget build(BuildContext context) {
// ③ 分别为TabBar和TabBarView设置同一个TabController实例
return Column(children: [
TabBar(
controller: \_tabController,
tabs: const [
Tab(icon: Icon(Icons.directions\_car)),
Tab(icon: Icon(Icons.directions\_transit)),
Tab(icon: Icon(Icons.directions\_bike)),
],
),
Expanded(
child: TabBarView(
controller: \_tabController,
children: const [
Icon(Icons.directions\_car), // Replace with your widget for tab 1
Icon(Icons.directions\_transit), // Replace with your widget for tab 2
Icon(Icons.directions\_bike), // Replace with your widget for tab 3
],
),
),
]);
}
@override
void dispose() {
// ④ 销毁时释放
\_tabController.dispose();
super.dispose();
}
}
```
#### 5.4.3. Get 提供的 GetSingleTickerProviderStateMixin
😄 不想用 **DefaultTabController**，也不想使用 **StatefulWidget**，能不能直接在GetXController中使用？可以，混入GetX给我们提供的「**GetSingleTickerProviderStateMixin**」就行啦，使用代码示例如下：

然后页面的 **TabBar** 和 **TabBarView** 的 **controller** 属性设置为这个TabController实例。😄 接着继续完善下公众号页面~
#### 5.4.4. 完善公众号页
逻辑的话是先拉公众号列表，然后再拉对应公号的历史文章数据列表，先写下VM，比较简单，就初始化的时候拉下接口：
```dart
class WxVM extends GetxController with GetSingleTickerProviderStateMixin {
TabController? tabController;
var wxAccounts = List.empty(growable: true).obs;
@override
void onInit() {
super.onInit();
WidgetsBinding.instance.addPostFrameCallback((\_) {
fetchWXAccounts();
});
}
// 拉取公众号列表
Future fetchWXAccounts({bool? isRefresh = false}) async {
var result = await VanApi.wxAccounts();
if (result.error == null) {
wxAccounts.addAll(result.data ?? []);
tabController = TabController(length: wxAccounts.length, vsync: this);
tabController?.addListener(() {
if (!tabController!.indexIsChanging) {}
});
} else {
showToast(msg: result.errorMsg);
}
}
@override
void onClose() {
tabController?.dispose();
super.onClose();
}
}
```
然后是页面，**TabController** 的长度初始化后就无法修改，一种解法是在需要更新长度时，旧的TabController实例调用 **dispose()** ，然后给变量赋值一个新的TabController实例。但在我们的场景，它的长度其实只会初始化一次，而如果给 **TabBar** 的 **controller属性** 赋值null的话会报错「**No TabController for TabBar**」，所以这里做下判断，有数据了才初始化Tab：
```dart
class WxPage extends StatelessWidget {
const WxPage({super.key});
@override
Widget build(BuildContext context) {
var vm = Get.put(WxVM());
return Obx(() {
// 💡 判断有数据才初始化Tab
if (vm.wxAccounts.isEmpty) {
return Container();
} else {
return Column(children: [
TabBar(
isScrollable: true, //设置为可以滚动，不然会显示补全
tabs: vm.wxAccounts.map((e) => e.name).toList().map((e) => Tab(text: e)).toList(),
controller: vm.tabController,
),
Expanded(
child: TabBarView(
controller: vm.tabController,
children: vm.wxAccounts.map((e) => e.id).map((id) => Text(wxId: "${id!}")).toList())),
]);
}
});
}
}
```
运行看下效果：

可以，接着整下微信文章列表页，和首页文章列表页基本相同，就是多一个wxId的字段：

串起来看看效果：

### 5.5. 其它页
🤔 这个页面的话，包含两个子页面 → 「**网站导航**」和「**学习体系**」，先搭个基本架子：

#### 5.5.1. 网站导航
要实现的效果如下：

😂 先不理 **网页无法打开** 的问题，先画页面，页面的主体可以用 **ListView**，**自动换行的流式标签** 可以用 **Wrap** 组件来实现。然后需要一个生成随机颜色值的工具方法：
```dart
// 获取一个随机颜色值
Color getRandomColor() {
final Random random = Random();
return Color.fromRGBO(
random.nextInt(256), // Red
random.nextInt(256), // Green
random.nextInt(256), // Blue
1, // Alpha
);
}
```
直接写出生成导航列表项的代码：
```dart
// 生成导航列表项
Widget \_generateNaviItem(NaviInfo info) {
return Column(
crossAxisAlignment: CrossAxisAlignment.start,
children: [
// 导航分类标题
Container(
height: 40,
alignment: Alignment.center,
child: Text("${info.name}", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold))),
// 判断数据不为空才显示流式标签
info.articles == null
? Container()
: Wrap(
direction: Axis.horizontal,
spacing: 4.0, // 水平间距
runSpacing: 2.0, // 垂直间距
children: info.articles!.map((e) {
return GestureDetector(
child: Container(
margin: const EdgeInsets.all(5),
padding: const EdgeInsets.all(5),
decoration: BoxDecoration(
border: Border.all(color: Colors.grey),
borderRadius: BorderRadius.circular(5),
),
// 生成随机颜色的文字
child: Text("${e.title}", style: TextStyle(color: getRandomColor())),
),
onTap: () {
if (null != e.link) Get.to(BrowserPage(url: e.link!));
});
}).toList(),
)
],
);
}
```
😄 好，页面写完，说下这个 **网页无法打开** 怎么解？报错信息「**ERROR_CLEARTEXT_NOT_PERMITTED**」
Android 9 (API 28) 及以上版本 **默认阻止明文流量**，当你尝试还在一个 **HTTP URL** 时就会报错。
解法就是：**修改应用的网络安全配置，允许特定或所有域名的明文流量**，具体配置步骤如下：
- ① **创建网络安全配置文件**：在android/app/main/res/xml目录下新建一个xml文件，如：network_security_config.xml。
- ② 在xml文件中，配置允许的明文流量是所有域名，还是特定域名。
- ③ **AndroidManifest.xml** 的`<application>`标签中添加 **android:networkSecurityConfig** 属性引用网络安全配置。
network_security_config.xml 文件示例如下：
```xml
xml version="1.0" encoding="utf-8"?

```
引用网络安全配置：

再次运行，就可以访问http协议的url啦~
#### 5.5.2. 学习体系
要实现的效果如下：

大体代码和网站导航基本一致，只是列表项生成的UI不同：
```dart
// 生成学习体系列表项
Widget \_generateNaviItem(StudySystemInfo info) {
return GestureDetector(
child: Row(children: [
Expanded(
child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
Padding(
padding: const EdgeInsets.only(left: 12, top: 12),
child: Text("${info.name}",
style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Get.theme.primaryColor))),
Padding(
padding: const EdgeInsets.only(left: 12, top: 10, bottom: 10),
child: info.children != null
? Wrap(
spacing: 5,
runSpacing: 5,
children: info.children!
.map((e) => Text(e.name ?? "",
style: const TextStyle(fontSize: 12, color: Colors.grey, fontStyle: FontStyle.italic)))
.toList())
: Container()),
const Divider(height: 1, color: Color(0xFFE0E0E0))
])),
const Icon(Icons.chevron\_right)
]),
onTap: () {});
}
```
## 6. 设置-主题切换
🤔 感觉基本的页面都写得差不多了，在搞下设置页吧，弄下非常常见的 **主题切换/换肤**，就预置几套主题，然后可以用户点击切换主题，然后整个APP的样式(如颜色)都统一切换。这里简单整两套主题，蕾姆蓝 和 拉姆粉，为了方便演示，只有 **primaryColor** 是不同的：
```dart
final ThemeData leiMuBlueTheme = ThemeData.light().copyWith(
primaryColor: leiMuBlue,
colorScheme: ColorScheme.fromSeed(seedColor: leiMuBlue),
appBarTheme: const AppBarTheme(
backgroundColor: leiMuBlue,
titleTextStyle: TextStyle(
color: Colors.white,
fontSize: 20,
),
),
);
const Color laMuPink = Color(0xFFFFB6C1);
final ThemeData laMuPinkTheme = ThemeData.light().copyWith(
primaryColor: laMuPink,
colorScheme: ColorScheme.fromSeed(seedColor: laMuPink),
appBarTheme: const AppBarTheme(
backgroundColor: laMuPink,
titleTextStyle: TextStyle(
color: Colors.white,
fontSize: 20,
),
),
);
```
接着定义一个用于主题切换的VM，里面定义一个 **ThemeData** 类型的可观察变量：
```dart
class ThemeVM extends GetxController {
var currentTheme = leiMuBlueTheme.obs;
void changeTheme(ThemeData theme) {
currentTheme.value = theme;
}
}
```
再接着修改下 **main.dart**，用 **Obx** 包裹 **GetMaterialApp**，在主题切换时触发重建：
```dart
void main() async {
await GetStorage.init(); // 初始化GetStorage
final themeVM = Get.put(ThemeVM());
runApp(Obx(
() => GetMaterialApp(theme: themeVM.currentTheme.value, initialBinding: MainBindings(), home: const MainPage())));
}
```
然后简单写下设置页面：
```dart
class SettingPage extends StatelessWidget {
const SettingPage({super.key});
@override
Widget build(BuildContext context) {
final vm = Get.find();
return Scaffold(
appBar: AppBar(
title: const Text('系统设置'),
),
body: Column(
children: [
Row(
children: [
Icon(
Icons.color\_lens,
color: Theme.of(context).primaryColor,
),
const Text("主题切换")
],
),
Row(
children: [
GestureDetector(
child: Container(width: 48, height: 48, color: leiMuBlue),
onTap: () {
vm.changeTheme(leiMuBlueTheme);
},
),
const SizedBox(width: 10),
GestureDetector(
child: Container(width: 48, height: 48, color: laMuPink),
onTap: () {
vm.changeTheme(laMuPinkTheme);
},
),
],
)
],
),
);
}
}
```
最后是Widget响应主题变化刷新，如果是使用 **Get.theme** 来获取当前主题的颜色或属性，需要使用 **Obx** 或 **GetX** 来包裹组件，否则是不会重建刷新的。如果是使用 **Theme.of(context)** 来获取主题的话，Widget重建时都会获取当前的主题数据。运行看看效果：

🎉 Nice，得益于GetX，我们轻松实现了主题切换~
## 7. 退出应用弹窗
😄 就 **防误触**，在用户尝试退出应用时弹出一个确认Dialog，常规操作是使用 **WillPopScope** 组件拦截用户的"**返回**"操作，触发操作时会执行 **onWillPop** 属性设置的 **回调** (Future)，回调返回 **true**，**允许路由出栈** (用户执行返回操作)，返回 false，**阻止路由出栈**。弹窗的话，直接用 **Get.showDialog()** ，返回一个 bool 值，具体代码如下：
```dart
/// 展示一个退出App的确认弹窗
Future showExitConfirmDialog() async =>
await Get.dialog(
AlertDialog(
title: const Text('退出应用'),
content: const Text('你确定要退出应用吗？'),
actions: [
TextButton(
onPressed: () => Get.back(result: false), // 不退出应用
child: const Text('取消'),
),
TextButton(
onPressed: () => Get.back(result: true), // 确认退出应用
child: const Text('确定'),
),
],
),
) ??
false; // 防止点击对话框外部时返回null
/// 根页面
class MainPage extends StatelessWidget {
const MainPage({super.key});
@override
Widget build(BuildContext context) {
return WillPopScope(
onWillPop: showExitConfirmDialog,
child: Scaffold(
appBar: AppBar(title: const Text("Van ♂ Android")),
body: const Column(
children: [
IndexContainerWidget(),
IndexBottomBarWidget(),
],
),
drawer: const DrawerPage()));
}
}
```
运行后，当用户来到首页，按回退按钮就会弹窗：

😄 然后 **WillPopScope** 组件已经被标注为 **deprecated**(废弃)，官方推荐使用更灵活的 **PopScope** 组件代替，它允许开发者通过这两个属性来更精细地处理页面关闭逻辑。
- **canPop**：当前路由是否可以被弹出，默认为true，表示允许弹出，如果设置为false，则阻止弹出。
- **onPopInvoked**：路由弹出发生时，无论弹出是否成功，都会调用此回调。
Flutter 官方文档还贴心写了个Demo → [Migrating a back confirmation dialog](https://docs.flutter.dev/release/breaking-changes/android-predictive-back#migrating-a-back-confirmation-dialog)

照葫芦画瓢，改下我们的代码：
```dart
return PopScope(
canPop: false,
onPopInvoked: (didPop) async {
if (didPop) {
return;
} else {
final bool shouldPop = await showExitConfirmDialog();
if(shouldPop) {
// Get.back() 一点反应都没有
Navigator.of(context).pop();
}
}
},
child: Scaffold(
appBar: AppBar(title: const Text("Van ♂ Android")),
body: const Column(
children: [
IndexContainerWidget(),
IndexBottomBarWidget(),
],
),
drawer: const DrawerPage()));
}
```
点击返回键，确认弹窗是有了，但是点击确定，直接就回退到黑屏页面了，还得按多一次返回键，才能关闭页面。在 flutter 官方仓库，找到的同样问题的 **issue** → [PopScope cannot exit the app](https://github.com/flutter/flutter/issues/145287)，close了，但没有给出具体的解决方案，其中一个成员让我们去看官方文档：

我的flutter版本是 3.16.1，enableOnBackInvokedCallback 这个属性也配了，但并没什么卵用。打开 **Flutter DevTools**，可以看到调用了 Navigator.of(context).pop() 后 GetMaterialApp 还在：

又搜了圈 **flutter navigator.pop(context) black screen**，没有讲解原因的文章，但有看到一个「**完全退出APP**」的方法 → 调 **SystemNavigator.pop()** 向操作系统发送关闭当前Flutter应用的请求。试了下，果然退出了。🤷‍♀️ em... 感觉这个问题跟路由有关系，后面撸完路由的源码再来尝试定位原因吧~
## 8. 小结
😄 本节，我们用 **GetX** 重写了之前的 **VanAndroid** 项目，而且还加了亿点锦上添花的 **小细节**。不得不说 **GetX** 全家桶瑞士军刀护航式的开发体验就是 **舒适** 啊：
- 页面逻辑自定义 **GetxController**，**可观察变量** 直接加 **.obs**，**Get.put()** 、**Get.lazyPut()** 无脑 **注入** 实例。
- 只用 **StatelessWidget**，**Get.find()** 获取注入实例，用 **Obx** 包裹需要监听状态自动刷新的组件。
- 页面入栈 **Get.to()** ，页面出栈 **Get.back()** ，弹窗 **Get.dialog()** ，根本不需要关心什么 **context**。
 相比之前用 **riverpod**，虽然可以根据注解自动生成 **Provider**，但实际用起来还是有些麻烦的，触发UI刷新都要 **state = state.copyWith(xxx)**。
😏 知其然也要知其所以然，后续找时间扒下 **GetX背后的实现原理** 吧，本节就先到这啦，有什么问题欢迎评论区交流一波，感谢🥳。对了，仓库地址：**示例源码**（已移除原文仓库链接）。