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


# ---------------------------------------------
def start_browser():
    options = uc.ChromeOptions()
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    # Define the path for the "WA" profile
    user_data_dir = os.path.join(os.getcwd(), "chrome_profiles")
    profile_dir = "WA"
    # profile_dir = "ME"
    options.add_argument(f"--user-data-dir={user_data_dir}")
    options.add_argument(f'--profile-directory={profile_dir}')

    # Create the user data directory if it doesn't exist
    if not os.path.exists(user_data_dir):
        os.makedirs(user_data_dir)
    driver = uc.Chrome(options=options, version_main=132)  # Specify the Chrome version
    return driver

def control_browser(driver):
    driver.get("https://web.facebook.com/")
    # print("started browser at :", driver.title)  # Print the title of the page
    
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



