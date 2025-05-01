# app.py
import gradio as gr
import os
import time
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

# Load environment variables from .env file
load_dotenv()

# --- Database Initialization ---
def initialize_database():
    """Connects to the database and creates tables if they don't exist."""
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL environment variable not set.")
        # Decide how to handle this: raise exception, exit, or run without DB?
        # For now, let's print an error and continue without DB init.
        return False

    print(f"Attempting to connect to database...")
    engine = None
    for i in range(5): # Retry connection a few times
        try:
            # Import dynamically to avoid circular import if models import app stuff
            from nexus_db.models import get_engine, create_tables
            # Use connect_args for timeout if needed, depends on driver
            # engine = get_engine(db_url, connect_args={"options": "-c statement_timeout=5000"})
            engine = get_engine(db_url)
            # Test connection
            with engine.connect() as connection:
                print("Database connection successful.")
                print("Initializing database tables (if they don't exist)...")
                create_tables(engine)
                print("Database tables checked/created.")
                return True # Indicate success
        except OperationalError as e:
            print(f"Database connection failed (Attempt {i+1}/5): {e}")
            if i < 4:
                print("Retrying in 5 seconds...")
                time.sleep(5)
            else:
                print("Could not connect to the database after multiple attempts.")
        except ImportError as e:
            print(f"Error importing database models: {e}")
            print("Ensure nexus_db/models.py exists and is importable.")
            break # Don't retry if import fails
        except Exception as e:
            print(f"An unexpected error occurred during database initialization: {e}")
            break # Don't retry unknown errors

    return False # Indicate failure

# Attempt to initialize the database when the script starts
database_initialized = initialize_database()

# --- Gradio UI Definition ---
def greet(name):
    # Placeholder function for Gradio interface
    db_status = "connected" if database_initialized else "NOT connected"
    return f"Hello {name}! Welcome to Nexus. Database status: {db_status}"

# Define the Gradio interface
with gr.Blocks() as demo:
    gr.Markdown("## Nexus - Agency UI")
    with gr.Tab("Greeting"): # Example Tab
        inp = gr.Textbox(placeholder="What is your name?")
        out = gr.Textbox()
        inp.change(greet, inp, out)

    # TODO: Add more tabs/components for Agency/Agent/Tool management here
    # Example: A tab to list Agencies from the database
    with gr.Tab("Agencies (DB Example)"):
        if database_initialized:
            # Placeholder - Add logic to query DB here
            agency_list = gr.Textbox(value="DB Connected - Agency list placeholder", interactive=False)
        else:
            gr.Markdown("Database connection failed. Cannot display agencies.")

# --- Launch Gradio App ---
if __name__ == "__main__":
    server_name = os.environ.get("GRADIO_SERVER_NAME", "127.0.0.1")
    server_port = int(os.environ.get("GRADIO_SERVER_PORT", 7860))

    print(f"Starting Gradio interface on {server_name}:{server_port}")
    demo.launch(server_name=server_name, server_port=server_port) 