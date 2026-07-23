---
title: "Flutter入门到精通（二十九）：玩转自定义绘制三部曲（上）"
pubDate: 2024-01-30
description: "Flutter自定义绘制入门，Canvas API、CustomPainter使用。"
author: wxc
tags: ["Flutter", "Dart", "前端"]
category: 'tech'
---

> 本文是Flutter系统学习系列的第二十九篇，该系列涵盖从环境搭建到高级原理的完整知识体系。

> **绘制**：在 **纸 (画板/画布-Canvas**) 上用 **笔 (画笔-Paint)** 按照一定的 **顺序 (路径-Path)** 画出想要的图形。

## 1. 引言

 本节如约系统讲解一波 **Flutter绘制** 相关的知识点，**Flutter** 的 **绘制API** 和 **Android** 非常相似，比如：

* **Canvas 和 Paint 类**：都用于绘制图形，并提供了 **同名绘制方法**，如：drawRect()、drawCircle() 等。
* **坐标系**：都使用 **左上角为原点的二维坐标系**，X轴向右，Y轴向下。
* **自定义绘制逻辑**：**Flutter** 继承 **CustomPainter** 重写 **paint()** ，**Android** 继承 **View** 重写 **onDraw()** 。
* **重绘**：**Flutter** 中的 **CustomPainter#shouldRepaint()** 用于确定是否需要重绘，Android 中的**View#invalidate()** 用于请求重绘。

😄 有 **Android** 经验的童鞋学 **Flutter绘制** 自带BUFF加成，没经验也没关系，跟上脚步就好了，本节学习路线图如下：

## 2. 绘制初体验-画圆 ⭕️

😆 先简单画个「**半径为10的圆**」，涉及到这些API：

* **CustomPaint**：**自定义绘制用到的Widget**，包含一个 **painter** 属性，用于指定自定义的绘制逻辑。
* **CustomPainter**：**抽象类**，需要继承并实现 **paint** (具体绘制逻辑) 和 **shouldRepaint** (确定是否重绘)。
* **Canvas**：**画布**，提供多种绘制方法，如drawCircle、drawLine 等，可在其上绘制形状和图像。
* **Paint**：**画笔**，用于定义绘制的样式和颜色，通过设置不同属性来控制绘制的外观。

具体绘制代码【--->c29/d2/draw\_circle\_demo.dart<---】：

### 2.1. 问题：圆心 & 大小

🤨 哈？怎么只有 **1/4** 的圆 ？？？

答：因为 **圆心的坐标位于坐标轴的左上角(0,0)** ，导致只有1/4的圆在可见区域内。

🙂 挪下圆心坐标可解，改为 **Offset(10, 10)** ：

🤔 画左上角不太优雅，怎么让它 **在中间绘制** 呢？**paint()** 的第二个参数 **size** 代表 **绘制区域的大小**，可以通过它拿到宽高除以2，不就能拿到中心点吗，改下代码：**Offset(size.width / 2, size.height / 2)** ，保存热重载：

😳 并没有出现预期的居中效果，这是为啥？打印下宽高，发现都是 **0.0**：

打开 **Flutter Inspector** 看下 **Widget 树**，定位到 **CustomPaint**：

**constraints** 在 **《二十四、🔍Flutter布局原理探秘》**中说过，它是 **父Widget传递的约束**，图中的约束类型是 **松约束**，允许 **子Widget** 在 **一定范围内** 自由决定自己的尺寸。😄 解法有三：

给 **CustomPaint** 组件设置下 **size** 属性、**child** 属性设置一个 **固定尺寸的Widget**、套一个 **紧约束的父Widget**。

解法示例代码如下：

```dart
// 💡 设置 size 属性
CustomPaint(painter: MyPainter(), size: const Size(200, 200))

// 💡 child 属性设置为一个固定尺寸的Widget
CustomPaint(painter: MyPainter(), child: const SizedBox(width: 200, height: 200))

// 💡 套一个「紧约束」的父Widget
SizedBox(width: 200, height: 200, child: CustomPaint(painter: MyPainter()))
```dart

😀 写死200不妥，应该是 **父约束宽高的一半**，可以通过 **LayoutBuilder** 来获取 **父约束**，修改后的代码如下：

😁 顺手把 **套紧约束的父Widget** 的方式也写下，用到 **紧约束的ConstrainedBox**：

😊 行吧，此时的圆就绘制在画板的中心啦。单独抽一个 **白色背景的画板Widget**，方便调用：

**💡Tips**：**CustomPaint** 其实有两个画板参数：**painter** 是背景画板，**foregroundPainter** 是前景画板，前后是相对于它的 **child-子组件** 而言的，设置了该属性的画，绘制内容将会在子组件的上层。

### 2.2. 扩展：屏幕方向设置

😄 移动端屏幕小，切换成 **横向全屏**，水平方向可以获得更大的绘制区域，也顺带提下一嘴 **屏幕方向切换** 相关的点，四个可选枚举值：

* **portraitUp** → 竖屏-顶部朝上
* **portraitDown** → 竖屏-底部朝上
* **landscapeLeft** → 横屏-左侧朝上
* **landscapeRight** → 横屏-右侧朝

如果想 **锁定屏幕方向**，禁止APP随着设备的方向改变，可在 **runApp()** 前进行下述设置：

手机开启 **自动旋转屏幕**，此时旋转手机，会发现只有水平方向改变才会旋转屏幕。如果想实现 **对整个APP屏幕旋转的监听**，可以使用 **OrientationBuilder** 组件包裹 **MaterialApp**，不过 **builder** 只在 **水平和垂直方向切换** 时才会回调！返回值：**Orientation.landscape(水平)** 或 **Orientation.portrait(垂直)** 。

