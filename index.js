'use strict'
var flat = require('flat')
var rest = require('restler')
var urls = ['/_nodes/stats', '/_nodes/_local/stats', '/_cluster/health', '/_stats']
/**
 * Constructor called by logagent, when the config file contains tis entry:
 * input
 *  elasticsearchStats:
 *    module: megastef/logagent-input-elasticsearch-stats
 *    utl: http://localhost:9200
 *
 * @config cli arguments and config.configFile entries
 * @eventEmitter logent eventEmitter object
 */
function ElasticsearchStats (config, eventEmitter) {
  this.config = config.configFile.input.elasticsearchStats
  this.config.url = config.configFile.input.elasticsearchStats.url
  this.eventEmitter = eventEmitter
}

/**
 * Plugin start function, called after constructor
 *
 */
ElasticsearchStats.prototype.start = function () {
    this.started = true
    var self = this
    var context = {source: 'elasticsearchStats', url: self.config.url}
    this.tid = setInterval(function () {
      for (var i=0; i<urls.length; i++) {
         self.queryStats (self.config.url + urls[i], context)
      }  
    }, 10000)
}

/**
 * Plugin stop function, called when logagent terminates
 * we close the server socket here.
 */
ElasticsearchStats.prototype.stop = function (cb) {
  clearInterval(this.tid)
}

ElasticsearchStats.prototype.emitData = function (data, context) {
   this.eventEmitter.emit('data.raw', data, context)
}

ElasticsearchStats.prototype.queryStats = function (url, context) {
  var self = this
  rest.get(url).on('complete', function (result) {
    if (result instanceof Error) {
      console.error('Error (' + url +'): ', result.message)
    } else {
      if (this.config.debug) {
        console.log(JSON.stringify(result, null, '\t'))
      }
      self.eventEmitter.emit('data.raw', JSON.stringify(result), context)
    }
  })
}

module.exports = ElasticsearchStats

