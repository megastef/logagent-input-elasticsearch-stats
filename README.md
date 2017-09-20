# logagent-input-elasticsearch-stats

Plugin to collect Elasticsearch stats  

1. Install logagent 2.x 

```
npm i -g @sematext/logagent
```

2. Install this plugin 
```
npm i -g logagent-input-elasticsearch-stats  
```
3. configure logagent 

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

4. Start logagent

```
logagent --config myconfig.yml
```


