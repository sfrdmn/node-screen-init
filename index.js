var pty = require('pty.js')
var resizeThrottle = 500

var meta = '\u0001'
var bindings = {
  'split': 'S',
  'split-v': '|',
  'focus': '\t',
  'screen': 'c',
  'fit': 'F'
}
var commands = {
  'splitH': ['split', 'focus', 'screen'],
  'splitV': ['split-v', 'focus', 'screen'],
  'screen': ['screen'],
  'fit': ['fit']
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

ScreenInit.prototype.exec = function(cmd) {
  this.termCommand_(cmd)
}

ScreenInit.prototype.splitH = function() {
  this.screenCommand_('splitH')
}

ScreenInit.prototype.splitV = function() {
  this.screenCommand_('splitV')
}

ScreenInit.prototype.new = function() {
  this.screenCommand_('screen')
}

ScreenInit.prototype.screenCommand_ = function(cmdName) {
  var bindings = commands[cmdName] || []
  bindings.forEach(function(key) {
    this.screen.stdin.write(this.meta + this.bindings[key])
  }.bind(this))
}

ScreenInit.prototype.termCommand_ = function(cmd) {
  if (typeof cmd === 'string' && cmd.length) {
    this.screen.stdin.write(cmd + '\r')
  }
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

module.exports = function(opts) {
  return new ScreenInit(opts)
}
module.exports.ScreenInit = ScreenInit

