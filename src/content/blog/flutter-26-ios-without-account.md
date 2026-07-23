---
title: "Flutter入门到精通（二十六）：无开发者账号打包安装iOS应用"
pubDate: 2024-01-27
description: "无Apple开发者账号情况下打包安装iOS应用的方案。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: 'https://miro.medium.com/1*10RECXGTH5NyaeBg5yD1pw.png'
---

> 本文是Flutter系统学习系列的第二十六篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

## 1. 引言

虽说是安卓崽，但日常主力机一直是老婆淘汰下来的🍎🐔，在年初刚学 Flutter 时就立了一个🚩Flag：

> Flutter 不是号称 **一套代码多端运行** 么？劳资要做个自用的 **信息流订阅/AI总结 + 工具百宝箱** 的 APP，然后给老婆的🍎🐔安排上，装波逼，你也会 iOS 开发啦 ❗️

说来惭愧，一直是 **语言上的巨人，行动上的矮子**，折腾半年有多，至今没试过 **iOS打包**，毕竟 **苹果个人开发者账号** 要 **99刀/年**，对于常在贫困线挣扎的来说，算是一笔不菲的费用...

公司的企业账号又握在 **iOS 手里**，也不好开口问人家拿来乱搞，所以，一直搁置。🙂 然后前阵子被法国奥运会的信息刷屏，特别是在各个渠道给我推某100 米栏运动员，根本没法屏蔽，就很烦 🤷‍♀️。做这个 **信息流订阅APP** 的想法变得空前强烈，但网上关于 **Flutter 打包 iOS** 的文章大多是基于 **有🍎开发者账号** 来进行的。😊 我不想发布到AppStore，我只想自己和老婆用上就够了。于是乎，我决然而然地踏上了「**没有开发者证书如何用上自己写的iOS App**」的旅程 🎉~️

> 💡 有开发者账号但不知道怎么打ipa的，可以参考下这几篇进行打包：

