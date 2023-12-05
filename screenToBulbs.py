#!/usr/bin/env python3

import pyautogui
import os
import time
import pyscreeze
import math
import colorsys
import requests

boxSize=100
sleepAmount=0.5
fullSize=pyautogui.size()
height=fullSize.height/2
width=fullSize.width/2

# Set your own custom ones
width=2875
height=2100

apiUrl='http://10.0.0.71:3000/api/setcolor/'
deviceIds=[
    '8023BEA879D8A0C9803F78AAF10260B81FA6D4AF', # bulb
    #'8023FDFEFF1A4374000CF2B385024A082038A2FD', # led strip
]

defaultColorh=30
defaultColors=100

#pyautogui.moveTo(width, height)
#time.sleep(5)
#print(pyautogui.position())
#time.sleep(50)

def calulate_data():
    im = pyautogui.screenshot(region=(math.floor(width-(boxSize/2)),math.floor(height-(boxSize/2)), boxSize, boxSize))

    # Calculate average color
    pixels = list(im.getdata())  # Get pixel data
    avg_color = [0, 0, 0]  # Initialize average color

    # Calculate total sum of RGB values
    total_r = sum(pixel[0] for pixel in pixels)
    total_g = sum(pixel[1] for pixel in pixels)
    total_b = sum(pixel[2] for pixel in pixels)

    # Calculate average RGB values
    num_pixels = len(pixels)
    avg_color[0] = total_r // num_pixels
    avg_color[1] = total_g // num_pixels
    avg_color[2] = total_b // num_pixels

    avg_color_rgb = tuple(avg_color)
    avg_color_hsv = colorsys.rgb_to_hsv(avg_color_rgb[0] / 255.0, avg_color_rgb[1] / 255.0, avg_color_rgb[2] / 255.0)

    print("Average Color (RGB):", avg_color_rgb)
    print("Average Color (HSV):", avg_color_hsv)

    hue = int(avg_color_hsv[0] * 360)  # Convert hue back to 0-360 range
    saturation = int(avg_color_hsv[1] * 100)  # Convert saturation to percentage

    if hue == 0:
        hue = defaultColorh

    if saturation == 0:
        saturation = defaultColors

    return (hue, saturation)

def main():
    last_hue = 0
    last_saturation = 0
    while True:
        (hue, saturation) = calulate_data()

        if hue == last_hue and last_saturation == saturation:
            time.sleep(0.5)
            continue
        
        last_hue = hue
        last_saturation = saturation

        for device_id in deviceIds:
            api_url = apiUrl+device_id 
            json_payload = {
                "hue": hue,
                "sat": saturation
            }

            # Make POST request
            response = requests.post(api_url, json=json_payload)

            # Check response status
            if response.status_code == 200:
                #print("Color successfully set!")
                pass
            else:
                print("Failed to set color. Status code:", response.status_code)

        #time.sleep(sleepAmount)

main()