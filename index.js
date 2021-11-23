class MongoDataAPIClient {
    /**
     * 
     * @param {string} appId 
     * @param {string} apiKey 
     * @param {string?} clusterName 
     */
    constructor(appId, apiKey, clusterName) {
        this.url = `https://data.mongodb-api.com/app/${appId}/endpoint/data/beta/action/`;
        this.apiKey = apiKey;
        this.clusterName = clusterName || 'Cluster0';
        this._fetch = typeof(fetch) === 'function' ? (function fetch(){return fetch(...arguments);}) : require('node-fetch-polyfill');
    }
    db(dbName) {
        return new Database(dbName, this.url, this.apiKey, this.clusterName, this._fetch);
    }
}

class Database {
    constructor(dbName, url, apiKey, clusterName, _fetch) {
        this.dbName = dbName;
        this.url = url;
        this.apiKey = apiKey;
        this.clusterName = clusterName;
        this._fetch = _fetch;
    }
    collection(collectionName) {
        return new Collection(collectionName, this.dbName, this.url, this.apiKey, this.clusterName, this._fetch);
    }
}

class Collection {
    /**
     * 
     * @param {string} collectionName 
     */
    constructor(collectionName, dbName, url, apiKey, clusterName, _fetch) {
        this.collectionName = collectionName;
        this.dbName = dbName;
        this.url = url;
        this.apiKey = apiKey;
        this.clusterName = clusterName;
        this._fetch = _fetch;
    }
    async internalFetch(action, obj) {
        obj = obj || {};
        const resp = await this._fetch(this.url + action, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.apiKey,
            },
            body: JSON.stringify({
                dataSource: this.clusterName,
                database: this.dbName,
                collection: this.collectionName,
                ...obj
            })
        });
        const {ok} = resp;
        const json = await resp.json();
        if (ok) {
            return json;
        } else {
            throw json;
        }

    }
    async findMany(query, options) {
        query = query || {};
        options = options || {};
        const a = await this.internalFetch('find', {
            filter: query,
            projection: options.projection,
            sort: options.sort,
            limit: options.limit,
            skip: options.skip
        });
        return a.documents;
    }
    find(query, options) {
        return this.findMany(query, options);
    }
    async findOne(query, options) {
        query = query || {};
        options = options || {};
        const a = await this.internalFetch('findOne', {
            filter: query,
            projection: options.projection
        });
        return a.document;
    }
    insertOne(doc) {
        return this.internalFetch('insertOne', {
            document: doc
        });
    }
    insertMany(docs) {
        return this.internalFetch('insertMany', {
            documents: docs
        });
    }
    updateOne(query, update, options) {
        options = options || {};
        return this.internalFetch('updateOne', {
            filter: query,
            update: update,
            upsert: options.upsert
        });
    }
    updateMany(query, update, options) {
        options = options || {};
        return this.internalFetch('updateMany', {
            filter: query,
            update: update,
            upsert: options.upsert
        });
    }
    update(query, update, options) {
        return this.updateMany(query, update, options);
    }
    deleteOne(query) {
        query = query || {};
        return this.internalFetch('deleteOne', {
            filter: query
        });
    }
    deleteMany(query) {
        query = query || {};
        return this.internalFetch('deleteMany', {
            filter: query
        });
    }
    delete(query) {
        return this.deleteMany(query);
    }
    replaceOne(query, doc, options) {
        query = query || {};
        return this.internalFetch('replaceOne', {
            filter: query,
            replacement: doc,
            upsert: options.upsert
        });
    }
    aggregate(pipeline) {
        return this.internalFetch('aggregate', {
            pipeline: pipeline
        });
    }
}
exports = module.exports = MongoDataAPIClient;