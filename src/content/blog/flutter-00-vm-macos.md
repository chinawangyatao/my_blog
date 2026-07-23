---
title: "Flutter入门到精通（前置篇）：VM虚拟机安装macOS：Flutter iOS打包前置准备"
pubDate: 2024-01-01
description: "在Windows上使用VM虚拟机安装macOS，为Flutter iOS打包做准备。涵盖VMware配置、macOS安装、Xcode配置等全流程。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: '/images/flutter-cover.png'
---

> 本文是Flutter系统学习系列的第前置篇篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

Flutter iOS 打包要 **Mac**，公司配的 **Windows**，懒得拿家里的mbp来公司，😆装个虚拟机熟悉下打包流程。一路下来还是比较顺畅的，记录下安装配置过程，有需要的童鞋可以参考下~

## 1. 基本安装 & 配置

### 1.1. VMware 虚拟机下载安装

* ① **直接官网下载安装包** → [官网](https://www.vmware.com/content/vmware/vmware-published-sites/us/products/workstation-pro/workstation-pro-evaluation.html.html)，注意下 **Workstation 17 Pro**，不要下免费版 **VMware Player**！！！
* ② 傻瓜式下一步安装，最后一步来到 **输入许可证秘钥**，可以掏钱，也可以自己网上搜。
* ③ 安装完后直接退出，**不要打开虚拟机**！！！
* ④ 打开了的话也没关系，**任务管理器 → 结束VM虚拟机进程**，**Win+R调出运行**，输入 **services.msc**，**右键停用** 所有正在运行的VM服务：

### 1.2. unlocker解锁VM支持macOS

* ① VM新建虚拟机向导默认没有MacOS，需要使用unlocker进行解锁，直接Github下载 [unlocker](https://github.com/DrDonk/unlocker/releases/) 压缩包
* ② 下载解压后，进入windows目录，找到 **unlock.exe** 双击执行解锁 (需要授予管理员权限)
* ③ 出现complete就是成功了，也可以双击 **check.exe** 进行检查，另外，relock.exe 是返回初始为破解状态

此时再打开虚拟机向导，就可以看到MacOS啦~

### 1.3. 下载macOS镜像

到 [cloud.mfpud.com](https://cloud.mfpud.com/mfpud/macOS/cdr/) 下载苹果镜像，**cdr/iso** 格式都可以，问了下iOS的同事在用的系统 → **Ventura 13.4.1**

镜像还挺大，建议用idm、迅雷等支持续传的软件下载，浏览器直接下时不时会断开，要自己点继续~

### 1.4. 创建配置虚拟机

**选中镜像** → **设置虚拟机名称和存储位置** → **指定磁盘容量** (直接建议的80G) → **选单个文件** → 可以 **自定义硬件** 来修改其它配置，内存越大越好，不过 **不建议超过最大建议内存**。觉得不够用后面再改也可以。

### 1.5. Mac系统安装

创建配置完打开MacOS虚拟机，选择系统语言，我选的 **简体中文**，然后找到 **磁盘工具**，点继续：

选中 **SATA Hard Drive Media**，点击右上角的 **抹掉**：

接着会弹窗 **，** 让你 **给主磁盘重命名**，如 macOS 13，然后点击 **抹掉**：

等它抹完，关掉页面，选择 **安装 macOS Ventura** 点继续，同意协议，然后选择刚处理过的硬盘，点击安装，然后就是漫长的等待了，我是装了一个多小时🐶

### 1.6. 网络配置

系统安装完重启后，出现 **无法连接网络** 的情况，网上有人说：macOS Ventura 13.x及后续版本都会遇到这个问题，解决方法是找到macOS系统安装时的配置文件 → **xxx.vmx**，比如我的：

记事本打开，搜索 **ethernet0.virtualDev** 将其值改为 **vmxnet3**，保存后重启虚拟机。但是，我看了下自己的配置文件，值本来就是vmxnet3，是VM网络设置的问题，几种网络连接模式：

* Bridged（桥接模式）：VMware虚拟机连接到主机的物理网络，虚拟机在主机所在网络上具有自己的IP地址。可以与其他计算机和资源进行通信。
* NAT（网络地址转换）：虚拟机使用主机的IP地址，并通过主机的网络连接进行外部通信。虚拟机不能直接与其他计算机进行通信。
* Host-Only（主机仅限模式）：创建一个虚拟网络，仅由主机和虚拟机之间使用。虚拟机之间以及虚拟机与主机之间可以进行通信，但无法与外部网络通信。
* Custom（自定义模式）：可以根据需要自定义网络连接类型，例如配置子网、DHCP服务器、DNS服务器等。

我选择 **桥接模式**，勾选物理网络连接状态，就好了：

也可以选择 **仅主机模式**，但是得在Windows主机配置下 **Internet连接共享**：网络状态 → 更改适配器选项 → 找到以太网或者Wifi → 共享 → 勾选允许其他网络用户通过此计算机的Internet连接来连接 → 下拉列表选中：**VMware Network Adapter VMnet1**

确定后，重启下虚拟机就可以正常上网啦。另外，想让虚拟机共享主机的 **科学上网**，折腾了一下发现配起来挺麻烦的。不如直接下个 **ClashX** 🐶。

### 1.7. 安装VMware tools (全屏 + 文件互传)

这个工具可以 **实现虚拟机和主机文件互传**，还能 **自动调整系统的分辨率(全屏)** ，**先把右上角的光盘推出**：

右键虚拟机的选项卡，点击 **安装VMware Tools**：

macOS会出现下述弹窗，**双击安装**：

中途会弹窗：**系统扩展已被阻止**，点击 **打开系统设置**：

点 **允许**，然后点击 **重新启动** 即可。

重启后，**分辨率会自动全屏**，然后随便把macOS里的文件拖拽到Windows上，会弹窗：

启用一下，然后文件可以从 **macOS → Windows** 啦，又试了下 Windows → macOS，没有成功。

可以通过另外一种方式实现互传 → 添加一个 **共享文件夹**，右键macOS的选项卡 → 点击设置 → 点击选项 → 选中总是启用 → 点击添加 → 点击下一步：

选择要共享的文件夹路径 → 点击下一步 → 勾选启用此共享 → 点击完成 → 点击确定

添加完成后，Windows主机随便复制一个文件到这个目录下，然后macOS点击 **前往** → 电脑 → 找到 **Vmware Shared Folders**，在此就可以看到共享文件夹了，复制的文件也在这个目录下：

### 1.8. 卡顿优化-**beamoff**

[beamoff](https://github.com/JasF/beamoff) 能够禁用图形加速 (虚拟机中的BeamSync功能)，避免虚拟机的卡顿和假死现象，图形渲染会变慢，但CPU的占用会减少。JasF是软件作者，但没提供下载，直接找到另一个 [HammerSister/Beamoff](https://github.com/HammerSister/Beamoff) ，直接点击**Download ZIP**，下载完成后解压，把里面的 **beamoff.zip** 拖拽到共享文件夹中。

打开macOS，从共享文件夹复制zip包到你喜欢的路径，比如用户，然后双击解压，会生生成一个app：

然后配下 **开机自启动**：设置 → 通用 → 登录项，点击 + 进行添加：

重启系统即可生效。另外，还有一些能提高界面响应速度的设置：**系统偏好设置**

① **辅助功能** → 显示 → 勾选 **减少透明度**

② **桌面与程序坞** → **最小化窗口时使用** → **缩放效果**

③ **搜扩展** → **共享菜单** → **把不使用的组件都取消勾选**：

到此，虚拟机的 基本安装和配置就完成了，建议保存一份 **快照**，后面瞎搞把系统搞坏了，可以随时回退。

后续是Mac上的Flutter开发环境搭建，有需要的可以继续往下走

## 2. Flutter开发环境搭建

### 2.1. 安装 Xcode

登下你的Apple ID，直接在AppStore搜Xcode下载安装，装到后面会一直卡99%，开下 **科学上网** 就好了。

### 2.2. 重新分配硬盘大小

装Xcode失败了，提示磁盘空间不足，关闭虚拟机把硬盘容量调成200GB，重新打开虚拟机发现没生效。还得命令行手动调整下硬盘大小，打开终端键入：**diskutil list**，找到 APFS Container Reference 对应的磁盘标识符：

接着键入调整容量的命令：**diskutil apfs resizeContainer disk1 200GB**，静待调整完毕，再次查看硬盘容量：

### 2.3. 安装 Chrome

倒不是Safari不好用，是flutter需要这个，直接官网下载安装：[Chrome](https://www.google.com/intl/zh-CN/chrome/)

### 2.4. 安装 搜狗输入法

自带输入法经常字母跟中文混输打不出字，不能连打，非常反人类，建议装个🐶 [搜狗输入法](https://pinyin.sogou.com/mac/)~

### 2.5. 安装 JDK

官网直接下载 [jdk17-mac](https://www.oracle.com/java/technologies/downloads/#jdk17-mac)，Windows电脑芯片是Intel的，这里选 **X64 DMG installer**，点击会自动跳下载，等下载完双击安装即可。安装完新开一个终端，键入 **java -version** 验证是否安装成功。

### 2.6. 安装 VS Code

直接官网下载 [Visual Studio Code](https://code.visualstudio.com/Download)，下载后解压会生成一个APP，直接拖拽到应用程序目录下。运行后安装两个插件，点击右侧插件图标，搜索 **Flutter** 和 **Dart** 进行安装即可。

### 2.7. 下载 Flutter SDK

**根据自己的芯片下载不同的SDK**，虚拟机直接下左侧Intel架构的：

下载完成解压到你想放的目录，如：/Users/pig/flutter

### 2.8. 更新PATH环境变量

官方文档有这样一段话：

自 Flutter 1.19.0 dev 版本开始，Flutter SDK 在 flutter 命令脚本的同级目录下增加了 dart 命令，你可以更方便地运行 Dart 命令行程序，下载 Flutter SDK 时也会下载对应版本的 Dart SDK。Flutter SDK 在 flutter 命令脚本的同级目录下增加了 **dart 命令**，你可以更方便地运行 Dart 命令行程序。

终端键入：**open ~/.bash_profile**，复制粘贴这四个变量 (Flutter_HOME替换为你flutter的实际路径)：

```dart
export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
export FLUTTER_HOME=/Users/pig/flutter
export PATH=$FLUTTER_HOME/bin:$PATH
```

保存后，执行 **source ~/.bash_profile** 刷新当前命令行窗口，可以键入 **which flutter** 检查命令是否可用。对了，上面前两行的作用是 **将安装源替换为国内镜像**，原安装源没科学上网，Flutter下依赖会有点慢。

### 2.9. 下载配置 Command line tools

Android Studio 体积还挺大，如果不想装，可以直接下载配置 [Command line tools](https://developer.android.google.cn/studio)，选择Mac平台下载：

解压后，创建一个类似于这样的目录层级，把解压后的文件全丢 **latest** 目录下：

接着终端执行 **open ~/.bash_profile** 新增下述变量：

```dart
export ANDROID_HOME=/Users/pig/android_sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
export PATH=$ANDROID_HOME/build-tools:$PATH
export PATH=$ANDROID_HOME/platform-tools:$PATH
```

执行 **source ~/.bash_profile** 刷新当前命令行窗口，键入 **sdkmanager --list** 可以查看都有哪些包及版本。这里直接下三个东西： **build-tools;30.0.2** + **platform-tools + platforms;android-30**，终端键入：

```dart
sdkmanager "build-tools;30.0.2" "platform-tools" "platforms;android-30"
```

等待安装完成。此时再执行 flutter doctor，一般就这几个错误或警告：

* **flutter doctor --android-licenses** → 终端键入此命令，回车，一直y回车同意即可；
* **sudo xcodebuild -license** → 终端键入此命令，回车，q，输入 **agree** 回车同意即可；
* **CocoaPods not installed (三方库文件管理工具)** → 终端直接运行 → **sudo gem install cocoapods -V，** 输入密码回车等安装；需要科学上网 (不要用HK的鸡场)，试了下换国内镜像源，不太行，直接报Https错误。中途可能会报错让你装什么库，照着装就好，示例：**sudo gem install activesupport -v 6.1.7.6**，第一次装得跑挺久~

全搞完，再执行 flutter doctor 就可以了，警告可以无视~

### 2.10. 创建Demo并运行

终端键入下述命令创建项目 hello_flutter：

```dart
flutter create --project-name hello_flutter --org cn.coderpig --platforms=android,ios hello_flutter
```

创建完后，cd 到 **hello_flutter** 目录下，接个 **Android手机**，接着输入 **flutter run** 即可在手机上运行Flutter程序。在iOS设备上运行需要开发者账号，目前还有，有需要的留意后续的打包章节吧😄~

至于官方Demo详细解读可以看下：**《逐行解读Demo里的main.dart》参考文献**：

* [Windows用《VM虚拟机安装MacOS Ventura 13.6系统全流程教程》](https://zhuanlan.zhihu.com/p/658521465)
* [《虚拟机安装MAC-OS系统开发非常卡。使用beamoff.zip优化教程》](https://blog.csdn.net/qq_42095701/article/details/115008088)
* [《Windows电脑使用虚拟机安装MacOS(黑苹果)完美教程(AMD亲测也可用+解决分辨率全屏)》](https://zhuanlan.zhihu.com/p/598806346?utm_id=0)