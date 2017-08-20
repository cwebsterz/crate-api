const { concat, trim, toLower, replace, compose } = require('ramda')

module.exports = prefix => value =>
  compose(toLower, replace(/ /g, '_'), concat(prefix), trim)(value)
