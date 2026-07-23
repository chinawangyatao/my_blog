---
title: "Flutter入门到精通（十一）：Flutter UI框架浅析"
pubDate: 2024-01-12
description: "深入理解Flutter UI框架的底层原理，Widget、Element、RenderObject三棵树。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
heroImage: '/images/flutter-cover.png'
---

> 本文是Flutter系统学习系列的第十一篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

不知不觉就写了10篇Flutter文章啦 🎉，重构版的实战项目也写了有一半了。常言道：**温故而知新**，本节决定回顾下之前写的章节，**总结思考归纳** 之余，做一些 **延展学习**，以便对Flutter这套 **UI框架** 有更深一步的理解。

> **Tips**：本节概念性东西比较多，只需简单了解下，有个基本认知就阔以了，不看也没关系，不影响后续章节的学习😆

## 1. Flutter架构概述

Flutter 的本质是一套 **UI框架**，解决的是 **一套代码在多端渲染**。**高度优化的渲染管线**，使其相比于RN、WebView等方案具有 **更好的性能**。最直观的体现就是 **绘制调用少一层**：

RN 等 **JavaScript+原生渲染跨平台技术** 需要 **由其框架先调用Android框架**，再通过 **Skia** 调用 **GPU** 进行绘制。而 **Flutter框架** 直接通过 **Skia** 即可调用 **GPU 绘制**，无需调用Android框架，**调用步骤少一层**，所以性能更接近于原生。

接着请出**《八、进阶-异步编程速通🧨》**里提到的 **Flutter架构层次图**：

从上到下分为三层 **，上层组件依赖下层组件，组件间无法跨层访问**，从上往下每一层的职责：

* **Framework (框架层)** ：**提供上层API的封装**，如Widget、绘图、动画、手势等，用Dart语言编写。开发者直接接触的层，通过这些API来构建应用的界面和逻辑。
* **Engine (引擎层)** ：**提供Flutter核心API的底层实现**，包括图形绘制、文本布局、文件和网络IO、插件架构和Dart运行时和编译环境等。使用C/C++编写，并通过 **dart:ui** 库暴露给上层调用。
* **Embedder (嵌入/平台层)** ：**与底层操作系统交互**，将Engine层的内容渲染到不同平台设备上，同时处理平台相关的操作，如：访问相机、GPS、文件系统等，这一层的语言与平台相关，如Android是Java或Kotlin，iOS是Objective-C或Swift。

😁 复习完架构概述，接着了解下渲染管线的概念～

## 2. 渲染管线相关概念

### 2.1. 什么是渲染？

> 由计算机图形学的一个专业名称 "**Rendering**" 翻译而来，指的是 **用软件从模型生成图像的过程**。在渲染过程中，计算机需要对三维模型或场景进行处理，包括建模、纹理、映射、光照计算、投影变换、视点变换等，最终生成一张 **二维图像**。

😆 简单点说就是：**计算机将存储在内存中的形状，转换成实际绘制在屏幕上的对应过程**。

### 2.2. 什么是渲染管线？

> **Rendering Pipeline**，也可译作 **渲染流水线**，指的是 **将渲染的流程拆解成固定顺序**，方便对流程进行优化，用较低的成本 **用较低的成本** (时间、空间、计算能力) 将要显示的内容 **高效渲染到屏幕上**。这个过程需要有CPU跟GPU协作完成，**CPU** 擅长 **逐个指令计算**，**GPU** 更擅长 **并行计算**。

### 2.3. 渲染管线的三个阶段

#### 2.3.1. 应用程序阶段 (CPU)

这阶段最重要的输出是 **渲染所需的几何信息(顶点数据)** ，即 **渲染图元**，可以是点、线、三角面等，这些信息会传递给GPU的渲染管线处理，这个阶段进行的工作如下：

* **准备场景数据**：收集和准备场景中所有对象的数据，包括几何数据(顶点、索引)、材质属性、纹理、理、光照信息、摄像机参数等。将这些数据按照渲染顺序和属性进行排序，然后设置一些全局状态，如视图矩阵、投影矩阵等。
* **Culling剔除**：确定哪些对象是可见的，那些不可见，常见的剔除技术有三类：背面剔除 (面向摄像机背面的三角形)、视锥体剔除 (不在摄像机视野内的对象)、遮挡剔除 (被其它对象完全遮挡的对象)。
* **模型渲染状态设置**：如使用的着色器程序、材质属性、光照模型、混合模式、深度测试和写入状态等。每个模型可能需要不同的渲染状态，该状态的设置通常涉及到对GPU状态的配置，所以需要在这个阶段为每个模型设置正确的渲染状态。

