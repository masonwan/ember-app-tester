# ember-app-tester

Utilities to test Ember apps.

AppTester assumes that your fixture apps looks like below:

```
apps/
├─ app1
├─ app2
├─ app3
```

AppTester will copy all the apps to the cache path (system temp directory by default), and run yarn and bower install for each of the app dir.

## Installation

`npm install --save-dev ember-app-testers`

## Usage

In your build script, you may have...

```
const AppTester = require('ember-app-tester')

new AppTester({
  appsPath: '/path/to/apps',
  cachePath: '/path/to/build/dir',
}).loadApps()
	.then((appNameList) => {
		// Apps are ready.
	})
	.catch((err) => {
		// One or more apps failed to load.
	})
```

And in your tests, you could
