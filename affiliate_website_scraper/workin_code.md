url = "http://localhost:3000/api/products"

    payload = {
    "name": "Product Name",
    "price": 99.99,
    "images": ["url1.jpg", "url2.jpg"],
    "description": "Product description",
    "description_images": ["desc1.jpg", "desc2.jpg"],
    "real_images": ["real1.jpg", "real2.jpg"],
    "product_id": "unique-product-id",
    "category": "jh757x6m9np46pvbw1jdg807ms7ah7mk" 
    }

    headers = {
    "Content-Type": "application/json"
    }

    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 201:
        print("Product created successfully!")
        print("Response:", response.json())
    elif response.status_code == 400:
        print("Bad request, possibly missing fields:")
        print("Response:", response.json())
    else:
        print(f"Error occurred. HTTP Status Code: {response.status_code}")
        print("Response:", response.text)

----------------------------------------------------------------------------
----------------------------------------------------------------------------
----------------------------------------------------------------------------
----------------------------------------------------------------------------

based on such python script:
import undetected_chromedriver as uc
import json
import os
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import psutil
from time import sleep
from io import BytesIO
from PIL import Image
import csv
import importlib
import requests
import json
def kill_relevant_processes():
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            process_info = proc.info
            if process_info['name'] in ['chrome', 'chromedriver']:
                os.kill(process_info['pid'], 9)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
kill_relevant_processes()

def start_browser():
    options = uc.ChromeOptions()
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    # Define the path for the "WA" profile
    user_data_dir = os.path.join(os.getcwd(), "chrome_profiles")
    profile_dir = "WA"
    options.add_argument(f"--user-data-dir={user_data_dir}")
    options.add_argument(f'--profile-directory={profile_dir}')

    # Create the user data directory if it doesn't exist
    if not os.path.exists(user_data_dir):
        os.makedirs(user_data_dir)
    driver = uc.Chrome(options=options, version_main=132)  # Specify the Chrome version
    return driver

def control_browser(driver):
    driver.get("https://sawa9ly.app/")
    print(driver.title)  # Print the title of the page
    
    # type exit to exit >> testing code <<
    while True:
        cmd = input("Enter command: ")
        if cmd == "exit":
            break
        elif cmd == "":
            # load a txt file 
            with open('code.txt', 'r') as file:
                code = file.read()
            exec(code) # <<<< testing code
        else:
            print("Invalid command")


if __name__ == "__main__":
    driver = start_browser()
    try:
        control_browser(driver)
    finally:
        driver.quit()

-----------------------------------------
provide a one line code snippet, that stores in a variable called "images" an array of the image urls based on this following html :
<>

<>
-----------------------------------------------------
it may be the case where some images outside the specific elements i provided you have the same strucure so his code might get also those images when i rrun it at the very top of all the web page (wich here i provided only a part of whole page) optimaze the code snippit to extract only images that are specificly under the html elemetns i provided you

----------------------------------------------------------------------------
----------------------------------------------------------------------------
----------------------------------------------------------------------------
----------------------------------------------------------------------------
import get_urls
    importlib.reload(get_urls)

    catId = "jh78bpbvh2djkkkjk4gpdxzstx7ag977"
    cat_number = 1
    pages_count = 1 # << change this 

    for i in range(pages_count):
        page_number = i + 1
        driver.get(f"https://sawa9ly.app/category/{cat_number}?page={page_number}")
        sleep(2)
        print(f'visited page number {page_number} ...')
        urls = get_urls.get_urls(driver)
        for url in urls:
            product_data = get_product_data(driver, url, catId)
            post_product_data(product_data)
            print("inserted into the databas: \n ---*---", {product_data["name"]} ,"---*---")

            
----------------------------------------------------------------------------
----------------------------------------------------------------------------
----------------------------------------------------------------------------
----------------------------------------------------------------------------
catId = "jh78bpbvh2djkkkjk4gpdxzstx7ag977"
    url = "https://sawa9ly.app/product/2855"

    product_data = get_product_data(driver, url, catId)
    # for key in product_data:
       # print(key)
    post_product_data(product_data)