😄 当然，通过 **MediaQuery.of(context).orientation** 获取当前屏幕方向亦可。🤔 某些特定页面需要 **指定不同的屏幕方向**，可在 **initState()** 调用 **SystemChrome.setPreferredOrientations()** 进行设置，但会覆盖 **main()** 处设置的全局屏幕方向，需要在 **dispose()** 中调用此方法恢复之前的设置：

😊 还有个常见问题 → **Flutter 设置屏幕方向不生效**，如：设了横屏，APP首屏 (启动页) 还是竖屏？

原因：启动页由原生平台 (Android/iOS) 在 **Flutter引擎初始化前** 显示的，其屏幕方向受原生代码的控制。

解法自然是 **原生端进行相应的设置**，**Android** 的话改下 **AndroidManifest.xml**，找到 Flutter 的 **宿主Activity** 对应的 **activity** 标签，将 **android:screenOrientation** 属性设置为 **landscape** 即可。

😯 横竖屏说完说 **全屏**，调用 **SystemChrome.setEnabledSystemUIMode(SystemUiMode.xxx**) 可以对 **导航栏(顶部)** 和 **导航栏(底部)** 进行控制，可选值：

* **leanBack**：点击屏幕任意位置显示状态栏和导航栏，Android J 后可用。
* **immersive**：从屏幕边缘滑动会显示状态栏和导航栏。
* **immersiveSticky**：同immersive，只是状态栏和导航栏显示后会自动隐藏，Android 10 后可用。
* **edgeToEdge**：固定显示状态栏和导航栏。
* **manual**：手动指定要显示的元素，**overlays** 参数传入 **SystemUiOverlay** 的枚举值列表。

示例如下：

## 3. 绘制API-详解️🔍

😁 快速扫一遍知道下就行，不用死记，用到再查。当然，也可以跟着实践一遍，这样印象更深刻，用起来也熟练，练习多了你会发现 **API** 其实不难，难的是 **数学计算** ~

### 3.1. Float64List & Matrix4 - 矩阵变换

在讲解 **Paint**、**Canvas**、**Path** 的具体API前，先介绍下这两者，在挺多地方能看到它们的身影。先是 **Float64List**：

一种用于存储 **64位浮点数** 的列表(**16个元素**)，表示一个 **4x4的矩阵**，通常用于处理 **矩阵变换** 等复杂数学运算。

矩阵形式：

```dart
| m00 m01 m02 m03 |
| m10 m11 m12 m13 |
| m20 m21 m22 m23 |
| m30 m31 m32 m33 |

元素含义：

● m00, m11, m22：缩放因子，控制在 x、y、z 轴上的缩放
● m01, m02, m10, m12, m20, m21：旋转和剪切变换的分量。
● m03, m13, m23：平移分量，控制在 x、y、z 轴上的移动。
● m30, m31, m32：透视投影分量，在 3D 投影中使用。
● m33：用于归一化坐标，一般为 1

没经过任何变化的初始状态 (单位矩阵，在变换中表示恒等变换)：

Float64List.fromList([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
])

逐行讲解：

第一行：
◆ 1 (m00)：x 轴的缩放因子，值为 1，表示 x 轴不进行缩放。
◆ 0 (m01)：x 与 y 轴的旋转或剪切分量，值为 0。
◆ 0 (m02)：x 与 z 轴的旋转或剪切分量，值为 0。
◆ 0 (m03)：x 轴的平移分量，值为 0，表示不平移。

第二行：
◆ 0 (m10)：y 与 x 轴的旋转或剪切分量，值为 0。
◆ 1 (m11)：y 轴的缩放因子，值为 1，表示 y 轴不进行缩放。
◆ 0 (m12)：y 与 z 轴的旋转或剪切分量，值为 0。
◆ 0 (m13)：y 轴的平移分量，值为 0。

第三行
◆ 0 (m20)：z 与 x 轴的旋转或剪切分量，值为 0。
◆ 0 (m21)：z 与 y 轴的旋转或剪切分量，值为 0。
◆ 1 (m22)：z 轴的缩放因子，值为 1，表示 z 轴不进行缩放。
◆ 0 (m23)：z 轴的平移分量，值为 0。

第四行
◆ 0 (m30, m31, m32)：透视投影的分量，值为 0。
◆ 1 (m33)：归一化因子，保持为 1。
```dart

在 **Flutter** 中可以直接使用 **Matrix4** 进行 **矩阵变换**，相关API：

