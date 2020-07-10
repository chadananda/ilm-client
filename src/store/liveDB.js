import io from 'socket.io-client';

const socket = io(process.env.LIVE_QUERY_URL);
let connection_attempts = 0;
let max_connection_attempts = 5;
socket.on('reconnect_error', () => {
  ++connection_attempts;
  if (connection_attempts >= max_connection_attempts) {
    socket.close();
  }
})

class liveDB {
  constructor() {
    this.keys = {};
    this.subscriber_id = null;
    //this.className = null;
  }

  setSubscriberId(subscriber_id) {
    this.subscriber_id = subscriber_id;
  }

  startWatch(key, className, params, callback) {
    if (this.keys[className] && this.keys[className] != key) {
      this.stopWatch(className);
    }
    if (!this.keys[className] || this.keys[className] !== key) {
      this.keys[className] = key;
      //this.className = className;

      socket.emit('start-watch', {class: className, params: params, key: key, subscriber: this.subscriber_id});

      socket.on('data-change-' + key, (data) => {
        //console.log('data-change-' + key, data);
        callback.call(this, data);
      });
      socket.on('stop-watch-all-' + key, (data) => {
        this.stopWatch(data.class);
      });
      socket.on('connect_error', (data) => {
        console.error(data)
        socket.close();
      })
    }
  }

  stopWatch(className) {
    if (this.keys[className]) {
      //console.log(socket)
      socket.emit('stop-watch', {class: className, key: this.keys[className], subscriber: this.subscriber_id});
      delete this.keys[className];
      //socket.close();
    }
  }

  stopWatchAll() {
    for (var k in this.keys) {
      socket.emit('stop-watch', {class: k, key: this.keys[k], subscriber: this.subscriber_id});
    }
  }

  onBookReimport() {
    let key = this.keys['blockV'];
    if (key) {
      socket.emit('stop-watch-all', {class: 'blockV', key});
      this.stopWatch('blockV');
    }
  }
}

export {
  liveDB
}
