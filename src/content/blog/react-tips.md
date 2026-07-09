---
title: "React 技巧"
pubDate: 2024-01-15
description: "一些 React 开发中的技巧"
author: 'wxc'
tags: ["astro", "前端", "blogging", "教程"]
category: 'tech'
heroImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=630&fit=crop"
featured: true
---

## 1、遍历渲染

react数组循环，基本都会设置一个唯一的key，表格的对象数组循环一般没什么问题，数据基本都会有一个id。那有种情况就比较坑了，出现在表单形式的页面结构中，对某个数组进行增删改操作，一般对于非对象数组而言，没有id，可能很多人会偷懒，循环的时候，直接设置数组的下标index作为key，当出现增删改时候，就会出现数据对不上或者重新渲染组件的问题等。解决方案有很多种，例如把字符串数组等重组对象数组，每个元素设置一个唯一id等。另外有个方式：推荐使用[shortid](https://github.com/dylang/shortid)
生成唯一key的数组，和数据数组一起使用，省去提交数据时再重组数组。

``` tsx
import React from 'react';
import shortid from 'shortid';

class Demo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: ['a', 'b', 'c']
        }
        this.dataKeys = this.state.data.map(v => shortid.generate());
    }

    deleteOne = index => { // 删除操作
        const {data} = this.state;
        this.setState({data: data.filter((v, i) => i !== index)});
        this.dataKyes.splice(index, 1);
    }

    render() {
        return (
            <ul>
                {
                    data.map((v, i) =>
                        <li
                            onClick={i => this.deleteOne(i)}
                            key={this.dataKeys[i]}
                        >
                            {v}
                        </li>
                    )
                }
            </ul>
        )
    }
}
// 稍微抽取，可以封装一个通用的组件
```

## 2、元素是否显示

通过判断值是否存在来控制元素是否显示，一般三目运算可以达到此效果，最简单的还是用短路的写法：
``` jsx
// 不错
const flag = 'something';
flag && <div></div>

// 很好
// 注意一般可能上面写法多一些，但当flag为0 的时页面上会显示0，用!!将其转为boolean避免坑，
// 代码也更规范
const flag = 'something';
!!flag && <div></div>
```
## 3、使用组件，传递props
使用组件，传递props：

``` jsx
const { data, type, something } = this.state;

<Demo 

  data={data}

  type={type}

  something={something}

/>
```

也许另外一种传递方式更简洁：

``` jsx
const { data, type, something } = this.state;

<Demo 

  {...{ data, id, something }}

/>
```

## 4、组件传递props通过扩展运算符和解构赋值可以简化

组件的props有时候会定义很多，但是调用组件传递props的时候又想一个个传，不想一次性传递一个option对象，通过扩展运算符和解构赋值可以简化此操作：

``` jsx
const Demo = ({ prop1, prop2, prop3, ...restProps }) => (
    <div>
        xxxx
        { restProps.something }
    </div>
)
// 父组件使用Demo
<Demo
    prop1={xxx}
    prop2={xxx}
    something={xxx}
/>
```

## 5、 通过callback的方式改变state的值
一般改变state值的一种方式：

``` jsx
const { data } = this.state;
this.setState({ data: {...data, key: 1 } });
```

另外一种可以通过callback的方式改变state的值

``` jsx
this.setState(({ data }) => ({ data: {...data, key: 1 } }));
```

还可以：

``` jsx
this.setState((state, props) => {
    return { counter: state.counter + props.step };
});
```

希望在异步回调或闭包中获取最新状态并设置状态，此时获取的状态不是实时的，React 官方文档提到：组件内部的任何函数，包括事件处理函数和 Effect，都是从它被创建的那次渲染中被「看到」的，所以引用的值任然是旧的，最后导致 setState 出现异常：

## 6、创建弹层的三种方式
创建弹层的三种方式：

1. 普通组件通过state和样式控制，在当前组件中显示弹层-每次引入组件并且render里面控制显示，挂载节点在某组件里面

``` jsx
// 弹层 
const Dialog = () => <div>弹层</div>
// 某组件
render() {
    return (
        this.state.showDialog && <Dialog />
    )
}
```


2. 通过Portals创建通道，在根节点外部挂载组件-但还是需要每次引入并且在render里面调用

``` jsx
// 弹层 
class Dialog extends React.Component {
  constructor(props) {
    super(props);
    this.el = document.createElement('div');
  }
  componentDidMount() {
    modalRoot.appendChild(this.el);
  }
  componentWillUnmount() {
    modalRoot.removeChild(this.el);
  }

  render() {
    return ReactDOM.createPortal(
      this.props.children || <div>xxxx</div>,
      this.el,
    );
  }
}
// 某组件
render() {
    return (
        this.state.showDialog && <Dialog />
    )
}

```
3. 推荐使用ReactDom.render创建弹层-挂载根节点外层，使用也更方便

``` jsx 
// demo
let dialog;
class Dialog {
    show(children) {    // 显示
        this.div = document.createElement('div');
        document.body.appendChild(this.div);

        ReactDom.render(children || <div>xxxx</div>, this.div);
    }
    destroy() {     // 销毁
        ReactDom.unmountComponentAtNode(this.div);
        this.div.parentNode.removeChild(this.div);
    }
}
export default {
    show: function(children) {
        dialog = new Dialog();
        dialog.show(children);
    },
    hide: xxxxx
};
// 某组件
import Dialog from 'xxx';
alert = () => {
    Dialog.show(xxxx);
}
render() {
    return (
        <button onClick={this.alert}>点击弹层</button>
    )
}
```

## 7、 子组件改变父组件的state
子组件改变父组件的state方式有很多种，可以在父组件设置一个通用函数，类似：setParentState，通过子组件回调处理时，就可以更方便的统一处理：

```jsx
// 父组件
state = {
    data: {}
}
setParentState = obj => {
    this.setState(obj);
}
// 子组件
onClick = () => {
    this.props.setParentState({ data: xxx });
}
```
## 8、永远不要直接设置state的值
永远不要直接设置state的值：this.state.data = { a: 1 }。这个会导致几个问题： 1：组件不会重新渲染 2：shouldComponentUpdate(nextProps, nextState) 函数里面 this.state的值是已经改变了,和nextState的值相同。

举个栗子：

```jsx
// wrong
const { data } = this.state;
data.a = 1;     // 等价于this.state.data.a = 1;
this.setState({ data }); // shouldComponentUpdate里面观察到 this.state 和nextState的值是相同的
// 此时函数里面性能相关的优化是无效的

// correct  需要用到当前state值的写法
this.setState(state => ({ data: {...state.data, a: 1} }))
```
## 9、redux or mobx简单用法替代
#### Context是什么？

Context直译就是上下文，是 React 16.3.0开始提供的一个官方API，它无需通过props的方式就可以完成项目中由上而下及组件之间的数据传递和共享，即你也不用依赖任何第三方的状态数据插件库就可以完成这项工作任务。

官方推荐使用的情况是：当需要用到全局数据的时候，比如：主题，多语言制或者用户登录授权等等。 **==当然：==** 你无需这么死板，当需要用到多层级的组件数据传递或者复杂的数据共享场景也可以使用context api，也可以用来做缓存使用。

#### Context简单使用

```jsx
// 1.使用React.createContext创建context提供者Provider 和 context订阅者cunsomer

const {Provider, Consumer} = React.createContext(defaultValue); // defaultValue根据使用场景设置

// 2.设置Provider组件
// 一般包裹需要订阅的子组件的顶层父组件
// value设置需要传递和共享的数据以及改变数据的函数等
// 为了避免没必要的重绘和渲染，value的数据属性值通过组件state设置

<Provider value={/* some value */}>
    {/* some component with comsumer */}
</Provider>

// 3.设置Consumer组件
// 通过函数作为子元素的方式，订阅context的变换

<Consumer>
  {value => /* render something based on the context value */}
</Consumer>

// 组合Provider 和 Consumer即可大功告成

<ProviderComponent>
    <ConsumerComponent>{somechildren}</ConsumerComponent>
</ProviderComponent>

// 其他更多用法，比如生命周期函数调用（可点击上面demo查看），高阶组件等浏览一下文档即会，非常简单

```
## 10、 useReducer 是什么？
#### useReducer 是什么？

usereducer 是 useState的一个替代方案，用于维护状态；官方的解释是：对于拥有许多状态更新逻辑的组件来说，过于分散的事件处理程序可能会令人不知所措。对于这种情况，你可以将组件的所有状态更新逻辑整合到一个外部函数中，这个函数叫作 **reducer**。

```jsx
import { useReducer } from 'react';

function reducer(state, action) {
  // ...
}

function MyComponent() {
  const [state, dispatch] = useReducer(reducer, { age: 42 });
```

#### 参数

- `reducer`：用于更新 state 的纯函数。参数为 state 和 action，返回值是更新后的 state。state 与 action 可以是任意合法值。
- `initialArg`：用于初始化 state 的任意值。初始值的计算逻辑取决于接下来的 `init` 参数。
- **可选参数** `init`：用于计算初始值的函数。如果存在，使用 `init(initialArg)` 的执行结果作为初始值，否则使用 `initialArg`。

#### 返回值

`useReducer` 返回一个由两个值组成的数组：

1. 当前的 state。初次渲染时，它是 `init(initialArg)` 或 `initialArg` （如果没有 `init` 函数）。
2. [`dispatch`](https://zh-hans.react.dev/reference/react/useReducer##dispatch)[ 函数](https://zh-hans.react.dev/reference/react/useReducer#dispatch)。用于更新 state 并触发组件的重新渲染。

#### 注意事项

- `useReducer` 是一个 Hook，所以只能在 **组件的顶层作用域** 或自定义 Hook 中调用，而不能在循环或条件语句中调用。如果你有这种需求，可以创建一个新的组件，并把 state 移入其中。
- 严格模式下 React 会 **调用两次 reducer 和初始化函数**，这可以 [帮助你发现意外的副作用](https://zh-hans.react.dev/reference/react/useReducer#my-reducer-or-initializer-function-runs-twice)。这只是开发模式下的行为，并不会影响生产环境。只要 reducer 和初始化函数是纯函数（理应如此）就不会改变你的逻辑。其中一个调用结果会被忽略。

## 11、Hook 的闭包陷阱的成因和解决方案
index.tsx：



```jsx
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(<App />);

```

然后看这样一个组件，通过定时器不断的累加 count：

```jsx
import { useEffect, useState } from 'react';

function App() {

    const [count,setCount] = useState(0);

    useEffect(() => {
        setInterval(() => {
            console.log(count);
            setCount(count + 1);
        }, 1000);
    }, []);

    return <div>{count}</div>
}

export default App;

```

大家觉得这个 count 会每秒加 1 么？

不会。

可以看到，setCount 时拿到的 count 一直是 0:

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b65be16ef0a344dd80888d72c14c92c0~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=672&h=664&s=46868&e=png&b=ffffff)

为什么呢？

大家可能觉得，每次渲染都引用最新的 count，然后加 1，所以觉得没问题：

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8b009eefb31b43cd9ac592f512e77022~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=1310&h=702&s=59478&e=png&b=ffffff)

但是，现在 useEffect 的依赖数组是 []，也就是只会执行并保留第一次的 function。

而第一次的 function 引用了当时的 count，形成了闭包。

也就是实际上的执行是这样的：

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b55b6ba62e8e4f0a8bc9db726aae8a0d~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=1384&h=712&s=67579&e=png&b=fffefe)

