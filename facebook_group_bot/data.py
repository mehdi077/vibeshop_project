from time import sleep
from selenium.webdriver.common.by import By
import os
from selenium.webdriver.common.keys import Keys
import pyperclip
import json
import time

# def post_in_group(driver, url, image_path, body_text):
#     driver.get(url)
#     sleep(10)

#     ## press the add image button
#     try:
#         photo_button = driver.find_element(By.XPATH, "//div[contains(@class, 'x1yztbdb')]//div[contains(@class, 'x1i10hfl') and .//span[text()='Photo/video']]")
#         photo_button.click()
#         sleep(4)
#     except:
#         print("error clicking the photo button")
#         return

#     try:
#         ## upload image
#         file_name = image_path
#         absolute_path = os.path.abspath(file_name)  # Converts to absolute path
#         file_input = driver.find_element(By.XPATH, "//div[contains(@class, 'x9f619 x1n2onr6 x1ja2u2z x78zum5 xdt5ytf x2lah0s x193iq5w xurb0ha x1sxyh0 x1gslohp x12nagc xzboxd6 x14l7nz5')]//input[@type='file']")
#         file_input.send_keys(absolute_path)
#         sleep(2)
#     except:
#         print("error uploading the image")
#         return

#     try:
#         ## add a text to the body
#         text_input = driver.find_element(By.XPATH, "//div[contains(@class, 'x1ed109x')]//div[@role='textbox' and @contenteditable='true' and @aria-label='Create a public post…']")
#         # text_input.send_keys(body_text)
#         pyperclip.copy(body_text)
#         text_input.click()
#         text_input.send_keys(Keys.CONTROL + "v")

#         sleep(2)
#     except:
#         print("error adding text to the body")
#         return

    
def post_in_group(driver, url, image_path, body_text):
    # Load JSON data
    json_file = "data.json"
    existing_data = []
    if os.path.exists(json_file):
        with open(json_file, 'r', encoding='utf-8') as f:
            try:
                existing_data = json.load(f)
            except json.JSONDecodeError:
                existing_data = []

    sendable = True
    for item in existing_data:
        if item['url'] == url:
            sendable = item['sendable']
            break
    
    if not sendable:
        print(f"Skipping {url} - sendable is False")
        return
    

    driver.get(url)
    sleep(10)

    ## press the add image button
    try:
        photo_button = driver.find_element(By.XPATH, "//div[contains(@class, 'x1yztbdb')]//div[contains(@class, 'x1i10hfl') and .//span[text()='Photo/video']]")
        photo_button.click()
        sleep(4)
    except:
        print("error clicking the photo button")
        # Update sendable to False on failure
        for item in existing_data:
            if item['url'] == url:
                item['sendable'] = False
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=4, ensure_ascii=False)
        return

    try:
        ## upload image
        file_name = image_path
        absolute_path = os.path.abspath(file_name)
        file_input = driver.find_element(By.XPATH, "//div[contains(@class, 'x9f619 x1n2onr6 x1ja2u2z x78zum5 xdt5ytf x2lah0s x193iq5w xurb0ha x1sxyh0 x1gslohp x12nagc xzboxd6 x14l7nz5')]//input[@type='file']")
        file_input.send_keys(absolute_path)
        sleep(2)
    except:
        print("error uploading the image")
        # Update sendable to False on failure
        for item in existing_data:
            if item['url'] == url:
                item['sendable'] = False
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=4, ensure_ascii=False)
        return

    try:
        ## add a text to the body
        text_input = driver.find_element(By.XPATH, "//div[contains(@class, 'x1ed109x')]//div[@role='textbox' and @contenteditable='true' and @aria-label='Create a public post…']")
        pyperclip.copy(body_text)
        text_input.click()
        text_input.send_keys(Keys.CONTROL + "v")
        sleep(2)
    except:
        print("error adding text to the body")
        # Update sendable to False on failure
        for item in existing_data:
            if item['url'] == url:
                item['sendable'] = False
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=4, ensure_ascii=False)
        return
    
    try:
        # Click the post button
        post_button = driver.find_element(By.XPATH, './/div[@aria-label="Post" and @role="button"]//span[text()="Post"]/ancestor::div[@role="button"]')
        post_button.click()
        sleep(10)
    except:
        print("error clicking the post button")
        # Update sendable to False on failure
        for item in existing_data:
            if item['url'] == url:
                item['sendable'] = False
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=4, ensure_ascii=False)
        return

    driver.get(url + "my_pending_content")
    sleep(5)

    try:
        post_status = "Pending" if any(e.text == "1 post" for e in driver.find_elements(By.XPATH, '//div[contains(@class, "x1xmf6yo")]//a[contains(@href, "my_pending_content")]//span')) else "Published" if any(e.text == "1 post" for e in driver.find_elements(By.XPATH, '//div[contains(@class, "x1xmf6yo")]//a[contains(@href, "my_posted_content")]//span')) else "None"
    except:
        print("error getting post status")
        post_status = "Error"

    # If successful, update timestamp
    for item in existing_data:
        if item['url'] == url:
            item['timestamp'] = int(time.time())
            item['post_status'] = post_status
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, indent=4, ensure_ascii=False)


