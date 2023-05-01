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
            this.devices.push(
                {
                    api: new P110(this.devicesConfig[device].ip,
                        this.devicesConfig[device].email || this.secrets.email,
                        this.devicesConfig[device].pass || this.secrets.pass,
                        this.devicesConfig[device].timeout || Number(this.secrets.timeout)),
                    name: this.devicesConfig[device].name,
                    initialised_ok: false,
                    type: this.devicesConfig[device].type || CustomDeviceType.PLUG,
                }
            )
        }

        const promises:Promise<any>[] = [];
        for(let device in this.devices){
            promises.push(this.initialiseDevice(this.devices[device]));
        }

        const values = await Promise.allSettled(promises);
        for(let prom of values){
            if(prom.status === 'fulfilled'){
                //console.log("device", prom.value, "succeeded");
            }else{
                //console.log("device", prom.reason, "failed");
            }
        }
    }

    private initialiseDevice(device: CustomDevice):Promise<any> {
        return new Promise(async (resolve, reject) => {
            try{
                await device.api.handshake();
                console.log("handshake ok", device.name);
                await device.api.login();
                console.log("login ok", device.name);
                const info = await device.api.getDeviceInfo();
                console.log("info is ok", device.name);
                const consumption = await device.api.getEnergyUsage();
                console.log("consumption is ok", device.name);
                device.initialised_ok = true;
                device.last_error = undefined;
                resolve(device.name);
            }catch(e:any){
                device.initialised_ok = false;
                device.last_error = e.message;
                reject(device.name);
            }
        });
    }

    private updateDevice(device: CustomDevice):Promise<any>{
        return new Promise(async (resolve, reject) => {
            if(device.initialised_ok){
                try{
                    await device.api.getDeviceInfo();
                    await device.api.getEnergyUsage();
                    device.last_error = undefined;
                    resolve(device.name);
                }catch(e:any){
                    device.last_error = e;
                    reject(device.name);
                }
            }else{
                console.log("device failed to update", device.name);
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