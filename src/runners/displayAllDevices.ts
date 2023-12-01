import AllDevices from "../utils/allDevices";
import { ConsumptionInfo, ConsumptionInfoBulb, CustomDevice, CustomDeviceType } from "../utils/types";
const readline = require('readline');
require('dotenv').config();
const Table = require('cli-table');
const colors = require('colors/safe');

const fs = require('fs')
const jsonfileData = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
let macDict:any = {};
try{
    const ips = JSON.parse(fs.readFileSync('./ips.json', 'utf-8'));
    ips.map(ip =>{
        let r = {
            ip: undefined,
            mac: undefined,
        }
        for(let addr of ip.address){
            if(addr['+@addrtype'] === 'mac'){
                r.mac = addr['+@addr'];
            }else if(addr['+@addrtype'] === 'ipv4'){
                r.ip = addr['+@addr'];
            }
        }
        if(r.mac){
            macDict[r.mac] = r.ip;
        }
        return r;
    });
}catch(e:any){
    if(e.code === 'ENOENT'){
        console.log("ips.json file not found. You can run ./getIps.sh to generate it. Its only needed if you want to use mac address mapping");
    }else{
        console.error("failed to read ips", e);
    }
}

function deviceToString(device: CustomDevice): any{
    const info:any = device.api.getSysInfo();
    const power:any = device.api.getPowerConsumption();

    let showInfo = `${power && power.current_power ? power.current_power.toFixed(3) : 0}W`;

    if(device.type === CustomDeviceType.BULB){
        showInfo = `${info ? info.brightness : 0}% ${info ? info.color_temp : 0}`;
    }else if(device.type === CustomDeviceType.LIGHT_STRIP){
        let brightness = `${info ? info.brightness : 0}%`;
        if(info.lighting_effect && info.lighting_effect.brightness && info.lighting_effect.brightness !== 0){
            brightness = `${info.lighting_effect.brightness || 0}%`;
        }
        showInfo = `${brightness} ${info ? info.color_temp : 0}`;
    }

    const on:boolean = info ? info.device_on : false;



    let devType = on ? colors.red('') : colors.gray('');
    if(device.type === CustomDeviceType.BULB){
        devType = on ? colors.yellow('') : colors.gray('');
    }else if(device.type === CustomDeviceType.LIGHT_STRIP){
        devType = on ? colors.magenta('') : colors.gray('');
    }
    const ipAdd = device.api.ipAddress.split('.');
    return [
        devType,
        //`${device.name}@..${device.api.ipAddress.substring(11)}`,
        `${device.name}`,
        `${ipAdd[ipAdd.length -1]}`,
        //`${info ? info.device_on ? colors.green('') : colors.red('') : colors.red('')}`,
        `${power ? power.today_runtime.toFixed(3) : 0}h ${power ? power.today_energy.toFixed(3) : 0}kWh`,
        `${power ? power.month_runtime.toFixed(3) : 0}h ${power ? power.month_energy.toFixed(3) : 0}kWh`,
        showInfo, 
        `${device.last_error ? device.last_error : ''}`
    ]

    //return {
    //    '': devType,
    //    '': `${device.name}@..${device.api.ipAddress.substring(11)}`,
    //    //on: `${info ? info.device_on ? 'Y' : 'N' : 'N'}`,
    //    '': `${info ? info.device_on ? '' : '' : ''}`,
    //    '': `${power ? power.today_runtime.toFixed(3) : 0}h ${power ? power.today_energy.toFixed(3) : 0}kWh`,
    //    '': `${power ? power.month_runtime.toFixed(3) : 0}h ${power ? power.month_energy.toFixed(3) : 0}kWh`,
    //    '': showInfo, 
    //    '': `${device.last_error ? device.last_error : ''}`
    //}
}

function clearScreen(){
    const blank = '\n'.repeat(process.stdout.rows);
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
}

async function display(obj: AllDevices) {
    await obj.updateDevices();
    const d = obj.getDevices();
    // const table:any = [];
    // for(let i in d){
    //     table.push(deviceToString(d[i]));
    // }
    const table = new Table({
        head: [
            '',
            '',
            '',
            //'',
            '',
            '',
            '',
            '',
        ],
        style: { 
            'padding-left': 1, 
            'padding-right': 2,
            'border': ['grey'],
            'head': ['gray'],
        },
        colAligns: ['middle', 'middle', 'middle', 'middle', 'middle', 'middle', 'middle']
    });
    for(let i in d){
        table.push(deviceToString(d[i]));
    }

    clearScreen();
    console.log("\n");
    console.table(table.toString());
    setTimeout(()=>{
        display(obj);
    }, 1500);
}

(async() => {
    const allDevices = new AllDevices(jsonfileData, macDict, {
        pass: process.env.API_PASS,
        email: process.env.API_EMAIL,
        timeout: process.env.TIMEOUT,
        interfaceIp: process.env.INTERFACE_IP
    });
    await allDevices.initialiseDevices();
    display(allDevices);
})()