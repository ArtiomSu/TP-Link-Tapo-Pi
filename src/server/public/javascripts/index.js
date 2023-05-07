
const URL = 'http://localhost:3000/api/';

let AllDevices;

const CustomDeviceType = {
  PLUG: 'plug',
  BULB: 'bulb',
  LIGHT_STRIP: 'led_strip',
};

window.onload = function(){
    loaded();
}

function api(method, url, data=undefined){
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

async function toggle(id){
    await api('GET', URL+'toggle/'+id);
    await api('GET', URL+'status');
    renderAllDevices();
}

async function refresh(id){
    await api('GET', URL+'update/'+id);
    await api('GET', URL+'status');
    renderAllDevices();
}

async function setBrightness(id, brightness){
    await api('POST', URL+'setcolorbrightness/'+id, {
        brightness: brightness
    });
}

async function setKelvin(id, kelvin){
    await api('POST', URL+'setcolortemperature/'+id, {
        temperature: 1000000 / Math.trunc(kelvin)
    });
}

async function setHSL(id, hue, sat){
    await api('POST', URL+'setcolor/'+id, {
        hue: hue,
        sat: sat
    });
}

function openColors(id){
    if(id == 'undefined'){
        console.log("undefined id");
        return;
    }
    const container = document.getElementById(`device-controls-extra-${id}`);
    const device = AllDevices.find(e => e.info && e.info.device_id === id);
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

        const c_kelvin = new iro.Color(`hsl(${device.info.hue}, ${device.info.saturation}%, ${device.info.brightness}%)`);
        c_kelvin.kelvin = device.info.color_temp;
        const c_brightness = new iro.Color(`hsl(${device.info.hue}, ${device.info.saturation}%, ${device.info.brightness}%)`);
        c_brightness.value = device.info.brightness;
        const c_hsl = new iro.Color(`hsl(${device.info.hue}, ${device.info.saturation}%, ${device.info.brightness}%)`);
        const kelvinPicker = new iro.ColorPicker(`#color-picker-kelvin-${id}`, {
            width: 250,
            color: c_kelvin,
            display: 'flex',
            borderWidth: 0,
            borderColor: "#fff",
            layoutDirection: 'vertical',
            layout: [
                {
                    component: iro.ui.Slider,
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
        kelvinPicker.on('color:change', function(color){
            if(kelvinTimeout){
                clearTimeout(kelvinTimeout);
            }
            kelvinTimeout = setTimeout(()=>{
                console.log("sending kelvin", color.kelvin);
                setKelvin(id, color.kelvin);
            }, 1000);
            console.log("new temperature color is", color.kelvin);
        });
        const brightnessPicker = new iro.ColorPicker(`#color-picker-brightness-${id}`, {
            width: 250,
            color: c_brightness,
            display: 'flex',
            borderWidth: 0,
            borderColor: "#fff",
            layoutDirection: 'vertical',
            layout: [
                {
                    component: iro.ui.Slider,
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
                setBrightness(id, color.value);
            }, 1000);
            console.log("new brightness color is", color.value);
        });
        const hslPicker = new iro.ColorPicker(`#color-picker-hsl-${id}`, {
            width: 250,
            color: c_hsl,
            display: 'flex',
            borderWidth: 0,
            borderColor: "#fff",
            layout: [
                {
                    component: iro.ui.Wheel,
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
                setHSL(id, color.hsl.h, color.hsl.s);
            }, 1000);
            console.log("new hsl color is", color.hsl);
        });
    }
}

function openDeviceControls(id){
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

        const device = AllDevices.find(e => e.info && e.info.device_id === id);
        if(!device){
            return;
        }

        clearMyInterval();

        let htmlOut = '';

        htmlOut += `
            <div class="device-controls-button device-controls-refresh" onclick="refresh('${id}')">
                <span class="material-symbols-outlined">
                    refresh
                </span>
            </div>
            <div class="device-controls-button device-controls-toggle" onclick="toggle('${id}')">
                <span class="material-symbols-outlined">
                    power_rounded
                </span>
            </div>
        `;

        if(device.type === CustomDeviceType.BULB || device.type === CustomDeviceType.LIGHT_STRIP){
            htmlOut+= `
                <div class="device-controls-button device-controls-set-color" onclick="openColors('${id}')">
                    <span class="material-symbols-outlined">
                        palette
                    </span>
                </div>
            `
        }

        container.innerHTML = htmlOut;
    }
}

function renderAllDevices(){
    const container = document.getElementById('all-devices');
    if(container && AllDevices){
        let htmlOut = '';
        for(device of AllDevices){
            const on = device.info ? device.info.device_on : false;
            let showInfo = `${device.power && device.power.current_power ? device.power.current_power.toFixed(3) : 0}W`;
            if(device.type === CustomDeviceType.BULB){
                showInfo = `${device.info ? device.info.brightness : 0}% ${device.info ? device.info.color_temp : 0}k`;
            }else if(device.type === CustomDeviceType.LIGHT_STRIP){
                let brightness = `${device.info ? device.info.brightness : 0}%`;
                if(device.info && device.info.lighting_effect && device.info.lighting_effect.brightness && device.info.lighting_effect.brightness !== 0){
                    brightness = `${device.info.lighting_effect.brightness || 0}%`;
                }
                showInfo = `${brightness} ${device.info ? device.info.color_temp : 0}k`;
            }
            let icon = 'power';
            switch(device.type){
                case CustomDeviceType.BULB:
                    icon = 'light';
                    break;
                case CustomDeviceType.LIGHT_STRIP:
                    icon = 'fluorescent';
                    break;
            } 


            htmlOut+=`
            <div class="device ${!device.initialised_ok ? 'init-failed' : (on ? 'on' : 'off')}"> 
                <div class="device-name">
                    <span class="material-symbols-outlined">${icon}</span>
                    ${device.name}
                    <span class="material-symbols-outlined highlight-button" onclick="openDeviceControls('${device.info ? device.info.device_id : undefined}')">menu</span>
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

async function initialise(){
    const didLoad = await api('GET', URL+'initialise');
    console.log("didLoad", didLoad);
    AllDevices = await api('GET', URL+'status');
    renderAllDevices();
}

async function reinitialise(){
    const didLoad = await api('GET', URL+'reinitialise');
    console.log("didLoad", didLoad);
    AllDevices = await api('GET', URL+'status');
    renderAllDevices();
}

async function updateAll(){
    const didLoad = await api('GET', URL+'update');
    console.log("didLoad", didLoad);
    AllDevices = await api('GET', URL+'status');
    renderAllDevices();
}

async function keepUpdatingToggle(){
    if(updateInterval){
        clearMyInterval();
    }else{
        updateInterval = setInterval(async()=>{
            await api('GET', URL+'update');
            AllDevices = await api('GET', URL+'status');
            renderAllDevices();
        }, 1000);
        const d = document.getElementById('keep-updating-button');
        if(d){
            d.classList.add('on');
        }
    }
}

function clearMyInterval(){
    if(updateInterval){
        clearInterval(updateInterval);
        updateInterval = undefined;
        const d = document.getElementById('keep-updating-button');
        if(d){
            d.classList.remove('on');
        }
    }
}


let updateInterval = undefined;

async function loaded(){
    // check if initialised
    const isok = await api('GET', URL+'status');
    console.log("is initialised", isok);
    if(!isok.success){
        const didLoad = await api('GET', URL+'initialise');
        console.log("didLoad", didLoad);
    }
    AllDevices = await api('GET', URL+'status');
    renderAllDevices();
    await api('GET', URL+'update');
    AllDevices = await api('GET', URL+'status');
    renderAllDevices();
}