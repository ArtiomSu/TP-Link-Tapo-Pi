import AllDevices from "../utils/getAllDevices";
import { ConsumptionInfo, ConsumptionInfoBulb, CustomDevice, CustomDeviceType } from "../utils/types";
const readline = require('readline');
require('dotenv').config();

const fs = require('fs')
const jsonfileData = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

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

    let devType = '';
    if(device.type === CustomDeviceType.BULB){
        devType = '';
    }else if(device.type === CustomDeviceType.LIGHT_STRIP){
        devType = '';
    }

    return {
        '': devType,
        '': `${device.name}@..${device.api.ipAddress.substring(11)}`,
        //on: `${info ? info.device_on ? 'Y' : 'N' : 'N'}`,
        '': `${info ? info.device_on ? '' : '' : ''}`,
        '': `${power ? power.today_runtime.toFixed(3) : 0}h ${power ? power.today_energy.toFixed(3) : 0}kWh`,
        '': `${power ? power.month_runtime.toFixed(3) : 0}h ${power ? power.month_energy.toFixed(3) : 0}kWh`,
        '': showInfo, 
        '': `${device.last_error ? device.last_error : ''}`
    }
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
    const table:any = [];
    for(let i in d){
        table.push(deviceToString(d[i]));
    }
    clearScreen();
    console.log("\n");
    console.table(table);
    setTimeout(()=>{
        display(obj);
    }, 1500);
}

(async() => {
    const allDevices = new AllDevices(jsonfileData, {
        pass: process.env.API_PASS,
        email: process.env.API_EMAIL,
        timeout: process.env.TIMEOUT,
    });
    await allDevices.initialiseDevices();
    display(allDevices);
})()