```dart
// 构造方法
Matrix4.identity()：创建一个单位矩阵，表示无任何变换。
Matrix4.translationValues(double x, double y, double z)：创建一个平移矩阵，按照指定的 x、y、z 轴值进行平移。
Matrix4.rotationX(double radians)：创建一个绕 X 轴旋转的矩阵，radians 为旋转角度（弧度）。
Matrix4.rotationY(double radians)：创建一个绕 Y 轴旋转的矩阵。
Matrix4.rotationZ(double radians)：创建一个绕 Z 轴旋转的矩阵。
Matrix4.diagonal3Values(double x, double y, double z)：创建一个缩放矩阵，按照指定的 x、y、z 轴比例进行缩放。
Matrix4.skew(double x, double y)：创建一个倾斜矩阵，x 和 y 为倾斜角度（弧度）。

// 属性
storage：一个长度为 16 的 Float64List，以列优先的顺序存储矩阵元素，可直接访问和修改矩阵数据。

// 方法
clone()：创建当前矩阵的副本。
invert()：将当前矩阵求逆，如果矩阵可逆则返回自身，否则返回 null。
transpose()：将当前矩阵转置。
translate(double x, [double y = 0.0, double z = 0.0])：在当前矩阵的基础上进行平移变换。
rotateX(double radians)：在当前矩阵的基础上绕 X 轴旋转。
rotateY(double radians)：在当前矩阵的基础上绕 Y 轴旋转。
rotateZ(double radians)：在当前矩阵的基础上绕 Z 轴旋转。
scale(double x, [double y, double z])：在当前矩阵的基础上进行缩放变换。
skew(double x, double y)：在当前矩阵的基础上进行倾斜变换。
multiply(Matrix4 other)：将当前矩阵与另一个矩阵相乘，结果存储在当前矩阵中。

// 从 List → Float64List → Matrix4 的转换过程
List<double> matrixValues = [
  1.0, 0.0, 0.0, 0.0,
  0.0, 1.0, 0.0, 0.0,
  0.0, 0.0, 1.0, 0.0,
  0.0, 0.0, 0.0, 1.0,
];

// 转换为 Float64List
Float64List float64List = Float64List.fromList(matrixValues);

// 使用 Float64List 构造 Matrix4 对象
Matrix4 matrix = Matrix4.fromFloat64List(float64List);
```dart

😄 看不懂也没关系，知道通过它两可在自定义绘制中实现复杂的图形变换就行了，涉及到的时候再来深入学习~

### 3.2. Paint-基础属性

**Paint-画笔** 的基础属性有这些：

* **color**：Color，绘制颜色。
* **isAntiAlias**：bool，是否抗锯齿。
* **style**：PaintingStyle，绘制样式，可选值：fill-填充、stroke-线条。
* **strokeWidth**：double，线宽，style为stroke才会起作用，而且会有一半宽度在外侧。
* **strokeCap**：StrokeCap，线帽类型，可选值：butt-不出头、round-圆头、square-方头。
* **strokeJoin**：StrokeJoin，线接类型，可选值：bevel-斜角、miter-锐角、round-圆角。
* **strokeMiterLimit**：double，斜接限制，strokeJoin为miter才生效，用于控制斜接长度，值越大，尖角越尖，默认值为4，意味着斜接长度超过四倍线宽时，斜接将被剪裁。该值一般设置为 **大于等于1** 的数 (1就是bevel🐶)。
* **invertColors**：bool，是否反转颜色，即是否使用color在色环中相反位置的颜色进行绘制。

写下简单属性效果预览Demo【--->c29/d3/paint/paint\_api\_first\_preview.dart<---】：

### 3.3. Canvas

#### 3.3.1. 绘制

**绘制** 相关的API：

```dart
drawLine(Offset p1, Offset p2, Paint paint): 绘制一条线。
drawRect(Rect rect, Paint paint): 绘制一个矩形。
drawRRect(RRect rrect, Paint paint): 绘制一个圆角矩形。
drawDRRect(RRect outer, RRect inner, Paint paint): 绘制一个嵌套的圆角矩形。
drawOval(Rect rect, Paint paint): 绘制一个椭圆。
drawCircle(Offset c, double radius, Paint paint): 绘制一个圆。
drawArc(Rect rect, double startAngle, double sweepAngle, bool useCenter, Paint paint): 绘制一个弧。
drawPath(Path path, Paint paint): 绘制一个路径。
drawImage(Image image, Offset offset, Paint paint): 绘制一个图片。
drawImageRect(Image image, Rect src, Rect dst, Paint paint): 绘制一个缩放或裁剪后的图片。
drawImageNine(Image image, Rect center, Rect dst, Paint paint): 绘制图片时实现九宫格拉伸效果。
drawPicture(Picture picture): 绘制一个图像。
drawParagraph(Paragraph paragraph, Offset offset): 绘制一个段落。
drawPoints(PointMode pointMode, List<Offset> points, Paint paint): 绘制一组点。
drawVertices(Vertices vertices, BlendMode blendMode, Paint paint): 绘制顶点。
```dart

涉及到的 **参数类型** 的API：