这就导致了每次执行定时器的时候，都是在 count = 0 的基础上加一。

这就叫做 hook 的闭包陷阱。

### 第一种解法

那怎么解决这个问题呢？

不让它形成闭包不就行了？

这时候可以用 setState 的另一种参数：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ae5bd877c1064ae794e0cb7acb6444f8~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=772&h=640&s=83605&e=png&b=1f1f1f)

这次并没有形成闭包，每次的 count 都是参数传入的上一次的 state。

![](/images/bf98db9314104a3480fbb98bdd520bd0.awebp)

这样功能就正常了。

和用 setState 传入函数的方案类似，还可以用 useReducer 来解决。

因为它是 dispatch 一个 action，不直接引用 state，所以也不会形成闭包：

![](/images/2dd11775cf3f4f00b168baf4e9f848b1.awebp)

```jsx
import { Reducer, useEffect, useReducer } from "react";

interface Action {
    type: 'add' | 'minus',
    num: number
}

function reducer(state: number, action: Action) {

    switch(action.type) {
        case 'add':
            return state + action.num
        case 'minus': 
            return state - action.num
    }
    return state;
}

function App() {
    const [count, dispatch] = useReducer<Reducer<number, Action>>(reducer, 0);

    useEffect(() => {
        console.log(count);

        setInterval(() => {
            dispatch({ type: 'add', num: 1 })
        }, 1000);
    }, []);

    return <div>{count}</div>;
}

export default App;

```

