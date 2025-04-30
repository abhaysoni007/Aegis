import requests
import json

class NewsAPI:
    def __init__(self, api_key=""):
        self.base_url = "https://newsapi.org/v2/top-headlines"
        self.api_key = api_key

    def get_news(self, category="general", country="us"):
        """
        Fetch the latest news headlines from the NewsAPI.
        :param category: Category of news (e.g., general, technology, business, sports).
        :param country: Country code for news (default is 'us').
        :return: Formatted string containing news headlines.
        """
        params = {
            "apiKey": self.api_key,
            "category": category,
            "country": country,
            "pageSize": 5  # Limit to 5 headlines
        }

        try:
            response = requests.get(self.base_url, params=params)
            if response.status_code == 200:
                news_data = response.json()
                articles = news_data.get("articles", [])
                if not articles:
                    return "No news articles found for this category."

                headlines = "Here are the top news headlines:\n"
                for i, article in enumerate(articles, 1):
                    title = article.get("title", "No title available")
                    source = article.get("source", {}).get("name", "Unknown source")
                    headlines += f"{i}. {title} (Source: {source})\n"

                return headlines
            else:
                return f"Failed to fetch news. Status code: {response.status_code}"
        except requests.exceptions.RequestException as e:
            return f"An error occurred while fetching news: {str(e)}"