```dart
// ===================【💡 Rect 矩形 】====================
Rect.fromLTWH(double left, double top, double width, double height): 创建一个矩形，参数依次为左边界、上边界、宽度和高度。
Rect.fromLTRB(double left, double top, double right, double bottom): 创建一个矩形，参数依次为左、上、右和下边界。
Rect.inflate(double delta): 返回一个新的矩形，其边界向外扩展指定的距离。
Rect.deflate(double delta): 返回一个新的矩形，其边界向内收缩指定的距离。
Rect.intersect(Rect other): 返回当前矩形和另一个矩形的交集。
Rect.contains(Offset point): 判断一个点是否在矩形内。

// ===================【💡 PRect 圆角矩形 】====================
RRect.fromLTRBR(double left, double top, double right, double bottom, Radius radius): 创建一个圆角矩形，参数依次为左、上、右和下边界，以及圆角半径。
RRect.fromRectAndRadius(Rect rect, Radius radius): 从一个矩形和圆角半径创建一个圆角矩形。
RRect.fromRectAndCorners(Rect rect, {Radius topLeft = Radius.zero, Radius topRight = Radius.zero, Radius bottomRight = Radius.zero, Radius bottomLeft = Radius.zero}): 从一个矩形和四个角的圆角半径创建一个圆角矩形。
RRect.inflate(double delta): 返回一个新的圆角矩形，其边界向外扩展指定的距离。
RRect.deflate(double delta): 返回一个新的圆角矩形，其边界向内收缩指定的距离。
RRect.contains(Offset point): 判断一个点是否在圆角矩形内。

// ===================【💡 Image 图片 】====================
// 注：绘制图片使用的「ui.Image」而非「Image」组件 ❗️ 需要异步加载，加载图片数据解码为图片对象：
Future<ui.Image>? loadImageFromAssets(String path) async {
  ByteData data = await rootBundle.load(path);
  return decodeImageFromList(data.buffer.asUint8List());
}

// ===================【💡 drawImageNine 图片实现九宫格拉伸】====================
// 注：源图不一定要是.9.png图片，Flutter 中可以使用普通位图实现，
// Flutter 不直接支持 .9.png 格式，需要先转换成普通PNG图片。
// 只需合理定义中心区域，指定哪些部分需要拉伸，哪些部分保持不变。
// center 代表image上一块可缩放的矩形区域，dst将抠出图片填充到画布的矩形区域
canvas.drawImageNine(image, center, dstRect, paint);

// ===================【💡 Picture 图像 】====================
// 一个包含绘图指令的对象，可以通过 PictureRecorder 记录绘图操作生成。
// 适用于需要重复绘制复杂图形的场景，使用它可以预先记录绘图指令，提高绘制效率。
final recorder = PictureRecorder();
final recordingCanvas = Canvas(recorder);
final paint = Paint()..color = Colors.blue;
recordingCanvas.drawCircle(Offset(50, 50), 30, paint);
final picture = recorder.endRecording();
canvas.drawPicture(picture);

// ===================【💡 Paragraph 文本段落 】====================
// 使用 ParagraphBuilder 构建并布局
// ① ParagraphStyle 定义文本样式，如对齐方式、字体大小等
final paragraphStyle = ParagraphStyle(
  textAlign: TextAlign.left,
  fontSize: 20,
  maxLines: 1,
);
// ② ParagraphBuilder 设置样式并添加文本内容
ParagraphBuilder builder = ParagraphBuilder(ParagraphStyle());
builder.addText('Hello, Flutter!');
// ③ 构建 Paragraph
Paragraph paragraph = builder.build();
// ④ layout() 设置文本宽度，宽度不足文本会自动换行
paragraph.layout(ParagraphConstraints(width: 200));
canvas.drawParagraph(paragraph, Offset(10, 10));
// ❗️ 注：频繁重绘时，尽量避免在 paint 方法中创建 Paragraph 对象，可以提前创建并缓存

// ===================【💡 PointMode 点的绘制模式 】====================
PointMode.points：绘制独立的点。
PointMode.lines：将点两两连接成线段。
PointMode.polygon：将所有点依次连接，形成折线。

// ===================【💡 Vertices 顶点 】====================
// 顶点是构成几何图形的基本单位，通常用于定义多边形、网格等复杂图形的形状。
// 顶点不仅包含位置坐标，还可以包含颜色、法线、纹理坐标等属性。
// ui.Vertices 用于定义一组顶点及其相关属性：
//
// VertexMode mode：顶点模式，决定了顶点如何连接成图形，常见模式：
// triangles-三角形：每三个顶点组成一个独立三角形。
// triangleStrip-三角形条带：前三个顶点组成一个三角形，之后的每个顶点与前两个顶点组成一个新的三角形。
// triangleFan：三角形扇形模式，第一个顶点作为中心点，之后的每两个顶点与中心点组成一个新的三角形。
//
// positions：顶点的位置列表，每个位置由 Offset 对象表示。
// colors：顶点的颜色列表，每个颜色由 Color 对象表示（可选）。
// textureCoordinates：顶点的纹理坐标列表（可选）。
// indices：顶点的索引列表，用于定义顶点的连接顺序（可选）。

// ===================【💡 TextPainter-文本绘制】====================
// Flutter中用于绘制文本的低级绘图类，位于dart:ui库中，提供了对文本布局和渲染的精细控制

// 基本使用步骤：
// ① 创建TextSpan对象：定义要绘制的文本及其样式。
final textSpan = TextSpan(
  text: 'Hello, TextPainter!',
  style: TextStyle(color: Colors.black, fontSize: 18),
);
// ② 创建TextPainter实例：将TextSpan赋值给TextPainter的text属性。
final textPainter = TextPainter(
  text: textSpan,
  textDirection: TextDirection.ltr,
);
// ③ 布局文本：调用layout()方法，计算文本的尺寸和位置。
textPainter.layout(minWidth: 0, maxWidth: size.width);

// ④ 绘制文本：使用paint()方法在Canvas上绘制文本。
textPainter.paint(canvas, Offset(10, 10));

// 常用属性与方法
width和height：获取文本的宽度和高度。
size：获取文本的尺寸。
computeLineMetrics()：获取每一行的布局信息。
getPositionForOffset(Offset offset)：根据触摸位置获取文本位置，用于实现文本交互。
getOffsetForCaret(TextPosition position, Rect caretPrototype)：获取光标的位置。
```dart

绘制效果示例【--->c29/d3/canvas/canvas\_api\_first\_preview.dart<---】

#### 3.3.2. 其它

😄 **Canvas** 除了 **绘制** 外的API分为这三类：