![](/images/a631dbd862864eb2bdb467149e395b45.awebp)

思路和 setState 传入函数一样，所以算是一种解法。

### 第二种解法

但有的时候，是必须要用到 state 的，也就是肯定会形成闭包，

比如这里，console.log 的 count 就用到了外面的 count，形成了闭包，但又不能把它挪到 setState 里去写：

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/80ebcb21f71541c194da144776c2ceec~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=792&h=698&s=93154&e=png&b=1f1f1f)

这种情况怎么办呢？

还记得 useEffect 的依赖数组是干啥的么？

当依赖变动的时候，会重新执行 effect。

所以可以这样：

![](/images/effect1.awebp)

```jsx
import { useEffect, useState } from 'react';

function App() {

    const [count,setCount] = useState(0);

    useEffect(() => {
        console.log(count);

        const timer = setInterval(() => {
            setCount(count + 1);
        }, 1000);

        return () => {
            clearInterval(timer);
        }
    }, [count]);

    return <div>{count}</div>
}

export default App;

```

依赖数组加上了 count，这样 count 变化的时候重新执行 effect，那执行的函数引用的就是最新的 count 值。

![](/images/effect.awebp)

这种解法是能解决闭包陷阱的，但在这里并不合适，因为 effect 里跑的是定时器，每次都重新跑定时器，那定时器就不是每 1s 执行一次了。

