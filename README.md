# logagent-input-elasticsearch-stats

Plugin to collect Elasticsearch stats  

## Install logagent 2.x 

  ```
  npm i -g @sematext/logagent
  ```

## Install logagent-input-elasticsearch-stats plugin 

  ```
  npm i -g logagent-input-elasticsearch-stats  
  ```

## Configure logagent 

  ```
  input:
    elasticsearchStats:
      module: logagent-input-elasticsearch-stats 
      url: 'http://localhost:9200'
      debug: false
      nodesStats: true

  output:
    elasticsearch:
      url: http://localhost:9200
      index: logs

  # global options
  options:
    includeOriginalLine: false
    printStats: 60

  ```

## Start logagent

  ```
  logagent --config myconfig.yml
  ```


