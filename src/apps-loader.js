const childProcess = require('child_process')
const debug = require('debug')('ember-app-tester:app-tester')
const os = require('os')
const fs = require('fs-promise')
const path = require('path')

module.exports = class AppsLoader {

  static runBowerInstall(destinationDir) {
    return AppsLoader.runCommand({
      file: 'bower',
      args: ['install'],
      cwd: destinationDir,
    })
  }

  static runNpmInstall(destinationDir) {
    return AppsLoader.runCommand({
      file: 'npm',
      args: ['install'],
      cwd: destinationDir,
    })
  }

  static runYarn(destinationDir) {
    return fs.access(path.join(destinationDir, 'package.json'), fs.R_OK).then(() => true).catch(() => false)
      .then((isAccessible) => {
        if (!isAccessible) {
          throw new Error(`Could not read 'package.json'.`)
        }

        return AppsLoader.runCommand({
          file: 'yarn',
          cwd: destinationDir,
        })
      })
  }

  static runCommand(options = {}) {
    const {
      file,
      args = [],
      cwd,
      stdout,
      stderr,
    } = options

    return new Promise(function (resolve, reject) {
      debug(`Run '${file} ${args.join(' ')}' at '${cwd}'`)

      const child = childProcess.spawn(file, args, { cwd })
      if (stdout) {
        child.stdout.pipe(stdout)
      }
      if (stderr) {
        child.stderr.pipe(stderr)
      }

      let stderrText = ''
      child.stderr.on('data', (buffer) => {
        stderrText += buffer.toString()
      })

      child.once('close', (code) => {
        if (code > 0) {
          reject(new Error(`'${file} ${args.join(' ')}' returns exit code ${code}.\n${stderrText}`))
        } else {
          resolve()
        }
      })
      child.once('error', (err) => reject(err))
    })
  }

  static getDefaultTempDir() {
    return path.join(os.tmpdir(), 'ember-app-tester');
  }

  constructor(options = {}) {
    this.appsPath = options.appsPath
    this.cachePath = options.cachePath || AppsLoader.getDefaultTempDir()
    this.port = options.port || 4200
    this.process = null
  }

  loadApps() {
    debug(`Loading apps from '${this.appsPath}' and cache them into '${this.cachePath}'...`)

    return Promise.resolve()
      .then(() => {
        return fs.readdir(this.appsPath)
      })
      .then((files) => {
        let promises = files
          .map((file) => {
            let fullFilename = path.join(this.appsPath, file)
            return fs.stat(fullFilename)
              .then((stat) => {
                return {
                  filename: fullFilename,
                  isDirectory: stat.isDirectory(),
                }
              })
          })
        return Promise.all(promises)
      })
      .then((fileInfoList) => {
        let appDirs = fileInfoList
          .filter((fileInfo) => fileInfo.isDirectory)
          .map((fileInfo) => fileInfo.filename)

        let appNames = appDirs.map((appDir) => path.basename(appDir))
        debug.enabled && debug(`List of apps: ${appNames}`)

        let promises = appDirs
          .map((appDir) => {
            let appName = path.basename(appDir)
            let destinationDir = path.join(this.cachePath, appName)

            return Promise.resolve()
              .then(() => {
                debug(`Copy '${appDir}' to '${destinationDir}'`)
                return fs.copy(appDir, destinationDir)
              })
              .then(() => {
                return AppsLoader.runYarn(destinationDir)
                  .then(() => {
                    return AppsLoader.runBowerInstall(destinationDir)
                  })
              })
              .catch((err) => {
                throw new Error(`Failed to load app '${appName}'.\n${err.stack}`)
              })
          })

        return Promise.all(promises)
          .then(() => {
            return appNames
          })
      })
  }

  clearCache() {
    debug(`Removing '${this.cachePath}'`)
    return fs.remove(this.cachePath)
  }
}