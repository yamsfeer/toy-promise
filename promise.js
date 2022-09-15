const PENDING = Symbol('pending')
const FULLFILLED = Symbol('fullfilled')
const REJECTED = Symbol('rejected')

class Promise {
  constructor(executor) {
    try {
      executor(this.resolve, this.reject)
    } catch (error) {
      this.reject(error)
    }
  }

  state = PENDING // 初始状态
  value = null // fullfill 的值
  reason = null // reject 的原因

  fullfillCbs = []
  rejectCbs = []

  // 用箭头函数绑定上下文，使其指向 promise
  resolve = (value) => {
    if (this.state !== PENDING) return

    this.state = FULLFILLED
    this.value = value

    // 清空 fullfill callback
    while (this.fullfillCbs.length) {
      this.fullfillCbs.shift()(value)
    }
  }
  reject = (reason) => {
    if (this.state !== PENDING) return

    this.state = REJECTED
    this.reason = reason

    // 清空 reject callback
    while (this.rejectCbs.length) {
      this.rejectCbs.shift()(reason)
    }
  }

  static resolvePromise(promise, x, resolve, reject) {
    if (promise === x) {
      return reject(new TypeError('chaining cycle detected for promise'))
    }
    x instanceof Promise
      ? x.then(resolve, reject) // then 函数中返回一个新的 promise
      : resolve(x) // 普通值
  }

  static defaultFullfill(value) {
    return value
  }
  static defaultReject(reason) {
    throw reason
  }

  then(onFullfill, onReject) {
    // 默认处理函数
    onFullfill = typeof onFullfill === 'function'
      ? onFullfill
      : Promise.defaultFullfill
    onReject = typeof onReject === 'function'
      ? onReject
      : Promise.defaultReject

    const promise = new Promise((resolve, reject) => {

      if (this.state === FULLFILLED) {
        queueMicrotask(() => {
          try {
            const x = onFullfill(this.value)
            Promise.resolvePromise(promise, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      }


      if (this.state === REJECTED) {
        queueMicrotask(() => {
          try {
            const x = onReject(this.reason)
            Promise.resolvePromise(promise, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      }


      if (this.state === PENDING) {
        const wrapOnFullfill = () => {
          queueMicrotask(() => {
            try {
              const x = onFullfill(this.value)
              Promise.resolvePromise(promise, x, resolve, reject)
            } catch (err) {
              reject(err)
            }
          })
        }
        const wrapOnReject = () => {
          queueMicrotask(() => {
            try {
              const x = onReject(this.reason)
              Promise.resolvePromise(promise, x, resolve, reject)
            } catch (err) {
              reject(err)
            }
          })
        }

        this.fullfillCbs.push(wrapOnFullfill)
        this.rejectCbs.push(wrapOnReject)
      }

    })

    return promise
  }

  /* 以下是 ES6 的一些方法，不属于 Promise/A+ 规范 */
  static resolve(target) {
    return target instanceof Promise
      ? target
      : new Promise(resolve => resolve(target))
  }
  static reject(target) {
    return target instanceof Promise
      ? target
      : new Promise((resolve, reject) => reject(target))
  }
  catch(onReject) {
    this.then(null, onReject)
  }
  finally() {}

  static all() {}
  static race() {}
  static allSettled() {}

}

module.exports = Promise