```dart
// ===================【💡 变换】====================
translate(double dx, double dy): 平移画布原点，后续的绘制操作都会基于新的原点进行。
scale(double sx, [double? sy]): 按比例缩放画布。
rotate(double radians): 画布按照指定弧度值旋转旋转，旋转是围绕画布原点进行的。
skew(double sx, double sy): 将画布按指定的水平和垂直倾斜角度进行倾斜变换。
transform(Float64List matrix4): 应用一个 4x4 矩阵变换。

// ===================【💡 裁剪】====================
clipRect(Rect rect, {ClipOp clipOp = ClipOp.intersect, bool doAntiAlias = true}): 裁剪一个矩形区域。
clipRRect(RRect rrect, {bool doAntiAlias = true}): 裁剪一个圆角矩形区域。
clipPath(Path path, {bool doAntiAlias = true}): 裁剪一个路径区域。

// ===================【💡 保存与状态恢复】====================
save(): 保存当前的画布状态(压栈)，方便后续restore()恢复。
restore(): 恢复到上一次保存的画布状态。
restoreToCount(int count): 将状态栈恢复到指定的保存点 count，一次性弹出多个保存的状态。
getSaveCount(): 获取当前保存的状态数量 (状态栈深度)，初始状态返回1，每次调用 save() 或 saveLayer()，计数加一。

saveLayer(Rect? bounds, Paint paint): 保存当前的画布状态并创建一个新的图层。
// 注：图层是一个独立的绘制表面，类似于在画布上叠加了一张透明的玻璃，合成时，图层内容会与下方的内容合并。
// 使用 saveLayer() 会创建离屏缓冲，可能影响性能，应在需要时使用，例如需要特殊的混合效果。
```dart

绘制效果示例【--->c29/d3/canvas/canvas\_api\_second\_preview.dart<---】

### 3.4. Path-路径

#### 3.4.1. 移动路径

**移动路径** 相关的API：

```dart
// ===================【💡 移动路径(绝对) 】====================
moveTo(double x, double y): 移动到指定位置。
lineTo(double x, double y): 绘制一条线。
arcTo(Rect rect, double startAngle, double sweepAngle, bool forceMoveTo): 添加一个弧线，forceMoveTo 用于指定绘制弧线前是否移动到弧线的起点
arcToPoint(Offset arcEnd, {Radius radius = Radius.zero, double rotation = 0.0, bool largeArc = false, bool clockwise = true}): 添加一个弧线到指定点
conicTo(double x1, double y1, double x2, double y2, double w): 绘制二阶有理贝塞尔曲线，通过权重参数实现特殊曲线形状。
quadraticBezierTo(double x1, double y1, double x2, double y2): 绘制二阶贝塞尔曲线，适用于简单的曲线绘制。
cubicTo(double x1, double y1, double x2, double y2, double x3, double y3): 绘制三阶贝塞尔曲线，适用于需要精细控制的复杂曲线。

// ===================【💡 移动路径(相对) 】====================
relativeMoveTo(double dx, double dy): 相对移动到指定位置。
relativeLineTo(double dx, double dy): 相对绘制一条线。
relativeArcToPoint(Offset arcEndDelta, {Radius radius = Radius.zero, double rotation = 0.0, bool largeArc = false, bool clockwise = true}): 相对添加一个弧线到指定点。
relativeConicTo(double dx1, double dy1, double dx2, double dy2, double w): 相对绘制二阶有理贝塞尔曲线。
relativeQuadraticBezierTo(double dx1, double dy1, double dx2, double dy2): 相对绘制二阶贝塞尔曲线。
relativeCubicTo(double dx1, double dy1, double dx2, double dy2, double dx3, double dy3): 相对绘制三阶贝塞尔曲线。
```dart

😁 **绝对** → 移动到指定的 **绝对坐标位置(x,y)** ，**相对** → 基于 **当前绘制点当前位置移动(dx,dy)** 的偏移量。前者参考的是 **画布原点**，后者参考的 **当前点所在的位置**。

绘制效果示例【--->c29/d3/canvas/path\_api\_first\_preview.dart<---】

#### 3.4.2. 添加路径

😄 就是在 **已有的路径** 上添加各种形状，相关API：

```dart
// ===================【💡 添加路径】====================
addArc(Rect oval, double startAngle, double sweepAngle): 添加一个弧。
addOval(Rect oval): 添加一个椭圆。
addPath(Path path, Offset offset, {Float64List? matrix4}): 添加另一个路径，不会连接到当前路径的末尾。
extendWithPath(Path path, Offset offset, {Float64List? matrix4}): 扩展路径，从路径的最后一个点开始连接。
addRect(Rect rect): 添加一个矩形。
addRRect(RRect rrect): 添加一个圆角矩形。
addPolygon(List<Offset> points, bool close): 添加一个多边形。
```dart

绘制效果示例【--->c29/d3/canvas/path\_api\_second\_preview.dart<---】

#### 3.4.3. 其它

相关API：

```dart
// ===================【💡 路径操作】====================
close(): 闭合当前路径，将路径的最后一个点与第一个点连接起来，形成一个封闭的形状，便于填充。
transform(Float64List matrix4): 对路径进行变换。
contains(Offset point): 判断给定的点是否在路径内部，常用语命中测试、碰撞检测等功能，判断用户点击或触摸的点是否在特定的形状内。
computeMetrics({bool forceClosed = false}): 获取路径的几何信息，如长度、切线、子路径数量等，便于执行动画、绘制进度等效果，返回一个PathMetrics对象的迭代器。
shift(Offset offset): 将路径按照指定的偏移量平移，返回一个新的路径对象。
Path.combine(PathOperation operation, Path path1, Path path2): 组合两个路径生成新路径，用于创建复杂的形状，通过对基本形状进行相交、合并、相减等操作。
reset(): 清空路径的所有内容，将其重置为初始状态。
getBounds(): 获取包含路径的最小矩形边界，即路径所占用的区域。
getFillType(): 获取路径的填充类型，决定了在路径重叠或自相交时，哪些区域被认为是“内部”，从而影响填充效果。
setFillType(PathFillType fillType): 设置路径的填充类型，可选值：nonZero-非零环绕数规则、evenOdd-奇偶规则。
Path.from(Path source)：复制一个路径，对其操作，不会影响原始路径。
```dart