* [《Flutter官方文档：Build and release an iOS app》](https://docs.flutter.dev/deployment/ios)
* **《Flutter IOS 新建打包发布全流程 2023 版》**
* **《最新版iOS Xcode如何证书配置和ipa打包》**

## 2. 真机调试

😁 就，就先把程序运行到手机上，假设读者已经参考前面写的**《Window VM虚拟机🧱 安装 MacOS🍎》**搭建好了 Mac 的 Flutter 开发环境，执行 **flutter doctor** 无报错：

### 2.1. 准备一枚Apple ID

😮 苹果在 **XCode 7** 后开放了「**普通 Apple ID**」也能进行真机调试，没有的话，直接去官网注册一个「[创建Apple ID](https://appleid.apple.com/account?localang=zh_CN)」，注册成功后，打开「[苹果开发者中心](https://developer.apple.com/account) 」登录下账号，勾选下同意协议，至于是否接收更新消息推送，看自己喜欢，最后点下 **Submit** 提交。

### 2.2. XCode 添加 Apple ID

接着打开 **XCode**，依次点击 **Settings** → **Account**，点击 + 号，添加方式选 **Apple ID**：

账号密码无误的话，账号会被添加到账号列表，**双击** Team 处的选项：

会 **弹窗**，依次点击： **+** → **Apple Development**，然后会生成一个「**苹果开发证书**」，接着点 **Done**。

### 2.3. 打开 Runner.xcworkspace

打开终端，cd到合适的目录，执行下述命令拉下我们的Flutter项目：**示例源码**（已移除原文仓库链接）

```dart
git clone https://github.com/配套示例源码.git
```

然后，因为的flutter项目用到了 **json_serializable** 库，需要用到运行时代码生成，所以要执行下生成命令：

```dart
cd van_android_getx
flutter pub run build_runner build --delete-conflicting-outputs
```

执行完，打开「**ios**」目录，双击打开「**Runner.xcworkspace**」自动唤起「**XCode**」：

### 2.4. 可能出现的报错 & 解决方法

🤷‍♀️ em... 一般都不会顺风顺水，构建没报错的话，可以跳过这一部分~

#### 2.4.1. could not find inclued file 'Generated.xcconfig'

先是这个错误：

执行下「**flutter build ios**」，出现这样的报错不用理，后面再配开发者证书：

重启「**XCode**」，接着可能会出现下述报错。

#### 2.4.2. Module 'flutter_inappwebview' not found XCode

终端执行：

```dart
cd ios
flutter clean
flutter pub get
pod install
```

如果执行中途出现这样的报错：

打开「**Podfile**」文件，指定下 platform 的版本，比如这里去掉开头的#，把11.0改成12.0：

再次执行 **pod install**，如果还是不行，可能需要卸载重装下 **cocoapods**，具体命令如下：

```dart
gem list --local | grep cocoapods | awk '{print $1}' | xargs sudo gem uninstall
brew install cocoapods
brew link cocoapods
pod repo update
pod install
```

### 2.5. 插手机 & 打开开发者模式

插上手机后会弹窗：

点击「**信任**」， 接着点击 **Runner** 选中「**Signing & Capabilities**」，Team 那里选中上面创建的账号：

点击运行按钮：

大概率会失败，出现下述弹窗：

需要在手机的：**设置** → **隐私和安全** → **打开开发者模式**：

打开后会重启手机，静待片刻，再次点击运行按钮，手机会出现如下弹窗：

依次点击：**设置** → **通用** → **VPN与设备管理**，找到我们的App，点击「信任」

接着再次运行：App 就成功运行到🍎🐔上啦：

修改完代码，可以在XCode中直接按 **Command + r** 快速运行，也可以在IDE中直接运行：

🐶 这不得给老婆秀一下装个逼？结果一拔线，APP直接闪退，点图标也是无限闪退。搜了一圈才知道，这是因为 flutter 默认在开发过程中使用 **debug** 模式编译，需要把模式修改为 **release**，依次点击：**Runner** → **Edit Scheme...** → 点击 **Info** 选项，将 **Build Configuration** 切换为 **Release**：

😄 再次运行，拔线了 App 也不会闪退啦~

### 2.6. 无线调试

😡 手机插着线调试还挺烦，可以安排下 **无线调试 (手机和电脑需处于同一个Wifi)** ，**手机要先插着**❗️❗️❗️，顶部菜单依次点击：**Windows** → **Device and Simulators**，在 **Device** 中找到我们的真机，勾选 **Connect via network**：

真机设备右边出现 **小地球**，说明配置成功，此时线拔了，App 也能直接运行啦😁~

## 3. 如何把APP安装到别人的手机上?

😄 可以问别人要手机，插电脑上，**真机调试** 直接装，🤔 em... 能不能像 **Android** 一样，发个 **.apk** 文件过去，直接在手机上装呢？(🤷‍♀️ 现在大部分国产手机系统开始限制 **只能安装备案过的APP** 了，🙂 原生/类原生OS大法好)。

Android 的安装包格式是 **APK**，而Apple的安装包格式是 **IPA** (iOS Application Package)。而上面使用 **flutter build ios** 命令生成产物是 **.app (macOS上的可执行应用程序)** ，需要先转换成 **ipa包**。

### 3.1. 生成 ipa 包

🤷‍♀️ Flutter 其实提供了 **flutter build ipa** 生成 ipa 的命令，但是我们用的是 **白嫖的Apple ID**，而非 **开发者账号**，直接执行是会报错：

😄 网上搜了圈，发现了介个 →[《Mac教学：app和ipa文件之间如何互相转换 (用于签名打包）》](https://www.bilibili.com/video/BV1mB4y1a7EB/?vd_source=cde9177154f1ca0eacfb6aeb8cefa108)，试了下up主提供的脚本，确实能转换，并安装到手机上正常运行，不过它的脚本参数是写死的，需要自己修改名称，直接丢给GPT改改，弄成根据传入的 **app包** 自动生成对应的 **ipa包**，具体脚本代码如下：

```dart
#!/bin/bash

# Ensure a file was dragged onto the script
if [ -z "$1" ]
then
    echo "No file provided. Please drag and drop the .app file onto this script."
    exit 1
fi

# Extract the app name from the file path
appName=$(basename "$1" .app)

# Remove any existing directory with the same name
rm -rf "$appName"

# Create necessary directories
mkdir "$appName"
mkdir "$appName/Payload"

# Copy the .app file into the Payload directory
cp -r "$1" "$appName/Payload/$appName.app"

# If there's an icon file, copy it over
if [ -f Icon.png ]
then
    cp Icon.png "$appName/iTunesArtwork"
fi

# Change to the app directory
cd "$appName"

# Create the .ipa file
zip -r "$appName.ipa" Payload iTunesArtwork

# Print the absolute path of the .ipa file
echo "The .ipa file has been created at: $(pwd)/$appName.ipa"

# Exit successfully
exit 0
```

保存为 **app_to_ipa.sh** 后，执行下脚本，可以看到生成的 **ipa** 文件路径：

如果报错：permission denied: /Users/xxx/app_to_ipa.sh，执行下述命令给脚本点权限：

```dart
chmod +x app_to_ipa.sh
```

🎉 再次运行脚本就可以啦~

### 3.2. PC上自签名

🤔 转完ipa，如何把文件装到手机上呢？直接 **微信文件传输助手** 发送ipa文件，点开安装？或者上传到云盘或者哪里生成URL，浏览器下载下载安装？🤷‍♀️ 抱歉，**都不行**，搜了圈，看到这个[《iOS16及以上如何在线安装IPA文件？》](https://www.machunjie.com/macos/1328.html)，照着里面说的方式修改了 ipa 文件的命名，依旧没有触发安装。

😑 然后，即便能通过下载触发安装，也是装不上去的，为啥？因为 **签名** 的问题，❓ 啥签名，😲 有签名这一步吗？😆 有的，我们并没有用正规的 **开发者账号** 来进行签名，而是使用 **Apple ID + XCode自动签名**。

把上面那个勾勾去掉，下面就会出现，让你选择打包用的 **Provisioning Profile** (描述文件) 和 **签名证书**：

 然后，使用 **Apple ID** 签名的方式，其实是跟 **设备ID** 相关联的，XCode看不到，下个「**爱思助手**」就知道了，依次打开：工具箱 → IPA签名 → 使用 Apple ID 签名 → 添加 Apple ID：

😁 然后，用 **Apple ID自签** 的程序运行时间是受限的，通常 **只能运行7天** 左右，到期了需要 **重新签名&安装**。

💡 个人感觉：自己写的App直接XCode自动签名就好，别人的ipa重签名再用爱思助手 (安装后会显示**个人正版**)。

### 3.3. APP上自签名

🙂 每隔七天，就要插下电脑，重启名ipa，然后重新安装，也太麻烦了，有没有更简便的方式呢？有，通过一些**自动签名的App** 来直接签名，这里App巨多，如：**轻松签、万能签、魔力签、喵喵签** 等。

😁 一般会提供一些 **免费的企业证书签名**，这类证书一般仅用于企业内部应用分发，通过这种签名方式可以在不越狱的情况下安装和运行非苹果官方认证的应用程序。苹果公司时常会检测并撤销这些被滥用的企业证书，表现为App打开闪退，术语好像叫 **"掉签"** 。 这我熟，之前玩的一个没上AppStore的国产氪金小游戏，为了不给苹果抽成(30%)，就是这样搞的，导致iOS玩家每隔一阵子就得卸载，重新下载安装，新人新的证书🤣。这种证书某宝、咸鱼也有卖的，搜索关键字：**苹果手机签名**。

😏 接着依次介绍几个我用过还可以的自签APP吧，读者可以按需尝试~

#### 3.3.1. 牛蛙助手 (Apple ID一键续签)

 搜索引擎直接 **搜名字** 下载安装对应客户端 (Windows或MAC)，手机插上，等它装完APP打开，会让你下载一个描述文件，下完打开手机 **设置**，安装下，装完App会变成右侧这样的内容，点击 **IPA签名**：

点击右上角 +，导入资源，然后选择我们的ipa包，然后会导入应用库：

点击应用，弹窗选 **签名**，点击 **Apple ID证书**，填入你的 Apple ID 和 密码 (❗️❗️❗️ 为了安全起见，建议 **申请一个小号** 来输入，避免引起不必要的麻烦)。

证书添加成功后，再次点击签名，选中 **Apple ID** 证书 进行签名 (2333，开支持多开)：

点击 **立即签名**，静待片刻后，就可以看到已签名的包了，点击 **安装** 即可，中途可能出现下述弹窗，到设置哪里手动打开下状态就好了：

安装完就可以在桌面看到我们自签名的App啦，证书 **到期续签** 的话，直接点击 **已安装** 的Tab，点击我们的App在弹窗里点下 **续签** 即可：

#### 3.3.2. Scarlet-猩红 (免费企业签)

 号称"永不掉签" (本质还是企业签)，就是 [官网](https://usescarlet.com) 广告巨TM多❗️ 建议开启给 **Safari** 浏览器装下广告拦截插件 (如Adblock) 或者**关闭浏览器的JavaScript** (设置→safair浏览器→滑到最底部→高级→关闭JavaScript)。不需要发短信啥的❗️ 直接首页找到 **Install** 按钮点击，出现右侧页面点击第一个 **Direct Install** (直接安装)，等下载完触发安装，装完打开会提示 **未信任企业App...** ，设置那里信任下。**先不要打开App**！到设置那里找到 **Scarlet**，打开这三个设置开关：

然后就可以用它来 **安装ipa** 文件了，依次这两个图标，在弹出的页面选中ipa文件，然后会出现安装确认弹窗，点击 **安装**，直接切到桌面，可以看到App的安装过程~

#### 3.3.3. TrollStore2-巨魔2 (永不掉签)

😏 **巨魔**-苹果搞机的都知道的神器，它利用了苹果系统中的一些漏洞 (如AMFI和CoreTrust漏洞)，实现了 **无需签名**、**无过期限制**、**无闪退** 等问题的应用安装。可以在 **不越狱 (有点像Android的Root)** 的情况下安装未经过苹果官方审核的应用程序。商店除了提供丰富的APP资源外，还具备多种使用功能，包括但不限于：

* ✨ **安装第三方APP**：用户可以随意安装从其它渠道获取的IPA文件，无需担心兼容和签名问题。
* **应用多开**、**屏蔽软件广告**、**通话录音**、**系统美化** 等。

💁‍♂️ 安装方式根据不同的设备和iOS版本有所不同，具体可以看 [《官方文档：Installing TrollStore》](https://ios.cfw.guide/installing-trollstore/)的表格：

系统版本可以依次点击手机：**设置** → **通用** → **关于本机** → **iOS版本** 进行查看，比如我的16.5，就是直接装 **TrollInstallerX**，点开后，找到 **jailbreaks.app** 点开：

点击 **TrollInstallerX** 安装 (需要Safari浏览器打开哦😯)

安装点击会弹不受信任，去设置点下信任，然后打开点击 **Install TrollStore** 进行安装：

然后等安装，自动重启，接着桌面就会多了一个 **TrollStore** 的 APP：

点开，右上角 + 号，**Install IPA File**，找到要安装的 ipa 文件，点击后的弹窗点 **Install**，静待安装完毕：

此时，回到桌面也可以看到我们通过巨魔安装的APP啦，不用越狱而且不会掉签，真香🥰~

## 4. 小结

本节我们探索了一下「**没有苹果开发者账号，如何打包/安装自己写的APP**」，先概括下 **真机调试** 的步骤：

* **需要一枚Apple ID**：直接苹果官网注册个(免费)，然后登录下苹果开发者中心，同意下协议。
* XCode **Account** 添加下 Apple ID，双击点开Flutter项目/ios下的 **Runner.xcworkspace**。
* 插上手机，信任电脑，手机打开开发者模式，XCode Runner 的 **Signing & Capabilities** 选中我们添加的账号。
* command+R 运行。第一次打开APP会有 **不受信任的开发者** 弹窗，手机到设置 → 通用 → VPN与设备管理 点下信任。
* **无线调试**：手机插着，要和电脑处于同一个局域网！点击 Windows → Device and Simulators，找到真机，勾选 Connect via network，即可拔线进行无线调试。

接着说下怎么把APP装到别人的手机上：

* **生成ipa包**：项目编译默认生成的文件是 **.app** 格式的，需要转换成 **.ipa** 文件才能安装到手机上。
* **PC上自签名**：**Apple ID + XCode自动签名**，爱思助手使用 Apple ID 自签 IPA。
* **APP上自签名**：牛蛙助手 (Apple ID一键续签)、Scarlet(免费企业签)、TrollStore2 (永不掉签)。

😄 看着复杂，实则不然，核心就两步：**如何生成ipa文件**+**解决签名问题**，相关工具只是展示 **签名安装**，还有很多玩法，感兴趣的读者可自行检索相关资料进行学习。另外，😏 有了自签工具，不需要XCode的自动签名，可以直接命令行执行 **flutter build ios --release --no-codesing** 来构建没签名的app包，速度会更快~

🏃 行吧，本节就到这，赶紧去试试吧，有问题欢迎评论区交流，谢谢🙏~