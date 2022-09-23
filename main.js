const PENDING = Symbol('pending')
const FULFILLED = Symbol('fulfilled')
const REJECTED = Symbol('rejected')

function isThenable(p) {
  return (
    p !== null &&
    (typeof p === "object" || typeof p === "function") &&
    typeof p.then === "function"
  )
}


class TPromise {
  constructor(executor) {
    try {
      executor(this.resolve, this.reject)
    } catch (error) {
      this.reject(error)
    }
  }

  state = PENDING // 初始状态
  value = null // fulfill 的值
  reason = null // reject 的原因

  fulfillCbs = []
  rejectCbs = []

  // 用箭头函数绑定上下文，使其指向 promise
  resolve = (value) => {
    if (this.state !== PENDING) { // state 只能变化一次
      return
    }

    this.state = FULFILLED
    this.value = value

    // 清空 fulfill callback
    while (this.fulfillCbs.length) {
      this.fulfillCbs.shift()(value)
    }
  }

  reject = (reason) => {
    if (this.state !== PENDING) {
      return
    }

    this.state = REJECTED
    this.reason = reason

    // 清空 reject callback
    while (this.rejectCbs.length) {
      this.rejectCbs.shift()(reason)
    }
  }

  // promise2 = promise1.then(onFulfill, onReject)
  then(onFulfill, onReject) {
    // 默认处理函数
    onFulfill = typeof onFulfill === 'function'
      ? onFulfill
      : value => value
    onReject = typeof onReject === 'function'
      ? onReject
      : reason => { throw reason }

    const promise2 = new TPromise((resolve, reject) => {
      const fulfilledMicrotask = () => {
        queueMicrotask(() => {
          try {
            TPromise.resolvePromise(promise2, onFulfill(this.value), resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      }

      const rejectedMicrotask = () => {
        queueMicrotask(() => {
          try {
            TPromise.resolvePromise(promise2, onReject(this.reason), resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      }

      /* 判断 promise 的 state
         已经 fulfill 或 reject 的直接调用
         pending 时先保存，等 resolve 后调用 */
      if (this.state === FULFILLED) {
        fulfilledMicrotask()
      }

      if (this.state === REJECTED) {
        rejectedMicrotask()
      }

      if (this.state === PENDING) {
        this.fulfillCbs.push(fulfilledMicrotask)
        this.rejectCbs.push(rejectedMicrotask)
      }

    })

    return promise2 // 每个 then 函数都会返回新的 promise
  }

  /**
   *
   * @param {TPromise} promise2 then 函数返回的新 promise
   * @param {any} userReturn onFulfill 或 onReject 处理函数中用户代码的返回值，可能是一个新 promise 对象
   * @param {function} resolve promise2 的 resolve 函数，已用箭头函数绑定 this
   * @param {function} reject promise2 的 reject 函数，已用箭头函数绑定 this
   * @returns
   */
  static resolvePromise(promise2, userReturn, resolve, reject) {
    if (promise2 === userReturn) {
      /* then 处理函数中，用户代码返回自身会形成循环
         let promise2 = TPromise.resolve().then(() => promise2)
         然而事实上，这会报错：Cannot access 'promise' before initialization
         需要异步任务执行才可能发生这种情况 */
      return reject(new TypeError('chaining cycle detected for promise'))
    }

    userReturn instanceof TPromise || isThenable(userReturn)
      ? userReturn.then(resolve, reject) // then 函数中返回新的 promise，需要等这个 promise resolve
      : resolve(userReturn) // 普通值
  }

  /* 以下是 ES6 的一些方法，不属于 TPromise/A+ */
  static resolve(target) {
    return target instanceof TPromise
      ? target
      : new TPromise(resolve => resolve(target))
  }

  static reject(target) {
    return target instanceof TPromise
      ? target
      : new TPromise((resolve, reject) => reject(target))
  }

  // catch 是 then(null, rejection) 的别名，用于指定发生错误时的回调
  catch(onReject) {
    this.then(null, onReject)
  }

  // 不管 promise 最后状态如何都会执行
  finally(fn) {
    const p = TPromise.resolve(fn())
    return this.then(
      value => p.then(() => value),
      error => p.then(() => { throw error })
    )
  }

  // 所有子 promise 都 fulfill
  // 任意子 promise reject，即 reject
  static all(promises) {
    return new TPromise((resolve, reject) => {
      let result = []
      let count = 0
      let length = promises.length

      if (length === 0) {
        resolve(result)
      }

      promises.forEach((p, index) => {
        TPromise.resolve(p) // 防止数组中有非 promise
          .then(value => {
            result[index] = value // 与传入顺序相同，与 resolve 顺序无关
            count++

            if (count === length) { // 全部 fulfill，即 resolve
              resolve(result)
            }
          }, reason => reject(reason)) // 有任何 reject，即 reject
      })
    })
  }

  // 任意子 promise fulfill，即 resolve
  // 任意子 promise reject，即 reject
  static race(promises) {
    return new TPromise((resolve, reject) => {
      if (promises.length === 0) {
        return resolve()
      }

      promises.forEach(p => {
        TPromise.resolve(p) // 防止有非 promise
          .then(
            value => resolve(value), // 任一子 promise fulfill，即 resolve
            reason => reject(reason) // 任一子 promise reject，即 reject
          )
      });
    })
  }

  // 任一个 fulfil，即 resolve
  // 所有都 reject，才 reject
  static any(promises) {
    return new TPromise((resolve, reject) => {
      let count = 0
      let result = []
      let length = promises.length

      if (length === 0) {
        return resolve()
      }

      promises.forEach((p, index) => {
        TPromise.resolve(p)
          .then(
            value => resolve(value),
            reason => {
              result[index] = reason
              if (++count === length) {
                reject(result)
              }
            }
          )
      })
    })
  }

  // 所有子 promise 都 resolve，不管 fulfill 或 reject
  // 返回一个数组，数组元素结构为 { status: 'fulfilled', value: v } 或 { status: 'rejected', reason: error }
  // https://github.com/tc39/proposal-promise-allSettled
  static allSettled(proimises) {
    return new TPromise(resolve => { // 除非本身有错误，否则不会 reject
      let count = 0
      let result = []
      let length = proimises.length

      if (length === 0) {
        return resolve(result)
      }

      proimises.forEach((p, index) => {
        const onFulfill = value => {
          result[index] = {
            status: 'fulfilled',
            value
          }
          if (++count === length) {
            resolve(result)
          }
        }
        const onReject = reason => {
          result[index] = {
            status: 'rejected',
            reason
          }
          if (++count === length) {
            resolve(result)
          }
        }
        TPromise.resolve(p).then(onFulfill, onReject)
      })
    })
  }

}

module.exports = TPromise
