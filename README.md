# The package that uses MongoDB Atlas Data API to access your data
## First you need to get an API key and App ID for the service, explained how [here](https://www.mongodb.com/blog/post/introducing-mongodb-atlas-data-api-now-available-preview). 
## After that import/require the package and use it like this:  
```javascript
const MongoClient = require('@ph4ntomiki/mongodb-data-api-client');
const client = MongoClient('app_id', 'api_key', 'clusterName'); //cluster defaults to 'Cluster0'
const db = client.db('dbName');
const collection = db.collection('collectionName');

const results = await collection.find({title: /a/i});
```

You can also create client with custom fetch implementation, like for ex. for Cloudflare Workers like this:  
```javascript
const client = MongoClient('app_id', 'api_key', 'clusterName', {'fetch': fetch.bind(self)});
```
Or if you want default clusterName you can pass ```undefined``` or ```null``` at that place.