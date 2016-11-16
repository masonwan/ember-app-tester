const path = require('path')
const request = require('request-promise')
const expect = require('chai').expect
const fs = require('fs-promise')

const AppsLoader = require('../index').AppsLoader

describe('AppsLoader', function () {
  this.timeout(60000) // It may encounter the worst case that nothing in the Bower and yarn cache.

  const defaultTempDir = AppsLoader.getDefaultTempDir()

  describe('wrong fixture apps', () => {

    afterEach(() => {
      return fs.remove(defaultTempDir)
    })

    it('should throw if package.json does not exist', () => {
      let appsLoader = new AppsLoader({
        appsPath: path.join(__dirname, 'no-package-json-apps'),
      })
      return appsLoader.loadApps()
        .catch((err) => {
          expect(err.message).to.contains(`Could not read 'package.json'`)
        })
    })

    it('should throw if bower.json does not exist', () => {
      let appsLoader = new AppsLoader({
        appsPath: path.join(__dirname, 'no-bower-json-apps'),
      })
      return appsLoader.loadApps()
        .catch((err) => {
          expect(err.message).to.contains(`'bower install' returns exit code 1`)
        })
    })
  })

  describe('correct fixture app', () => {

    let appsLoader

    before(() => {
      appsLoader = new AppsLoader({
        appsPath: path.join(__dirname, 'apps'),
      })
      return appsLoader.loadApps()
    })

    it('should be in the cache directory', () => {
      return Promise.resolve()
        .then(() => {
          return fs.readdir(defaultTempDir)
            .then((files) => {
              expect(files).to.contains('simple-app')
            })
        })
        .then(() => {
          let packageJsonPath = path.join(defaultTempDir, 'simple-app', 'package.json')
          return fs.access(packageJsonPath, fs.R_OK)
        })
    })

    it('should clear cache', () => {
      return appsLoader.clearCache()
        .then(() => {
          return fs.access(defaultTempDir, fs.R_OK)
            .then(() => {
              throw new Error(`${defaultTempDir} should not be accessible`)
            })
            .catch((err) => {
              expect(err.code).to.equals('ENOENT')
            })
        })
    })
  })
})