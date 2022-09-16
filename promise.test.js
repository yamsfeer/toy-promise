const TPromise = require('./main')
const { assert } = require('chai')

describe('基本', () => {
  it('new', () => {
    const promise = new TPromise((resolve, reject) => {
      resolve('resolve')
      reject('reject')
    })

    assert.equal(promise instanceof TPromise, true)
  })

  it('then 获取 resolve 值', () => {
    new TPromise((resolve, reject) => {
      resolve('resolve')
      reject('reject')
    }).then(
      value => assert.equal(value, 'resolve'),
      reason => assert.equal(reason, 'reject'),
    )
  })

  it('then 获取 reject 值', () => {
    new TPromise((resolve, reject) => reject('reject'))
      .then(
        value => assert.equal(value, 'resolve'),
        reason => assert.equal(reason, 'reject'),
      )
  })
})

describe('异步逻辑', () => {
  it('异步 resolve', () => {
    new TPromise(resolve => setTimeout(() => resolve('resolve'), 100))
      .then(
        value => assert.equal(value, 'resolve'),
        reason => assert.equal(reason, 'reject'),
      )
  })

  it('异步 reject', () => {
    new TPromise((resolve, reject) => setTimeout(() => reject('reject'), 100))
      .then(
        value => assert.equal(value, 'resolve'),
        reason => assert.equal(reason, 'reject'),
      )
  })
})

describe('多个 then 函数', () => {
  it('then 函数添加多个回调', () => {
    const promise = new TPromise(resolve => {
      setTimeout(() => resolve('resolve'), 100)
    })

    const callbacks = []
    promise.then(value => callbacks.push(value))
    promise.then(value => callbacks.push(value))
    promise.then(value => callbacks.push(value))

    promise.then(() => assert.equal(callbacks.length, 3))
  })

  it('then 链式调用返回普通值', () => {
    new TPromise(resolve => 1)
      .then(value => {
        assert.equal(value, 1)
        return 2
      })
      .then(value => {
        assert.equal(value, 2)
      })
  })

  it('then 链式调用返回新 promise', () => {
    new TPromise(resolve => 1)
      .then(value => {
        assert.equal(value, 1)
        return new TPromise(resolve => resolve(2))
      })
      .then(value => {
        assert.equal(value, 2)
        return new TPromise(resolve => setTimeout(() => {
          resolve(new TPromise(resolve => resolve(3)))
        }, 100))
      })
      .then(value => assert.equal(value, 3))
  })

  it('then 链式调用返回 promise 本身', () => {
    const promise = new TPromise(resolve => 1)
      .then(value => {
        assert.equal(value, 1)
        return promise
      })
      .then(
        () => {},
        reason => assert.equal(reason, '2chaining cycle detected for promise')
      )
  })
})

describe('捕获错误', () => {
  it('执行器错误', () => {
    new TPromise(() => {
      throw new Error('executor error')
    })
      .then(
        () => {},
        reason => assert.equal(reason, 'executor error')
      )
  })

  it('then resolve 执行错误', () => {
    new TPromise(resolve => resolve(1))
      .then(() => { throw new Error('then resolve error')})
      .then(
        () => {},
        reason => assert.equal(reason, 'then resolve error')
      )
  })

  it('then reject 执行错误', () => {
    new TPromise(resolve => resolve(1))
      .then(
        () => {},
        () => { throw new Error('then reject error') }
      )
      .then(
        () => {},
        reason => assert.equal(reason, 'then reject error')
      )
  })
})

describe('默认处理函数', () => {
  it('默认 fullfill 处理函数', () => {
    new TPromise(resolve => resolve(1))
      .then()
      .then()
      .then(
        value => assert.equal(value, 1)
      )
  })
  it('默认 reject 处理函数', () => {
    new TPromise((resolve, reject) => reject('reject'))
      .then()
      .then()
      .then(
        null,
        reason => assert.equal(reason, reject)
      )
  })
})

describe('静态方法', () => {
  it('resolve 静态方法', () => {
    TPromise.resolve(1).then(value => assert.equal(value, 1))

    const promise = new TPromise(resolve => resolve(2))
    TPromise.resolve(promise).then(value => assert.equal(value, 2))
  })

  it('reject 静态方法', () => {
    TPromise.reject(1).then(
      null,
      value => assert.equal(value, 1)
    )

    const promise = new TPromise((resolve, reject) => reject(2))
    TPromise.reject(promise).then(
      null,
      value => assert.equal(value, 2)
    )
  })
})

describe('TPromise.all', () => {
  it('子 promise 都 resolved => 主 promise resolve', () => {
    let tmp = 'pending'
    const promises = [
      TPromise.resolve(1),
      new TPromise(resolve => setTimeout(() => resolve(2), 300)),
      new TPromise(resolve => setTimeout(() => {
        tmp = 'resolved'
        resolve(4)
      }, 300))
    ]
    TPromise.all(promises).then(() => assert.equal(tmp, 'resolved'))
  })
  it('子 promise 有任何 rejected => 主 promise 立即 rejected', () => {
    const promises = [
      TPromise.resolve(1),
      new TPromise(resolve => setTimeout(() => resolve(2), 300)),
      new TPromise((resolve, reject) => reject('rejected'))
    ]
    TPromise.all(promises).then(
      () => assert.equal(tmp, 'resolved'),
      reason => assert.equal(reason, 'rejected')
    )
  })
  it('resolve 结果与子 promise 传入时顺序相同', () => {
    const promises = [
      TPromise.resolve(1),
      new TPromise(resolve => setTimeout(() => resolve(2), 300)),
      3
    ]
    TPromise.all(promises)
      .then(arr => assert.equal(arr[2], 3))
  })
})

describe('TPromise.prototype.catch', () => {
  it('捕获错误', () => {
    new TPromise(resolve => { throw new Error('reject') })
      .then(() => { throw new Error('reject') })
      .catch(err => assert.equal(err, 'reject'))
  })
})
