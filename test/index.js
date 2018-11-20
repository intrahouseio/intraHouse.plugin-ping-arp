const child = require('child_process');
const modulepath = './index.js';

const unitid = 'plugin_pingarp'

const plugin = { debug: 'on' };
const system = { port: 4001 };

const config = [{"id":"ping_1","unit":"pinger","chan":"DI_1","desc":"DI","ip":"127.0.0.1","interval":5,"dn":"SENSOR1","dn_prop":""}];

const ps = child.fork(modulepath, [unitid]);

ps.on('message', data => {
  if (data.type === 'get' && data.tablename === `params/${unitid}`) {
    ps.send({ type: 'get', params: plugin });
  }

  if (data.type === 'get' && data.tablename === `system/${unitid}`) {
    ps.send({ type: 'get', system });
  }

  if (data.type === 'get' && data.tablename === `config/${unitid}`) {
    ps.send({ type: 'get', config });
  }

  if (data.type === 'data') {
    console.log('-------------data-------------', new Date().toLocaleString());
    console.log(data.data);
    console.log('');
  }

  if (data.type === 'channels') {
    console.log('-----------channels-----------', new Date().toLocaleString());
    console.log(data.data);
    console.log('');
  }

  if (data.type === 'debug') {
    console.log('-------------debug------------', new Date().toLocaleString());
    console.log(data.txt);
    console.log('');
  }
});

ps.on('close', code => {
  console.log('close');
});

ps.send({type: 'debug', mode: true });
