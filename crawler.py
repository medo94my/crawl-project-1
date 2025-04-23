
from crawl4ai import AsyncWebCrawler, BrowserConfig,CrawlerRunConfig, CacheMode
async def crawler(url):
    data= None
    browser_config = BrowserConfig(verbose=True)
    async with AsyncWebCrawler(config=browser_config) as crawler:
        session_id ="my_session_id"
        run_config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            session_id=session_id,
        )
        result = await crawler.arun(url=url, config=run_config)
        if not result.success:
            print(f"Crawl failed: {result.error_message}")
            print(f"Status code: {result.status_code}")
        data = {
            "url": url,
            "metadata": result[0].metadata,
            "links": result[0].links,
            # "markdown": result[0].markdown,
            "success": result.success,
            "status_code": result.status_code,
            "error_message": result.error_message,
            # "html": result[0].html,
        }
    return data
