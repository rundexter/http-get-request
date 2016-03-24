var agent = require('superagent')
  , q     = require('q')
  , _     = require('lodash')
;

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
       var urls = step.input('url')
         , promises = []
         , parameters, headers, req
       ;

       urls.each(function(url, idx) {
           parameters = step.input('parameters')[idx] || {};
           headers    = step.input('headers')[idx] || {};

           //turn a superagent request into a q promsise
           promises.push(
               promisify(
                 agent.get(url).type('json').query(parameters).set(headers), [ 'body', 'statusCode' ] 
               )
           );
       });

       q.all(promises)
        .then(this.complete.bind(this))
        .catch(this.fail.bind(this));

    }
};

/**
 * Generate a promise from a superagent request
 * 
 * @param {object} scope - context to bind to
 * @param {string} call - name of function to call
 * @param {string} path - dot notation of path to return from response object
 * 
 * @return q/Promise - a promise that gets resolved on a successful request
 */
function promisify(agent, path) {
    var deferred = q.defer(); 

    agent.end(function(err, result) {
        return err || result.statusCode >= 400
          ? deferred.reject(err || result.body)
          : deferred.resolve(_.pick(result, path))
        ;
    });

    return deferred.promise;
}
