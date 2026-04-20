from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

options = Options()
options.add_argument('--headless')
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

try:
    driver = webdriver.Chrome(options=options)
    driver.get('http://localhost:8000')
    time.sleep(2)
    for entry in driver.get_log('browser'):
        if entry['level'] == 'SEVERE':
            print("ERROR:", entry['message'])
    driver.quit()
except Exception as e:
    print(e)
