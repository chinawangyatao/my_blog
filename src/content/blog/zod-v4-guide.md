---
title: "Zod v4 使用指南：数据验证核心功能"
pubDate: 2026-07-10
description: "基于 Zod v4 版本，涵盖 Schema 定义、类型推导、对象/数组/联合类型、转换、自定义验证、错误处理及 v4 新功能的完整指南。"
author: wxc
tags: ["zod", "typescript", "schema", "validation", "前端"]
category: 'tech'
heroImage: '/images/zod_image.jpeg'
---

> 本文基于 Zod v4 版本撰写。Zod 4 于 2025 年发布，带来了显著的性能提升、更小的 bundle size，以及多项新功能如内建 JSON Schema 转换、递归对象支持等。

## 基本用法

### 定义 Schema

“Schema”是 Zod 的核心概念，它同时扮演两个角色：执行期验证器与编译期类型定义。

传统的 TypeScript 开发中，通常需要分别维护两套定义：一套是 TypeScript 的 interface 或 type 用于编译期类型检查，另一套是执行期的验证逻辑（如手写的 if 判断或使用其他验证库）。这种分离带来同步问题——当数据结构改变时，必须同时更新两个地方，否则就会生成类型定义与实际验证逻辑不一致的 bug。

Zod 采用“单一来源”（Single Source of Truth）的设计理念来解决这个问题。只需要定义一次 schema，Zod 就会同时提供：

1. **执行期验证**：在程式运行时检查数据是否符合预期结构
2. **编译期类型**：通过 `z.infer` 自动推导出对应的 TypeScript 类型

修改 schema 时，类型定义会自动跟着改变，不需要手动同步，从根本上消除了类型与验证逻辑不同步的风险。

```ts
import { z } from "zod";

const UserSchema = z.object({
  username: z.string(),
  age: z.number(),
});
```

### 解析数据 (parse)

使用 `.parse()` 验证数据。验证成功时会返回一个经过验证的深层复制数据，这确保了原始数据不会被意外修改，同时也让 TypeScript 能够正确推导出返回值的类型。

```ts
const user = UserSchema.parse({ username: "john", age: 25 });
// => { username: "john", age: 25 }

// 验证失败会抛出 ZodError
UserSchema.parse({ username: 123, age: "25" }); // throws ZodError
```

### 安全解析 (safeParse)

相较于 `.parse()` 会抛出异常，`.safeParse()` 返回一个 discriminated union，可以用 `if/else` 处理成功与失败的情况，不需要 `try/catch`。在表单验证或 API 输入处理时，通常会选择 `.safeParse()`，因为验证失败是预期中的情况，不应该用异常来处理。

```ts
const result = UserSchema.safeParse({ username: "john", age: 25 });

if (!result.success) {
  console.log(result.error); // ZodError
} else {
  console.log(result.data); // { username: string; age: number }
}
```

### 异步解析

当 schema 包含异步操作（如 async refinements 或 async transforms）时，必须使用异步版本的解析方法。常见的应用场景包括：验证 email 是否已被注册、检查用户名称是否可用等需要查询数据库的情况。

```ts
await UserSchema.parseAsync(data);
await UserSchema.safeParseAsync(data);
```

### 类型推导 (Type Inference)

Zod 最强大的特性之一是能够从 schema 自动推导出 TypeScript 类型。只需要定义一次 schema，就能同时获得执行期验证和编译期类型检查。

```ts
const UserSchema = z.object({
  username: z.string(),
  age: z.number(),
});

// 使用 z.infer 提取类型
type User = z.infer<typeof UserSchema>;
// => { username: string; age: number }

// 现在可以在任何地方使用这个类型
const user: User = { username: "john", age: 25 };
```

当 schema 包含转换逻辑时，输入与输出类型可能不同。Zod 提供了 `z.input` 和 `z.output` 来分别提取这两种类型：

```ts
const schema = z.string().transform((val) => val.length);

type SchemaInput = z.input<typeof schema>;  // string
type SchemaOutput = z.output<typeof schema>; // number (等同于 z.infer)
```

## 原始类型 (Primitives)

