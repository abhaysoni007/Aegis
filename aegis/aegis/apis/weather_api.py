import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class WeatherAPI:
    BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

    def __init__(self):
        # Retrieve the API key from the .env file
        self.api_key = os.getenv("OPENWEATHER_API_KEY")
        if not self.api_key:
            raise ValueError("OpenWeather API key not found. Please set it in the .env file.")

    def get_weather(self, location):
        """Fetch current weather for the given location."""
        try:
            # API parameters
            params = {
                "q": location,          # Location name
                "appid": self.api_key,  # API Key
                "units": "metric"       # Temperature in Celsius
            }

            # Make the GET request
            response = requests.get(self.BASE_URL, params=params)
            data = response.json()

            # Check if the response is successful
            if response.status_code == 200:
                # Extract required weather details
                weather = {
                    "location": data["name"],
                    "temperature": data["main"]["temp"],
                    "description": data["weather"][0]["description"],
                }
                return f"Weather in {weather['location']}: {weather['temperature']}°C, {weather['description']}."
            else:
                # Handle API errors
                return f"Error: {data.get('message', 'Unable to fetch weather data.')}"
        except Exception as e:
            return f"Error: {str(e)}"
