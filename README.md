# ProNotes Sticky Notes App

ProNotes is a modern, responsive sticky notes application designed to help you organize your thoughts, tasks, and reminders efficiently. It features dynamic note management, search functionality, pinning important notes, due date tracking, and data export/import capabilities. In its current state, ProNotes leverages a Node.js Express backend with a PostgreSQL database for persistent storage and includes an integration with the `scripture.api.bible` to display daily inspirational verses.

## Features

* **Dynamic Note Creation:** Easily add new notes with a text input and optional due dates.
* **Persistent Storage:** Notes are saved to a PostgreSQL database via a Node.js/Express backend.
* **Search Functionality:** Quickly find notes by searching their content.
* **Pin Important Notes:** Pin notes to keep them at the top of your list for quick access.
* **Editable Notes:** Double-click on a note's text to edit its content directly.
* **Due Date Tracking:** Assign due dates to notes and easily identify overdue items.
* **Export/Import Notes:**
    * **Export:** Download all your notes as a JSON file for backup.
    * **Import:** Upload a JSON file to either merge with existing notes or replace them entirely (client-side operation).
* **Responsive Design:** Optimized for various screen sizes, from desktop to mobile.
* **Inspirational Bible Verse Integration:** Displays a random Bible verse fetched from the `scripture.api.bible` API (proxied through the backend).
* **Confirmation Modals:** Ensures accidental deletions are prevented with a confirmation prompt.

## Technologies Used

### Frontend (Client-side)

* **HTML5:** Structure of the web application.
* **CSS3:** Styling and responsive design.
* **JavaScript (ES6+):** Core logic for interacting with notes, search, and the backend API.
* **Font Awesome:** For icons (e.g., pin icon).

### Backend (Server-side)

* **Node.js:** JavaScript runtime environment.
* **Express.js:** Web application framework for Node.js.
* **PostgreSQL:** Relational database for storing notes.
* **`pg`:** Node.js driver for PostgreSQL.
* **`cors`:** Middleware to enable Cross-Origin Resource Sharing.
* **`dotenv`:** To load environment variables from a `.env` file.
* **`node-fetch`:** (or built-in `fetch` for Node.js >= 18) To make HTTP requests to external APIs from the backend.

### External API

* **scripture.api.bible:** Used to fetch Bible verses (requires an API key).

## Setup and Installation

To run ProNotes, you'll need to set up both the backend server and the frontend application.

### Prerequisites

* Node.js (LTS version recommended)
* npm (Node Package Manager, comes with Node.js)
* PostgreSQL database server

### 1. Database Setup

First, set up your PostgreSQL database and create the `notes` table.

1.  **Install PostgreSQL** if you haven't already.
2.  **Create a new database** for ProNotes (e.g., `pronotes_db`). You can do this via `psql` or a GUI tool like pgAdmin/DBeaver.
    ```bash
    psql -U your_username -c "CREATE DATABASE pronotes_db;"
    ```
3.  **Connect to your new database** and run the following SQL command to create the `notes` table:
    ```sql
    CREATE TABLE notes (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        due_date DATE
    );
    ```

### 2. Backend Setup

1.  **Navigate into the `backend` directory:**
    ```bash
    cd backend
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file:** In the `backend` directory, create a file named `.env` and add the following environment variables. **Replace the placeholder values** with your actual database credentials and your API key from `scripture.api.bible`.
    * **Get your API Key:** You'll need to sign up at [scripture.api.bible](https://scripture.api.bible/) to obtain your free API key.

    ```dotenv
    PORT=5000
    DATABASE_URL="postgresql://your_db_user:your_db_password@your_db_host:5432/pronotes_db"
    BIBLE_API_KEY="YOUR_SCRIPTURE_API_KEY_HERE"
    # JWT_SECRET="a_very_secret_jwt_key_for_future_auth" # For future user authentication
    ```
    * **Example `DATABASE_URL` for local PostgreSQL:** `"postgresql://postgres:mysecretpassword@localhost:5432/pronotes_db"`
4.  **Start the Backend Server:**
    ```bash
    npm start
    # Or, for development with auto-restarts:
    # npm run dev
    ```
    The server should start on `http://localhost:5000` (or the `PORT` you specified). You should see `Server running on port 5000` in your console.

### 3. Frontend Setup

The frontend is a static HTML, CSS, and JavaScript application.

1.  **Navigate back to the project root and then into the `sticky-notes-app` directory:**
    ```bash
    cd ../sticky-notes-app
    ```
2.  **Ensure `script.js` is configured correctly:**
    * Open `script.js`.
    * Verify that `const API_BASE_URL = 'http://localhost:5000/api';` matches the port your backend is running on.
3.  **Open `index.html` in your web browser.**
    You can simply double-click the `index.html` file in your file explorer, or open it via your browser (e.g., `file:///path/to/your/project/sticky-notes-app/index.html`).

    **Important:** Due to browser security restrictions (CORS), it's recommended to serve the frontend via a simple local web server for optimal functionality, especially when making API calls. You can use tools like `live-server` (install with `npm install -g live-server`) or Python's built-in server:
    ```bash
    # If using live-server (install globally first: npm install -g live-server)
    live-server

    # Or using Python's http.server
    python -m http.server 8000
    ```
    Then, navigate to `http://localhost:8000` (or whatever port `live-server` opens) in your browser.

## Usage

1.  **Add a New Note:** Type your note content in the textarea at the top. Optionally, select a due date using the calendar input. Click "Add Note" (or press Enter) to save it.
2.  **Search Notes:** Use the search bar to filter notes by their content.
3.  **Edit a Note:** Double-click on the text of any note to make it editable. Press Enter or click outside to save changes.
4.  **Pin/Unpin Notes:** Click the thumbtack icon in the top-right corner of a note to pin it. Pinned notes will always appear at the top.
5.  **Delete a Note:** Click the "✖" button on a note. A confirmation modal will appear to prevent accidental deletions.
6.  **Export Notes:** Click "Export All Notes" to download a JSON file containing all your notes.
7.  **Import Notes:** Click "Import Notes", select a JSON file (e.g., one previously exported). You will be prompted to either merge the imported notes with your existing ones or replace all existing notes.
8.  **Bible Verse:** An inspirational Bible verse will be displayed below the search bar, updated each time the app loads.

## Project Structure
