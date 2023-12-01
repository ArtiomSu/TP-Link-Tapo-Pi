import {ColorLightSysinfo, ConsumptionInfoBulb} from './types';
import L510E from './l510e';

export default class L530 extends L510E {

  private _colorLightSysInfo!:ColorLightSysinfo;
  private _consumption!:ConsumptionInfoBulb;

  constructor(
        public readonly ipAddress: string,
        public readonly email: string,
        public readonly password: string,
        public readonly timeout: number,
        public readonly interfaceIp: string,
  ) {
    super(ipAddress, email, password, timeout, interfaceIp);
    //console.log('Constructing L530 on host: ' + ipAddress);
    this._consumption = {
      today_runtime: 0,
      month_runtime: 0,
      today_energy: 0,
      month_energy: 0,
    };
  }

  async getDeviceInfo(): Promise<ColorLightSysinfo>{
    return super.getDeviceInfo().then(() => {
      return this.getSysInfo();
    });
  }

  async setColorTemp(color_temp:number):Promise<true>{
    const transformedColorTemp = this.transformColorTemp(color_temp);
    //console.log('Color Temp Tapo :' + transformedColorTemp);

    const roundedValue = transformedColorTemp > 6500 ? 6500 : transformedColorTemp < 2500 ? 
      2500 : transformedColorTemp;

    const payload = '{'+
              '"method": "set_device_info",'+
              '"params": {'+
                  '"hue": 0,' +
                  '"saturation": 0,' +
                  '"color_temp": ' + roundedValue +
                  '},'+
                  '"requestTimeMils": ' + Math.round(Date.now() * 1000) + ''+
                  '};';
    
    if(this.is_klap){
      return this.newHandleRequest(payload).then(()=>{
        return true;
      });
    }
    return this.handleRequest(payload).then(()=>{
      return true;
    });

  }

  async setColor(hue:number, saturation:number):Promise<boolean>{
    if(!hue){
      hue = 0;
    }
    if(!saturation){
      saturation = 0;
    }
    const payload = '{'+
              '"method": "set_device_info",'+
              '"params": {'+
                  '"hue": ' + Math.round(hue) + ','+
                  '"color_temp": 0,' +
                  '"saturation": ' + Math.round(saturation) +
                  '},'+
                  '"requestTimeMils": ' + Math.round(Date.now() * 1000) + ''+
                  '};';

    return this.sendRequest(payload);
  }

  protected setSysInfo(sysInfo:ColorLightSysinfo){
    this._colorLightSysInfo = sysInfo;
    this._colorLightSysInfo.last_update = Date.now();
  }

  public getSysInfo():ColorLightSysinfo{
    return this._colorLightSysInfo;
  }

  private transformColorTemp(value: number){
    return Math.floor(1000000 / value);
  }

  async getColorTemp(): Promise<number>{
    return super.getDeviceInfo().then(() => {
      return this.calculateColorTemp(this.getSysInfo().color_temp);
    });
  }

  calculateColorTemp(tapo_color_temp:number){
    const newValue = this.transformColorTemp(tapo_color_temp);
    return newValue > 400 ? 400 : (newValue < 154 ? 154 : newValue);
  }

  async getEnergyUsage():Promise<ConsumptionInfoBulb>{        
    const payload = '{'+
                '"method": "get_device_usage",'+
                    '"requestTimeMils": ' + Math.round(Date.now() * 1000) + ''+
                    '};';
    try{                
      let response;
      if(this.is_klap){
        response = await this.newHandleRequest(payload);
      }else{
        response = await this.handleRequest(payload);
      }

      if(response && response.result && response.result.time_usage){
        this._consumption = {
          today_runtime: response.result.time_usage.today / 60,
          month_runtime: response.result.time_usage.past30 / 60,
          today_energy: response.result.power_usage.today / 1000,
          month_energy: response.result.power_usage.past30 / 1000,
        };
      } else{
        this._consumption = {
          today_runtime: 0, 
          month_runtime: 0,
          today_energy: 0,
          month_energy: 0,
        }
      }
      return this._consumption;

    } catch(error: any){
      if(error.message.indexOf('9999') > 0){
        try{
          if(this.is_klap){
            await this.newReconnect();
          }else{
            await this.reconnect();
          }
        }catch(e){}
      }
      //return false;
      throw new Error(error.message);
    };
  }

  public getPowerConsumption():ConsumptionInfoBulb{
    return this._consumption;
  }
}