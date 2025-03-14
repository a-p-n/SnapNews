# scraper.py
import requests
from bs4 import BeautifulSoup
import sqlite3
from datetime import datetime

def scrape_news(url, source_name):
    response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
    soup = BeautifulSoup(response.text, 'html.parser')
    articles = soup.find_all('div', class_='article')  # Adjust selector

    conn = sqlite3.connect('snapnews.db')
    for article in articles:
        title = article.find('h2').text.strip()
        content = article.find('div', class_='content').text.strip()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        conn.execute('''
            INSERT INTO articles (title, content, source, timestamp)
            VALUES (?, ?, ?, ?)
        ''', (title, content, source_name, timestamp))
    conn.commit()
    conn.close()

# Example usage
scrape_news('https://timesofindia.indiatimes.com/', 'TOI')
