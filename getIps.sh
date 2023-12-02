#!/usr/bin/env bash

OUTPUT="ips.txt"

TEMPOUTPUT="/tmp/tapoips_"

# flush the cache for nmap
#sudo ip neigh flush all dev wlan0
#sudo ip neigh flush all dev eth0
sudo rm ${OUTPUT}
# nmap fking sucks for some reason.. fails to get mac
#sudo nmap -sn --host-timeout 10 10.0.0.100-254 -e wlan0 -oX nmap.txt && yq -p=xml -o=json nmap.txt | jq '.nmaprun.host' > ips.json && sudo rm nmap.txt && echo "generated ips.json successfully. This software will attempt to use it."

INTERFACE="wlan0"
IPRANGE="10.0.0."

function getmac(){
    mac=$(sudo arping -r -c 1 -i ${INTERFACE} ${IPRANGE}${1})

    if [ -n "$mac" ]; then
        echo "${mac}__${IPRANGE}${i}" > ${TEMPOUTPUT}${1}.tmp 
    fi
}



for i in {100..254}
do
    getmac $i &
done

wait $(jobs -p)

cat ${TEMPOUTPUT}*.tmp > $OUTPUT
rm ${TEMPOUTPUT}*.tmp

cat $OUTPUT


echo "Do not forget to set the INTERFACE_IP variable to one of the following"
ip a | grep 'inet '


