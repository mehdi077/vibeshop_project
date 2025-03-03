a Next.js 15 e-commerce website built from the ground, leveraging products scraped from an affiliate website.
deployed the final project in vercel at => https://vibeshop.vercel.app
----------------------------------------------------------------------------------------------------------
my name is mehdi bechiche, and i started this project about 3 weeks ago :
![image](https://github.com/user-attachments/assets/2ae8fc6e-348f-4920-b59b-56986d33c7a2)

the goal was to learn from it and sharpen my knowledge, and so i did.
i learned a lot from using cursor as it was the most thing that helped me build this as fast as i did, without having previous knowlegde on how things work.
the idea was simple:
- scrape product informations from an affiliate website "https://sawa9ly.app/"
![image](https://github.com/user-attachments/assets/8e20f81c-f8fd-48ed-8847-9e168d7bf912)
![image](https://github.com/user-attachments/assets/b0f35d65-d94c-4fdb-8b35-488805b6ca4a)
- using next.js 15 and convex as backend, i then create a complete online store, with categories, product page, checkout page and search, having the product content be the data scraped from the affiliate website's list of products
- add a price margin for each product, and boom, you got yourself an online e-commerce store. 


here is exactly how this web app works: (fyi i am writing this, i didn't use an AI XD)

i started by scraping the affiliate website, using selenium, and a usful method i found that helped me test and develop the scraper faster, wich is using a txt file, wich than i import it into the main python script, where when i run the script, i can experement with code without reruning the script from  the start, just by editing the txt file, and improved that by creating another python file, and importing that into the txt file so its easier to work on a .py instead of .txt while improving code in real time. (check out /)

