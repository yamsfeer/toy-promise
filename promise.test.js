const Promise = require('./promise')
const { assert } = require('chai')

describe('基本', () => {
  it('new', () => {
    const promise = new Promise((resolve, reject) => {
      resolve('resolve')
      reject('reject')
    })

    assert.equal(promise instanceof Promise, true)
  })

  it('then 获取 resolve 值', () => {
    new Promise((resolve, reject) => {
      resolve('resolve')
      reject('reject')
    }).then(
      value => assert.equal(value, 'resolve'),
      reason => assert.equal(reason, 'reject'),
    )
  })

  it('then 获取 reject 值', () => {
    new Promise((resolve, reject) => reject('reject'))
      .then(
        value => assert.equal(value, 'resolve'),
        reason => assert.equal(reason, 'reject'),
      )
  })
})

describe('异步逻辑', () => {
  it('异步 resolve', () => {
    new Promise(resolve => setTimeout(() => resolve('resolve'), 100))
      .then(
        value => assert.equal(value, 'resolve'),
        reason => assert.equal(reason, 'reject'),
      )
  })

  it('异步 reject', () => {
    new Promise((resolve, reject) => setTimeout(() => reject('reject'), 100))
      .then(
        value => assert.equal(value, 'resolve'),
        reason => assert.equal(reason, 'reject'),
      )
  })
})

describe('多个 then 函数', () => {
  it('then 函数添加多个回调', () => {
    const promise = new Promise(resolve => {
      setTimeout(() => resolve('resolve'), 100)
    })

    const callbacks = []
    promise.then(value => callbacks.push(value))
    promise.then(value => callbacks.push(value))
    promise.then(value => callbacks.push(value))

    promise.then(() => assert.equal(callbacks.length, 3))
  })

  it('then 链式调用返回普通值', () => {
    new Promise(resolve => 1)
      .then(value => {
        assert.equal(value, 1)
        return 2
      })
      .then(value => {
        assert.equal(value, 2)
      })
  })

  it('then 链式调用返回新 promise', () => {
    new Promise(resolve => 1)
      .then(value => {
        assert.equal(value, 1)
        return new Promise(resolve => resolve(2))
      })
      .then(value => {
        assert.equal(value, 2)
        return new Promise(resolve => setTimeout(() => {
          resolve(new Promise(resolve => resolve(3)))
        }, 100))
      })
      .then(value => assert.equal(value, 3))
  })

  it('then 链式调用返回 promise 本身', () => {
    const promise = new Promise(resolve => 1)
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
    new Promise(() => {
      throw new Error('executor error')
    })
      .then(
        () => {},
        reason => assert.equal(reason, 'executor error')
      )
  })

  it('then resolve 执行错误', () => {
    new Promise(resolve => resolve(1))
      .then(() => { throw new Error('then resolve error')})
      .then(
        () => {},
        reason => assert.equal(reason, 'then resolve error')
      )
  })

  it('then reject 执行错误', () => {
    new Promise(resolve => resolve(1))
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
    new Promise(resolve => resolve(1))
      .then()
      .then()
      .then(
        value => assert.equal(value, 1)
      )
  })
  it('默认 reject 处理函数', () => {
    new Promise((resolve, reject) => reject('reject'))
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
    Promise.resolve(1).then(value => assert.equal(value, 1))

    const promise = new Promise(resolve => resolve(2))
    Promise.resolve(promise).then(value => assert.equal(value, 2))
  })

  it('reject 静态方法', () => {
    Promise.reject(1).then(
      null,
      value => assert.equal(value, 1)
    )

    const promise = new Promise((resolve, reject) => reject(2))
    Promise.reject(promise).then(
      null,
      value => assert.equal(value, 2)
    )
  })
})

describe('catch 函数', () => {
  it('捕获错误', () => {
    new Promise(resolve => { throw new Error('reject') })
      .then(() => { throw new Error('reject') })
      // .catch(err => assert.equal(err, 'reje2ct'))
  })
})
