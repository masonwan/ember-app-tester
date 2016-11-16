const path = require('path')
const request = require('request-promise')
const expect = require('chai').expect
const fs = require('fs-promise')

const AppTester = require('../src/app-tester')
const EmberServer = require('../src/ember-server')

describe('EmberServer', function () {
  this.timeout(30000) // It may encounter the worst case that nothing in the Bower and yarn cache.

  let appTester
  let emberServer

  before(() => {
    appTester = new AppTester({
      appsPath: path.join(__dirname, 'apps'),
    })
    return appTester.loadApps()
  })

  after(() => {
    return appTester.clearCache()
  })

  afterEach(() => {
    return emberServer.stop()
  })

  it('should throw if app does not exist', () => {
    emberServer = new EmberServer({
      appName: 'non-existing-app',
    })

    return emberServer.start()
      .then(() => {
        throw new Error('It should not start')
      })
      .catch((err) => {
        expect(err.message).to.contains(`non-existing-app' is not accessible`)
      })
  })

  it('should start server and return HTML', () => {
    emberServer = new EmberServer({
      appName: 'simple-app',
    })

    return emberServer.start()
      .then(() => {
        return request('http://localhost:4200')
      })
      .then((html) => {
        expect(html).to.contains(`<title>SimpleEmberApp</title>`)
      })
  })
})