# def extract_group_info(driver):
#     cards = driver.find_elements(By.XPATH, "//div[@role='article']")
#     for card in cards:
#         name = card.find_element(By.XPATH, ".//a[contains(@href, 'groups') and @aria-hidden='true']").text
#         members = card.find_element(By.XPATH, ".//span[contains(text(), 'members')]").text.split(' · ')[1].split(' ')[0]
#         url = card.find_element(By.XPATH, ".//a[contains(@href, 'groups') and @aria-label='Visit']").get_attribute('href')
#         print(f"{url}")
#     print(f"Number of cards: {len(cards)}")

# def extract_group_info(driver):
    # Specify the JSON file path
    json_file = "data.json"
    
    # Load existing data if file exists
    existing_data = []
    if os.path.exists(json_file):
        with open(json_file, 'r', encoding='utf-8') as f:
            try:
                existing_data = json.load(f)
            except json.JSONDecodeError:
                existing_data = []
    
    # Get existing URLs for duplicate checking
    existing_urls = {item['url'] for item in existing_data}
    
    # Get new data from page
    cards = driver.find_elements(By.XPATH, "//div[@role='article']")
    new_entries = []
    
    for card in cards:
        try:
            name = card.find_element(By.XPATH, ".//a[contains(@href, 'groups') and @aria-hidden='true']").text
            members = card.find_element(By.XPATH, ".//span[contains(text(), 'members')]").text.split(' · ')[1].split(' ')[0]
            url = card.find_element(By.XPATH, ".//a[contains(@href, 'groups') and @aria-label='Visit']").get_attribute('href')
            
            # Check if URL already exists
            if url not in existing_urls:
                new_entries.append({
                    'name': name,
                    'members': members,
                    'url': url,
                    'timestamp': 0,
                    'sendable': True,
                    'post_status': 'None'
                })
                print(f"Added: {url}")
            else:
                print(f"Skipped (duplicate): {url}")
            print(url)                
        except Exception as e:
            print(f"Error processing card: {e}")
            continue
    
    print(f"Number of cards processed: {len(cards)}")
    print(f"Number of new entries: {len(new_entries)}")
    
    # Combine existing data with new entries
    updated_data = existing_data + new_entries
    
    # Write back to JSON file
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(updated_data, f, indent=4, ensure_ascii=False)
    
    print(f"Total entries in file: {len(updated_data)}")

