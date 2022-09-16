const Promise = require('./promise')
const promiseAplusTests = require('promises-aplus-tests')

const adapter = {
  pending() {
    const result = {}
    result.promise = new Promise((resolve, reject) => {
      result.fulfill = resolve
      result.reject = reject
    })
    return result
  }
}
promiseAplusTests(adapter)
