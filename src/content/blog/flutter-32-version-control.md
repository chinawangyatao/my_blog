---
title: "Flutter入门到精通（三十二）：玩转Flutter版本控制"
pubDate: 2024-02-02
description: "Flutter SDK版本管理方案，fvm、git分支策略等。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第三十二篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

2024.2.29 日 **Apple** 发布了[《关于 App Store 提交的隐私更新》](https://developer.apple.com/cn/news/?id=3d8a9yyh)，明确要求 **新上架或更新的APP** 必须包含 「**PrivacyInfo.xcprivacy**」 隐私清单文件，否则可能被拒审，部分第三方SDK若以二进制形式集成，还需附带签名。😶 对此组里的 **iOS小伙伴** 抛出疑问：

**Flutter 3.18.0** 后才内置了PrivacyInfo.xcprivacy，现在我们的版本是3.7.12，要不要 **升级下Flutter版本**？不升的话就先按照这次提交改一下：[Add xcprivacy privacy manifest to iOS framework](https://github.com/flutter/engine/pull/48951/files/d41d6a041197b4ae51939f961b032de68b529c45#diff-061dbd9aea4078fde63015908bd77fb6a614bdb98aa9f89df8d3bef35316b005)

😶 当初搞 **Flutter** 的一个原因就是 **适配鸿蒙**，但 [openharmony-sig/flutter_flutter](https://gitee.com/openharmony-sig/flutter_flutter) 有 **flutter** 版本限制，所以组里一直没更新，看提交记录，前阵子合并了一个 **3.22.0** 的分支：

😄 反正早晚要踩坑，还是升级一波吧，「**本地 Flutter SDK**」切换到特定版本的命令如下：

```dart
# 导航到 Flutter SDK
cd path/to/flutter_sdk

# 拉取最新 Flutter SDK 版本
git pull

# 查看可用的 Flutter 版本
git tag

# 切换到特定版本，如3.22.0
git checkout 3.22.0

# 升级 Flutter 到该版本
flutter upgrade

# 版本验证，是否成功切换到该版本
flutter --version
```

😳 升级过程中卡住不动大概率就是 **网络问题**，可以设置下 **国内镜像环境变量** (任选其一)：

```dart
# 清华源
export FLUTTER_STORAGE_BASE_URL=https://mirrors.cnnic.cn/flutter
export PUB_HOSTED_URL=https://mirrors.cnnic.cn/dart-pub

# 腾讯源
export FLUTTER_STORAGE_BASE_URL=https://mirrors.cloud.tencent.com/flutter
export PUB_HOSTED_URL=https://mirrors.cloud.tencent.com/dart-pub
```

配置后执行下 **source** 命令或重启终端生效后，再重新升级。当然，你有 **科学上网** 的话，配下 **终端代理** 亦可：

```dart
# 后面的端口号取决于你的✈️
export http_proxy=http://127.0.0.1:1087
export https_proxy=http://127.0.0.1:1087
```

😳 如果出现「**Waiting for another flutter command to release the startup lock**」的提示，把 Android Studio 关掉，打开任务管理器 **杀掉所有dart进程**，接着到 Flutter SDK 目录的 **/bin/cache** 下删掉名为 **lockfile** 的文件后，再尝试升级。🙃 当然，也可能有其它莫名其妙的问题，实在搞不定或者不想折腾，直接删了，去 [Flutter官网](https://docs.flutter.dev/release/archive) 下载对应版本的SDK，重新配置下就好了：

🤔 升级完我就在想，**Flutter** 有没有类似于 **Python中的版本管理工具**，如：**venv** (轻量级隔离，依赖系统Python版本)、**pipenv** (依赖锁定+虚拟环境)、**pyenv** (多版本Python切换)、**conda** (环境+包管理+跨语言依赖)。如果存在 **需要管理多个Flutter版本的需求** (A项目要用a版本，B项目要用b版本，互不干扰)，有一个 **版本管理工具** 还是挺方便的，搜了下，还真有 → [FVM (Flutter Version Management)](https://fvm.app/documentation/getting-started)，用法非常简单，顺手记录下~

## 2. FVM 安装

官方文档[《FVM Installation》](https://fvm.app/documentation/getting-started/installation)中详细列出了系统环境的安装方式：

```dart
# MacOS 和 Linux
curl -fsSL https://fvm.app/install.sh | bash
brew tap leoafarias/fvm
brew install fvm

# Windows
choco install fvm
```

### 2.1. Windows

😶 用的 **Windows**，得先装下 **Chocolatey**，它是 **Windows** 上的 **包管理器**，类似于 **Linux** 中的 **apt** 或 **yum**，允许用户通过命令行来安装、更新和管理软件包。**Chocolatey** 使用 **NuGet-包管理器** 和 **PowerShell-脚本** 来自动化软件安装过程，简化软件管理。以「**管理员身份**」运行 **PowerShell**，依次键入下述命令：

```dart
# 输入下述命令回车后，输入 Y
Set-ExecutionPolicy RemoteSigned

# 安装 Chocolatey
iwr https://chocolatey.org/install.ps1 -UseBasicParsing | iex

# 安装完，键入下述命令查询版本，确认是否安装成功
choco -v
```

然后再执行 **choco install fvm** 安装fvm，中途会让你输入，直接输入 **Y**：

需要 **科学上网**，偶尔可能抽风下一半就失败，切换不同的代理依旧失败，大概率服务器的问题，建议 **换个时间** 安装，昨天下午就是一直不行，今早再试就好了，而且速度快多了🤷‍♀️。安装完 **fvm**， **Flutter SDK** 默认缓存路径为「 **~/fvm/versions**」，😳 就C盘，如果不想放这里，执行下述命令指定下缓存地址：

```dart
fvm config --cache-path D:\Coding\fvm
```

然后配置下环境变量「**FVM_CACHE_PATH**」

### 2.2. Pub

😶 官方还给出一个 **pub** 安装的方式，不过想用 **FVM全局管理Flutter版本**，建议还是走独立安装~

```dart
dart pub global activate fvm
```

## 3. FVM 使用

😄 版本管理工具一般都支持 **全局控制版本** 和 **单一项目控制版本**，**FVM** 亦是如此，依次讲讲相关用法~

### 3.1. 全局设置

#### 3.1.1. 查看所有可用 Flutter SDK 版本

执行「**fvm releases**」进行查看：

渠道默认是 **stable(稳定版)** ，如果想查看其它渠道 (beta、main)，可以添加 **--channel** 参数指定：

#### 3.1.2. 安装特定版本 Flutter SDK

执行「**fvm install 版本号**」进行安装：

安装完，可以键入「**fvm list**」查看已安装的Flutter版本列表：

此时 **Flutter Version** 那里显示 **Need setup**，表示该版本还未完全设置或初始化。

#### 3.1.3. 设置全局 Flutter 版本

执行「**fvm global 版本号**」进行设置 (第一次安装完必须先执行，设置一个默认的版本)

设置完，对应目录下会多这个 **default** 快捷方式：

接着执行「**fvm flutter doctor**」来检查和完成设置：

如果一直卡住不动，可以尝试添加下述两个 **环境变量** 来指定 **镜像源**：

* **PUB_HOSTED_URL** → [pub.flutter-io.cn](https://pub.flutter-io.cn)
* **FLUTTER_STORAGE_BASE_URL** → [storage.flutter-io.cn](https://storage.flutter-io.cn)

等待设置结束：

完成后，此时再键入「**fvm list**」

后续执行 **flutter**、**dart** 相关的命令，在前面加上 **fvm** 就好了，比如「**fvm flutter --version**」

😄 试下装个当前最新的 **3.29.0** 的版本：

再次执行「**fvm flutter --version**」查看当前 **Flutter** 版本：

👏 切换起来还是非常方便的，有时可能会出现这样的提示：

```dart
Can't load Kernel binary: Invalid kernel binary format version.
fvm as globally activated doesn't support Dart 3.4.0.

try:
`dart pub global activate fvm` to reactivate.
```

😄 执行下「**dart pub global activate fvm**」命令 **全局激活fvm工具** 即可。最后，在 **PATH** 环境中加上「**fvm路径\default\bin**」，**fvm** 切换 **Flutter** 版本，直接执行 **flutter** 命令也会是切换后的版本啦~

### 3.2. 单一项目设置

执行「**fvm use 版本号**」为当前项目设置一个 **特定的Flutter版本**，后面没跟版本号的话，会让你选：

运行后会在当前目录下生成下述两个东西~

#### 3.2.1. .fvmrc

用于 **记录当前项目使用的Flutter 版本** 的简单配置文件：

支持的配置如下：

* `flutter`: 要使用的 Flutter SDK 版本，如果未明确设置，则回退到 flutter 值。
* `cachePath`: 定义项目缓存目录的路径。
* `useGitCache`: （默认值：true）指示是否使用 Git 缓存来处理依赖项。
* `gitCachePath`: 设置 Git 缓存目录的路径，适用于 `useGitCache` 为 true 的情况。
* `flutterUrl`: 指定 Flutter SDK 仓库的 URL。
* `privilegedAccess`: （默认值：true）确定是否启用需要提升权限的配置。
* `flavors`: 定义不同配置的自定义项目风格的映射。
* `updateVscodeSettings`: （默认值：true）标志是否在配置更改时自动更新 VS Code 设置。
* `updateGitIgnore`: （默认值：true）指示是否根据项目配置自动更新 `.gitignore` 文件。
* `runPubGetOnSdkChanges`: （默认值：true）在 Flutter SDK 版本更改时自动触发 `flutter pub get`。

#### 3.2.2. .fvm目录

用于 **存储和管理 Flutter SDK** 的目录：

**对应作用**：

* **flutter_sdk**：指向 **versions** 文件夹中 **具体Flutter版本** 的 **符号链接(快捷方式)** 。
* **versions**：存储了通过 FVM 安装的所有 Flutter SDK 版本。
* **fvm_config.json**：(已弃用) 记录当前项目使用的Flutter版本及其它配置信息。
* **release**：(内部使用) 与 Flutter SDK 相关的发布信息和元数据。
* **version**：(内部使用) 记录了当前使用的 Flutter SDK 版本号。

> **Tips**：从 3.0 及以上版本开始，建议将 **.fvm** 目录添加 **.gitignore** 文件中。如果 **updateGitIgnore** 设置为 **true**，当你将某个版本固定到项目时，它会自动添加到 .gitignore 文件中。

#### 3.2.3. 测试

😄 测试下 **全局** 和 **项目** 的 **Flutter版本是否隔离**，键入「**fvm use 3.29.0**」切换项目的 Flutter版本。

键入「**fvm list**」可以看到，**Local** 处亮起绿灯：

接着分别在 **当前目录** 和 **上级目录** 执行 「**fvm flutter --version**」看看对应的 Flutter 版本：

👍 牛皮！

### 3.3. IDE 配置

#### 3.3.1. Android Studio

打开 **设置**，搜索 **Flutter**，修改 **Flutter SDK path** 指向 **fvm/default** 目录：

不想采用 **全局设置** 的话而是 **单一项目设置**，路径指向当前项目的 **fvm\flutter_sdk** 即可。

#### 3.3.2. Visual Studio Code

使用 **Ctrl+Shift+P** 或者点击左下角齿轮图标，选择 **命令面板**，输入 **settings.json** 进行搜索，打开 **Workspace (工作区)** 的设置文件：

添加 **dart.flutterSdkPaths** 的配置，值为 **fvm目录\versions**：

保存后，**Ctrl+Shift+P** 输入 **Change SDK**，即可选择需要的版本直接切换：

切换完，**settings.json** 会自动生成 **dart.flutterSdkPath** 的配置：

右下角会弹出版本切换提醒，点下 **pub upgrade** 更新依赖就行啦~

### 3.4. 其它

#### 3.4.1. spawn & exec 命令

**spawn** 是以 **指定Flutter版本** 直接运行命令，示例：

```dart
# 指定要使用的 Flutter 版本
fvm spawn --version 2.2.3 flutter doctor

# 指定环境变量
fvm spawn --env ENV_VAR=value

# 指定当前工作目录
fvm spawn --cwd /path/to/project flutter build apk
```

**exec** 则是基于 **当前项目配置** 的 Flutter版本运行命令 (🤔直接执行fvm也是一样的效果吧...)

#### 3.4.2. remove 命令

删除本地存储的指定Flutter版本，示例：**fvm remove 2.2.3**

#### 3.4.3. destroy 命令

删除FVM安装的所有Flutter版本和相关数据，重置FVM环境，示例：**fvm destroy**

#### 3.4.4. flavor 命令

FVM 支持项目 **flavors(多渠道)** ，你可以为不同构建配置指定的不同的Flutter版本，如：

```dart
# 为 test 的渠道设置 3.16.9 的 Flutter SDK
fvm use 3.16.9 --flavor dev
```

🤷‍♀️ 网上搜了下，有人很多人说直接执行 **fvm flavor** 可以查看所有 flavor 名称，实测并不行：

想看的话，可以打开 **.fvmrc** 文件：

如果想 **切换特定的flavor** 可以执行下述命令：

```dart
# 其实等价于 fvm use 3.29.0
fvm flavor main
```

## 4. 附：使用过程出现的问题

### 4.1. was unexpected at this time

不知道误操作了啥，执行fvm的命令一直报这个错：

在 [[Beta] flutter upgrade has broken flutter command](https://github.com/flutter/flutter/issues/162204#issuecomment-2614664358 "https://github.com/flutter/flutter/issues/162204#issuecomment-2614664358") 找到了临时解决方法：

* 命令行cd到flutter目录下，执行命令「**git rev-parse HEAD**」获取当前所在commit的 **hash值**。
* 打开 **bin/internal/engine.version** 文件(没有自己创建)，粘贴上面的 **hash值** 保存。
* 运行「**flutter doctor**」即可解决

### 4.2. unable to normalize alternate object path

执行 **fvm list** 报错：

```dart
error: unable to normalize alternate object path: D:/Coding/fvm/cache.git/.git/objects
fatal: Not a valid commit name HEAD
Error: Unable to determine engine version...
```

当前版本的 flutter sdk 的 Git 目录损坏，执行「**fvm global 版本号**」重新下载即可。

##