### 第三种解法

有定时器不能重新跑 effect 函数，那怎么做呢？

可以用 useRef。

```jsx
import { useEffect, useState, useRef, useLayoutEffect } from 'react';

function App() {
    const [count, setCount] = useState(0);

    const updateCount = () => {
        setCount(count + 1);
    };
    const ref = useRef(updateCount);

    useLayoutEffect(() => {
        ref.current = updateCount;
    });

    useEffect(() => {
        const timer = setInterval(() => ref.current(), 1000);

        return () => {
            clearInterval(timer);
        }
    }, []);

    return <div>{count}</div>;
}

export default App;

```

通过 useRef 创建 ref 对象，保存执行的函数，每次渲染在 useLayoutEffect 里更新 ref.current 的值为最新函数。

这样，定时器执行的函数里就始终引用的是最新的 count。

useEffect 只跑一次，保证 setIntervel 不会重置，是每秒执行一次。

执行的函数是从 ref.current 取的，这个函数每次渲染都会更新，引用着最新的 count。

useLayoutEffect 是在渲染前同步执行的，用这个 hook 能确保在所有 useEffect 之前执行。

跑一下：

![照片！！！！](/images/useLayoutEffect.awebp)

功能正常。

讲 useRef 的时候说过，ref.current 的值改了不会触发重新渲染，

它就很适合这种保存渲染过程中的一些数据的场景。

其实定时器的这种处理是常见场景，我们可以把它封装一下：

```jsx  
import { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';

function useInterval(fn: Function, time: number) {
    const ref = useRef(fn);

    useLayoutEffect(() => {
        ref.current = fn;
    });

    let cleanUpFnRef = useRef<Function>();
    
    const clean = useCallback(() =>{
        cleanUpFnRef.current?.();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => ref.current(), time);

        cleanUpFnRef.current = ()=> {
            clearInterval(timer);
        }

        return clean;
    }, []);

    return clean;
}

function App() {
    const [count, setCount] = useState(0);

    const updateCount = () => {
        setCount(count + 1);
    };

    useInterval(updateCount, 1000);

    return <div>{count}</div>;
}

export default App;


```

这里我们封装了个 useInterval 的函数，传入 fn 和 time，里面会用 useRef 保存并更新每次的函数。

通过 useEffect 来跑定时器，依赖数组为 []，确保定时器只跑一次。

在 useEffect 里返回 clean 函数在组件销毁的时候自动调用来清理定时器。

useInterval 返回 clean 函数是让调用者可以手动清理定时器。

那为什么要用 useCallback 包裹 clean 函数呢？

因为返回的 clean 函数可能是作为参数传入其它组件，这个组件可能是用 memo 包裹的，所以我们内部做了这个，调用者就不用再包一层 useCallback。

这种就叫做自定义 hook，它就是普通的函数封装，没啥区别。

这样，组件里就可以直接用 useInterval 这个自定义 hook，不用每次都 useRef + useEffect 了。


