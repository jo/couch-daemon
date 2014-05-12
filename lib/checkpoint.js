/* couch-daemon
 * 
 * checkpoint - store last seq in checkpoint docs
 *
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 */


var _ = require('highland');

module.exports = function(db, options) {
  options = options || {};

  // throttle writes
  // TODO: use it.
  options.throttle = options.throttle || 0;


  function isCompletedWithSelf(data) {
    return data.type === 'complete' && data.seq;
  }


  return function(source) {
    var target = _(function(push, done) {
      source
        .on('data', function(data) {
          if (isCompletedWithSelf(data)) {
            push(null, data);
            source.pause();
            // TODO: skip if checkpoint is not greater than current
            data.checkpoint = data.checkpoint || { _id: '_local/' + options.name };
            data.checkpoint.seq = data.seq;
            data.db.insert(data.checkpoint, data.checkpoint._id)
              .on('data', function(d) {
                var response = JSON.parse(d);

                if (response.ok) {
                  data.checkpoint._rev = response.rev;
                  push(null, {
                    type: 'checkpointed',
                    db: data.db,
                    checkpoint: data.checkpoint
                  });
                  return;
                }

                push(response);
              })
              .on('error', push)
              .on('end', function() {
                source.resume();
              });
          } else {
            push(data);
          }
        })
        .on('error', push);
    });

    source.on('end', function() {
      target.end();
    });

    return target;
  };
};
