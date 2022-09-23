promise/A+ 规范的 promise ( 学习用 )。

安装：

```shell
npm i @yamstoy/toy-promise
```

使用：

```javascript
const TPromise = require('toy-promise')

const promise = new TPromise((resolve, reject) => {
  setTimeout(() => resolve('hello world'), 1000)
})
.then(value => console.log(value)) // 'hello world'
```

支持的方法：

```javascript
TPromise.prototype.then

TPromise.resolve
TPromise.reject

TPromise.prototype.catch
TPromise.prototype.finally

TPromise.all
TPromise.race
TPromise.any
TPromise.allSettled
```

代码测试相关命令：

```shell
npm run test # 执行开发时测试
npm run aplus # 测试 promise/A+ 规范
npm run coverage # 测试代码覆盖率
npm run coverageAplus # 只测试 promise/A+ 部分的代码覆盖率
```

执行测试代码覆盖率：

```shell
npm run coverage
```

代码覆盖率

```shell
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------|---------|----------|---------|---------|-------------------
All files |    99.1 |    95.45 |     100 |   99.09 |                   
 main.js  |    99.1 |    95.45 |     100 |   99.09 | 125               
----------|---------|----------|---------|---------|-------------------
```

