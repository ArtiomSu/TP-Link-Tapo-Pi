//import iro from '@jaames/iro';

class Client{
    URL = '/api/';
    AllDevices;
    //@ts-ignore
    iro:any = window.iro || {};

    CustomDeviceType = {
        PLUG: 'plug',
        BULB: 'bulb',
        LIGHT_STRIP: 'led_strip',
    };

    updateInterval:any = undefined;

    api(method:string, url:string, data:any=undefined){
        return new Promise(async (resolve, reject) => {
            let xhr = new XMLHttpRequest();

            xhr.onload = function() {
                if (xhr.status != 200) { // analyze HTTP status of the response
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
                    reject();
                } else { // show the result
                    resolve(JSON.parse(this.responseText));
                }
            };

            xhr.onerror = function() {
                console.log("error is", this.responseText);
                reject()
            };

            xhr.open(method, url);
            xhr.setRequestHeader('Content-Type', 'application/json');
            if(data !== undefined){
                xhr.send(JSON.stringify(data));
            }else{
                xhr.send();
            }
        });
    }

    async toggle(id){
        await this.api('GET', this.URL+'toggle/'+id);
        await this.api('GET', this.URL+'status');
        this.renderAllDevices();
    }

    async refresh(id){
        await this.api('GET', this.URL+'update/'+id);
        await this.api('GET', this.URL+'status');
        this.renderAllDevices();
    }

    async setBrightness(id, brightness){
        await this.api('POST', this.URL+'setcolorbrightness/'+id, {
            brightness: brightness
        });
    }

    async setKelvin(id, kelvin){
        await this.api('POST', this.URL+'setcolortemperature/'+id, {
            temperature: 1000000 / Math.trunc(kelvin)
        });
    }

    async setHSL(id, hue, sat){
        await this.api('POST', this.URL+'setcolor/'+id, {
            hue: hue,
            sat: sat
        });
    }

    openColors(id){
        if(id == 'undefined'){
            console.log("undefined id");
            return;
        }
        const container = document.getElementById(`device-controls-extra-${id}`);
        const device = this.AllDevices.find(e => e.info && e.info.device_id === id);
        if(container){
            if(container.innerHTML.length > 2){
                container.innerHTML = '';
                return;
            }
            container.innerHTML = `
            <div class="color-pickers-container">
                <div class="color-picker" id="color-picker-kelvin-${id}"></div>
                <div class="color-picker" id="color-picker-brightness-${id}"></div>
                <div class="color-picker" id="color-picker-hsl-${id}"></div>
            </div>
            `

            const c_kelvin = new this.iro.Color(`hsl(${device.info.hue}, ${device.info.saturation}%, ${device.info.brightness}%)`);
            c_kelvin.kelvin = device.info.color_temp;
            const c_brightness = new this.iro.Color(`hsl(${device.info.hue}, ${device.info.saturation}%, ${device.info.brightness}%)`);
            c_brightness.value = device.info.brightness;
            const c_hsl:any = new this.iro.Color(`hsl(${device.info.hue}, ${device.info.saturation}%, ${device.info.brightness}%)`);
            const kelvinPicker = this.iro.ColorPicker(`#color-picker-kelvin-${id}`, {
                width: 250,
                color: c_kelvin,
                display: 'flex',
                borderWidth: 0,
                borderColor: "#fff",
                layoutDirection: 'vertical',
                layout: [
                    {
                        component: this.iro.ui.Slider,
                        options: {
                            sliderType: 'kelvin',
                            sliderSize: 40,
                            minTemperature: 2500,
                            maxTemperature: 6500,
                        }
                    }
                ]
            });
            let kelvinTimeout;
            const that = this;
            kelvinPicker.on('color:change', function(color){
                if(kelvinTimeout){
                    clearTimeout(kelvinTimeout);
                }
                kelvinTimeout = setTimeout(()=>{
                    console.log("sending kelvin", color.kelvin);
                    that.setKelvin(id, color.kelvin);
                }, 1000);
                console.log("new temperature color is", color.kelvin);
            });
            const brightnessPicker = this.iro.ColorPicker(`#color-picker-brightness-${id}`, {
                width: 250,
                color: c_brightness,
                display: 'flex',
                borderWidth: 0,
                borderColor: "#fff",
                layoutDirection: 'vertical',
                layout: [
                    {
                        component: this.iro.ui.Slider,
                        options: {
                            sliderType: 'value',
                            sliderSize: 40
                        }
                    }
                ]
            });
            let brightnessTimeout;
            brightnessPicker.on('color:change', function(color){
                if(color.value === 0){
                    color.value = 1;
                }
                if(brightnessTimeout){
                    clearTimeout(brightnessTimeout);
                }
                c_hsl.l = color.value;
                brightnessTimeout = setTimeout(()=>{
                    console.log("sending brightness", color.value);
                    that.setBrightness(id, color.value);
                }, 1000);
                console.log("new brightness color is", color.value);
            });
            const hslPicker = this.iro.ColorPicker(`#color-picker-hsl-${id}`, {
                width: 250,
                color: c_hsl,
                display: 'flex',
                borderWidth: 0,
                borderColor: "#fff",
                layout: [
                    {
                        component: this.iro.ui.Wheel,
                    },
                ]
            });
            let hslTimeout;
            hslPicker.on('color:change', function(color){
                if(hslTimeout){
                    clearTimeout(hslTimeout);
                }
                hslTimeout = setTimeout(()=>{
                    console.log("sending hue", color.hsl);
                    that.setHSL(id, color.hsl.h, color.hsl.s);
                }, 1000);
                console.log("new hsl color is", color.hsl);
            });
        }
    }

