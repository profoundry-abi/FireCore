sc_require('firebase');

FireCore.DataSource = SC.DataSource.extend({

  _createdIdsToIgnore: [],

  firebaseApp: null,

  firebase: function() {
    var app = this.get('firebaseApp');

    return new Firebase('https://%@.firebaseio.com/'.fmt(app));
  }.property('firebaseApp').cacheable(),

  fetch: function(store, query) {
    var firebase = this.get('firebase'),
        self = this,
        record, type, name, ref, hash, id;

    type = query.get('recordType');
    name = self.firebaseReferenceNameFor(type);
    ref = firebase.child(name);

    /*
     * Detach any existing observers
     */
    ref.off();
    
    /*
     * Attach our new observers
     */
    ref.on('child_added', function(snapshot) {
      self.invokeNext(function() {
        var id = snapshot.name(),
            hash = self.cleanObject(snapshot.val());

        /*
         * Make sure we don't add a record that was
         * just, or is about to be, added by a call
         * to commitRecords.
         */
        if (self._createdIdsToIgnore.contains(id)) {
          self._createdIdsToIgnore.removeObject(id);
        } else {
          store.loadRecord(type, hash, id);
        }
      });
      self.scheduleRunLoop();
    });
    
    ref.on('child_changed', function(snapshot) {
      self.invokeNext(function() {
        var id = snapshot.name(),
            hash = self.cleanObject(snapshot.val());

        store.pushRetrieve(type, id, hash);
      });
      self.scheduleRunLoop();
    });
    
    ref.on('child_removed', function(snapshot) {
      self.invokeNext(function() {
        var id = snapshot.name();

        store.pushDestroy(type, id);
      });
      self.scheduleRunLoop();
    });

    return YES;
  },

  retrieveRecords: function(store, keys) {
    var firebase = this.get('firebase'),
        self = this,
        type, name, id, hash, status, ref;

    keys.forEach(function(key, index) {
      type = store.recordTypeFor(key);
      name = self.firebaseReferenceNameFor(type);
      id = store.idFor(key);
      ref = firebase.child(name).child(id);

      ref.once('value', function(snapshot) {
        hash = self.cleanObject(snapshot.val());
        status = store.readStatus(key);

        SC.run(function() {
          if (status == SC.Record.BUSY_LOADING) {
            store.dataSourceDidComplete(key, hash, id);
          } else {
            store.pushRetrieve(type, id, hash);
          }
        });
      });
    });

    return YES;
  },

  commitRecords: function(store, createKeys, updateKeys, destroyKeys, params) {
    var firebase = this.get('firebase'),
        self = this,
        type, name, hash, ref, newRef, id;

    createKeys.forEach(function(key) {
      type = store.recordTypeFor(key);
      name = self.firebaseReferenceNameFor(type);
      hash = self.cleanObject(store.readDataHash(key));
      ref = firebase.child(name);

      newRef = ref.push();
      id = newRef.name();

      // Ignore this ID in child_added calls so
      // we don't add it twice
      self._createdIdsToIgnore.pushObject(id);

      // Save the data to firebase
      newRef.set(hash);

      // Then notify the store
      store.dataSourceDidComplete(key, hash, id);
    });

    updateKeys.forEach(function(key) {
      type = store.recordTypeFor(key);
      name = self.firebaseReferenceNameFor(type);
      hash = self.cleanObject(store.readDataHash(key));
      id = store.idFor(key);
      ref = firebase.child(name).child(id);

      ref.set(hash);
      store.dataSourceDidComplete(key, hash, id);
    });

    destroyKeys.forEach(function(key) {
      type = store.recordTypeFor(key);
      name = self.firebaseReferenceNameFor(type);
      id = record.get('id');
      ref = firebase.child(name).child(id);

      ref.remove();
      store.dataSourceDidDestroy(key);
    });
  },

  firebaseReferenceNameFor: function(type) {
    if (SC.none(type) || SC.none(type.typeName) || SC.empty(type.typeName)) {
      throw new Error("SC.Records must provide a typeName property to be compatible with FireCore.");
    }

    return type.typeName.decamelize().pluralize();
  },

  scTypeNameFromSnapshot: function(snapshot) {
    return snapshot.ref().path.m[0].camelize().singularize();
  },

  cleanObject: function(object) {
    var self = this,
        type = SC.typeOf(object),
        cleaned = null, key, i, j, tmp;

    if (type == SC.T_OBJECT || type == SC.T_HASH) {
      cleaned = {};

      for (key in object) {
        if (object.hasOwnProperty(key) && !key.match(/^_/)) {
          cleaned[key] = self.cleanObject(object[key]);
        }
      }
    } else if (type == SC.T_ARRAY) {
      cleaned = [];

      for (i = 0, j = 0; i < object.length; i++) {
        tmp = self.cleanObject(object[i]);

        if (tmp) {
          cleaned[j] = tmp;
          j++;
        }
      }
    } else if (type == SC.T_FUNCTION) {
      // Do nothing, assume that functions should be ignored
    } else {
      cleaned = object;
    }

    return cleaned;
  },

  _scheduleRunLoopTimer: null,
  scheduleRunLoop: function() {
    var self = this;

    if (!this._scheduleRunLoopTimer) {
      SC.RunLoop.begin();
      this._scheduleRunLoopTimer = SC.Timer.schedule({
        target: self,
        action: '_endRunLoop',
        interval: 100
      });
      SC.RunLoop.end();
    }
  },

  _endRunLoop: function() {
    SC.RunLoop.begin(); SC.RunLoop.end();
    this._scheduleRunLoopTimer = null;
  }

});
