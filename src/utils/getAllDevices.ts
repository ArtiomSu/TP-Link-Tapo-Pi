import L530 from "./l530";
import L900 from "./l900";
import P110 from "./p110";
import { CustomDevice, CustomDeviceType } from "./types";

export default class AllPlugs {

    private devicesConfig;
    private secrets = {
        pass: '',
        email: '',
        timeout: 1000,
    }

    constructor(config: any[], secrets: any){
        this.devicesConfig = config;
        this.secrets = secrets;
    }

    private devices: CustomDevice[] = [];

    public async initialiseDevices():Promise<void> {
        for(let device in this.devicesConfig){
            if(this.devicesConfig[device].type){
                let whichClass:any = P110;
                if(this.devicesConfig[device].type === CustomDeviceType.BULB){
                    whichClass = L530;
                }else if(this.devicesConfig[device].type === CustomDeviceType.LIGHT_STRIP){
                    whichClass = L900;
                }

                this.devices.push(
                    {
                        api: new whichClass(this.devicesConfig[device].ip,
                            this.devicesConfig[device].email || this.secrets.email,
                            this.devicesConfig[device].pass || this.secrets.pass,
                            this.devicesConfig[device].timeout || Number(this.secrets.timeout)),
                        name: this.devicesConfig[device].name,
                        initialised_ok: false,
                        type: this.devicesConfig[device].type,
                        last_update: 0,
                        update_interval: this.devicesConfig[device].update_interval || Number(this.secrets.timeout)
                    }
                );
            }
        }

        const promises:Promise<any>[] = [];
        for(let device in this.devices){
            promises.push(this.initialiseDevice(this.devices[device]));
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

    private initialiseDevice(device: CustomDevice):Promise<any> {
        return new Promise(async (resolve, reject) => {
            const now = new Date();
            try{
                await device.api.handshake();
                await device.api.login();
                await device.api.getDeviceInfo();
                await device.api.getEnergyUsage();
                device.initialised_ok = true;
                device.last_error = undefined;
                device.last_update = now.getTime();
                resolve(device.name);
            }catch(e:any){
                device.initialised_ok = false;
                device.last_error = e.message;
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

    public getDevices(){
        return this.devices;
    }
}