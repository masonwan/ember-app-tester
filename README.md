# ember-app-tester

Utilities to test Ember apps.

AppsLoader assumes that your fixture apps looks like below:

```
apps/
├─ app1
├─ app2
├─ app3
```

AppsLoader will copy all the apps to the cache path (system temp directory by default), and run yarn and bower install for each of the app dir.

## Installation

`npm install --save-dev ember-app-tester`

## Usage

In the build script, load the apps directory.

```
const AppsLoader = require('ember-app-tester').AppsLoader

new AppsLoader({
  appsPath: '/path/to/apps',
  cachePath: '/path/to/build/dir',
}).loadApps()
	.then((appNameList) => {
		// Apps are copied to the temp directory and ready to be served.
	})
	.catch((err) => {
		// One or more apps failed to load.
	})
```

In the test, start the Ember server.

```
const EmberServer = require('ember-app-tester').EmberServer

const emberServer = new EmberServer({
  appName: 'non-existing-app',
})

emberServer.start()
  .then(() => {
    // Ember server is ready.
  })
  .catch((err) => {
    // Something bad happened.
  })
```