Zod 提供了对应 JavaScript 所有原始类型的 schema。这些是建构更复杂 schema 的基础组件。

```ts
// 基本类型
z.string();
z.number();
z.bigint();
z.boolean();
z.date();
z.symbol();

// 空值类型
z.undefined();
z.null();
z.void(); // 接受 undefined

// 万用类型
z.any();
z.unknown();

// Never 类型
z.never();
```

## 字面量 (Literals)

字面量 schema 用于验证特定的固定值，常用于建构 discriminated union 或定义常数类型。

```ts
const tuna = z.literal("tuna");
const twelve = z.literal(12);
const isTrue = z.literal(true);

// 取得字面量
tuna.value; // "tuna"
```

## 字串验证 (Strings)

字串是最常见的验证对象。Zod 提供了丰富的内建验证方法，涵盖长度限制、格式验证、内容检查等常见需求。

### 长度与内容验证

```ts
z.string().min(5);                    // 最少 5 字符
z.string().max(10);                   // 最多 10 字符
z.string().length(5);                 // 刚好 5 字符
z.string().regex(/^[a-z]+$/);         // 正则表达式
z.string().includes("hello");         // 包含子字串
z.string().startsWith("https://");    // 以特定字串开头
z.string().endsWith(".com");          // 以特定字串结尾
```

### 格式验证

Zod 内建了许多常见格式的验证器。在 v4 中，这些格式验证也被提升为顶层函数，提供更好的 tree-shaking 支持。

```ts
// 常用格式
z.string().email();                   // Email 格式
z.string().url();                     // URL 格式
z.string().uuid();                    // UUID 格式
z.string().ip();                      // IPv4 或 IPv6

// 标识符格式
z.string().nanoid();
z.string().cuid();
z.string().cuid2();
z.string().ulid();

// 日期时间格式
z.string().datetime();                // ISO 8601 完整格式
z.string().date();                    // YYYY-MM-DD
z.string().time();                    // HH:mm:ss

// 编码格式
z.string().base64();
```

### 字串转换

这些方法会在验证过程中转换字串，输出的值会是转换后的结果。例如，使用 `.trim()` 可以自动去除用户输入的前后空白，避免因为多余空白导致的验证失败或数据不一致。

```ts
z.string().trim();                    // 去除前后空白
z.string().toLowerCase();             // 转小写
z.string().toUpperCase();             // 转大写
```

### 自定义错误消息

良好的错误消息对用户体验至关重要。Zod 允许为每个验证规则指定自定义消息。

```ts
z.string().min(5, { message: "至少需要 5 个字符" });
z.string().email({ message: "无效的 Email 格式" });
z.string().url({ message: "无效的 URL" });
```

## 数字验证 (Numbers)

数字验证涵盖范围检查、整数验证、正负数限制等常见需求。

```ts
// 范围验证
z.number().gt(5);                     // > 5
z.number().gte(5);                    // >= 5 (别名: .min(5))
z.number().lt(5);                     // < 5
z.number().lte(5);                    // <= 5 (别名: .max(5))

// 整数与正负数
z.number().int();                     // 整数
z.number().positive();                // > 0
z.number().nonnegative();             // >= 0
z.number().negative();                // < 0
z.number().nonpositive();             // <= 0

// 其他验证
z.number().multipleOf(5);             // 5 的倍数 (别名: .step(5))
z.number().finite();                  // 有限数（非 Infinity）
z.number().safe();                    // 安全整数范围
```

自定义错误消息：

```ts
z.number().lte(100, { message: "数值不能超过 100" });
```

## 对象 (Objects)

对象是 Zod 中最常用的复合类型。Zod 提供了丰富的对象操作方法，可以灵活地组合、修改和重用 schema。

### 基本定义

```ts
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

type User = z.infer<typeof UserSchema>;
// => { name: string; age: number }
```

### 扩展 (extend)

`.extend()` 是扩展对象 schema 的推荐方式。它可以新增属性，也可以覆盖现有属性的 schema。相较于 `z.intersection()`，使用 `.extend()` 返回的仍然是 `ZodObject`，保留了所有对象方法如 `.pick()`、`.omit()` 等。