#### 2.3.2. 几何阶段 (GPU)

也称 **顶点处理阶段**，或者理解成 **顶点着色器**，这个阶段的任务是 **处理与几何相关的绘制**，进行的工作如下：

* **顶点变换**：**将顶点从模型空间转换到视图**、**世界和裁剪空间的过程**，通常包括：视图矩阵、模型矩阵和投影矩阵的应用，这一步的目的是：将三维场景中的对象放置在正确的位置和方向，并考虑到摄像机的视角；
* **光照**：可能需要进行一点**光照计算**，如顶点法线与光源方向的点积计算，以确定顶点的光照强度。为后续片段处理阶段提供必要的光照信息，以便片段着色器能够更准确地计算每个像素的颜色。
* **裁剪**：**将位于视图体积之外的顶点移除**，视图体积定义了摄像机可以看到的空间，在这个空间外的顶点都不会被渲染，这一步减少了不必要的渲染工作量，提高了渲染效率。
* **投影**：**将三维空间的顶点映射到二维屏幕空间**，根据使用的投影类型，顶点会被重新定位以模拟真实世界中的视觉效果。使用透视投影会模拟人眼对远近物体的感知，使得远处的物体看起来更小，使用正交投影则保持物体的实际大小，不随距离变化。
* **屏幕映射**：将经过裁剪和投影处理后的顶点从**裁剪空间转换到屏幕空间**，顶点的坐标会被转换为屏幕上的像素坐标，通常是通过将坐标除以w分量 (透视除法) 并映射到屏幕的分辨率上，此时的顶点坐标同城在-1到1的范围内，还需要进一步转换为实际的屏幕像素坐标。

#### 2.3.3. 光栅化阶段 (GPU)

这个阶段的任务是 **将数据转换为可见像素**，进行的工作如下：

* **三角形设置**：准备即将被光栅化三角形所需的信息，包括：顶点位置、纹理坐标、法线、颜色等。
* **三角形遍历**：确定三角形覆盖的像素范围，通常涉及三角形的边缘计算，并确定哪些像素位于三角形内部。
* **像素/片元着色**：对光栅化后的每个像素执行 **片段着色器** 程序，计算像素的最终颜色，会应用到纹理映射、光照模型、阴影计算等，这是渲染过程中最耗时的部分之一，因为它需要对屏幕上每个像素都执行计算。
* **混合**：将新渲染的像素颜色与帧缓冲区中已经存在的颜色进行合并，通常涉及这几个测试和操作：**Alpha测试**(据像素的Alpha值决定是否丢弃该像素)、**模板测试** (根据模板缓冲区中的值决定是否丢弃该像素，用于渲染复杂的场景，如透明物体或反射效果)、**深度测试** (根据像素深度值Z值决定是否丢弃该像素，确保只有最近的像素才会被绘制，从而正确处理遮挡关系)、**Alpha混合** (像素通过上述测试，它的颜色将与帧缓冲区对应位置的颜色混合，Alpha混合用于实现半透明效果，如玻璃或水)。

#### 2.3.4. 将像素颜色输出到屏幕上

💁‍♂️ 光栅化完，渲染管线也算到头了，接着就是把最终的像素数据输出到屏幕上了：

* 合成的颜色会被写入 **帧缓冲区** (一片内存区域，用于存储即将显示屏幕上的图片数据)；
* 一旦 **帧缓存区中的数据准备好**，显卡会等待 **VSync垂直同步信号** (一个用来协调显示器刷新率和显卡帧率，避免屏幕撕裂的同步机制)；
* **当VSync信号到来时**，帧缓冲区中的内容会被发送到 **显示器**，显示器根据帧缓冲区中的数据 **逐行扫描**，将图像显示到屏幕上；
* 整个过程是 **连续** 的，显示器会以一定的 **刷新率**（例如60Hz或144Hz）不断重复这个过程；
* 当前帧显示到屏幕上后，渲染管线会开始处理下一帧数据，重复整个渲染流程；

💁‍♂️ 以上就是常规渲染管线的大概流程，简单点说就是：

> **CPU负责计算帧数据**，算完交给 **GPU栅格化处理和渲染**，渲染完丢 **图像缓冲区(显存)** 存起来，在 **合适的时机(VSync信号)** 把图像缓冲区里的数据呈现到 **Display(屏幕)** 上。

