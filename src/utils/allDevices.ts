import L530 from "./l530";
import L900 from "./l900";
import P110 from "./p110";
import { CustomDevice, CustomDeviceType } from "./types";

export default class AllDevices {

    private devicesConfig;
    private macDict;
    private secrets = {
        pass: '',
        email: '',
        timeout: 1000,
        interfaceIp: '127.0.0.1' 
    };

    constructor(config: any[], macDict: any, secrets: any){
        this.devicesConfig = config;
        this.secrets = secrets;
        this.macDict = macDict;
    }

    private devices: CustomDevice[] = [];

    private devicesIdDict = {};

    public async initialiseDevices():Promise<void> {
        for(let device in this.devicesConfig){
            if(this.devicesConfig[device].type && !this.devicesConfig[device].hidden){
                let whichClass:any = P110;
                if(this.devicesConfig[device].type === CustomDeviceType.BULB){
                    whichClass = L530;
                }else if(this.devicesConfig[device].type === CustomDeviceType.LIGHT_STRIP){
                    whichClass = L900;
                }

                if(this.devicesConfig[device].mac){
                    if(this.macDict[this.devicesConfig[device].mac]){
                        this.devicesConfig[device].ip = this.macDict[this.devicesConfig[device].mac];
                    }
                }

                this.devices.push(
                    {
                        api: new whichClass(this.devicesConfig[device].ip,
                            this.devicesConfig[device].email || this.secrets.email,
                            this.devicesConfig[device].pass || this.secrets.pass,
                            this.devicesConfig[device].timeout || Number(this.secrets.timeout),
                            this.secrets.interfaceIp
                        ),
                        name: this.devicesConfig[device].name,
                        initialised_ok: false,
                        type: this.devicesConfig[device].type,
                        last_update: 0,
                        update_interval: this.devicesConfig[device].update_interval || Number(this.secrets.timeout),
                        permissions: this.devicesConfig[device].permissions || []
                    }
                );
            }
        }

        const promises:Promise<any>[] = [];
        for(let device in this.devices){
            promises.push(this.initialiseDevice(this.devices[device], Number(device)));
        }

        await Promise.allSettled(promises);
        // for(let prom of values){
        //     if(prom.status === 'fulfilled'){
        //         //console.log("device", prom.value, "succeeded");
        //     }else{
        //         //console.log("device", prom.reason, "failed");
        //     }
        // }
    }

    private initialiseDevice(device: CustomDevice, index: number):Promise<any> {
        return new Promise(async (resolve, reject) => {
            const now = new Date();
            try{
                const result = await device.api.handshake();
                if(!result && device.api.is_klap){
                    await device.api.handshake_new();
                }else if(result){
                    await device.api.login();
                }
                await device.api.getDeviceInfo();
                await device.api.getEnergyUsage();
                device.initialised_ok = true;
                device.last_error = undefined;
                device.last_update = now.getTime();
                this.devicesIdDict[device.api.getSysInfo().device_id] = index;
                resolve(device.name);
            }catch(e:any){
                console.error(e);
                device.initialised_ok = false;
                device.last_error = e && e.message ? e.message : 'no error message';
                device.last_update = now.getTime();
                reject(device.name);
            }
        });
    }

    private updateDevice(device: CustomDevice):Promise<any>{
        return new Promise(async (resolve, reject) => {
            const now = new Date();
            if(device.initialised_ok && ((now.getTime() - device.last_update) > device.update_interval)){
                try{
                    await device.api.getDeviceInfo();
                    await device.api.getEnergyUsage();
                    device.last_error = undefined;
                    device.last_update = now.getTime();
                    resolve(device.name);
                }catch(e:any){
                    device.last_error = e;
                    device.last_update = now.getTime();
                    reject(device.name);
                }
            }else{
                reject(device.name);
            }
        });
    }

    public async updateDevices(): Promise<void>{
        const promises:Promise<any>[] = [];
        for(let device in this.devices){
            promises.push(this.updateDevice(this.devices[device]));
        }

        await Promise.allSettled(promises);
    }

    public async updateOneDevice(id:string): Promise<boolean>{
        if(this.devicesIdDict[id]){
            try{
                await this.updateDevice(this.devices[this.devicesIdDict[id]]);
                return true;
            }catch(e){}
        }
        return false;
    }

    public async reinitialiseFailedDevices(): Promise<void>{
        const promises:Promise<any>[] = [];
        for(let device in this.devices){
            if(!this.devices[device].initialised_ok){
                promises.push(this.initialiseDevice(this.devices[device], Number(device)));
            }
        }
        await Promise.allSettled(promises); 
    }

    public async toggleDevice(id:string): Promise<boolean>{
        if(this.devicesIdDict[id]){
            const device = this.devices[this.devicesIdDict[id]];
            if(!device.permissions.includes('power')){
                return false;
            }
            try{
                await device.api.setPowerState(!device.api.getSysInfo().device_on);
                device.api.getSysInfo().device_on = !device.api.getSysInfo().device_on;
                return true;
            }catch(e:any){
                console.error('failed to toggle', e);
                device.last_error = e;
            }
        }
        return false;
    }

    public async setColor(id:string, hue: number, saturation: number): Promise<boolean>{
        if(this.devicesIdDict[id]){
            const device = this.devices[this.devicesIdDict[id]]
            if(!device.permissions.includes('color')){
                return false;
            }
            if(device.type === CustomDeviceType.BULB || device.type === CustomDeviceType.LIGHT_STRIP){
                return await (device.api as L530).setColor(hue, saturation);
            }else{
                return false;
            }
            
        }
        return false;
    }

    public async setColorTemperature(id:string, temperature: number): Promise<boolean>{
        if(this.devicesIdDict[id]){
            const device = this.devices[this.devicesIdDict[id]]
            if(!device.permissions.includes('color')){
                return false;
            }
            if(device.type === CustomDeviceType.BULB || device.type === CustomDeviceType.LIGHT_STRIP){
                return await (device.api as L530).setColorTemp(temperature);
            }else{
                return false;
            }
            
        }
        return false;
    }

    public async setColorBrightness(id:string, brightness: number): Promise<boolean>{
        if(this.devicesIdDict[id]){
            const device = this.devices[this.devicesIdDict[id]]
            if(!device.permissions.includes('color')){
                return false;
            }
            if(device.type === CustomDeviceType.BULB || device.type === CustomDeviceType.LIGHT_STRIP){
                return await (device.api as L530).setBrightness(brightness);
            }else{
                return false;
            }
            
        }
        return false;
    }

    public getDevices(){
        return this.devices;
    }
}