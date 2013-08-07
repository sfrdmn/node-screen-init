var pty = require('pty.js')
var resizeThrottle = 500

var meta = '\u0001'
var bindings = {
  'split': 'S',
  'split-v': '|',
  'focus': '\t',
  'screen': 'c',
  'fit': 'F',
  'title': 'A'
}
var commands = {
  'splitH': ['split', 'focus', 'screen'],
  'splitV': ['split-v', 'focus', 'screen'],
  'screen': ['screen'],
  'title': ['title'],
  'fit': ['fit']
}
var termBindings = {
  'return': '\r',
  'backspace': '\b'
}
var termCommands = {
  'clearLine': range(64).map(function() {
    return termBindings.backspace
  }).join('')
}

function ScreenInit(opts) {
  opts = opts || {}
  this.meta = opts.meta || meta
  this.bindings = mixin(bindings, opts.bindings || {})
  this.cols = opts.cols || process.stdout.columns
  this.rows = opts.rows || process.stdout.rows
  this.fixedWidth = typeof opts.cols !== 'undefined'
  this.fixedHeight = typeof opts.rows !== 'undefined'
  this.args = opts.args || ['-l']
  this.name = opts.name || process.env.TERM || 'screen-init'
  this.env = opts.env || process.env
  this.cwd = opts.cwd || ''

  this.screen = pty.spawn('screen', this.args, {
    name: this.name,
    cols: this.cols,
    rows: this.rows,
    cwd: this.cwd,
    env: this.env
  })

  process.stdin.setRawMode(true)
  this.screen.stdout.pipe(process.stdout)
  process.stdin.pipe(this.screen.stdin)

  process.stdout.on('resize', throttle(this.onResize_, resizeThrottle).bind(this))
  this.screen.on('close', this.onClose_.bind(this))
  this.screen.on('error', this.onError_.bind(this))
  process.on('exit', function() {
    process.stdin.setRawMode(false)
  })
}

ScreenInit.prototype.exec = function(cmd, title) {
  title = title || cmd
  this.writeCommand_(cmd)
  this.title(title)
}

ScreenInit.prototype.splitH = function() {
  this.screenCommand_('splitH')
}

ScreenInit.prototype.splitV = function() {
  this.screenCommand_('splitV')
}

ScreenInit.prototype.newScreen = function() {
  this.screenCommand_('screen')
}

ScreenInit.prototype.title = function(title) {
  if (typeof title === 'string' && title.length) {
    this.screenCommand_('title')
    this.termCommand_('clearLine')
    this.writeCommand_(title)
  }
}

ScreenInit.prototype.write_ = function(input) {
  if (typeof input === 'string' && input.length) {
    this.screen.stdin.write(input)
  }
}

ScreenInit.prototype.writeCommand_ = function(cmd) {
  // raw mode off so input isn't sitting in buffer somewhere?
  // not sure, prevents leftover output when screen terminates
  process.stdin.setRawMode(false)
  this.write_(cmd + termBindings.return)
  process.stdin.setRawMode(true)
}

ScreenInit.prototype.screenCommand_ = function(cmdName) {
  var bindings = commands[cmdName] || []
  bindings.forEach(function(key) {
    this.write_(this.meta + this.bindings[key])
  }.bind(this))
}

ScreenInit.prototype.termCommand_ = function(cmdName) {
  this.write_(termCommands[cmdName])
}

ScreenInit.prototype.onResize_ = function() {
  if (!this.fixedWidth && !this.fixedHeight) {
    if (!this.fixedWidth) {
      this.cols = process.stdout.columns
    }
    if (!this.fixedHeight) {
      this.rows = process.stdout.rows
    }
    this.screen.resize(this.cols, this.rows)
    this.screenCommand_('fit')
  }
}

ScreenInit.prototype.onClose_ = function() {
  process.exit(0)
}

ScreenInit.prototype.onError_ = function() {
  process.exit(1)
}

function mixin(dest /* , sources... */) {
  dest = dest || {}
  var sources = [].slice.call(arguments, 1)
  sources.forEach(function(source) {
    Object.keys(source).forEach(function(key) {
      dest[key] = source[key]
    })
  })
  return dest
}

function throttle(fn, ms) {
  var blocked = false
  var runQueued = false

  return function() {
    var args = [].slice.call(arguments, 0)
    var self = this

    if (blocked) {
      runQueued = true
    } else {
      run()
    }

    function run() {
      runQueued = false
      blocked = true
      setTimeout(unblock, ms)
      fn.apply(self, args)
    }

    function unblock() {
      blocked = false
      if (runQueued) {
        run()
      }
    }
  }
}

function range(start, end) {
  var arr = []
  if (typeof start !== 'undefined' && typeof end === 'undefined') {
    end = start - 1
    start = 0
  }
  if (typeof start !== 'undefined' && typeof end !== 'undefined' && start <= end) {
    for (var i = start; i <= end; i++) {
      (function(i) {
        arr.push(i)
      })(i)
    }
  }
  return arr
}

module.exports = function(opts) {
  return new ScreenInit(opts)
}
module.exports.ScreenInit = ScreenInit

