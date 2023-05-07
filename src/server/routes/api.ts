const exp = require('express');
const router = exp.Router();
const fs = require('fs');
import AllDevices from "../../utils/allDevices";
import { CustomDevice } from "../../utils/types";

let allDevices:AllDevices; 

const intialise = async () => {
  const jsonfileData = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
  allDevices = new AllDevices(jsonfileData, {
        pass: process.env.API_PASS,
        email: process.env.API_EMAIL,
        timeout: process.env.TIMEOUT,
  });
  await allDevices.initialiseDevices();
}

router.get('/initialise', async function(req, res, next) {
  try{
    await intialise();
    return res.json({
      success: true
    })
  }catch(e){
    return res.json({
      success: false,
      error: e
    });
  }
});

router.get('/update', async function(req, res, next) {
  if(typeof allDevices === 'undefined'){
    return res.json({
      success: false,
      error: 'not initialised'
    });
  }
  try{
    await allDevices.updateDevices();
    return res.json({
      success: true
    })
  }catch(e){
    return res.json({
      success: false,
      error: e
    });
  }
});

router.get('/reinitialise', async function(req, res, next) {
  if(typeof allDevices === 'undefined'){
    return res.json({
      success: false,
      error: 'not initialised'
    });
  }
  try{
    await allDevices.reinitialiseFailedDevices();
    return res.json({
      success: true
    })
  }catch(e){
    return res.json({
      success: false,
      error: e
    });
  }
});

router.get('/update/:id', async function(req, res, next) {
  if(typeof allDevices === 'undefined'){
    return res.json({
      success: false,
      error: 'not initialised'
    });
  }
  return res.json({
    success: await allDevices.updateOneDevice(req.params.id)
  });
});

router.get('/status', async function(req, res, next) {
  if(typeof allDevices === 'undefined'){
    return res.json({
      success: false,
      error: 'not initialised'
    });
  }
  const devices = allDevices.getDevices();
  let returnArr:any[] = [];
  for(let d of devices){
    returnArr.push({
      name: d.name,
      type: d.type,
      last_error: d.last_error,
      initialised_ok: d.initialised_ok,
      last_update: d.last_update,
      ipAddress: d.api.ipAddress,
      info: d.api.getSysInfo(),
      power: d.api.getPowerConsumption()
    })
  }

  return res.json(returnArr);
});

router.get('/toggle/:id', async function(req, res, next) {
  return res.json({
    success: await allDevices.toggleDevice(req.params.id)
  });
});

router.post('/setcolor/:id',async function(req, res, next) {
  try{
    return res.json({
      success: await allDevices.setColor(req.params.id, req.body.hue, req.body.sat || 100)
    });
  }catch(e){
    return res.json({
      success: false,
      error: e 
    });
  }
});

router.post('/setcolortemperature/:id',async function(req, res, next) {
  try{
    return res.json({
      success: await allDevices.setColorTemperature(req.params.id, req.body.temperature)
    });
  }catch(e){
    return res.json({
      success: false,
      error: e 
    });
  }
});

router.post('/setcolorbrightness/:id',async function(req, res, next) {
  try{
    return res.json({
      success: await allDevices.setColorBrightness(req.params.id, req.body.brightness)
    })
  }catch(e){
    return res.json({
      success: false,
      error: e 
    });
  }
});


module.exports = router;
