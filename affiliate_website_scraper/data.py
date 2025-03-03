from selenium.webdriver.common.by import By
import json
from time import sleep

def get_urls(driver):
    product_urls = product_urls = [a.get_attribute('href') for a in driver.find_elements(By.XPATH, "//div[contains(@class, 'grid-cols-2') and contains(@class, 'md:grid-cols-6')]//a")]
    return product_urls

def write_product_to_json(product_data, cat_page_number):
    try:
        # Try to read existing data
        try:
            with open(f'cat_{cat_page_number}.json', 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                if not isinstance(existing_data, list):
                    existing_data = []
        except (FileNotFoundError, json.JSONDecodeError):
            existing_data = []
        
        # Append new product data
        existing_data.append(product_data)
        
        # Write back to file
        with open(f'cat_{cat_page_number}.json', 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
            
        print(f"Successfully wrote product data to cat_{cat_page_number}.json")
    except Exception as e:
        print(f"Error writing to cat_{cat_page_number}.json: {str(e)}")

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

def check_existing_products(urls, cat_page_number):
    try:
        # Read existing data from output.json
        try:
            with open(f'cat_{cat_page_number}.json', 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                if not isinstance(existing_data, list):
                    existing_data = []
        except (FileNotFoundError, json.JSONDecodeError):
            existing_data = []
        
        # Extract existing product IDs
        existing_ids = set(item.get('product_id') for item in existing_data if item.get('product_id'))
        
        # Check each URL's product ID
        new_urls = []
        all_exist = True
        
        for url in urls:
            product_id = url.split("/")[-1]
            if product_id not in existing_ids:
                all_exist = False
                new_urls.append(url)
        
        return not all_exist, new_urls
    except Exception as e:
        print(f"Error checking existing products: {str(e)}")
        return True, urls

def old(driver):
    # catId = "jh78bpbvh2djkkkjk4gpdxzstx7ag977" # >> 1
    # catId = "jh7drapbgcp0tvde6785g6pek17agpct" # >> 2
    # catId = "jh7f459hwdv9zht1wfvptzxdyn7agy2b" # >> 3
    # catId = "jh75htsnkj4yythrjr65ta77yh7ag21g" # >> 4
    # catId = "jh7a36nf8zjcs2cpqrdfra3d4d7ags54" # >> 5
    # catId = "jh7b1qc314j1f5tzbma1vv5wmh7ahz7g" # >> 6
    # catId = "jh7fr8p67k11k4na0za6mpx8ss7ag9d2" # >> 7
    # catId = "jh788bfv78rc1jdkh75k809b7x7ag7c9" # >> 8
    # catId = "jh7azpfvrj99dpytdb09s0zcq57ahtjk" # >> 9 
    # catId = "jh752w9f9bcr1sstypzjtb3g097ag31a" # >> 10
    # catId = "jh7c98xfcx1mcn9g0ypcq8ahc57agd6p" # >> 11
    # catId = "jh73w8ceanbm9wqr6wq8tk6mj57aggnh" # >> 12
    # catId = "jh70h8s1pj3pmsg30hq6k186497agem1" # >> 13
    # catId = "jh7agswn9fwfbbw80mbp820y4n7ahdjd" # >> 14
    # catId = "jh7dn0fpzxjre0yjy05qx48j8n7agjh6" # >> 15
    # catId = "jh70z4cwzzersc4726a8fyawws7ag6m0" # >> 17
    # catId = "jh77g11z4r4g3pnmerf2dxrbw97ahvtg" # >> 18
    # catId = "jh7fgpjnjhz8v5y8dstbaskrdd7agqd8" # >> 20
    # catId = "jh7c5bzs0mh1y2vfaqdf1dnpen7ag0jz" # >> 22
    # catId = "jh77ydygprh3gckz9krx10kvk57ahgh4" # >> 23
    # catId = "jh79hfr2t1wbr2pextnystqe4d7ah3f5" # >> 24
    catId = "jh76f651k30k32z9112c2m9g257am5xa" # >> 26
    # catId = "" # >> X

    cat_page_number = 26 # << change this
    pages_count = 2 # << change this 
    found_new_products = False

    for i in range(pages_count):
        page_number = i + 1
        driver.get(f"https://sawa9ly.app/category/{cat_page_number}?page={page_number}")
        sleep(2)
        print(f'visited page number {page_number} ...')
        urls = get_urls(driver)
        
        # Only check for existing products if we haven't found new ones yet
        if not found_new_products:
            should_process, filtered_urls = check_existing_products(urls, cat_page_number)
            if not should_process:
                print(f"All products from page {page_number} already exist, moving to next page...")
                continue
            found_new_products = True
            print(f"Found new products starting from page {page_number}, will process all subsequent pages without checking")
        else:
            filtered_urls = urls  # Skip checking if we already found new products
            
        print(f"Processing {len(filtered_urls)} products from page {page_number}")
        for url in filtered_urls:
            product_data = get_product_data(driver, url, catId)
            write_product_to_json(product_data, cat_page_number)

    # when done go to categories page
    driver.get("https://sawa9ly.app/categories")

def extract_delivery_data(driver):
    delivery_data = []
    elements = driver.find_elements(By.CSS_SELECTOR, "body > div:nth-child(2) > section > div.grid.grid-cols-1.lg\\:grid-cols-3.gap-2.m-2.text-sm > div")

    for element in elements:
        try:
            wilaya_code = element.find_element(By.XPATH, ".//div[@class='w-2/5']").text.split(" ")[0]
            wilaya_name = element.find_element(By.XPATH, ".//div[@class='w-2/5']").text.split("- ")[1].strip()
            address = element.find_element(By.XPATH, ".//div[@class='w-2/5']//div[@class='text-sm text-gray-500'][1]").text.replace("\xa0", " ").strip()
            delay = element.find_element(By.XPATH, ".//div[@class='w-2/5']//div[@class='text-sm text-gray-500'][2]").text.strip()
            price = element.find_element(By.XPATH, ".//div[@class='w-1/5 ']").text.strip()
            delivery_office_price = element.find_element(By.XPATH, ".//div[@class='w-2/5'][2]").text.strip()

            delivery_data.append({
                "wilaya_code": wilaya_code,
                "wilaya_name": wilaya_name,
                "address": address,
                "delay": delay,
                "price": price,
                "delivery_office_price": delivery_office_price
            })
        except Exception as e:
            print(f"Error extracting data from element: {e}")
            continue # Skip to the next element if there's an error

    return delivery_data

def main(driver):
    delivery_info = extract_delivery_data(driver)
    if delivery_info:
        delivery_json = json.dumps(delivery_info, indent=4, ensure_ascii=False) #ensure_ascii=False for Arabic
        with open("livrison.json", "w", encoding="utf-8") as f: json.dump(delivery_info, f, indent=4, ensure_ascii=False)