绘制效果示例【--->c29/d3/canvas/path\_api\_third\_preview.dart<---】

### 3.5. Paint-着色器

源码【--->c29/d3/paint/paint\_api\_second\_preview.dart<---】

#### 3.5.1. Gradient-渐变着色器

**Shader (抽象类)** ，允许我们使用家变、图像或其它着色器来填充绘制的形状。然后关于 **渐变** Flutter 里有 **两组API**：

* Flutter框架的一部分，通常用于 **Widget树** 中，如在 Container、BoxDecoration 等中使用。它提供了一个更高层次的 API，适合在构建 UI 时使用：**LinearGradient(线性渐变)** 、**RadialGradient(径向渐变)** 、**SweepGradient(扫描渐变)** 。
* Dart 的 **dart:ui** 库的一部分，通常用于 **自定义绘制**（CustomPainter）中，直接操作 **Canvas**。它提供了更底层的控制，适合需要精细控制绘制过程的场景：**ui.Gradient.linear()** 、**ui.Gradient.radial()** 、**ui.Gradient.sweep()** 。

😄 自定义绘制自然用的 **后者**，需要用到 **ui包下的Gradient**，导包时需设置下别名→ **import 'dart:ui' as ui**。**渐变着色器** 的API：

```dart
// ===================【💡 线性渐变 】====================
Gradient.linear(
  Offset from,	// 渐变起点
  Offset to,	// 渐变终点
  // 渐变使用的颜色列表，如：[Colors.red, Colors.blue] 表示从红色到蓝色的渐变
  // 列表中至少要有2个颜色 ❗️
  List<Color> colors,
  [
    // 定义每个颜色在渐变中的位置，范围[0.0,1.0], ❗️ 数量需要和colors长度一致！！！
    // 如果不传该参数，colors 数组必须正好有 2 个元素，否则会报错：
    // Invalid argument(s): "colors" must have length 2 if "colorStops" is omitted.
    // 示例：[0.0, 1.0] 表示第一个颜色在起点，第二个颜色在终点，
    List<double>? colorStops,

    // 渐变在定义区域外的绘制方式 (绘制内容超过渐变范围)
    // clamp: 默认，延伸边缘颜色、repeated: 重复渐变、mirror: 镜像重复渐变、deal：填充透明黑色
    TileMode tileMode = TileMode.clamp,

    // 一个 4x4 的变换矩阵，用于对渐变进行变换
    Float64List? matrix4,
  ]
)

// ===================【💡 径向渐变 】====================
Gradient.radial(
  Offset center,	// 渐变的中心点
  double radius,	// 渐变的半径
  List<Color> colors, // 渐变使用的颜色列表
  [
    List<double>? colorStops,	// 定义渐变中每个颜色的位置
    TileMode tileMode = TileMode.clamp,	// 渐变在定义区域外的绘制方式
    Float64List? matrix4,	// 一个 4x4 的变换矩阵，用于对渐变进行变换
    Offset? focal,	// 渐变的焦点位置，默认为中心点
    // 焦点半径，默认为0.0，将其设置为大于0的值，焦点会变成一个圆形区域
    // 渐变将从这个圆形区域开始扩展
    double focalRadius = 0.0,
  ]
)

// ===================【💡 扫描渐变 】====================
Gradient.sweep(
  Offset center,	// 渐变的中心点
  List<Color> colors, // 渐变使用的颜色列表
  [
    List<double>? colorStops,	// 定义渐变中每个颜色的位置
    TileMode tileMode = TileMode.clamp,	// 渐变在定义区域外的绘制方式
    double startAngle = 0.0,	// 渐变的起始角度，单位为弧度
    double endAngle = pi * 2,	// 渐变的终止角度，单位为弧度，pi 代表 180°
    Float64List? matrix4,	// 一个 4x4 的变换矩阵，用于对渐变进行变换
  ]
)
```dart

效果如下：

#### 3.5.2. ImageShader-图片着色器

**将图像转换为着色器**，在绘制过程中使用该图像填充形状，一般用于创建纹理和其它复杂视觉效果。用到 **ImageShader** 类，API 如下：

```dart
  ImageShader(
    // 需要ui包下的Image对象，不是Image组件，要导包 import 'dart:ui' as ui
    // 可以使用 decodeImageFromList() 函数从字节数组中解码图像
    // 也可以使用 instantiateImageCodec() 来解码图像。
    Image image,

    TileMode tmx, // x轴的平铺模式
    TileMode tmy, // y轴的平铺模式
    Float64List matrix4, // 变换矩阵

    //图像采样质量，可选值：
    // none: 不进行任何过滤，速度最快但质量最低。
    // low: 默认，进行低质量的过滤，速度较快。
    // medium: 进行中等质量的过滤，平衡速度和质量。
    // high: 进行高质量的过滤，速度最慢但质量最高
    {FilterQuality? filterQuality,}
  )
```dart

关键代码示例：

效果如下：

### 3.6. BlendMode-混合模式

