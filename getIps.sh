#!/usr/bin/env bash

sudo nmap -sn --host-timeout 500 10.0.0.100-254 -e wlan0 -oX nmap.txt && yq -p=xml -o=json nmap.txt | jq '.nmaprun.host' > ips.json && sudo rm nmap.txt && echo "generated ips.json successfully. This software will attempt to use it."

echo "Do not forget to set the INTERFACE_IP variable to one of the following"
ip a | grep 'inet '


