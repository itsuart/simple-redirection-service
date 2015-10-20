'use strict';

module.exports.create = function(ttl_in_millis){
    if (! ttl_in_millis) throw new Error('ttl_in_millis is not provided.');
    var cache = {ttl: ttl_in_millis};
    var storage = {};

    cache.purgeStale = function(){
        var keys = Object.keys(storage);
        var now = Date.now();
        for (var i = 0; i < keys.length; i += 1){
            var key = keys[i];
            var value = storage[key];
            if (! value){
                delete storage[key];
            } else {
                if (now - value.last_access_millis >= cache.ttl){
                    delete storage[key];
                }
            }
        }
    };
    
    cache.get = function(key){
        if (! key) throw new Error('key is not provided.');
        cache.purgeStale();
        var value = storage[key];

        if (value){
            value.last_access_millis = Date.now();
            return value.data;
        }
    };

    cache.put = function(key, value){
        if (! key) throw new Error('key is not provided.');
        storage[key] = {
            last_access_millis: Date.now(),
            data: value
        };
    };

    cache.remove = function(key){
        if (! key) throw new Error("key is not provided.");
        delete storage[key];
    }
    
    return cache;
};
