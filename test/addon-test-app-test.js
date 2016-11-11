const path = require('path')
const request = require('request-promise')
const expect = require('chai').expect

const AppTester = require('../src/app-tester')

describe('AddonTestApp', function() {
  let appTester

  before(() => {
    appTester = new AppTester({
      // appPath: path.join(__dirname, 'apps/simple-app'),
      appPath: '/var/folders/cn/7_p1z2sj1hqgsgb1f9l18zvh000nqp/T/test-initializer/simple-app',
    })

    return appTester.startEmberServe()
  })

  after(() => {
    return appTester.stopEmberServe()
  })

  it('should return ', () => {
    return request({
      uri: 'http://localhost:4200',
    })
      .then((html) => {
        expect(html).contains('<title>SimpleEmberApp</title>')
      })
  })
})