import P110 from "./p110";

export type CommonSysinfo = {
    nickname: string;
    device_id: string;
    model: string;
    fw_ver: string;
    hw_ver: string;
  };

export type PlugSysinfo = CommonSysinfo &{ 
    type: 'SMART.TAPOPLUG';
    mac: string;
    hw_id: string;
    fw_id: string;
    device_on: boolean;
    last_update:number;
  };

export type LightSysinfo = PlugSysinfo &{ 
    brightness: number;
  };

export type ColorLightSysinfo = LightSysinfo &{ 
    color_temp: number;
    hue: number;
    saturation: number;
  };

export type ConsumptionInfo = {
    today_runtime: number;
    month_runtime: number;
    today_energy: number;
    month_energy: number;
    current_power: number;
};

export enum CustomDeviceType {
  PLUG = 'plug',
  BULB = 'bulb',
  LIGHT_STRIP = 'light_strip',
}

export interface CustomDevice{
    api: P110;
    name: string;
    type: CustomDeviceType;
    last_error?: string;
    initialised_ok: boolean;
}


