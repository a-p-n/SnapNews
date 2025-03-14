# news_scraper/spiders/rss_spider.py
import scrapy
from datetime import datetime

class RSSSpider(scrapy.Spider):
    name = 'rss'
    start_urls = ['https://timesofindia.indiatimes.com/rssfeedstopstories.cms']

    def parse(self, response):
        for item in response.xpath('//item'):
            yield {
                'title': item.xpath('title/text()').get(),
                'content': item.xpath('description/text()').get(),
                'source': 'Example RSS Source',
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
