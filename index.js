const __fetch = require('cross-fetch');
const { EJSON: ejson, ObjectId } = require('bson');

class MongoDataAPIClient {
    /**
     * 
     * @param {string} appId 
     * @param {string} apiKey 
     * @param {string?} clusterName 
     */
    constructor(appId, apiKey, clusterName, options) {
        options = options || {};
        this.url = `https://data.mongodb-api.com/app/${appId}/endpoint/data/beta/action/`;
        this.apiKey = apiKey;
        this.clusterName = clusterName || 'Cluster0';
        this._fetch = options.fetch || __fetch;
    }
    /**
     * 
     * @param {string} dbName database name
     * @returns {Database}
     */
    db(dbName) {
        return new Database(dbName, this.url, this.apiKey, this.clusterName, this._fetch);
    }
}
MongoDataAPIClient.prototype.ObjectId = MongoDataAPIClient.prototype.ObjectID = ObjectId;

class Database {
    constructor(dbName, url, apiKey, clusterName, _fetch) {
        this.dbName = dbName;
        this.url = url;
        this.apiKey = apiKey;
        this.clusterName = clusterName;
        this._fetch = _fetch;
    }
    /**
     * 
     * @param {string} collectionName collection name
     * @returns {Collection}
     */
    collection(collectionName) {
        return new Collection(collectionName, this.dbName, this.url, this.apiKey, this.clusterName, this._fetch);
    }
}
Database.prototype.ObjectId = Database.prototype.ObjectID = ObjectId;

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
        if(obj.filter)obj.filter = this.fixBson(obj.filter);
        if(obj.document)obj.document = this.fixBson(obj.document);
        if(obj.documents)obj.documents = this.fixBson(obj.documents);
        if(obj.update)obj.update = this.fixBson(obj.update);
        if(obj.replacement)obj.replacement = this.fixBson(obj.replacement);
        if(obj.pipeline)obj.pipeline = this.fixBson(obj.pipeline);
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
    fixBson(obj) {
        if(typeof(obj._id)==='string' && (/^[a-f\d]{24}$/i).test(obj._id))obj._id = ObjectId(obj._id);
        if(Array.isArray(obj))obj = obj.map(e=>{if(typeof(e._id)==='string' && (/^[a-f\d]{24}$/i).test(e._id))e._id = ObjectId(obj._id);return e;});
        obj = ejson.serialize(obj, { relaxed: false, legacy: false });
        return obj;
    }
    /**
     * 
     * @param {object} query query
     * @param {object} options options
     * @returns {Promise<object[]>}
     */
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
        return ejson.deserialize(a.documents);
    }
    /**
     * 
     * @param {object} query query
     * @param {object} options options
     * @returns {Promise<object[]>}
     */
    find(query, options) {
        return this.findMany(query, options);
    }
    /**
     * 
     * @param {object} query query
     * @param {object} options options
     * @returns {Promise<object>}
     */
    async findOne(query, options) {
        query = query || {};
        options = options || {};
        const a = await this.internalFetch('findOne', {
            filter: query,
            projection: options.projection
        });
        return ejson.deserialize(a.document);
    }
    /**
     * 
     * @param {object} doc document
     * @returns {Promise<object>}
     */
    insertOne(doc) {
        return this.internalFetch('insertOne', {
            document: doc
        });
    }
    /**
     * 
     * @param {array} docs documents
     * @returns {Promise<object>}
     */
    insertMany(docs) {
        return this.internalFetch('insertMany', {
            documents: docs
        });
    }
    /**
     * 
     * @param {object} query query
     * @param {object} update update
     * @param {object} options options
     * @returns {Promise<object>}
     */
    updateOne(query, update, options) {
        query = query || {};
        options = options || {};
        return this.internalFetch('updateOne', {
            filter: query,
            update: update,
            upsert: options.upsert
        });
    }
    /**
     * 
     * @param {object} query query
     * @param {object} update update
     * @param {object} options options
     * @returns {Promise<object>}
     */
    updateMany(query, update, options) {
        query = query || {};
        options = options || {};
        return this.internalFetch('updateMany', {
            filter: query,
            update: update,
            upsert: options.upsert
        });
    }
    /**
     * 
     * @param {object} query query
     * @param {object} update update
     * @param {object} options options
     * @returns {Promise<object>}
     */
    update(query, update, options) {
        return this.updateMany(query, update, options);
    }
    /**
     * 
     * @param {object} query query
     * @returns {Promise<object>}
     */
    deleteOne(query) {
        query = query || {};
        return this.internalFetch('deleteOne', {
            filter: query
        });
    }
    /**
     * 
     * @param {object} query query
     * @returns {Promise<object>}
     */
    deleteMany(query) {
        query = query || {};
        return this.internalFetch('deleteMany', {
            filter: query
        });
    }
    /**
     * 
     * @param {object} query query
     * @returns {Promise<object>}
     */
    delete(query) {
        return this.deleteMany(query);
    }
    /**
     * 
     * @param {object} query query
     * @param {object} doc document
     * @param {object} options options
     * @returns {Promise<object>}
     */
    replaceOne(query, doc, options) {
        query = query || {};
        return this.internalFetch('replaceOne', {
            filter: query,
            replacement: doc,
            upsert: options.upsert
        });
    }
    /**
     * 
     * @param {object} pipeline pipeline
     * @returns {Promise<object>}
     */
    aggregate(pipeline) {
        return this.internalFetch('aggregate', {
            pipeline: pipeline
        });
    }
}
Collection.prototype.ObjectId = Collection.prototype.ObjectID = ObjectId;

/**
 * 
 * @param {string} appId App ID
 * @param {string} apiKey API Key
 * @param {string} [clusterName=Cluster0] cluster name
 * @param {object} options options
 * @returns {MongoDataAPIClient}
 */
function createMongoClient(appId, apiKey, clusterName, options) {
    return new MongoDataAPIClient(appId, apiKey, clusterName, options);
}
createMongoClient.ObjectId = createMongoClient.ObjectID = ObjectId;
exports = module.exports = createMongoClient;
exports.ObjectId = module.exports.ObjectId = ObjectId;
exports.ObjectID = module.exports.ObjectID = ObjectId;