    openDeviceControls(id){
        if(id == 'undefined'){
            console.log("undefined id");
            return;
        }
        console.log("opening controls for", id);
        const container = document.getElementById('device-controls-'+id);
        if(container){
            
            console.log("container html ", container.innerHTML);

            if(container.innerHTML.length > 2){
                container.innerHTML = '';
                return;
            }

            const device = this.AllDevices.find(e => e.info && e.info.device_id === id);
            if(!device){
                return;
            }

            this.clearMyInterval();

            let htmlOut = '';

            htmlOut += `
                <div class="device-controls-button device-controls-refresh" onclick="window.TapoClient.refresh('${id}')">
                    <span class="material-symbols-outlined">
                        refresh
                    </span>
                </div>
                <div class="device-controls-button device-controls-toggle" onclick="window.TapoClient.toggle('${id}')">
                    <span class="material-symbols-outlined">
                        power_rounded
                    </span>
                </div>
            `;

            if(device.type === this.CustomDeviceType.BULB || device.type === this.CustomDeviceType.LIGHT_STRIP){
                htmlOut+= `
                    <div class="device-controls-button device-controls-set-color" onclick="window.TapoClient.openColors('${id}')">
                        <span class="material-symbols-outlined">
                            palette
                        </span>
                    </div>
                `
            }

            container.innerHTML = htmlOut;
        }
    }