😮 混合模式是一种图形渲染技术，定义了 **源图像 (src，要绘制的内容)** 和 **目标图像 (dst，已绘制的内容/背景)** 进行 **像素级别的颜色混合**。每种混合模式都有自己的算法，决定了源色和目标色如何组合成最终的呈现效果，😏 它可是实现 **高级特效的必备技巧** ❗️ 在自定义绘制中，可以为 **源图像的Paint** 设置 **blendMode** 属性来使用混合模式，**dst** 则是 **已经绘制在Canvas上的内容**。

绘制效果示例【--->c29/d3/paint/paint\_api\_third\_preview.dart<---】

### 3.7. Filter-滤镜

#### 3.7.1. ColorFilter-滤色器

除了 **Paint** 能使用 **BlendMode** 外，**ColorFilter(滤色器)** 也可以，它使用 **变换矩阵** 或 **颜色叠合模式** 对绘制的对象进行滤色处理。**ColorFilter.matrix()** 通过一个 **5x4的颜色矩阵** 控制色彩变换，计算方式如下：

绘制效果示例【--->c29/d3/paint/color\_filter\_demo.dart<---】

#### 3.7.2. 其它滤镜

😊 **API** 如下：

```dart
// ===================【💡 MaskFilter 模糊滤镜 】====================
// 可以对绘制的图形的边缘或内部添加模糊处理，通常用于生成阴影、发光等效果。

// 创建 MaskFilter，然后通过 Paint 对象的「maskFilter」进行应用。
MaskFilter.blur(BlurStyle style, double sigma)
// 参数：
// BlurStyle-模糊类型，可选值：normal-图形内外均匀模糊、solid-内部模糊边界清晰、outer-外部模糊内部清晰、inner-内部模糊外部透明
// sigma-模糊半径，半径越大，模糊程度越强

// ===================【💡 ImageFilter 图像滤镜 】====================
// 对绘制内容或图像应用过渡效果，如模糊、颜色矩阵变换等，常与 BackdropFilter 组件搭配使用。
// 调用其「blur()」来让图片模糊，调用「matrix」进行矩阵变换。

ImageFilter.blur({double sigmaX = 0.0, double sigmaY = 0.0, TileMode tileMode = TileMode.clamp})
// 参数：
// sigmaX：横向模糊程度，sigmaY：纵向模糊程度，tileMode：滤镜在图像边缘的处理，默认clamp。

// ===================【💡 FilterQuality 滤镜质量 】====================
// 枚举，用于控制在图像缩放或变换时使用的过滤算法质量，它影响绘制位图时的渲染质量和性能。
// 可选值：none-最快，可能有锯齿或瑕疵、low-比none稍好，性能也较好，默认、
// medium-较高过滤质量，性能有所下降、high-最高过滤质量，性能最差。
// 一般作为 Paint 的「filterQuality」属性来使用。
```dart

绘制效果示例【--->c29/d3/paint/other\_filter\_demo.dart<---】

## 4. 练手时间-画图表📊

😑 花了不少时间，总算把 Flutter 绘制相关的API过完了，接下来是练手时间😏~

### 4.1. 柱形/直方图

😁 直接说思路【--->c29/d4/bar\_chart.dart<---】：

* 1、绘制一个浅灰色背景用于标识画布区域。
* 2、获取画布宽高，设置最大绘制宽高。
* 3、canvas.save() 保存画布状态，translate(30, size.height - 60) 将原点挪到左下角，绘制红色原点。
* 4、画Y轴线、求出Y轴需要绘制的刻度数量，算偏移，然后绘制刻度。
* 5、画X轴线，设置一个起始绘制绘制，算每个刻度的间距，然后依次绘制刻度、柱子、柱子上的数字。
* 6、画底部描述信息，canvas.restore() 恢复状态(挪回原点)，translate(width / 2, height - 20) 然后依次绘制小矩形和问题。

绘制效果如下：

基本还原了想要的效果，😏 接着搞点 **动画**，**CustomPainter** 本身是一个 **Listenable** 子类，支持通过 **repaint** 参数传入一个 **Listenable** 对象，该对象更新时会触发通知让 **CustomPainter** 进行重绘，相比起调 **State#setState()** 来完成画布刷新要高效多了。这里直接在 **State类** 中创建 **Animation对象** 传入，在计算柱子Y轴偏移时用上动画值即可轻松实现动画效果，核心代码如下：

运行看看效果：

👏 牛逼，so easy 啊，接着试试画其它图~

### 4.2. 折线图

😁 直接用柱形图的数据，然后一步步绘制【--->c29/d4/line\_chart.dart<---】

#### 4.2.1. 绘制虚线背景坐标系

两端箭头就不用说了，难点是这 **虚线** 怎么画？Flutter 并没有提供虚线绘制的API，😏 我们可以变通下用 **Path**实现 → **lineTo() 画一小段线** + **moveTo() 挪一段距离**，循环，最后绘制出的 Path 不就是虚线了，代码实现：

😀 这里其实还可以用 **PathMetric** + **extractPath()** 实现，**PathMetric** 在前面的 **Path API** 中有提到过它，用于表示 **路径的度量信息** (长度、是否闭合、切线等)，调用Path对象的 **computeMetrics()** 可以获得 **PathMetric的迭代器**，可以通过它遍历路径中的各个子路径 (如果有)。而 **extractPath()** 是 **PathMetric** 里的方法，用于**从原始路径中提取一段子路径**，它会根据你指定的 **起始偏移量(路径起点开始的距离)** 和 **结束偏移量**，从路径中提取 **特定范围的子路径** 返回。具体代码实现：

#### 4.2.2. 画线的三种方式

