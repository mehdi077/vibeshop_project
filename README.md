a Next.js-15 e-commerce website built from the ground, leveraging products scraped from an affiliate website.
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


here is exactly how this web app was created:

i started by creating a table schemas in convex, and based on that schema i started scraping the affiliate website.
using selenium, a usful method i found that helped me test and develop the scraper faster, is using a txt file, wich then i import it into the main python script, then when i run the main script, i can experement with code without reruning the script from  the start, just by editing the txt file. 
and improved that by creating another python file, and importing that into the txt file so its easier to work on a .py instead of .txt file, while improving code in real time. (check out "/affiliate_website_scraper").

i made the scraped output in same format used to import data in convex based on the table schema at hand, and after the scraping ended, i imported them manually into convex via thier dashboard.

i tried creating an api endpoint in nextjs to recive data from the python scraper, than writing that data into convex using custom convex apis i created in ./convex/products.ts, but the process was slower and used up a lot of convex bandwith in the process, while importing only about 5% of the data into the tables, i found manually importing data is the fastest and cheapest path (unless working with a self hosted convex wich works but i found out about that later).

once i had the product data in the db, i started working on the UI, and here where cursor was insanly usful, using nextjs 15's dynamic routes, i created the product page, category page and checkout page, build it once and have it applied for all the products based on IDs, very usful.

created relevent convex apis to read data from the db such as categories, products, productsByIDs ... ect and also write data to the db such as orders.
and convex made it so easy to fetch and write data by creating easy to use apis, wich i think would take a long time if approched with traditional methods.

and what made the development of the convex apis more fast and robust is using cursor file rules, where convex provided thiere own cursor rules in a file wich i imported to the directory of the project, and, the composer agent immidiatly was fumiliar with how to write convex specific code accuratly.

after completing a working version of the UI with all the functionalities working as expected, using images, gifs, custom tsx components and shadCn's components, i then deployed the app into vercel, and deployed the convex production mode succefully, importing the data from dev mode to the production mode. 

i tested the app, and improved some of the convex api logic to be effecient in using bandwith.

and finally, a last touch in the initial development of the UI, i created a promo code section that reduces the price by 400 (value changable using constants), and implmented it into the checkout page, where the promo code is "ramadan".

than used 2 analytics tracking solutions, google analytics and a custom provider called "posthog", as posthog worked faster than GA, but learned how to implement both in the process.

i then descovered the ability to self host convex into my local machine, using docker, so i did that, span up the slef hosted db, and imported into it the data, and i could now develope offline without any issues (myabe one issue with the product images, as i had them in the db as the same image urls used in the affiliate website, and require online connection to appear).

and now for the marketing of the store, i thought i could do somthing a little complex, by creating a bot that scrapes facebook groups i already joined in, and go through each one and posting a post in it. i did it, with tracking of wich groups already posted, and if the post is pending or pubished, and stored all the data into a clear to read json file, but no luck came from that (i already knew this might happened but i wanted to try it anyway in case if it might work out), my account got flagged for spamming (surprise surprise).

i then proceeded into implementing the facebook pixel, into all the important parts of the store, to ensure facebook tracks the important behaviours of the visitor, i did the standard pageView at the top of every page, a "Content view" event at the product page, "initial checkout" when the user visits the checkout page, an "AddPaymentInfo" when the user fills out the order form (i used COD as algerias don't know what online payments are yet), and finally the "purchase" event.

i tested the events, and everything was working properly.

i launched the ads, and i am waiting for resaults, so far, no orders yet. :)

other improvments that should be implemented :

- creating a page that is accessible with only a certain name and password, that shows the orders in a nice UI.
- improving the home page's UI further









