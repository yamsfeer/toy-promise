const TPromise = require('./main')
const promiseAplusTests = require('promises-aplus-tests')

const adapter = {
  pending() {
    const result = {}
    result.promise = new TPromise((resolve, reject) => {
      result.fulfill = resolve
      result.reject = reject
    })
    return result
  }
}
promiseAplusTests(adapter)
