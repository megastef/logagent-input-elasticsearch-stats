var elasticsearchStats = require('./index.js')
// simulate LA plugin loading
function test () {
  var EE = require('events').EventEmitter
  // Logagent loads the configfrom a yaml file
  // we simply pass a JSON object
  var config = {
    configFile: {
      input: {
        elasticsearchStats: {
          url: 'http://localhost:9200',
          debug: true
        }
      }
    }
  }
  // create and start the plugin - normally done by logagent ...
  var plugin = new elasticsearchStats(config, new EE())
  plugin.start()
}

if (require.main === module) {
  test()
}