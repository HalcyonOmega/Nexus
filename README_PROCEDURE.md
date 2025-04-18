# Nexus Docker Setup and Run Procedure

This document outlines the steps required to set up and run the Nexus application (Nexus UI and Backend) with PostgreSQL using Docker and Docker Compose.

## Overview

The setup uses Docker Compose to orchestrate two main services:
1.  `db`: A PostgreSQL database container.
2.  `app`: A Python container running the Gradio frontend and Nexus backend logic.

Database data is persisted using a Docker named volume.

## Prerequisites

*   **Docker:** Ensure Docker Desktop or Docker Engine is installed and running on your system. ([Install Docker](https://docs.docker.com/get-docker/))
*   **Docker Compose:** Typically included with Docker Desktop. If not, install it separately. ([Install Docker Compose](https://docs.docker.com/compose/install/))
*   **Git:** Required to clone the repository.
*   **Text Editor:** For creating/editing the `.env` file.

## Setup Steps

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Create `.env` File:**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    **Edit the `.env` file** using your text editor:
    *   **`POSTGRES_PASSWORD`**: **IMPORTANT!** Change `changeme_very_secret_password` to a strong, unique password.
    *   **`OPENAI_API_KEY`**: **IMPORTANT!** Replace `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual OpenAI API key.
    *   Review other variables (like `POSTGRES_USER`, `POSTGRES_DB`) and change them if necessary, ensuring they match across the file (e.g., in `DATABASE_URL`). The defaults should work for initial setup.

## Running the Application

1.  **Build and Start Containers:**
    Open your terminal in the project's root directory (where `docker-compose.yml` is located) and run:
    ```bash
    docker compose up --build -d
    ```
    *   `--build`: Forces Docker Compose to build the `app` image based on the `Dockerfile` if it doesn't exist or if the Dockerfile/context has changed.
    *   `-d`: Runs the containers in detached mode (in the background).

    The first time you run this, it will:
    *   Download the `postgres:16` image (if not already present).
    *   Build the `app` image using the `Dockerfile` (installing Python dependencies).
    *   Create the `nexus_network` Docker network.
    *   Create the `nexus_db_data` Docker volume.
    *   Start the `db` container. The PostgreSQL entrypoint script will initialize the database (`nexus_db`) and user (`nexus_user`) using the credentials from `.env`.
    *   Wait for the `db` container to become healthy (using the healthcheck).
    *   Start the `app` container. The `app.py` script will attempt to connect to the database and run `create_tables` from `nexus_db.models.py` to create the application schema.
    *   Launch the Gradio web server.

2.  **Accessing the UI:**
    Once the containers are running, open your web browser and navigate to:
    [http://localhost:7860](http://localhost:7860)
    (Or replace `7860` if you changed `GRADIO_SERVER_PORT` in `.env` and `docker-compose.yml`).

## Stopping the Application

To stop the running containers, execute the following command in the project's root directory:
```bash
docker compose down
```
This stops and removes the containers and the network, but **preserves the `nexus_db_data` volume**, so your database contents will remain for the next time you run `docker compose up`.

To stop the containers *and* remove the database volume (deleting all data), use:
```bash
docker compose down -v
```

## Data Persistence

The PostgreSQL database data is stored in the named Docker volume `nexus_db_data`. This volume is managed by Docker and persists even when the containers are stopped and removed (unless you use `docker compose down -v`). This ensures your agencies, agents, tools, etc., are not lost between runs.

## Troubleshooting

*   **Port Conflicts:** If you get an error about port `7860` being already allocated, ensure no other application (or another instance of this project) is using that port. You can change the host port mapping in `docker-compose.yml` (e.g., `"8080:7860"`) and access the UI at `http://localhost:8080`.
*   **`.env` File Errors:** Double-check that you copied `.env.example` to `.env` and correctly set the `POSTGRES_PASSWORD` and `OPENAI_API_KEY`.
*   **Build Failures:** Check the output of `docker compose up --build`. Errors might indicate issues in the `Dockerfile` (e.g., typos, missing system dependencies) or `requirements.txt` (e.g., incorrect package names, version conflicts).
*   **Database Connection Errors:** Look at the logs from the `app` container (`docker compose logs app`). Common issues include:
    *   Incorrect `DATABASE_URL` in `.env`.
    *   `db` container not healthy (check `docker compose logs db`).
    *   Network issues between containers (less common with Docker Compose default networking).
    *   Missing `psycopg2-binary` (should be handled by `requirements.txt` and Dockerfile).
*   **Viewing Logs:** To see the logs from the running containers:
    ```bash
    docker compose logs        # Show logs from all services
    docker compose logs -f app   # Follow logs specifically from the app service
    docker compose logs -f db    # Follow logs specifically from the db service
    ```
*   **Connecting to Database Directly (for Debugging):**
    While the database port isn't exposed by default, you can connect from within the running `app` container or use `docker exec`:
    ```bash
    # Get a shell inside the db container
    docker exec -it nexus_db_container bash

    # Connect using psql inside the container
    # You'll be prompted for the password defined in .env
    psql -U $POSTGRES_USER -d $POSTGRES_DB

    # Exit psql with \q and the container shell with exit
    ``` 