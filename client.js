const elasticsearch = require('elasticsearch');
const util = require('util')

class Doc {
  
    host = '127.0.0.1:9200';
    index = 'code_test';
    type = 'documents';

    constructor() {
        this.client = new elasticsearch.Client({
            host: this.host
        });
        this.checkStatus();
        
    }

    checkStatus() {
        this.client.ping({ requestTimeout: 5000 }, (error) => {
            if (error) {
                throw 'elasticsearch cluster is down!';
            } 
        });
    }
  
    create(id, keywords) {
        var that = this;
        return new Promise( (resolve, reject) => {
            that.client.index({
                index: that.index,
                id: id,
                type: that.type,
                body: { tags : keywords},
            }, (error, response, status) => {
                if (error) {
                   reject(error.message);
                }
                resolve(response); 
            });
        });
    }

    combinedQuery(query) {
        let combinedQuery = { bool : {}};
        let subQuery = { bool: {} };
        let subStr = query.substring(query.indexOf('(') + 1, query.indexOf(')'));
        if (subStr.includes ('&')) {
            subQuery.bool = {
                must: subStr.split('&').map(el => {
                    return { match: { tags: el } };
                })
            };
        } else {
            subQuery.bool = {
                should: subStr.split('|').map(el => {
                    return { match: { tags: el } };
                })
            };
        }
        let restQuery = query.replace(`(${subStr})`,'');
        if (restQuery !== ''){
        
            if (restQuery.includes ('&')) {
                combinedQuery.bool = {
                    must: [subQuery, { match: { tags: restQuery.replace('&', '')} }]
                };
            } else {
                combinedQuery.bool = {
                    should: [subQuery, { match: {tags: restQuery.replace('|', '')} }]
                };
            }
        } else combinedQuery = subQuery;
        return combinedQuery;
    }

    simpleQuery(query) {
        let simpleQuery = { bool : {}};
        if (query.includes ('&')) {
            simpleQuery.bool = {
                must: query.split('&').map(el => {
                    return { match: { tags: el } };
                })
            };
        } else if (query.includes ('|')) {
            simpleQuery.bool = {
                should: query.split('|').map(el => {
                    return { match: { tags: el } };
                })
            };
        } else simpleQuery = { match: {tags: query} };
        return simpleQuery;
    }

    buildQuery(query) {

        if (query.includes('(') && query.includes(')'))  return this.combinedQuery(query);
        else return this.simpleQuery(query);

    }

    search(query) {

        let body = { query: this.buildQuery(query)};
        return this.client.search({ index: this.index, body: body, type: this.type });
        
    }

    destroy() {
        this.client.transport.close()
    }
}

module.exports = Doc;