```ts
const UserWithEmail = UserSchema.extend({
  email: z.string().email(),
});
```

### 合并 (merge)

`.merge()` 用于合并两个独立的 object schema。当两个 schema 有相同的 key 时，第二个 schema 的定义会覆盖第一个。

```ts
const BaseUser = z.object({ name: z.string() });
const WithAge = z.object({ age: z.number() });

const User = BaseUser.merge(WithAge);
// => { name: string; age: number }
```

### 选取 (pick) 与省略 (omit)

这两个方法灵感来自 TypeScript 的 `Pick` 和 `Omit` 工具类型，可以从现有 schema 建立子集。举例来说，假设有一个完整的 User schema 包含 `id`、`name`、`email`、`passwordHash` 等字段，但在返回给前端时只想暴露 `id`、`name`、`email`，这时就可以用 `.omit({ passwordHash: true })` 来建立一个安全的公开版本。

```ts
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

// 只保留指定属性
const NameOnly = UserSchema.pick({ name: true });
// => { name: string }

// 移除指定属性
const WithoutId = UserSchema.omit({ id: true });
// => { name: string; email: string }
```

### 部分可选 (partial)

`.partial()` 将所有属性变为可选，类似 TypeScript 的 `Partial<T>`。这个方法常用于 PATCH API 的输入验证——用户可能只想更新 `name` 而不动 `email`，此时所有字段都应该是可选的。

```ts
const PartialUser = UserSchema.partial();
// => { id?: string; name?: string; email?: string }

// 只将部分属性变为可选
const PartialName = UserSchema.partial({ name: true });
// => { id: string; name?: string; email: string }
```

### 深层部分可选 (deepPartial)

当对象包含嵌套结构时，`.deepPartial()` 会递归地将所有层级的属性都变为可选。

```ts
const user = z.object({
  name: z.string(),
  address: z.object({
    city: z.string(),
    country: z.string(),
  }),
});

const deepPartialUser = user.deepPartial();
/*
{
  name?: string;
  address?: {
    city?: string;
    country?: string;
  }
}
*/
```

### 必填 (required)

`.required()` 是 `.partial()` 的反向操作，将所有可选属性变为必填。

```ts
const RequiredUser = PartialUser.required();
```

### 未知键处理

Zod 默认会忽略（strip）未定义的键。这是一个重要的安全特性，可以防止意外的数据注入。可以根据需求调整这个行为：

```ts
// 默认：忽略未知键（推荐用于 API 输入）
const user = z.object({ name: z.string() });
user.parse({ name: "john", extra: "ignored" }); // => { name: "john" }

// 严格模式：拒绝未知键（适合需要精确控制的场景）
const strictUser = z.object({ name: z.string() }).strict();
strictUser.parse({ name: "john", extra: "error" }); // throws ZodError

// 保留未知键（适合需要透传数据的场景）
const looseUser = z.object({ name: z.string() }).passthrough();
looseUser.parse({ name: "john", extra: "kept" });
// => { name: "john", extra: "kept" }
```

## 数组 (Arrays)

### 基本定义

Zod 提供两种等价的语法来定义数组 schema。选择哪种主要是风格偏好，但 `.array()` 方法在链式调用时更为简洁。

```ts
const StringArray = z.array(z.string());
// 或
const StringArray = z.string().array();

type StringArray = z.infer<typeof StringArray>; // string[]
```

### 数组验证

```ts
z.array(z.string()).min(1);           // 至少 1 个元素
z.array(z.string()).max(10);          // 最多 10 个元素
z.array(z.string()).length(5);        // 刚好 5 个元素
z.array(z.string()).nonempty();       // 非空数组
```

### 元素存取

通过 `.element` 属性可以取得数组元素的 schema，在需要动态操作 schema 时很有用。

```ts
const schema = z.array(z.string());
schema.element; // z.string()
```

## 元组 (Tuples)

元组用于表示固定长度且每个位置有特定类型的数组。这与 TypeScript 的 tuple 类型完全对应，适合用于表示如座标 `[x, y]`、RGB 值 `[r, g, b]` 等结构化数据。