def extract_group_info(driver):
    # Specify the JSON file path
    json_file = "data.json"
    
    # Load existing data if file exists
    existing_data = []
    if os.path.exists(json_file):
        with open(json_file, 'r', encoding='utf-8') as f:
            try:
                existing_data = json.load(f)
            except json.JSONDecodeError:
                existing_data = []
    
    # Get existing URLs for duplicate checking
    existing_urls = {item['url'] for item in existing_data}
    
    # Add a sleep to ensure page loads (replacing WebDriverWait)
    sleep(5)
    
    # Get new data from page
    cards = driver.find_elements(By.XPATH, "//div[@role='article']")
    new_entries = []
    
    for card in cards:
        try:
            # Extract group name
            name_element = card.find_element(By.XPATH, ".//a[@aria-hidden='true' and contains(@href, 'groups')]")
            name = name_element.text.strip()

            # Extract member count with fallback
            members = "Unknown"
            try:
                info_text = card.find_element(By.XPATH, ".//span[contains(@class, 'x1lliihq')]").text
                for part in info_text.split(' · '):
                    if 'members' in part.lower():
                        members = part.split()[0]
                        break
            except:
                print("Could not extract members count")

            # Extract URL with multiple fallbacks
            url = None
            try:
                # First try: Look for any link with 'groups' in href within the button area
                url_element = card.find_element(By.XPATH, ".//div[contains(@class, 'x1q0g3np')]//a[contains(@href, 'groups')]")
                url = url_element.get_attribute('href').split('?')[0]
            except:
                try:
                    # Second try: Look for any link with 'groups' in href
                    url_element = card.find_element(By.XPATH, ".//a[contains(@href, 'groups')]")
                    url = url_element.get_attribute('href').split('?')[0]
                except:
                    print("Could not extract URL")
                    continue

            if url and url not in existing_urls:
                new_entries.append({
                    'name': name,
                    'members': members,
                    'url': url,
                    'timestamp': 0,
                    'sendable': True,
                    'post_status': 'None'
                })
                print(f"Added: {url}")
            else:
                print(f"Skipped (duplicate or no URL): {url}")
            print(url)
                
        except Exception as e:
            print(f"Error processing card: {e}")
            continue
    
    print(f"Number of cards processed: {len(cards)}")
    print(f"Number of new entries: {len(new_entries)}")
    
    # Combine existing data with new entries
    updated_data = existing_data + new_entries
    
    # Write back to JSON file
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(updated_data, f, indent=4, ensure_ascii=False)
    
    print(f"Total entries in file: {len(updated_data)}")

def operate(driver):
    with open('data.json', 'r', encoding='utf-8') as file:
        groups_data = json.load(file)

    # Define the post content
    image_path = "post_image.png"
    body_text = "🚨⚠️ عرض محدود لشهر رمضان\nادخل رمز \"ramadan\" عند شرائك اي منتج، و استفد من تخفيض في السعر قدره 400 دج.\nتصفح كامل المنتجات المتوفرة : 👇\nhttps://vibeshop.vercel.app/"

    # Loop through each group and post
    for group in groups_data:
        if group["sendable"] and group["timestamp"] == 0:  # Only post to groups where sendable is True and timestamp is 0
            url = group["url"]
            print(f"Posting to: {group['name']} ({url})")
            try:
                post_in_group(driver, url, image_path, body_text)
                print(f"Successfully posted to {group['name']}")
            except Exception as e:
                print(f"Failed to post to {group['name']}: {str(e)}")
        else :
            print(f"Skipping {group['name']} - sendable is False or already posted")
            continue
        sleep(10)


def main(driver):
    
    
    # url = "https://web.facebook.com/groups/634980317981383/"
    # image_path = "post_image.png"
    # body_text = "🚨⚠️ عرض محدود لشهر رمضان\nادخل رمز \"ramadan\" عند شرائك اي منتج، و استفد من تخفيض في السعر قدره 400 دج.\nتصفح كامل المنتجات المتوفرة : 👇\nhttps://vibeshop.vercel.app/"
    
    # post_in_group(driver, url, image_path, body_text)

    # extract_group_info(driver)
    operate(driver)

    

    
    