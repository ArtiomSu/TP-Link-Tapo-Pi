const axios = require('axios');
const Table = require('cli-table');
const colors = require('colors/safe');
const readline = require('readline');

const url = 'http://10.0.0.71:3000/api/';

const updateInterval = 1000;

function deviceToString(device){
    const info = device.info;
    const power = device.power;

    let showInfo = `${power && power.current_power ? power.current_power.toFixed(3) : 0}W`;

    if(device.type === 'bulb'){
        showInfo = `${info ? info.brightness : 0}% ${info ? info.color_temp : 0}`;
    }else if(device.type === 'light_strip'){
        let brightness = `${info ? info.brightness : 0}%`;
        if(info.lighting_effect && info.lighting_effect.brightness && info.lighting_effect.brightness !== 0){
            brightness = `${info.lighting_effect.brightness || 0}%`;
        }
        showInfo = `${brightness} ${info ? info.color_temp : 0}`;
    }

    const on = info ? info.device_on : false;

    let devType = on ? colors.red('') : colors.gray('');
    if(device.type === 'bulb'){
        devType = on ? colors.yellow('') : colors.gray('');
    }else if(device.type === 'light_strip'){
        devType = on ? colors.magenta('') : colors.gray('');
    }
    const ipAdd = device.ipAddress.split('.');
    return [
        devType,
        `${device.name}`,
        `${ipAdd[ipAdd.length -1]}`,
        `${power ? power.today_runtime.toFixed(3) : 0}h ${power ? power.today_energy.toFixed(3) : 0}kWh`,
        `${power ? power.month_runtime.toFixed(3) : 0}h ${power ? power.month_energy.toFixed(3) : 0}kWh`,
        showInfo, 
        `${device.last_error ? device.last_error : ''}`
    ]
}

function clearScreen(){
    const blank = '\n'.repeat(process.stdout.rows);
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
}

async function display(d) {
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
}

(async() => {
    while(true){
        try{
            const updateRes = await axios.get(url+'update');
            if(updateRes && updateRes.data){
                if(updateRes.data.success === false && updateRes.data.error === 'not initialised'){
                    console.log("initialising api please wait");
                    await axios.get(url+'initialise');
                }
            }else{
                console.log(updateRes.data);
                console.log('unknown error exiting');
                return;
            }
            const res = await axios.get(url+'status');
            const devices = res.data;
            if(!devices || devices.length === 0){
                console.log("no devices from api, exiting");
                return;
            }
            display(devices);
        }catch(e){
            console.error("failed to get", e);
            return;
        }
        await new Promise((resolve, reject) =>{
            setTimeout(()=>{resolve()},updateInterval);
        });
    }
})()