```ts
const athleteSchema = z.tuple([
  z.string(),  // name
  z.number(),  // jersey number
  z.object({ pointsScored: z.number() }),
]);

type Athlete = z.infer<typeof athleteSchema>;
// => [string, number, { pointsScored: number }]
```

### 可变长度元组

使用 `.rest()` 可以定义可变长度的元组，类似 TypeScript 的 rest element。

```ts
const variadicTuple = z.tuple([z.string()]).rest(z.number());
// => [string, ...number[]]

variadicTuple.parse(["hello", 1, 2, 3]); // ✅
```

## 联合类型 (Unions)

### 基本联合

联合类型表示“多种类型之一”。Zod 会依序尝试每个选项，返回第一个成功的结果。

```ts
const stringOrNumber = z.union([z.string(), z.number()]);
// 或使用更简洁的语法
const stringOrNumber = z.string().or(z.number());

type StringOrNumber = z.infer<typeof stringOrNumber>; // string | number
```

### 区分联合 (Discriminated Union)

当对象有共同的“区分键”（discriminator）时，使用 `z.discriminatedUnion()` 可以获得显著的性能提升和更精确的错误消息。Zod 会先检查区分键的值，然后只验证对应的 schema，而不是逐一尝试所有选项。

常见的使用场景包括 API 响应、状态机、Redux actions 等。

```ts
const ResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.string() }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);

type Result = z.infer<typeof ResultSchema>;
// => { status: "success"; data: string } | { status: "error"; message: string }

ResultSchema.parse({ status: "success", data: "hello" }); // ✅
```

## 记录 (Records)

`z.record()` 用于验证具有动态键的对象，对应 TypeScript 的 `Record<K, V>` 类型。当事先不知道对象会有哪些 key，但知道所有 value 都应该是某种类型时，就适合使用 `z.record()`。例如：用户 ID 对应用户数据的 mapping、配置文件的 key-value 结构等。

```ts
const UserMap = z.record(z.string(), z.number());
type UserMap = z.infer<typeof UserMap>; // Record<string, number>

UserMap.parse({ alice: 25, bob: 30 }); // ✅
```

## 集合 (Sets) 与映射 (Maps)

Zod 也支持 JavaScript 的 `Set` 和 `Map` 数据结构。

```ts
// Set
const NumberSet = z.set(z.number());
type NumberSet = z.infer<typeof NumberSet>; // Set<number>

// Map
const UserMap = z.map(z.string(), z.number());
type UserMap = z.infer<typeof UserMap>; // Map<string, number>
```

## 枚举 (Enums)

### Zod Enum

`z.enum()` 建立一个字串字面量的联合类型。它提供了 `.enum` 属性用于存取值（支持自动完成），以及 `.options` 属性取得所有选项的数组。

```ts
const FishEnum = z.enum(["Salmon", "Tuna", "Trout"]);
type Fish = z.infer<typeof FishEnum>; // "Salmon" | "Tuna" | "Trout"

// 存取枚举值（有自动完成）
FishEnum.enum.Salmon; // "Salmon"
FishEnum.options; // ["Salmon", "Tuna", "Trout"]
```

### Native Enum

如果已经有 TypeScript 原生 enum，可以使用 `z.nativeEnum()` 来建立对应的 schema。

```ts
enum Fruits {
  Apple = "apple",
  Banana = "banana",
}

const FruitEnum = z.nativeEnum(Fruits);
type Fruit = z.infer<typeof FruitEnum>; // Fruits

FruitEnum.parse("apple"); // ✅
FruitEnum.parse(Fruits.Apple); // ✅
```

## 可选与可空 (Optional & Nullable)

这三个修饰符处理 JavaScript 中常见的“空值”情况。理解它们的差异对于正确建模 API 和数据库字段至关重要。

