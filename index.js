'use strict'
var rest = require('restler')
var urls = ['/_cluster/health', '/_nodes/_local/stats', '/_stats?level=shards']
// '/_stats/indexing,store,search,merge,refresh,flush,docs,get?level=shards'
var flat = require('flat')
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
      var context = {sourceName: 'elasticsearchStats', url: self.config.url + urls[i]}
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
    console.log('#############################')
    console.log('context: ', context)
    console.log('#############################')
    console.log(JSON.stringify(flat.flatten(data), null, '\t'))
  }
  this.eventEmitter.emit('data.raw', JSON.stringify(flat.flatten(data)), context)
}

ElasticsearchStats.prototype.transformStats = function (_stats, context) {
  try {
    var indices = Object.keys(_stats.indices)
    _stats._shards.stats_type = 'shard_stats'
    this.emitData(_stats._shards, context)
    // do we need _all?
    // _stats._all._type='all'
    // self.eventEmitter.emit('data.raw', JSON.stringify(_stats._all), context)
    for (var i = 0; i < indices.length; i++) {
      var index = _stats.indices[indices[i]]
      index.stats_type = 'index_stats'
      index.index_name = indices[i]
      var allShards = index.shards
      var shardNames = Object.keys(allShards)
      for (var k = 0; k < shardNames.length; k++) {
        var shardArray = allShards[shardNames[k]]
        for (var j = 0; j < shardArray.length; j++) {
          shardArray[j].index_name = index.index_name
          shardArray[j].shard_number_str = String(shardNames[k])
          shardArray[j].shard_number_int = Number(shardNames[k])
          shardArray[j].stats_type = 'shard_details'
          this.emitData(shardArray[j], context)
        }
      }
      delete index.shards
      this.emitData(index, context)
    }
  } catch (err) {
    console.error(err)
  }
}

ElasticsearchStats.prototype.transformLocalStats = function (_stats, context) {
  try {
    var nodes = Object.keys(_stats.nodes)
    console.log(_stats)
    for (var i = 0; i < nodes.length; i++) {
      var node = _stats.nodes[nodes[i]]
      node.stats_type = 'node_stats'
      node.node = nodes[i]
      node.cluster_name = _stats.cluster_name
      this.emitData(node, context)
    }
  } catch (err) {
    console.error(err)
  }
}

ElasticsearchStats.prototype.queryStats = function (url, context) {
  var self = this
  rest.get(url).on('complete', function (result) {
    if (result instanceof Error) {
      console.error('Error (' + url + '): ', result)
    } else {
      if (/_cluster\/health$/i.test(url)) {
        self.emitData(result, context)
      }
      if (/_local\/stats/i.test(url)) {
        self.transformLocalStats(result, context)
      }
      if (/_stats\?level=shards/i.test(url)) {
        self.transformStats(result, context)
      }
    }
  })
}

module.exports = ElasticsearchStats
