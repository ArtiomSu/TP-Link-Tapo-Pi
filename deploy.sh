#!/usr/bin/env bash

HOST="guest@10.0.0.71"
LOC="/home/guest/smarthome"
DEST="${HOST}:${LOC}"

#ssh $HOST rm -rf ${LOC}/*
# just delete src as node modules take forever
ssh $HOST rm -rf ${LOC}/src

scp -r ./src ${DEST}/src
scp ./.env ${DEST}/
scp ./config.json ${DEST}/
scp ./ips.json ${DEST}/
scp ./getIps.sh ${DEST}/
scp ./package.json ${DEST}/
scp ./tsconfig.json ${DEST}/

echo "installing packages"
ssh $HOST "cd ${LOC} && npm install"
echo "installing packages done"
echo "converting javascript into javascript"
ssh $HOST "cd ${LOC} && npm run build"
echo "converting javascript into javascript done"
echo "deployment done"
echo ""
echo "to start server"
echo "npm run run-server"