😐 依次为：**drawLine() 直接画**、**Path搞好再drawPath()** 和 **drawPoints() + PointMode.polygon** (将所有点按顺序连接成一个多边形)，一一实现，先通过 **比例** 的方式求出每个要绘制点的坐标存起来：

试试 **drawLine()** ：

运行效果：

接着是 **drawPath()** ：

同样轻松实现，再试试 **drawPoints()** ：

#### 4.2.3. 绘制曲线

🤔 哪该用哪种呢？个人倾向于 **drawPath()** ，在稍微复杂点的场景，另外两个就实现不了了，比如希望绘制的线是 **曲线**，又或者搞什么动画，另外两个根本没法做。Path 提供了一系列绘制曲线的方法，如：arcTo(弧)、arcToPoint(弧到点)、conicTo(有权二阶贝塞尔曲线)、quadraticBezierTo(二阶贝塞尔曲线)、cubicTo (三阶贝塞尔曲线) 等。这里的话使用 **cubicTo()** ，在通过多个数据点绘制平滑曲线时效果很好。😳 **两个控制点** 怎么算呢？把两点间的宽度划分为 **三等份**，按照如图所示的方式计算出两个控制点 (**注意升序和降序**)：

不难看出点的计算方式： **(起点x+1/3宽，起点y)** 和 **(起点x+2/3宽，终点y)** ，理解后直接写出绘制代码 (这里我使用的相对定位，有点不一样)

绘制效果：

👏 不错，非常圆滑的曲线~

#### 4.2.4. 加渐变填充

😀 看到很多曲线喜欢搞 **渐变** 填充，比如这样：

经过前面的学习，我们知道通过设置 **paint.shader = ui.Gradient.xxx()** 来实现颜色渐变，这里的话选择 **liner线性渐变**，颜色从上往下过渡：

运行看下效果：

出现非预期的结果是因为 **路径没有闭合**，连下线：最后一个点连X轴，然后连回起点：

闭合后，绘制就正常了：

颜色过渡好像不是很自然？搞多几个颜色就好了：

效果：

然后，发现一个BUG， **页面滚动** 会导致绘制超过边界：

打了下日志，发现滑动时 **CustomPainter#paint()** 会反复调用，明明 **shouldRepaint()** 返回的 **false**，也没 **super(repaint: repaint)** ，外层的 **LayoutBuilder#build()** 打了日志并没有触发刷新，那应该不是尺寸变化导致的，真的是奇了怪。感觉是绘制区域算错了 (超出了)，**CustomPainter** 中的绘制内容都会显示到屏幕上，就是出界也会画，一个解法就是调下 **canvas.clipRect()** 裁剪画布区域，使得绘制内容只在矩形区域内有效。

😳 另外还找到一个 **临时解法**：外层套一个「**RepaintBoundary** 」组件，它会创建一个新的绘制图层(Layer) 将其子节点的绘制隔离开来，从而避免不必要的重绘。试了下确实可以，但paint()方法还会调，后面定位到真正原因再来补充吧🤷‍♀️。

😑 另外，在搞 **线性渐变** 时理解错参数的意义，浪费了不少时间，也提醒下各位：

渐变的方向是从 **from** 指向 **to** 的 **向量方向！向量方向！向量方向！** 简单点说：**两个点连起来的线就是渐变的方向&范围**。

#### 4.2.5. 加点动画

😄 就那种线从左到右展示的动画，这种 **局部到全部过渡的动画**，用 **Canvas.clipXxx()** 来做超简单的~

运行效果：

> 💡 **Tips**：调用完 **canvas.save()** ，记得调 **restore()** 恢复画布哦~

### 4.3. 饼图

😊 也是很常见的统计图表，就画下微信公众号助手这个图吧【--->c29/d4/pie\_chart.dart<---】

没啥难点，就是按角度画弧，画一波 **实心圆+动画**：

😏 那 **空心圆** 呢？这就更简单了，直接在前面 **再绘制一个小圆**，后绘制的会盖住前面绘制的内容~

运行效果：

### 4.4. 蜘蛛/雷达图

😁 最后画多一个 **蜘蛛/雷达图** 作为本节的收尾案例，这图核心难点在于「**顶点坐标的计算**」用到一点初中 **三角函数** 的芝士🧀：正多边形的顶点都在其外接圆上，所以任意一个顶点坐标为： **(r \* cos(θ), r \* sin(θ))** ，不理解的看图就懂了【--->c29/d3/paint/regular\_polygon\_calculate.dart<---】

接着是绘制思路：

* 1、绘制五层多边形背景。
* 2、按照分数/100的百分比\*半径，算出每个点的坐标。
* 3、根据点坐标依次画点、连线、写分数、顶部加字。
* 4、绘制红色半透明背景填充。
* 5、加下clip动画。

具体代码可见【--->c29/d4/spider\_chart.dart<---】最终运行效果：

## 5. 小结

😛 花了好些天，总算把这篇写完了，把 **Flutter** 自定义绘制相关的API都写例子过了一遍，然后还实战写了几个图表，画图真的是太有意思了😆，相比起 **Android** 的自定义绘制简单多了，不用担心这个又得担心那个🤷‍♀️。下一节我们继续探索更多自定义绘制相关的姿势，比如：**手势处理**、**贝塞尔曲线应用**、**更复杂的图形绘制**等，敬请期待。有问题欢迎评论区留言，谢谢🙏~

本节示例代码：**示例源码**（已移除原文仓库链接）

**参考文献**：

* [《掘金小册：Flutter 绘制指南 - 妙笔生花》](https://s.juejin.cn/ds/iAqxJ6YJ/ "https://s.juejin.cn/ds/iAqxJ6YJ/")