node-screen-init
================

quickly initialize screen sessions with nodejs

## Usage

Run an HTTP server and Grunt watch split screen, with a CouchDB instance in a background screen!

```Javascript
#!/bin/usr/env node

var screen = require('screen-init')()

screen.exec('Python -m SimpleHTTPServer')
screen.splitH()
screen.exec('couchdb')
screen.newScreen()
screen.exec('grunt watch')
```

## API

newScreen, splitH, and splitV calls automatically focus the newly created screen.
calls to exec are run on whichever screen has focus

+ **screen.exec**
Takes a string and writes it as input to the currently focused screen.
Optionally, takes a second parameter specifying the title of the screen,
defaulting to the name of the command itself.
+ **screen.newScreen**
Creates a new screen and focuses it.
+ **screen.splitH**
Creates a new screen in a horizontal split and focuses it.
+ **screen.splitV**
Same as `splitH`, but creates a vertical split. **Note** Older versions of screen do not have this capability!
+ **screen.title**
Sets the title of the screen
+ **options**
Custom options can be easily supplied when required using `require('screen-init')({options: stuff})`.
Useful if you have custom bindings. `pty.js` options are passed through
  + **args**
  Array of arguments to be passed to screen
  + **meta**
  UTF8 equivalent of screen meta key
  + **bindings**
  UTF8 key bindings for screen commands. Defaults:
  ```
  {
    'split': 'S',
    'split-v': '|',
    'focus': '\t',
    'screen': 'c',
    'fit': 'F',
    'title: 'A'
  }
  ```
