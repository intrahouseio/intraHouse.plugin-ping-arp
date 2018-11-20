
const Plugin = require('./lib/plugin');

const plugin = new Plugin();
const spawn = require('child_process').spawn;

let debug = false;

const DATA = {};

plugin.on('params', params => {

});

plugin.on('channels', channels => {
    start(channels);
});

plugin.on('debug', mode => {
  debug = mode
});

function createPinger(pingitem) {
  DATA[pingitem.id] = { arpget: '', last: 0 };
  setInterval(() => macPinger(pingitem), pingitem.interval * 1000)
  macPinger(pingitem);
}


function macPinger(pingitem) {
  const arpclean = spawn("sudo", ["arp", "-d", pingitem.ip]);
  arpclean.on('exit', function (code) {
    const ping = spawn("ping", ["-c", "1", pingitem.ip]);
    ping.on('exit', function (code) {
      const arpget = spawn("arp", [pingitem.ip] );
      DATA[pingitem.id].arpget = '';
      arpget.stdout.on('data', function (data) {
        DATA[pingitem.id].arpget += data;
      });
      
      arpget.on('exit', function (code) {
        let response = 0; //Default - not found

        if(DATA[pingitem.id].last > 0 && DATA[pingitem.id].last > ((Date.now() / 1000) - pingitem.timewait))
            response = 1;

        let arptable = DATA[pingitem.id].arpget.split('\n');
        let startmac = arptable[0].indexOf("HWaddress"); //Check where MAC position start
        if (startmac > 0 && arptable[1].indexOf(pingitem.ip) == 0) {
          let checkmac = arptable[1].substring(startmac, startmac + 17).toLowerCase();
          if(checkmac.indexOf("incomplete") == -1 && checkmac.match(/^[0-9a-z:]{17}$/))
          {
            if(pingitem.mac == "" || pingitem.mac =="any" || pingitem.mac.toLowerCase() == checkmac)
            {
              response = 1;
              DATA[pingitem.id].last = Math.floor(Date.now() / 1000);
            }
          }
        }
        plugin.setChannelsData([{ id: pingitem.id, value: response, ext: {} }]);
      });
    });
  });
}

function start(items) {
  plugin.debug("version: 0.2.6");
  plugin.debug("start");
  plugin.debug("hosts: " + items.length);
  items.forEach(item => {
    createPinger(item);
  });
}
