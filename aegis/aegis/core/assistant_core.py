from datetime import datetime
import time
import threading

class AegisCore:
    def __init__(self):
        print("Initializing Aegis Assistant...")

    def run(self):
        print("Aegis is now active. How can I assist you?")
        while True:
            try:
                query = input("You: ")
                if query.lower() in ["exit", "quit", "bye"]:
                    print("Goodbye! Have a great day!")
                    break
                self.process_query(query)
            except KeyboardInterrupt:
                print("\nExiting Aegis. Goodbye!")
                break

    def process_query(self, query):
        print(f"Processing: {query}")
        # Placeholder for actual query handling logic
        print("This feature is under development.")

    #Date and Time function
    def get_time_and_date(self):
        now = datetime.now()
        date = now.strftime("%Y-%m-%d")
        time = now.strftime("%H:%M:%S")
        return f"Current date is {date}, and the time is {time}."

    
    #set an alarm 
    def set_reminder(self, reminder, seconds):
        def reminder_task():
            time.sleep(seconds)
            print(f"Reminder: {reminder}")
        threading.Thread(target=reminder_task).start()
        return f"Reminder set for {seconds} seconds from now."

class AegisCore:
    def __init__(self):
        self.todo_list = []

    def add_task(self, task):
        self.todo_list.append(task)
        return f"Task '{task}' added."

    def delete_task(self, task):
        if task in self.todo_list:
            self.todo_list.remove(task)
            return f"Task '{task}' removed."
        return f"Task '{task}' not found."

    def display_tasks(self):
        if not self.todo_list:
            return "Your to-do list is empty."
        return "To-Do List:\n" + "\n".join([f"- {task}" for task in self.todo_list])
