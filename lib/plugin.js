const EventEmitter = require('events');


class Plugin extends EventEmitter {

  constructor() {
    super();
    this.unitid = process.argv[2];
    this.params = null;
    this.system = null;
    this.channels = {};

    process.on('message', this.message.bind(this));

    this.start();
  }

  parseId(string) {
    const temp = string.split('_');

    if (temp.length > 2) {
     const id = temp[temp.length - 1];
     const alias = temp.slice(0, temp.length - 1).join('_');
     return { id, alias };
    }
   return { id: temp[1], alias: temp[0] };
  }


  message(msg) {
    if (msg.type === 'get' && msg.hasOwnProperty('params')) {
      this.params = msg.params;
      if (this.params && this.system) {
        this.emit('params', { plugin: this.params, system: this.system });
      }
    }
    if (msg.type === 'get' && msg.hasOwnProperty('system')) {
      this.system = msg.system;
      if (this.params && this.system) {
        this.emit('params', { plugin: this.params, system: this.system });
      }
    }
    if (msg.type === 'get' && msg.hasOwnProperty('config')) {
      this.emit('channels', msg.config);
    }
    if (msg.type === 'act') {
      this.emit('actions', msg.data);
    }
    if (msg.type === 'command') {
      this.emit('command', msg);
    }
    if (msg.type === 'debug') {
      this.emit('debug', msg.mode);
    }
  }

  send(type, data) {
    process.send(Object.assign({}, {type}, data));
  }

  response(type, data, status = true) {
    data.response = status;
    process.send(Object.assign({}, {type}, data));
  }

  debug(data) {
    process.send({ type: 'debug', txt: data });
  }

  getId() {
    return this.unitid;
  }

  getParams() {
    return { plugin: this.params, system: this.system };
  }

  getChannels() {
    return this.chanels;
  }

  setChannels(data) {
    if (data.length) {
      data.forEach(i => {
        this.channels[i.id] = i;
      })
      this.send('channels', { data: Object.keys(this.channels).map(key => this.channels[key]) });
    }
  }

  removeChannel(id) {
    Object.keys(this.channels)
      .forEach(key => {
        const temp1 = this.parseId(key);
        const temp2 = this.parseId(id);
        if (temp1.id === temp2.id) {
          delete this.channels[key];
        }
      });
    this.send('channels', { data: Object.keys(this.channels).map(key => this.channels[key]) });
  }

  setChannelsData(data) {
    this.send('data', { data });
  }

  start() {
    this.send('get', { tablename: `params/${this.unitid}` });
    this.send('get', { tablename: `system/${this.unitid}` });
    this.send('get', { tablename: `config/${this.unitid}` });

    new Promise(resolve => {}); // main process wait 
  }



}

module.exports = Plugin;