💁‍♂️ 渲染管线的 **核心渲染过程** (几何阶段+光栅化阶段) 一般是由 **渲染引擎** 来完成的。另外，**CPU可以代替GPU进行图形渲染**，只是效率没有GPU高，毕竟后者的 **并行计算** 能力使其能够快速将图形结果计算出来，并在屏幕的所有像素中显示，[CPU和GPU绘图](https://www.youtube.com/watch?v=-P28LKWTzrI) 这个视频很形象地演示了两者渲染的效果差异。

😁 关于渲染管线的概念就了解到这里，接下来看下 **Android的渲染管线** 是如何运作的~

## 3. Android 渲染管线浅析

### 3.1. 版本变更历史

早期的Android系统是没有 **官方的 Vsync 机制** 来协调GPU和显示器刷新，只有一个 **双缓冲机制**：

> **绘制和显示器都有自己的缓冲区**，**GPU** 在 **后台缓冲区** 渲染帧，完成一帧的渲染后，向系统发送一个信号，表明后台缓存区已经准备好可以渲染了。系统收到信号后，命令图形驱动程序 **交换前后台缓冲区 (交换指针或引用)** ，交换完成，**前台缓冲区** 就是 **新渲染的帧**，后台缓冲区则等待下一次的渲染，然后显示器从前台缓冲区读取数据来显示。

这种交换随时可能发生，如果显示器在读取缓冲区时，内容被改变了，就会导致 **屏幕撕裂**。

因为没有Vsync机制，渲染帧中间是没有间隔的，一帧绘制完下一帧就开始被处理，也导致了 **帧率的不稳定**。

**Android 4.0** 引入了 **硬件加速**，**Android 4.1** 引入了 **Vsync机制支持** + **Triple Buffer (三重缓存)** + **Choreographer(编舞者)，** 将 **App渲染** 和 **SurfaceFlinger** 合成的时间点规范化，提供了稳定的帧率输出。

#### 3.1.1. Vsync机制支持

**Vsync信号** 由屏幕显示设备产生，以固定的频率(如60Hz)发送给Android系统，这个信号确保了 **GPU帧的生成速度** 与 **屏幕刷新速度** 保持一致，从而避免画面撕裂，当系统接收到Vsync信号时，会 **立即处理下一帧数据**。

#### 3.1.2. **TripleBuffer (三重缓存)**

理想情况下，16ms内，CPU处理完数据，GPU将数据渲染到后台缓冲区，渲染结束，等下一个Vsync与前台缓冲区交换数据，显示到屏幕上。

CPU和GPU串行执行任务，存在资源浪费，毕竟没有多余的缓存区用于处理数据，两者中的一个必然空闲。而且其中一个出问题，导致帧耗时超过16ms (如CPU 8ms + GPU 12ms)，就会引起 **掉帧**。三重缓存就是增加一个Buffer给CPU用 (**即一个前缓冲区** + **两个后缓冲区**)，实现了CPU跟GPU的并行，保证了画面的连续性。

#### 3.1.3. **Choreographer (编舞者)**

它在整个渲染链路中起着关键作用：

* **承上**：**接收和处理App的更新更新信息和回调**，**等到Vsync信号到来时执行统一处理**。如：Input事件、动画、Traversal(measure、layout、draw等操作)、判断卡顿掉帧、记录Callback耗时等；
* **启下**：**请求和接收Vsync信号**。

#### 3.1.4. **RenderNode & RenderThread**

然后 **Android 5.0** 引入了两个较大的改变：

* **RenderNode**：对 **DisplayList** 和 部分View的显示属性做了进一步的封装；
* **RenderThread**：**渲染线程**，负责执行所有的OpenGL命令，在RenderNode中存有渲染帧的所有信息，可以做一些View的异步渲染任务，减轻了UI线程的工作量。

#### 3.1.5. **Vulkan**

接着 **Android 7.0** 引入了 **Vulkan** 的图形API，新一代图形API，采用了比OpenGL更加底层的架构，旨在提供更高效、更低开销的图形渲染。它是为多核处理、GPU协作和多GPU设计的，因此在现代硬件上的性能要由于OpenGL。然后有几个相关名词，也提一嘴：

* **OpenGL**：一种用于绘制2D和3D图形的跨平台API，**OpenGL ES** 是它的子集，专为嵌入式设备(手机等)设计。
* **Skia**：开源2D图形渲染库，能独立完成2D图形的绘制，并提供有限的3D效果支持。它主要通过 **CPU软件绘制** 实现，但也可以依赖底层的 **GPU硬件加速技术**，这由OpenGL、Vulkan、Metal等图形API提供支持。

### 3.2. 图形渲染架构概览

[官网](https://source.android.com/docs/core/graphics?hl=zh-cn) 给出了一张 **Android渲染架构图**：

**图像流** 从 **图像流生产者** 到 **Surface**，再被 **图像流消费者** 中的 **SurfaceFlinger** 消费掉，再到**HAL(硬件抽象层)** ，最后显示到 **屏幕上**。简单过下图中的几个组件：

* **图像流生产者**：包括 MediaPlayer、CameraPreview、NDK(Skia)、OpenGL ES，前两者通过直接读取 **图像源** 来生成图像数据，后两者通过 **自身的绘制能力** 生成图像数据，它们通过 **BufferData** 的形式将图像数据传递到缓冲队列中。
* **窗口管理器**：控制Window的系统服务 (**AWS**)，WindowsView的容器，每个窗口会关联一个 **Surface**，对应 **SurfaceFlinger** 的一个 **Layer (一个BufferQueue)** ，AWS会管理这些窗口，并把它们的数据传递给 **SurfaceFlinger**。
* **图像流消费者**：**SurfaceFlinger**(主要) 或 **显示OpenGL ES流** 的应用，如相机App预览。SurfaceFlinger 会把系统中所有应用程序的最终 **"绘制结果"** 进行混合 (也可能交给HAL层的HWC)。
* **HAL**：**抽象硬件层**，**Hardware Composer** 接收SurfaceFlinger提供的Layer完整列表进行合成，**Gralloc** 则封装了对 **FrameBuffer(显存映像，写操作会立即反应在屏幕上)** 的所有操作。

具体协作流程图如下：

其中 **BufferQueue** 的工作机制 (生产者消费者模式)

**生产者**：queue → 请求一块空闲的缓冲区；dequeue → 填充缓冲区后返回给队列；

**消费者**：acquire → 获得一块缓冲区；release → 使用完毕返回给队列；

😐 这部分简单概括下就是：

> 每个 **Window** 对应一个 **Surface**，指向 **SurfaceFlinger** 的一个 **Layer(BufferQueue)** ，应用程序把绘制好的图像数据添加到 **BufferQueue**，**SurfaceFlinger** 拿到数据后，请求HAL层决定Layer列表的由谁来合成，最终把合成后的图像数据显示到屏幕上。

### 3.3. 具体代码调用链路

😄 懒得画图了，感兴趣的直接看吧~

#### 3.3.1. Activity初始化

App启动创建主线程消息循环后，创建第一个Activity时会调用 **ActivityThread.performLaunchActivity()** 方法内部通过 **类加载器** 创建 **Activity实例**。

#### 3.3.2. **DecorView初始化**

* 接着调用 **Activity.attach()** ，内部创建了 **PhoneWindow实例** 并赋值给 Activity的成员变量 **mWindow**；
* 再接着 **Activity.onCreate()** 中调用 **setContentView()** ， 最终调用 **Window.getDecorView()** 创建了 **DecorView对象** 且与 Window绑定。

#### 3.3.3. ViewRootImpl、**Choreographer** 初始化

* Activity执行完 **onResume()** 会调用 **ActivityThread.handleResumeActivity()** ，其中调用了 **ViewManager.addView()** ，最终调用 **WindowManagerGlobal.addView()** 初始化了 **ViewRootImpl对象**，而且和 **DecorView** 进行绑定，成为它的 **parent**。而 **Choreographer** 也在 **ViewRootImpl构造方法** 中 完成了 **初始化**，而且通过 **FrameDisplayEventReceiver.onVsync()** 监听Vsync信号回调；

#### 3.3.4. ViewRootImpl 与 WMS 建立联系

* **ViewRootImpl** 是 **DecorView** 的 **管理者**，负责 View Tree 的测量、布局和绘制，接着上面的流程往下走，会调用 **ViewRootImpl.setView()** ，其中通过 **IWindowSession.addToDisplay()** 以Binder远程调用的方式和 **WMS** 建立了联系。

#### 3.3.5. ViewRootImpl 与 SurfaceFlinger 建立联系

* 接着调用 **WindowManagerService.addWindow()** 创建 **WindowState对象**，并调用 **win.attach()** 来创建一个 **SurfaceSession对象**，其中调用了 **android_view_SurfaceSession.cpp#nativeCreate()** 构造了一个 **SurfaceComposerClient对象**，它是App与 **SurfaceFlinger** 沟通的桥梁。
* 这个指针在第一次创建时会调用 **createScopedConnection()** 来创建一个 **ISurfaceComposerClient对象**，**SurfaceComposerClient** 就是通过它来与 **SurfaceFlinger** 通信，除此之外，它还可以创建 **Surface** 并 **维护一个App所有的Layer(层)** 。

#### 3.3.6. **requestLayout() 触发测绘**

* 经过上述步骤，**ViewRootImpl** 和 **WMS**、**SurfaceFlinger** 都建立了连接，但此时 View 还没显示出来，回到 **ViewRootImpl.setView()** ，这里还调用了 **requestLayout()。**
* 其中调用了 **scheduleTraversals()** 先设置同步屏障暂停处理后面的同步消息，然后调用 **mChoreographer.postCallback** (Choreographer.CALLBACK_TRAVERSAL, **mTraversalRunnable**, null)，指定一个回调函数，在下一个vsync信号到来时，执行 **mTraversalRunnable** 里的 **run()** ，点开这个方法只有一句 **doTraversal()** ，移除同步屏障后调用 **performTraversals()** 正式进入 **View的绘制流程**。

#### 3.3.7. 测量与布局

* 调用 **relayoutWindow()** 生成一个真正有效的 **Surface对象(Native层)** 并与 **Java层的Surface对象** 关联，同时会创建一个对应的 **Layer**，然后依次调用 **performMeasure**(测量) → **performLayout**(布局)，经过这两步已经确定了 **每个View的大小和摆放位置**；

#### 3.3.8. 具体绘制

* 接着就是确定每个View的 **具体绘制细节**，调用 **performDraw**(绘制) → **draw()** → **drawSoftware()** → **mSurface.lockCanvas**(锁定画布) → 通过 **nativeLockCanvas()** 向Native层的Surface对象获取一个**Canvas对象**，然后将其传递给 **DecorView** → 调用它的 **draw()** 方法，实际上调用的 **View#draw()** → **dispatchDraw()** 分配子元素的绘制，接着调用 **onDrawForeground()** 绘制前景。
* 在 **lockCanvas()** 中调用了一个JNI方法 **dequeueBuffer()** 获得了一块用于存储绘制元数据的 **Graphic Buffer**，**Skia** 会处理View的渲染，渲染数据输出到 **GraphicBuffer** 中。
* 最后调用 **unlockCanvasAndPost()** 解锁当前Canvas，并将图形缓存区数据写入Layer的 **BufferQueue**。

#### 3.3.9. **SurfaceFlinger合并Layer**

* **SurfaceFlinger** 检查到有新的 **GraphicBuffer**，会将这些缓冲区合成到一个完整的屏幕图像中，最后把合成后的图像渲染到屏幕上，渲染的同时还会处理输入事件，并将事件分发给对应的窗口。

 以上就是Android渲染相关代码的大概调用链路，除了调用 **requestLayout()** 标记自身或子View需要重新布局外，还有下面的情况会触发 **测绘**：

* View 调用 **invalidate()** 标记自己为脏，需要重绘；
* View Tree 中某些 **View的状态发生变化**，如大小、位置、可见性等；
* 用户与设备交互，如触摸屏幕，导致事件分发和View状态的改变；

Android系统会尽量减少不必要的View遍历，如：视图的尺寸没有变化，系统可能会跳过measure和layout过程；只有一小部分View需要重绘，系统会尽可能只重绘这些脏区域。

## 4. Flutter 渲染管线浅析

🤫 看完Android，接着来看下Flutter的渲染管线又是如何运作的~

### 4.1. Embedder层

🤔 作为一个跨端UI框架，**平台层** 要做的事情，自然是 **抽象底层平台差异**，为开发者提供一个统一的开发环境，只需专注于应用程序的业务逻辑和用户界面设计，而不用关心底层平台的复杂性。在渲染管线中的作用就表现为：

> **将引擎层的Skia渲染输出与底层图形API相结合，以便在不同的平台上都能正确的显示渲染结果**。

那具体要做什么呢？

* **渲染表面**：创建和管理一个平台特定的渲染表面，如 **SurfaceView** 或 **CAEAGLLayer**；
* **平台适配接口**：提供与操作系统交互的接口，包括线程管理、输入事件处理等；
* **图形API集成**：封装底层图形API，如OpenGL ES、Metal，使得Skia可以方便地调用这些API；
* **性能优化方案**：根据不同平台的特性，提供性能优化方案；
* **平台通道通信支持**：确保平台通道可以安全地传递与渲染相关的信息，如渲染状态、渲染命令等；

### 4.2. Engine层

🤔 这一层的话，感觉渲染管线相关的核心工作就两个：

* **向上提供dart:ui库**：提供一组Dart语言的API，包括但不限于绘制、布局、输入、图形、文字和动画等，**RenderObject** 通过这个库提供的API向Engince层发送绘制命令。该库还负责 **向上传递用户输入事件**，以便开发者可以响应用户的触摸、滑动等操作。
* **集成Skia完成渲染相关工作**：当Engine层收到来自于dart:ui库的绘制命令，调用Skia将绘制操作 **光栅化** 将矢量图形转换为像素，将渲染结果保存到 **帧缓冲区**，然后调用底层的渲染API来绘制到屏幕上。

渲染管线的绝大部分操作都在这层完成，详细的渲染过程复杂得很，目前没应用场景，就不刨了，大概知道下~

### 4.3. Framework层

普通UI崽能接触到Flutter渲染管线相关的基本就在这一层了，先是 **渲染三棵树**🌲，Flutter对 **视图树(UI Tree)** 的概念进行扩展，将 **视图数据的组合与渲染** 抽象成三个部分：

* **Widget (组件)** ：**Flutter UI 构建的基本单位**，开发者使用Widgets来构建UI，它们是 **不可变** 的，每当应用状态发生改变时，Flutter 会构建一个新的Widgets树。
* **Element (元素)** ：**Widget 在UI树中的实例**，Widgets树被编译成Element树，它们是 **持久** 的，即便Widgets树在状态变化时重新构建，Element 也可以保持不变。
* **RenderObject (渲染对象)** ：**负责实际的布局和绘制**，Element树中每个Element都可能对应一个RenderObject，它会根据Element的配置进行 **布局和绘制**。

然后是 **布局(Layout)** ：

> 从 **根RenderObject** 开始遍历(深度优先)，每个RenderObject都会根据其子节点的大小和位置来计算自己的大小和位置。

接着是 **绘制 (Paint)** ：

> RenderObject树中的每个RenderObject调用 **dart:ui** 中提供的API来绘制自己，绘制操作会被记录下来保存到**图层(Layer)** 中，层可以理解为屏幕上的一个 **矩形区域**，可以包含绘制内容或其它层，此时并没有实际绘制到屏幕上！

再接着是 **合成 (Composite)：**

> 遍历Layer树，确定每个Layer的组合方式，并应用任何必要的视觉效果，如混合模式、裁剪等。

最后将 **合成后的Layer树** 被提交给Engine层的 Skia 进行光栅化，转换成实际的像素数据。

💁 以上就是Flutter渲染管线的大概流程，只是在概念层面做下了解，并没有深入源码。实际开发中，很少需要我们去干预渲染过程，大多数时间都是在Framework层堆Widget。

## 5. Flutter App 启动流程

**main.dart** 是Flutter App的 **入口**，**main()** 函数是Dart应用程序的 **起点**，打开此文件的main()函数，只有一句**runApp(const MyApp())** ，点进去看看runApp()做了啥：

### 5.1. WidgetsFlutterBinding

调用 **WidgetsFlutterBinding.ensureInitialized()** 并返回了一个 **WidgetsBinding** 实例，点进去方法看看：

判断 **WidgetsBinding._instance** 属性是否为空，空的话调用构造方法创建一个实例，然后返回**WidgetsBinding.instance** 属性调用：

**checkInstance()** 里的实例没初始化的话，会显示一个错误信息，吼，就获取一个 **WidgetsBinding单例**。然后 **WidgetsFlutterBinding()** 并没有构造方法，调用的父类 **BindingBase** 的构造方法 (省略无关代码)：

```dart
BindingBase() {
  // 省略代码...
  initInstances();
  initServiceExtensions();
}
```

**initInstances()** 用于 **初始化绑定器实例**，**initServiceExtensions()** 用于 **注册扩展服务**。Flutter App 运行在 Dart VM上，两者是可以互相调用的，如Flutter调用Dart VM的服务来获取内存信息、类信息、调用方法等，Dart VM也可以反过来调用 Flutter 层注册好的方法。不过它们间的调用要遵循 [Json协议](https://github.com/dart-lang/sdk/blob/master/runtime/vm/service/service.md)，只要注册过，名字匹配上就可以调用，注册方法 **registerServiceExtension()** ，具体代码示例如下：

```dart
// 两个参数分别为：服务名称 和 回调
void registerServiceExtension({
  required String name,
  required ServiceExtensionCallback callback,
}) {
  // 包装传递的服务名称
  final String methodName = 'ext.flutter.$name';
  // 将方法名和回调注册到VM中，这是一个native方法，developer是一个开发者包
  developer.registerExtension(methodName, (String method, Map<String, String> parameters) async {
    // 省略代码...
    late Map<String, dynamic> result;
    try {
      result = await callback(parameters);
    } catch (exception, stack) {
      // 省略代码...
    }
    result['type'] = '_extensionType';
    result['method'] = method;
    return developer.ServiceExtensionResponse.result(json.encode(result));
  });
}
```

Dart VM 和 Flutter 的 **通信** 遵循socket协议，只要连接上 **虚拟机运行的URL** 就行了，需要用到 **vm_service** 模块，Flutter App 主动连接 VM的代码示例如下：

```dart
// Service.getInfo 是 Flutter 提供的获取虚拟机服务URL的API
// 也可以通过 FlutterEngine 获取，但需要通过插件传递，不是很方便
Service.getInfo().then((value) {
  String url = value.serverUri.toString();
  Uri uri = Uri.parse(url);
  // convertToWebSocketUrl() 对 url进行转换，生成WebSocket能识别的url
  Uri socketUri = convertToWebSocketUrl(serviceProtocolUrl: uri);
  // Flutter与VM服务建立连接
  vmServiceConnectUri(socketUri.toString()).then((service) {
    // 调用Flutter注册的exit方法
    service.callServiceExtension('ext.flutter.exit',
        isolateId: Service.getIsolateID(Is.Isolate.current),
        args: {'enabled': true});
  });
});

// 附: Flutter App 注册退出方法
registerSignalServiceExtension(
  name: 'exit',
  callback: _exitApplication,
);
Future<void> _exitApplication() async {
  exit(0);
}
```

接着提一嘴 混入**mixin** 的语法，它的几个关键字：**mixin**(声明混入类)、**with**(使用混入类)、**on**(限制混入只能应用于特定的子类)。混入的实现是依靠 **生成中间类** 的方式，生成伪代码如下：

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

不难看出 **混入是线性** 的，优先级高于 **继承**，后面的混入类会覆盖前面的 **同名方法**，所以下面的代码：

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

输出结果是 **C**，如果想 **每个混入类的同名方法都被调用**，可以这样玩：

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

**定义一个父类**，**每个混入类用on限定只能被父类的子类混入**，**方法中调用super**，**使用混入的类继承父类** 通过这四步就能实现多个混入类的 **链式调用**，每个mixin可以添加自己的逻辑，而不影响到其它mixin或基类。

看回代码，**BingingBase** 这里也是这样玩的，点开其中的两个混入类：

用on限定只有BindingBase的子类可以混入，然后 **super.initInstances()** ，就上面的玩法，综上：

BaseBinding 的构造方法起到 **模板方法**的作用，定义了所有绑定类的初始化流程，通过 **on** + **super** 实现混入绑定类从前往后初始化。

接着阐述下各个Binding类的作用~

#### 5.1.1. **GestureBinding**

Engine层事件监听的注册，在 **handleEvent()** 中处理所有RenderObject中注册的手势识别器决定分发给哪个组件，分发事件会回调 RenderObject中的 **dispatchEvent()。**

#### 5.1.2. SchedulerBinding

任务调度，处理各种类型任务的调度实际，执行UI构建前后的一些任务，除此之外可以对任务进行优先级排序。

* handleBeginFrame()：执行scheduleFrameCallback() 注册的回调；
* handleDrawFrame()：执行 addPersistentFrameCallback/addPostFrameCallback 注册的回调；
* addTimingsCallback()：GPU光栅化耗时回调，可用于GPU耗时检测；
* scheduleTask()：优先级执行异步任务；‘
* scheduleFrameCallback()：下一帧构建任务前的任务回调；
* addPersistentFrameCallback()：永久回调任务，下一帧之前都会执行一次；
* addPostFrameCallback()：addPersistentFrameCallback()后调用，只会被调用一次；
* scheduleFrame()：通知Engine有UI更新需要被回调；

#### 5.1.3. ServicesBinding

注册管理平台服务：

* _defaultBinaryMessenger：与platform通信；
* handleSystemMessage：处理系统消息，如字体改变、内存不足；
* _parseAppLifecycleMessage：生命状态回调处理；
* RestorationManager：数据保存/恢复管理；

#### 5.1.4. PaintingBinding

绘制库绑定，主要用于处理图片缓存；

#### 5.1.5. SemanticsBinding

语义化层与Engine层的桥梁，主要是辅助功能的底层支持；

#### 5.1.6. RendererBinding

**PipelineOwner** (用于管理RenderObject) 的管理，渲染树与Engine的桥梁，注册platform显示相关的监听，如：window.onMetricsChanged 、window.onTextScaleFactorChanged 等，创建了第一个RenderObject → RenderView。

#### 5.1.7. WidgetsBinding

Widget三棵树的入口，Widget树与Engine的桥梁，处理Widget、Element之间的业务，提供一些生命周期回调，如：window.onLocaleChanged、onBuildScheduled 等。

### 5.2. scheduleAttachRootWidget

继续往下走，调用了 **scheduleAttachRootWidget(binding.wrapWithDefaultView(app))** ，点开看看：

将一个Widget添加到渲染树的根节点上，**wrapWithDefaultView()** 定义在RendererBing中，用于创建一个默认视图，并将Widget包裹其中。View是用于显示Flutter内容的矩形区域，可以是整个屏幕，也可以是屏幕的一部分。

### 5.3. scheduleWarmUpFrame

**SchedulerBinding** 里的一个方法，触发一个空白帧，这个帧会通过渲染管道运行，但不会显示在屏幕上。这是为了初始化渲染管道，确保一切就绪，以便当第一个真正的帧被提交时，可以尽可能快地渲染。

**参考文献**：

* [《一文读懂渲染管线(7k字)》](https://zhuanlan.zhihu.com/p/430436550)
* [《八、渲染相关知识》](https://zhuanlan.zhihu.com/p/157877121)
* [《Starry-萌新的游戏开发之路》](https://zhuanlan.zhihu.com/p/101670053)
* [《计算机那些事(8)——图形图像渲染原理》](http://chuquan.me/2018/08/26/graphics-rending-principle-gpu/)
* **《关于 Android 渲染你应该了解的知识点》**
* **《Android图形系统（三）系统篇：渲染/合成的底层原理浅析》**
* [《苍耳叔叔：图形系统》](https://ljd1996.github.io/categories/Android/%E5%9B%BE%E5%BD%A2%E7%B3%BB%E7%BB%9F/)
* [《Android 系统架构 —— 图形架构篇》](https://sharrychoo.github.io/blog/android-source/graphic-overview)
* [《关于 UI 渲染，你需要了解什么？》](https://www.jianshu.com/p/279f727b00bc)
* [《深入探索Android布局优化（上）》](https://jsonchao.github.io/2020/01/13/%E6%B7%B1%E5%85%A5%E6%8E%A2%E7%B4%A2Android%E5%B8%83%E5%B1%80%E4%BC%98%E5%8C%96%EF%BC%88%E4%B8%8A%EF%BC%89/)
* [《UI绘制优化》](http://zzmblog.cn/html/sb/arc/157105315943.html)
* **《Android 渲染系列-App整个渲染流程全解析》**
* **《掌握Android图像显示原理上》**
* [《官方文档：Surface 和 SurfaceHolder》](https://source.android.google.cn/docs/core/graphics/arch-sh?hl=zh-cn)
* [《Android 基于 Choreographer 的渲染机制详解》](https://zhuanlan.zhihu.com/p/87954949)
* [《Android-Surface原理解析》](https://ljd1996.github.io/2020/11/09/Android-Surface%E5%8E%9F%E7%90%86%E8%A7%A3%E6%9E%90/)
* [《Android --- Activity/Window/DecorView/ViewRootImpl的创建时机》](https://blog.csdn.net/qq_43290288/article/details/134738347)
* [《ActivityThread源码分析》](https://blog.csdn.net/u013028621/article/details/116719655)
* [《从架构到源码：一文了解Flutter渲染机制》](https://mp.weixin.qq.com/s/wpU2APDdJdjMYkj5Kz2lTw)