    renderAllDevices(){
        const container = document.getElementById('all-devices');
        if(container && this.AllDevices){
            let htmlOut = '';
            for(let device of this.AllDevices){
                const on = device.info ? device.info.device_on : false;
                let showInfo = `${device.power && device.power.current_power ? device.power.current_power.toFixed(3) : 0}W`;
                if(device.type === this.CustomDeviceType.BULB){
                    showInfo = `${device.info ? device.info.brightness : 0}% ${device.info ? device.info.color_temp : 0}k`;
                }else if(device.type === this.CustomDeviceType.LIGHT_STRIP){
                    let brightness = `${device.info ? device.info.brightness : 0}%`;
                    if(device.info && device.info.lighting_effect && device.info.lighting_effect.brightness && device.info.lighting_effect.brightness !== 0){
                        brightness = `${device.info.lighting_effect.brightness || 0}%`;
                    }
                    showInfo = `${brightness} ${device.info ? device.info.color_temp : 0}k`;
                }
                let icon = 'power';
                switch(device.type){
                    case this.CustomDeviceType.BULB:
                        icon = 'light';
                        break;
                    case this.CustomDeviceType.LIGHT_STRIP:
                        icon = 'fluorescent';
                        break;
                } 


                htmlOut+=`
                <div class="device ${!device.initialised_ok ? 'init-failed' : (on ? 'on' : 'off')}"> 
                    <div class="device-name">
                        <span class="material-symbols-outlined">${icon}</span>
                        ${device.name}
                        <span class="material-symbols-outlined highlight-button" onclick="window.TapoClient.openDeviceControls('${device.info ? device.info.device_id : undefined}')">menu</span>
                    </div>

                    <div class="row-2-columns">
                        <div class="device-power">
                            <span class="material-symbols-outlined double-grid-row-span grid-icon">
                                calendar_today
                            </span>
                            <span class="device-power-text">
                                ${device.power ? device.power.today_runtime.toFixed(3) : 0}h
                            </span>
                            <span class="device-power-text">
                                ${device.power ? device.power.today_energy.toFixed(3) : 0}kWh
                            </span>
                        </div>
                        <div class="device-power">
                            <span class="material-symbols-outlined double-grid-row-span grid-icon">
                                calendar_month
                            </span>
                            <span class="device-power-text">
                                ${device.power ? device.power.month_runtime.toFixed(3) : 0}h
                            </span> 
                            <span class="device-power-text">
                                ${device.power ? device.power.month_energy.toFixed(3) : 0}kWh
                            </span>
                        </div>

                        <div class="device-power">
                            <span class="material-symbols-outlined double-grid-row-span grid-icon">
                                wifi
                            </span>
                            <span class="device-power-text double-grid-row-span">
                                ${device.ipAddress}
                            </span>
                        </div>
                        <div class="device-power">
                            <span class="material-symbols-outlined double-grid-row-span grid-icon">
                                info
                            </span>
                            <span class="device-power-text double-grid-row-span">
                                ${showInfo}
                            </span>
                        </div>
                    </div>

                    <div class="device-error">
                        ${device.last_error ? device.last_error : ''}
                    </div>
                    <div class="device-controls" id="device-controls-${device.info ? device.info.device_id : undefined}"></div>
                    <div class="device-controls-extra" id="device-controls-extra-${device.info ? device.info.device_id : undefined}"></div>
                </div>
                `
            }
            container.innerHTML = htmlOut;
        }
    }

    async initialise(){
        const didLoad = await this.api('GET', this.URL+'initialise');
        console.log("didLoad", didLoad);
        this.AllDevices = await this.api('GET', this.URL+'status');
        this.renderAllDevices();
    }

    async reinitialise(){
        const didLoad = await this.api('GET', this.URL+'reinitialise');
        console.log("didLoad", didLoad);
        this.AllDevices = await this.api('GET', this.URL+'status');
        this.renderAllDevices();
    }

    async updateAll(){
        const didLoad = await this.api('GET', this.URL+'update');
        console.log("didLoad", didLoad);
        this.AllDevices = await this.api('GET', this.URL+'status');
        this.renderAllDevices();
    }

    async keepUpdatingToggle(){
        if(this.updateInterval){
            this.clearMyInterval();
        }else{
            this.updateInterval = setInterval(async()=>{
                await this.api('GET', this.URL+'update');
                this.AllDevices = await this.api('GET', this.URL+'status');
                this.renderAllDevices();
            }, 1000);
            const d = document.getElementById('keep-updating-button');
            if(d){
                d.classList.add('on');
            }
        }
    }

    clearMyInterval(){
        if(this.updateInterval){
            clearInterval(this.updateInterval);
            this.updateInterval = undefined;
            const d = document.getElementById('keep-updating-button');
            if(d){
                d.classList.remove('on');
            }
        }
    }



    async loaded(){
        // check if initialised
        console.log("iro should be", this.iro);
        const isok:any = await this.api('GET', this.URL+'status');
        console.log("is initialised", isok);
        if(!isok.success){
            const didLoad = await this.api('GET', this.URL+'initialise');
            console.log("didLoad", didLoad);
        }
        this.AllDevices = await this.api('GET', this.URL+'status');
        this.renderAllDevices();
        await this.api('GET', this.URL+'update');
        this.AllDevices = await this.api('GET', this.URL+'status');
        this.renderAllDevices();
    }

}




window.onload = function(){
    //@ts-ignore
    window.TapoClient = new Client();
    //@ts-ignore
    window.TapoClient.loaded();
}