```ts
// Optional: 允许 undefined（适合可省略的字段）
const optionalString = z.string().optional();
type OptionalString = z.infer<typeof optionalString>; // string | undefined

// Nullable: 允许 null（适合数据库的 nullable 字段）
const nullableString = z.string().nullable();
type NullableString = z.infer<typeof nullableString>; // string | null

// Nullish: 允许 undefined 和 null（最宽松的空值处理）
const nullishString = z.string().nullish();
type NullishString = z.infer<typeof nullishString>; // string | null | undefined
```

### 顺序影响类型

修饰符的顺序会影响最终的类型。这是一个常见的陷阱，需要特别注意。

```ts
z.string().optional().array(); // (string | undefined)[]
z.string().array().optional(); // string[] | undefined
```

### 取得内部 Schema

使用 `.unwrap()` 可以取得被包装的原始 schema。

```ts
const optionalString = z.string().optional();
optionalString.unwrap(); // z.string()
```

## 类型强制转换 (Coercion)

`z.coerce` 系列方法会在验证前自动将输入值转换为目标类型。在处理表单数据、URL 参数、环境变量时，所有值都会是字串，这时就需要用 `z.coerce` 来转换类型。

```ts
z.coerce.string();    // String(input)
z.coerce.number();    // Number(input)
z.coerce.boolean();   // Boolean(input)
z.coerce.bigint();    // BigInt(input)
z.coerce.date();      // new Date(input)

const schema = z.coerce.number();
schema.parse("42");   // => 42
schema.parse(true);   // => 1
```

> **⚠️ 警告**
>
> `z.coerce.boolean()` 使用 JavaScript 的 `Boolean()` 转换，可能不符合预期。任何 truthy 值都会变成 `true`，包括字串 `"false"`：
>
> ```ts
> z.coerce.boolean().parse("false"); // => true (非空字串是 truthy)
> z.coerce.boolean().parse(0);       // => false
> ```
>
> 如果需要将字串 `"true"`/`"false"` 转换为布尔值，应该使用 `z.stringbool()` 或自定义 transform。

## 转换 (Transforms)

Transform 可以在验证过程中转换数据。常见的应用包括：数据标准化、格式转换、计算衍生值等。

### 基本转换

```ts
const schema = z.string().transform((val) => val.length);

type Input = z.input<typeof schema>;   // string
type Output = z.output<typeof schema>; // number

schema.parse("hello"); // => 5
```

### 转换中验证

Transform 函数可以接收第二个参数 `ctx`（context），这是一个包含 `addIssue()` 方法的对象，可以在转换过程中新增验证错误。这种模式常用于需要同时验证和转换的复杂场景。

```ts
const numberInString = z.string().transform((val, ctx) => {
  const parsed = parseInt(val);
  if (isNaN(parsed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Not a number",
    });
    return z.NEVER; // 特殊符号，表示提前结束
  }
  return parsed;
});

numberInString.parse("42");    // => 42
numberInString.parse("hello"); // throws ZodError
```

### 预处理 (Preprocess)

`z.preprocess()` 在验证之前执行转换。这与 `.transform()` 不同，后者是在验证之后执行。Preprocess 适合用于在验证前清理或标准化输入。

```ts
const castToString = z.preprocess((val) => String(val), z.string());
castToString.parse(123); // => "123"
```

## 自定义验证 (Refinements)

当内建的验证方法无法满足需求时，可以使用 refinement 新增自定义验证逻辑。

### refine

`.refine()` 是最常用的自定义验证方法。它接收一个返回布尔值的函数，若返回 `false` 则验证失败。

```ts
const nonEmptyString = z.string().refine((val) => val.length > 0, {
  message: "String cannot be empty",
});

// 对象层级验证：跨字段验证
const passwordForm = z
  .object({
    password: z.string(),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"], // 指定错误应该显示在哪个字段
  });
```

### superRefine

当需要更细致的控制时，使用 `.superRefine()`。它接收一个包含 `ctx`（context）参数的函数，`ctx.addIssue()` 可以新增多个错误，并指定不同的错误代码。

```ts
const uniqueArray = z.array(z.string()).superRefine((val, ctx) => {
  if (val.length > 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: 3,
      type: "array",
      inclusive: true,
      message: "Too many items",
    });
  }

  if (val.length !== new Set(val).size) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "No duplicates allowed",
    });
  }
});
```

