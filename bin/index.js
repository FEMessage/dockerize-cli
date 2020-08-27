#!/usr/bin/env node
const pkg = require('../package.json')
const program = require('commander')
const replace = require('../packages/commands/replace')
const proxy = require('../packages/commands/proxy')

program.version(pkg.version, '-v, --version')

program
  .command('replace [dist] [publicPath]')
  .description(
    'replace the projects network links to local files and replace it with the network link'
  )
  .action(replace)

program
  .command('proxy [port]')
  .description(
    'quick start a static server and use custom proxy config, the server port default is 80'
  )
  .action(proxy)

program
  .command('init')
  .description('quick init dockerize config files in your project')
  .action(require('../packages/commands/init.js'))

program.parse(process.argv)

// process.argv [0] is the node path
// process.argv [1] is the package path
// so if has the user custom argv will be persent in argv[2]
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
