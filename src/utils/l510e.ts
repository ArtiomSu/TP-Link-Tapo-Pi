import { LightSysinfo } from './types';
import P100 from './p100';

export default class L510E extends P100 {

  private _lightSysInfo!:LightSysinfo;

  constructor(
        public readonly ipAddress: string,
        public readonly email: string,
        public readonly password: string,
        public readonly timeout: number,
  ) {
    super(ipAddress, email, password, timeout);
    //console.log('Constructing L510E on host: ' + ipAddress);
  }

  async getDeviceInfo(): Promise<LightSysinfo>{
    try{
      await super.getDeviceInfo();
    }catch(e){
      throw e;
    }
    return this.getSysInfo();
  }

  async setBrightness(brightness:number):Promise<boolean>{
    const payload = '{'+
              '"method": "set_device_info",'+
              '"params": {'+
                  '"brightness": ' + brightness +
                  '},'+
                  '"requestTimeMils": ' + Math.round(Date.now() * 1000) + ''+
                  '};';

    return this.sendRequest(payload);
  }

  protected setSysInfo(sysInfo:LightSysinfo){
    this._lightSysInfo = sysInfo;
    this._lightSysInfo.last_update = Date.now();
  }

  public getSysInfo():LightSysinfo{
    return this._lightSysInfo;
  }
}