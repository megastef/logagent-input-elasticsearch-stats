'use strict'
var rest = require('restler')
var urls = ['/_cluster/health', '/_nodes/_local/stats', '/_stats'] // '/_stats/indexing,store,search,merge,refresh,flush,docs,get?level=shards'

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
  this.tid = setInterval(function () {
    for (var i = 0; i < urls.length; i++) {
      var context = {source: 'elasticsearchStats', url: self.config.url + urls[i]}
      self.queryStats(context.url, context)
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
  if (this.config.debug) {
    console.log ('#############################')
    console.log('context: ', context)
    console.log ('#############################')
    console.log(JSON.stringify(data, null, null))
  }
  this.eventEmitter.emit('data.raw', JSON.stringify(data), context)
}

ElasticsearchStats.prototype.transformStats = function (_stats, context) {
  var indices = Object.keys(_stats.indices)
  _stats._shards._type='shards'
  this.emitData(_stats._shards, context)
  // do we need _all
  // _stats._all._type='all'
  // self.eventEmitter.emit('data.raw', JSON.stringify(_stats._all), context)
  var indices = Object.keys(_stats.indices)
  for (var i = 0; i < indices.length; i++) {
    var index = _stats.indices[indices[i]]
    index._type = 'index_stats'
    index.index_name = indices[i]
    this.emitData(index, context)
  }
}

ElasticsearchStats.prototype.transformLocalStats = function (_stats, context) {
  var nodes = Object.keys(_stats.nodes)
  for (var i = 0; i < nodes.length; i++) {
    var node = _stats[nodes[i]]
    node._type = 'node_stats'
    node.node = nodes[i]
    node.cluster_name = _stats.cluster_name
    this.emitData(node, context)
  }
}

ElasticsearchStats.prototype.queryStats = function (url, context) {
  var self = this
  rest.get(url).on('complete', function (result) {
    if (result instanceof Error) {
      console.error('Error (' + url + '): ', result.message)
    } else {
      if (/_cluster\/health$/i.test(url)) {
        self.emitData(result, context)
      }
      if (/_local$/i.test(url)) {
        self.transformLocalStats(result, context)
      }
      if (/_stats$/i.test(url)) {
        self.transformStats(result, context)
      }
    }
  })
}

module.exports = ElasticsearchStats