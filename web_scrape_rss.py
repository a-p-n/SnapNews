# news_scraper/spiders/rss_spider.py
import scrapy
from datetime import datetime

class RSSSpider(scrapy.Spider):
    name = 'rss'
    start_urls = ['https://example-regional-news.com/rss-feed']

    def parse(self, response):
        for item in response.xpath('//item'):
            yield {
                'title': item.xpath('title/text()').get(),
                'content': item.xpath('description/text()').get(),
                'source': 'Example RSS Source',
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
