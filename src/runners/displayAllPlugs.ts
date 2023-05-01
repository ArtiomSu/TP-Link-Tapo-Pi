import AllPlugs from "../utils/getAllPlugs";
import { CustomDevice } from "../utils/types";
const readline = require('readline');
require('dotenv').config();

const fs = require('fs')
const jsonfileData = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

console.log("json is", jsonfileData);

function deviceToString(device: CustomDevice): any{
    const info = device.api.getSysInfo();
    const power = device.api.getPowerConsumption();

    return {
        device: `${device.name}@${device.api.ipAddress}`,
        on: `${info ? info.device_on ? 'Y' : 'N' : 'N'}`,
        today: `${power ? power.today_runtime.toFixed(3) : 0}h ${power ? power.today_energy.toFixed(3) : 0}kWh`,
        month: `${power ? power.month_runtime.toFixed(3) : 0}h ${power ? power.month_energy.toFixed(3) : 0}kWh`,
        current: `${power ? power.current_power.toFixed(3) : 0}W`,
        error: `${device.last_error ? device.last_error : ''}`
    }

    // return  `${device.name}@${device.api.ipAddress} ` +
    //         `on[${info ? info.device_on : false}] ` + 
    //         `today[${power ? power.today_runtime.toFixed(3) : 0}h] ` +
    //         `month[${power ? power.month_runtime.toFixed(3) : 0}h] ` +
    //         `today[${power ? power.today_energy.toFixed(3) : 0}kWh] ` +
    //         `month[${power ? power.month_energy.toFixed(3) : 0}kWh] ` +
    //         `current[${power ? power.current_power.toFixed(3) : 0}W] ` +
    //         `error[${device.last_error ? device.last_error : ''}] `;
}

async function display(obj: AllPlugs) {
    await obj.updateDevices();
    const d = obj.getDevices();
    const table:any = [];
    for(let i in d){
        table.push(deviceToString(d[i]));
    }

    const blank = '\n'.repeat(process.stdout.rows);
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
    console.log("\n\n");
    console.table(table);
    setTimeout(()=>{
        display(obj);
    }, 1500);
}

(async() => {
    const allPlugs = new AllPlugs(jsonfileData, {
        pass: process.env.API_PASS,
        email: process.env.API_EMAIL,
        timeout: process.env.TIMEOUT,
    });
    await allPlugs.initialiseDevices();

    console.log("devices are", allPlugs.getDevices());
    display(allPlugs);
})()