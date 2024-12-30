import os
import speech_recognition as sr
from playsound import playsound
from elevenlabs import generate_audio, save_audio, set_api_key, play_audio
from apis.weather_api import WeatherAPI
from apis.news_api import NewsAPI
from core.assistant_core import AegisCore
from difflib import SequenceMatcher

# Set your ElevenLabs API key
set_api_key("sk_bcc549fd3c2f3f60569f0c8bfbe2ba64654d05cfc736ab1b")  # Replace with your ElevenLabs API key

# Initialize TTS Engine (backup for debugging if ElevenLabs fails)
import pyttsx3
engine = pyttsx3.init()


def is_exit_query(query):
    """Check if the query is an exit command."""
    exit_keywords = ["exit", "quit", "bye", "goodbye", "see you", "stop", "end"]
    for keyword in exit_keywords:
        if keyword in query:
            return True
        if SequenceMatcher(None, query, keyword).ratio() > 0.8:  # Fuzzy matching
            return True
    return False

from elevenlabs import generate, set_api_key, play

# Set your ElevenLabs API Key
set_api_key("sk_bcc549fd3c2f3f60569f0c8bfbe2ba64654d05cfc736ab1b")  # Replace with your Eleven Labs API key

# Replace "your_voice_id_here" with the Voice ID of your generated voice
VOICE_ID = "RxFIFCtVGjv2e5nqfYP8"

def speak(text):
    """Speak the provided text using Eleven Labs API."""
    try:
        # Generate the audio using the Eleven Labs voice
        audio = generate(
            text=text,
            voice=VOICE_ID,
            model="eleven_monolingual_v1"
        )
        # Play the audio
        play(audio)
    except Exception as e:
        print(f"Error using Eleven Labs voice: {e}")




def listen():
    """Capture audio input from the user."""
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening...")
        try:
            audio = recognizer.listen(source, timeout=5)
            query = recognizer.recognize_google(audio)
            print(f"You said: {query}")
            return query.lower()
        except sr.UnknownValueError:
            return "I couldn't understand that. Please try again."
        except sr.RequestError as e:
            return "Speech recognition is not available right now."
        except Exception as e:
            return str(e)


def main():
    print("Starting Aegis Personal Assistant...")

    # Play greeting MP3
    greeting_path = "Music\Jarvismp3.mp3"  # Replace with the local path
    playsound(greeting_path)

    # Initial Greeting
    speak("Hello! I am Aegis, your personal assistant. How can I help you today?")
    print("Hello! I am Aegis, your personal assistant. How can I help you today?")

    assistant = AegisCore()
    weather_api = WeatherAPI()
    news_api = NewsAPI()  # Add your API key in news_api.py

    while True:
        try:
            print("Speak your query or type it:")
            query = listen() or input("You: ").strip().lower()

            if is_exit_query(query):  # Improved exit query detection
                speak("Goodbye! Have a great day!")
                print("Goodbye! Have a great day!")
                break

            elif "weather" in query:
                speak("Please tell me the location.")
                location = listen() or input("Enter location: ").strip()
                weather_info = weather_api.get_weather(location)
                speak(weather_info)
                print(weather_info)

            elif "news" in query:
                speak("Please specify the news category or say general.")
                category = listen() or input("Enter news category (e.g., general, technology): ").strip() or "general"
                news = news_api.get_news(category)
                speak("Here are the top headlines.")
                print(news)

            elif "time" in query or "date" in query:
                time_date_info = assistant.get_time_and_date()
                speak(time_date_info)
                print(time_date_info)

            elif "reminder" in query:
                speak("What should I remind you about?")
                reminder = listen() or input("Enter reminder: ").strip()
                speak("In how many seconds should I remind you?")
                seconds = int(listen() or input("Enter time in seconds: ").strip())
                reminder_info = assistant.set_reminder(reminder, seconds)
                speak(reminder_info)
                print(reminder_info)

            elif "to-do" in query:
                speak("Would you like to add, delete, or display tasks?")
                action = listen() or input("Add, delete, or display tasks? ").strip().lower()
                if action == "add":
                    speak("Please specify the task.")
                    task = listen() or input("Enter task: ").strip()
                    task_info = assistant.add_task(task)
                    speak(task_info)
                    print(task_info)
                elif action == "delete":
                    speak("Please specify the task to delete.")
                    task = listen() or input("Enter task to delete: ").strip()
                    task_info = assistant.delete_task(task)
                    speak(task_info)
                    print(task_info)
                elif action == "display":
                    task_list = assistant.display_tasks()
                    speak("Here are your tasks.")
                    print(task_list)
                else:
                    speak("Invalid action. Please choose add, delete, or display.")

            else:
                speak("I didn't understand that. Try asking something else.")
                print("I didn't understand that. Try asking something else.")

        except Exception as e:
            speak("An error occurred. Please try again.")
            print(f"An error occurred: {str(e)}")


if __name__ == "__main__":
    main()
