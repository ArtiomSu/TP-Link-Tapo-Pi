# Tapo Tools

Designed to control and monitor tapo devices from a raspberry pi 2b connect via ethernet to the main network and wifi to the guest network where the tapo smart devices are. So the api and web app is only accessible via the main network, but sends the requests to control the tapo devices over the guest network.

Also has some fun things like a cli, web UI. A python script that updates the bulbs to the average colour of your screen etc.

This project wouldn't have been possible without the hard work gone into this project https://github.com/apatsufas/homebridge-tapo-p100. I don't use homebridge so decided to make a standalone version with its own frontend etc.

# Video Demo and Guide

[![video guide and demo](https://img.youtube.com/vi/wu_cVN6Noyg/0.jpg)](https://www.youtube.com/watch?v=wu_cVN6Noyg)

# Dependancies
```bash
sudo apt install nodejs nmap jq arping

VERSION=v4.40.3
BINARY=yq_linux_arm

wget https://github.com/mikefarah/yq/releases/download/${VERSION}/${BINARY}.tar.gz -O - | tar xz && sudo mv ${BINARY} /usr/bin/yq
```

# Setup

1. Create a `.env` file with the following values

```
API_PASS="Your tapo account password"
API_EMAIL="Your tapo account email"
TIMEOUT="1500"
PORT="3000"
BIND_ADDRESS="10.0.0.2"

```
The default timeout is in milliseconds in this case its 1.5 seconds. which is fine for devices nearby. Timeout can be set per device.

Bind address is the ip you want the server to run on. This is needed to not expose the server to the guest network.


2. You will need to create a config file in the main folder and call it `config.json`

The config file looks like this. some of the fields are optional and will just use default values if not specified. 

```json
[
    {
        "name": "Laptop",
        "ip": "192.168.189.15",
        "mac": "AB:CD:EF:FE:ED:EE",
        "pass": null,
        "email": null,
        "timeout": null,
        "type": "plug",
        "permissions": ["power"]
    },
    {
        "name": "Office",
        "ip": "192.168.189.13",
        "mac": "FF:AA:BB:11:22:33",
        "pass": null,
        "email": null,
        "timeout": null,
        "update_interval": 5000,
        "type": "bulb",
        "permissions": ["power", "color"],
        "hidden": false,
    }
]
```

mac is optional, but recommended as it will never change unlike ip address. and needed for some of the tools.

pass and email can be supplied here if you are using some devices with a different account.

timeout can be supplied in milliseconds if you want to increase it for devices far away from the wifi router.

update_interval can be increased too for devices far away from the wifi router.

type determines what type of device this is. This is very important. Currently the device types supported are 'bulb', 'plug', 'led_strip'.

permissions need to be set in order to toggle the power or change the led colours. If nothing is supplied you will only be able to monitor that device.

hidden just means ignore this device from the config. The api won't know it exists.

# Tools
There are a number of different js and bash scripts in the repo to help with certain things.

### getIps.sh

Will get the ip addresses and the mac address from all devices on your network. This will be where that mac address lookup comes in for the api.

it will create a file called ips.json which the api will lookup and replace the ip from the config with the matching ip in this file.

### genRoutes.js

This will generate the route commands to forward traffic to and from the wifi adapter to the ethernet adapter. It will only generate it for ips in the config.json.

Note: you need to rerun this everytime you restart the raspbery pi.

### deploy.js

This will deploy the code to the raspberry pi, and build it.


# Running on one network

If you don't have seperate networks, then you can just run `npm install && npm run server`

# Running on ethernet and guest wifi network

For this you need to run `deploy.js` and generate the routes otherwise you might have issues sending commands to the tapo devices.

then you can just run `npm install && npm run server`

# User Interfaces

## API + Website

Running `npm run server` will start the api, which also hosts a simple javascript website on your port you specified in the config. If you want to use port 80 make sure to run this whole thing as root.

## CLI only

Run `npm run monitor` which will run a cli app in the terminal allowing you to monitor the statuses, this is only really handy if you are planning on running it on your main pc.

## API + CLI

Run `npm run server` to start the api. To start the http client monitor run `node monitorClient.js` This will display the same output as the CLI only version but it will querry the api server instead, so that you can have the best of both worlds.

# Systemd Service

You can use the included systemd service if your setup is the same as mine. The service will grap the ips and create routes before starting the api.

To create the service do the following

```sh
sudo cp tapoSystemd.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable tapoSystemd.service
sudo systemctl start tapoSystemd.service

```

# Screen to Bulbs

This will send the average colour of the centre of your screen to your bulbs

## Install and run
```
python -m venv venv
./venv/bin/pip3 install pyautogui
./venv/bin/pip3 install requests
./venv/bin/python3 ./screenToBulbs.py
```

Make sure to edit the values in that script to your own ones. specifically the device ids
