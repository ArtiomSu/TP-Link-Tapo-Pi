#!/usr/bin/env bash

rm /tmp/routes.sh

su guest

cd /home/guest/smarthome

sudo ./getIps.sh && node ./genRoutes.js > /tmp/routes.sh && sudo bash /tmp/routes.sh

npm run run-server

