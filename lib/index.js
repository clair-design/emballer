const { resolve } = require('path')
const chokidar = require('chokidar')
const { rollup, watch } = require('rollup')
const getInputOption = require('./get-input-option')
const ensureNpmPrefix = require('./ensure-npm-prefix')
const objectAssign = Object.assign

module.exports = function (config, isWatch) {
  const fn = isWatch ? watchCompile : bundle
  const options = config.options.filter(
    ({ input, output }) => !!input && !!output
  )

  return ensureNpmPrefix().then(npmPrefix =>
    Promise.all(options.map(option => fn(option, { npmPrefix })))
  )
}

function bundle (config, { npmPrefix }) {
  const { output } = config
  const inputOption = getInputOption(config, { npmPrefix })
  const outputOption = fixOutputOption(output, { npmPrefix })

  return rollup(inputOption).then(bundle =>
    Promise.all(
      outputOption.map(option =>
        bundle[option.file ? 'write' : 'generate'](option)
      )
    )
  )
}

function watchCompile (config, { npmPrefix }) {
  const { output } = config
  const inputOption = getInputOption(config, { npmPrefix })
  const outputOption = fixOutputOption(output, { npmPrefix })
  const watchOption = objectAssign(
    {
      watch: {
        chokidar,
        exclude: ['node_modules/**']
      },
      output: outputOption
    },
    inputOption
  )

  return Promise.resolve(watch(watchOption))
}

function fixOutputOption (output, { npmPrefix }) {
  return [].concat(output).filter(Boolean).map(option => {
    if (option.file) {
      option.file = resolve(npmPrefix, option.file)
    }
    return option
  })
}
