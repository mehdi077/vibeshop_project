import undetected_chromedriver as uc
import os
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import psutil
import requests
import json
from time import sleep
import importlib


# apis defs----------------
def post_text():
    url = "http://localhost:3000/api/text"

    payload = {
        "text": "hi motherfucker"
    }

    response = requests.post(
        url,
        json=payload,
        headers={"Content-Type": "application/json"}
    )

    print(response.json())

def post_product_data(product_data):
    url = "http://localhost:3000/api/products"
    
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=product_data, headers=headers)
        
        if response.status_code == 201:
            print("Product created successfully!")
            print("Response:", response.json())
        elif response.status_code == 400:
            print("Bad request, possibly missing fields:")
            print("Response:", response.json())
        else:
            print(f"Error occurred. HTTP Status Code: {response.status_code}")
            print("Response:", response.text)
            
        return response
            
    except requests.exceptions.RequestException as e:
        print(f"Error making request: {e}")
        return None

# rest --------------------
def kill_relevant_processes():
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            process_info = proc.info
            if process_info['name'] in ['chrome', 'chromedriver']:
                os.kill(process_info['pid'], 9)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
kill_relevant_processes()

# def pocess fnctions -------------------------
def get_product_data(driver, url, catId):
    driver.get(url)
    sleep(2)
    product_data = {}

    product_data['category'] = catId

    try:
        name = driver.find_element(By.XPATH, "//div[@class='flex flex-col space-y-2 text-xl']//div[@id='product-title']").text if driver.find_elements(By.XPATH, "//div[@class='flex flex-col space-y-2 text-xl']//div[@id='product-title']") else None
        product_data['name'] = name
    except Exception:
        print("Product name didn't get fetched and won't be inserted to the database")

    try:
        product_id = driver.current_url.split("/")[-1] if driver.current_url else None
        product_data['product_id'] = product_id
    except Exception:
        print("Product ID didn't get fetched and won't be inserted to the database")

    try:
        images = [img.get_attribute('src') for img in driver.find_element(By.CSS_SELECTOR, '.swiper.thumbsSliderSwiper .swiper-wrapper').find_elements(By.TAG_NAME, 'img')]
        product_data['images'] = images
    except Exception:
        print("Product images didn't get fetched and won't be inserted to the database")

    try:
        real_images = [img.get_attribute('src') for img in driver.find_element(By.CLASS_NAME, 'real_thumbsSliderSwiper').find_elements(By.TAG_NAME, 'img')]
        product_data['real_images'] = real_images
    except Exception:
        print("Product real images didn't get fetched and won't be inserted to the database")

    try:
        description_images = [img.get_attribute('src') for img in driver.find_element(By.ID, "product-description").find_elements(By.TAG_NAME, 'img') if img.get_attribute('src') != "https://ae01.alicdn.com/kf/H5f3e1509dda248af851fa25467aa04bfZ.jpg"]
        product_data['description_images'] = description_images
    except Exception:
        print("Product description images didn't get fetched and won't be inserted to the database")

    try:
        description = driver.find_element(By.ID, "product-description").text
        product_data['description'] = description
    except Exception:
        print("Product description didn't get fetched and won't be inserted to the database")

    try:
        price = driver.find_element(By.XPATH, "//div[@class='flex flex-col space-y-2 text-xl']//div[contains(@class,'font-bold') and contains(text(),'دج')]").text.replace(" دج","").replace(",","") if driver.find_elements(By.XPATH, "//div[@class='flex flex-col space-y-2 text-xl']//div[contains(@class,'font-bold') and contains(text(),'دج')]") else None
        product_data['price'] = int(price)
    except Exception:
        print("Product price didn't get fetched and won't be inserted to the database")

    return product_data

# ---------------------------------------------
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