## 错误处理 (Error Handling)

良好的错误处理是用户体验的关键。Zod 提供了结构化的错误信息，可以精确地向用户回报问题。

### ZodError 结构

`ZodError` 包含一个 `issues` 数组，每个 issue 都有详细的错误信息，包括错误代码、预期类型、实际类型、路径和消息。

```ts
try {
  UserSchema.parse({ username: 42, age: "25" });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.issues);
    /*
    [
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['username'],
        message: 'Expected string, received number'
      },
      {
        code: 'invalid_type',
        expected: 'number',
        received: 'string',
        path: ['age'],
        message: 'Expected number, received string'
      }
    ]
    */
  }
}
```

### 格式化错误 (format)

`.format()` 将错误转换为嵌套对象结构，方便与 UI 组件集成。每个字段的错误都放在 `_errors` 数组中。

```ts
const result = UserSchema.safeParse({ username: 42 });

if (!result.success) {
  const formatted = result.error.format();
  /*
  {
    username: { _errors: ['Expected string, received number'] }
  }
  */

  formatted.username?._errors; // ['Expected string, received number']
}
```

### 扁平化错误 (flatten)

`.flatten()` 将错误转换为更简单的两层结构，适合表单验证场景。`formErrors` 包含顶层错误，`fieldErrors` 包含各字段的错误。

```ts
const result = UserSchema.safeParse({ username: 42 });

if (!result.success) {
  const flattened = result.error.flatten();
  /*
  {
    formErrors: [],
    fieldErrors: {
      username: ['Expected string, received number']
    }
  }
  */
}
```

### 自定义错误消息

Zod 提供多种方式自定义错误消息，从简单的字串到能够存取错误详情的函数。

```ts
// 直接传入消息
z.string().min(5, "至少需要 5 个字符");

// 使用对象
z.string().min(5, { message: "至少需要 5 个字符" });

// 使用函数（可存取错误详情）
z.string().min(5, {
  error: (issue) => `至少需要 ${issue.minimum} 个字符`,
});
```

## 只读 (Readonly)

`.readonly()` 将 schema 的推导类型标记为只读，这有助于在编译期防止意外的数据修改。

```ts
z.object({ name: z.string() }).readonly();
// => { readonly name: string }

z.array(z.string()).readonly();
// => readonly string[]

z.tuple([z.string(), z.number()]).readonly();
// => readonly [string, number]

z.map(z.string(), z.date()).readonly();
// => ReadonlyMap<string, Date>

z.set(z.string()).readonly();
// => ReadonlySet<string>
```

## 默认值 (Default)

`.default()` 可以为 `undefined` 输入提供默认值。当输入为 `undefined` 时，Zod 会使用指定的默认值；若输入有值，则使用输入值。

```ts
const stringWithDefault = z.string().default("hello");

stringWithDefault.parse(undefined); // => "hello"
stringWithDefault.parse("world");   // => "world"
```

## Zod v4 新功能

Zod v4 带来了多项重要的改进和新功能。

### 内建 JSON Schema 转换

v4 新增了 `z.toJSONSchema()` 方法，可以将 Zod schema 转换为 JSON Schema 格式。这让 Zod schema 可以直接生成 API 文件或与 OpenAPI 集成。

```ts
const mySchema = z.object({
  name: z.string(),
  age: z.number(),
});

z.toJSONSchema(mySchema);
// => {
//   type: "object",
//   properties: {
//     name: { type: "string" },
//     age: { type: "number" },
//   },
//   required: ["name", "age"],
// }
```

### 递归对象支持

v4 正式支持递归对象类型，使用 getter 语法定义自我引用的 schema。

```ts
const User = z.object({
  name: z.string(),
  get friend() {
    return User; // 递归引用
  },
});
```

## Schema 设计最佳实践

### 使用 extend 而非 intersection

当需要扩展对象 schema 时，优先使用 `.extend()` 而非 `z.intersection()`。`.extend()` 返回的是 `ZodObject`，保留了所有对象方法；而 `z.intersection()` 返回的是 `ZodIntersection`，缺少 `.pick()`、`.omit()` 等方法。

