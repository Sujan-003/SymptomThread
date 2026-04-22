# SymptomThread

SymptomThread is a dual-database diagnostic tool that leverages the flexibility of document storage and the power of graph databases to track, log, and analyze patient symptoms and their correlations. 

## Architecture
- **MongoDB**: Used for flexible, schema-less document logging of patient symptom submissions.
- **ArangoDB**: Used for real-time, graph-based symptom correlation analysis, allowing healthcare providers or researchers to visualize how different symptoms cluster together.

## Technology Stack
- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **Databases**: MongoDB, ArangoDB

---

## Step by Step Run Guide

Follow these steps exactly to run the project locally.

### Step 1: Start ArangoDB
We are using the ArangoDB Docker image. In the root of the project, run:
```bash
docker-compose up -d
```
This will start ArangoDB in the background on port `8529` with the password `password`.

### Step 2: Configure Environment Variables
Navigate to the `backend` directory. Ensure you have a `.env` file configured with your database connections:
```env
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
ARANGODB_URI=http://localhost:8529
ARANGODB_DATABASE=symptomthread
ARANGODB_USERNAME=root
ARANGODB_PASSWORD=password
```

### Step 3: Start the Backend server
The backend will automatically connect to MongoDB and ArangoDB. It will also create the required graph databases and collections if they don't exist.
Open a new terminal window and run:
```bash
cd backend
npm install
npm run dev
```
*(Wait until you see "Server is running on port 5000", "MongoDB Connected", and "ArangoDB Connected")*

### Step 4: Run the Data Seeder (Optional but recommended)
To see the graph in action immediately, you can populate the databases with synthetic patient logs.
Open a new terminal window and run:
```bash
cd backend
node seed.js
```

### Step 5: Start the Frontend Application
Now, start the React application to interact with the system.
Open a new terminal window and run:
```bash
cd frontend
npm install
npm run dev
```
It will output a local URL (e.g., `http://localhost:5173`). Open this URL in your browser.

---

## How to test the app:
1. **View the Dashboard:** See the existing symptom correlation graph created by the seeder.
2. **Log new Symptoms:** Navigate to the "Log Symptoms" page and add a new patient with multiple symptoms. 
3. **Observe the Dual-Sync:** Once submitted, go back to the Dashboard and click "Refresh Data" to see the new patient and new symptom correlations drawn in real-time on the ArangoDB graph.
