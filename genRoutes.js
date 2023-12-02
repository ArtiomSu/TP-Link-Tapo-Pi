const netIp = '10.0.0.1'
const whitelistedpattern = '10.0.0.';
const iface = 'wlan0'

const fs = require('fs');

let macDict = {};

const USE_NMAPIPS = false;

const devicesConfig = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
if(USE_NMAPIPS){
  try{
    const ips = JSON.parse(fs.readFileSync('./ips.json', 'utf-8'));
    ips.map(ip =>{
      let r = {
        ip: undefined,
        mac: undefined,
      }
      if(Array.isArray(ip.address)){
        for(let addr of ip.address){
          if(addr['+@addrtype'] === 'mac'){
            r.mac = addr['+@addr'];
          }else if(addr['+@addrtype'] === 'ipv4'){
            r.ip = addr['+@addr'];
          }
        }
      }
      if(r.mac){
        macDict[r.mac] = r.ip;
      }
      return r;
    });
  }catch(e){
    if(e.code === 'ENOENT'){
      console.log("ips.json file not found. You can run ./getIps.sh to generate it. Its only needed if you want to use mac address mapping");
    }else{
      console.error("failed to read ips", e);
    }
  }
}else{
  try{
    let ips = fs.readFileSync('./ips.txt', 'utf-8');
    ips = ips.split('\n');
    for(let line of ips){
      const split = line.split('__');
      macDict[split[0].toUpperCase()] = split[1];
    }
  }catch(e){
    if(e.code === 'ENOENT'){
      console.log("ips.txt file not found. You can run ./getIps.sh to generate it. Its only needed if you want to use mac address mapping");
    }else{
      console.error("failed to read ips", e);
    }
  }

}

for(let device in devicesConfig){
    if(devicesConfig[device].type){

        if(devicesConfig[device].mac){
            if(macDict[devicesConfig[device].mac]){
                devicesConfig[device].ip = macDict[devicesConfig[device].mac];
            }
        }

        if(devicesConfig[device].ip.startsWith(whitelistedpattern)){
            console.log(`sudo ip route add ${devicesConfig[device].ip} via ${netIp} dev ${iface}`);
        }

    }
}