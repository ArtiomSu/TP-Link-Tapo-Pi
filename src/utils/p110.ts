import P100 from './p100';
import {ConsumptionInfo} from './types';

export default class P110 extends P100 {

  private _consumption!:ConsumptionInfo;

  constructor(
        public readonly ipAddress: string,
        public readonly email: string,
        public readonly password: string,
        public readonly timeout: number,
        public readonly interfaceIp: string,
  ) {
    super(ipAddress, email, password, timeout,interfaceIp);
    //console.log('Constructing P110 on host: ' + ipAddress);
  }

  async getEnergyUsage():Promise<ConsumptionInfo>{        
    const payload = '{'+
        '"method": "get_energy_usage",'+
        '"requestTimeMils": ' + Math.round(Date.now() * 1000) + ''+
        '};';

    try{
      let response;
      if(this.is_klap){
        response = await this.newHandleRequest(payload);
      }else{
        response = await this.handleRequest(payload);
      }

      if(response && response.result){
        this._consumption = {
          today_runtime: response.result.today_runtime / 60,
          month_runtime: response.result.month_runtime / 60,
          today_energy: response.result.today_energy / 1000,
          month_energy: response.result.month_energy / 1000,
          current_power: response.result.current_power / 1000,
        };
      }else{
        this._consumption = {
          today_runtime: 0, 
          month_runtime: 0,
          today_energy: 0,
          month_energy: 0,
          current_power: 0,
        }
      }
    }catch(e){
      throw e;
    }
    
    return this._consumption;
  }

  public getPowerConsumption():ConsumptionInfo{
    return this._consumption;
  }
}