```ts
// ✅ 推荐
const ExtendedUser = BaseUser.extend({ email: z.string() });

// ❌ 不推荐
const ExtendedUser = z.intersection(BaseUser, z.object({ email: z.string() }));
```

### 善用 Discriminated Union

当处理多种可能的对象结构时，如果它们有共同的区分键，使用 `z.discriminatedUnion()` 可以获得更好的性能和错误消息。

```ts
// ✅ 推荐：使用 discriminatedUnion
const Result = z.discriminatedUnion("type", [
  z.object({ type: z.literal("success"), data: z.string() }),
  z.object({ type: z.literal("error"), code: z.number() }),
]);

// ❌ 性能较差：使用一般 union
const Result = z.union([
  z.object({ type: z.literal("success"), data: z.string() }),
  z.object({ type: z.literal("error"), code: z.number() }),
]);
```

### Schema 重用与组合

将常用的 schema 抽取为独立的定义，然后通过组合来建构更复杂的 schema。这不仅提高了可维护性，也确保了类型的一致性。

```ts
// 定义基础 schema
const EmailSchema = z.string().email();
const PasswordSchema = z.string().min(8);
const TimestampSchema = z.string().datetime();

// 组合使用
const UserSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  createdAt: TimestampSchema,
});
```

## 实用示例

### API Response 验证

在前端验证 API 响应，确保数据符合预期结构，并获得完整的类型安全。

```ts
const ApiResponseSchema = z.object({
  status: z.enum(["success", "error"]),
  data: z.object({
    users: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1),
        email: z.string().email(),
        createdAt: z.string().datetime(),
      })
    ),
  }),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
  }),
});

type ApiResponse = z.infer<typeof ApiResponseSchema>;

// 使用示例
const response = await fetch("/api/users");
const json = await response.json();

const result = ApiResponseSchema.safeParse(json);
if (result.success) {
  console.log(result.data.data.users[0].name); // string
  console.log(result.data.meta.total);         // number
} else {
  console.log(result.error.flatten());
  // { formErrors: [], fieldErrors: { ... } }
}
```

### 表单验证

结合 React Hook Form 等表单库使用，提供即时的表单验证。

```ts
const LoginFormSchema = z.object({
  email: z.string().email("请输入有效的 Email"),
  password: z.string().min(8, "密码至少需要 8 个字符"),
  rememberMe: z.boolean().default(false),
});

// 使用示例
const formData = { email: "test@example.com", password: "12345678" };
const result = LoginFormSchema.safeParse(formData);

if (result.success) {
  console.log(result.data);
  // { email: "test@example.com", password: "12345678", rememberMe: false }
} else {
  console.log(result.error.flatten().fieldErrors);
  // { email: ["请输入有效的 Email"], password: ["密码至少需要 8 个字符"] }
}

// 跨字段验证示例
const RegisterFormSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "密码不一致",
    path: ["confirmPassword"],
  });

const registerResult = RegisterFormSchema.safeParse({
  email: "test@example.com",
  password: "12345678",
  confirmPassword: "87654321",
});

console.log(registerResult.error?.flatten().fieldErrors);
// { confirmPassword: ["密码不一致"] }
```

### 环境变量验证

在应用程序启动时验证环境变量，确保所有必要的配置都已正确配置。这是一个常见且重要的 Zod 使用场景。

```ts
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
});

// 在应用程序启动时验证
const env = EnvSchema.parse(process.env);

// 现在 env 是完全类型安全的
console.log(env.PORT); // number
```

### 递归 JSON 验证

验证任意 JSON 数据结构，这是一个展示 Zod 递归能力的经典示例。

```ts
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];

const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);

// 使用示例
const data = { nested: { data: [1, "two", true] } };
const result = jsonSchema.parse(data);
console.log(result);
// { nested: { data: [1, "two", true] } }

// 验证失败示例（函数不是合法的 JSON）
const invalid = { fn: () => {} };
jsonSchema.parse(invalid); // throws ZodError
```
