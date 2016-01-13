#!/usr/bin/env node
var meow = require('meow')
var convert = require('./index')

var cli = meow([
  'Usage',
  '  $ swagger-markup <input>',
  '',
  'Options',
  ' -f, --format <markdown|confluence>'
], {
  alias: { f: 'format' },
  default: { format: 'markdown' }
})

convert(cli.input[0], cli.flags.format)
  .pipe(process.stdout)
