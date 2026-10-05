# Smart Employment Fraud Detection

This is a beginner-friendly guide to understanding this project from zero knowledge.

This project is a full-stack web application that checks whether a job advertisement looks genuine or fraudulent. It uses:

- React for the user interface
- Node.js + Express for the backend API
- Python + FastAPI for the machine learning service
- A trained ML model that uses TF-IDF + Linear SVM
- Rule-based fraud checks such as suspicious keywords, salary mismatch, and contact verification

The goal is simple: a user enters a job advertisement, the app analyzes it, and the system decides whether the ad is Genuine, Suspicious, or Fake.

---

## 1. Big picture: how this project works

Think of this project like a three-part system:

1. Frontend: the screen where the user types the job details
2. Backend: the middle server that receives the user request and prepares it
3. ML service: the Python service that actually analyzes the text using a trained model

The full flow is:

```text
User enters job ad in browser
        |
        v
React Frontend
        |
        v
Axios sends HTTP request to backend
        |
        v
Express backend validates and forwards request
        |
        v
Python FastAPI ML service
        |
        v
Model predicts Genuine/Fake + risk checks
        |
        v
Response returns back to frontend
        |
        v
User sees result and history
```

This is the main project workflow.

---

## 2. Why there are 3 different folders

At the root of the project you will see:

- `frontend/` → website interface
- `backend/` → API server that works between the UI and ML model
- `ml-service/` → Python model and prediction logic
- `.env.example` → environment variable template

Each folder has a different job.

### 2.1 Frontend folder
This is the part that users see and interact with.

The frontend is built with:

- React
- Vite
- Tailwind CSS
- Axios
- React Router

This is where the user fills in job details such as title, company, description, requirements, salary, recruiter email, and source link.

### 2.2 Backend folder
This holds the main API. It receives requests from the frontend, validates them, saves history to a local JSON file, and calls the ML service.

It does not train the model itself. Instead, it sends the advertisement to the Python ML service and gets the prediction back.

### 2.3 ML service folder
This is the intelligence part. It contains:

- text preprocessing
- fraud keyword detection
- salary checking
- model training and prediction
- risk scoring logic

This is the real decision engine.

---

## 3. Project structure in simple words

```text
smart-employment-fraud-detection/
├── .env.example
├── README.md
├── backend/
│   ├── data/
│   ├── node_modules/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   ├── node_modules/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── ml-service/
│   ├── data/
│   ├── models/
│   ├── src/
│   ├── .venv/
│   └── requirements.txt
└── .gitignore
```

## 4. What the app does

When a user clicks “Analyze Job”, the app sends a job description to the backend. The backend normalizes the data, calls the ML service, receives a prediction, and then returns the result to the browser.

The system gives:

- `Genuine` → the ad looks safe
- `Suspicious` → it may have some warning signs
- `Fake` → it is likely fraudulent

The output also includes:

- model confidence score
- risk score
- risk level
- fraud indicators such as “request for upfront payment” or “urgent hiring”
- verification results and salary analysis

---

## 5. The three-layer architecture in plain English

### Frontend (user interface)
User types data in forms and clicks buttons.

### Backend (API server)
Receives data, validates it, and sends it to the ML model.

### ML service (brain)
Performs the deep analysis and gives the judgment.

This separation is important because:

- frontend can stay simple
- backend can control security and validation
- ML logic stays in Python, which is strong for machine learning

---

## 6. Files and what they do

Below is a beginner-friendly explanation of the important files.

### Root files

#### `.env.example`
This file contains sample environment variables.

```env
ML_SERVICE_URL=http://localhost:8000
PORT=5000
ADMIN_TOKEN=change-me
```

What this means:

- `ML_SERVICE_URL` tells the backend where the Python ML service is running
- `PORT` sets the backend port
- `ADMIN_TOKEN` is used for admin-only training actions

To use it locally, copy this file to `.env`.

#### `README.md`
This file explains how the project works and how to run it.

---

## 7. Frontend explanation

The frontend folder is in `frontend/src`.

### `frontend/src/main.jsx`
This is the entry point of the React app.

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
```

This code:

- loads React
- creates the browser app
- wraps the app in `BrowserRouter` so pages can route using URLs
- imports the main app component
- loads CSS styling

### `frontend/src/App.jsx`
This file defines the routes for the app.

```jsx
<Route path="/" element={<DashboardPage />} />
<Route path="/analyze" element={<AnalyzeJobPage />} />
<Route path="/result" element={<ResultPage />} />
<Route path="/history" element={<HistoryPage />} />
<Route path="/analytics" element={<AnalyticsPage />} />
<Route path="/model-info" element={<ModelInfoPage />} />
<Route path="/about" element={<AboutPage />} />
```

This means:

- home page = dashboard
- analyze page = form to submit a job
- result page = prediction result
- history page = old analyses
- analytics page = statistics
- model info page = ML model details
- about page = project info

### `frontend/src/pages/AnalyzeJobPage.jsx`
This is the page where the user enters job information.

This is one of the most important files in the UI.

The page contains a form with fields like:

- job_title
- company_name
- location
- salary_range
- description
- requirements
- benefits
- employment_type
- education
- industry
- function
- company_website
- recruiter_email
- job_source_url

When the user clicks submit:

```js
const response = await predictJob(payload);
navigate('/result', { state: { result: response.data.data } });
```

This means:

- it calls the `predictJob` function from the API service
- it sends the data to the backend
- then the app navigates to the result page with the response data

### `frontend/src/services/api.js`
This is the connection between the React app and the backend.

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 120000,
});
```

This creates an Axios client.

- `baseURL` is the backend base address
- if no environment variable is set, it defaults to: `http://localhost:5000/api`
- `timeout` means the request will fail if it takes too long

Then it exports functions like:

```js
export const predictJob = (payload) => api.post('/predict', payload);
export const getPredictions = (params = {}) => api.get('/predictions', { params });
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getModelInfo = () => api.get('/model-info');
```

These functions are used by different pages.

---

## 8. Backend explanation

The backend lives in `backend/src`.

### `backend/src/app.js`
This is the main Express app setup.

It does the following:

```js
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
```

These lines mean:

- allow frontend and backend to communicate even if they are on different ports
- add security headers with Helmet
- allow JSON request bodies
- parse URL-encoded forms
- log each request to the console

Then it defines the health route:

```js
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is healthy',
    service: 'smart-employment-fraud-backend',
    timestamp: new Date().toISOString(),
  });
});
```

This route tells us whether the backend is alive. This is useful for testing if the API is running.

Then it routes all requests to the prediction router:

```js
app.use('/api', predictionRoutes);
```

This means every route under `/api` is handled by `predictionRoutes.js`.

### `backend/src/server.js`
This is the file that actually starts the server.

```js
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
```

This says:

- use the port from `.env` if available
- otherwise default to 5000
- start Express and listen for incoming requests

### `backend/src/routes/predictionRoutes.js`
This file defines all HTTP routes for the backend.

```js
router.post('/predict', analyzeJob);
router.get('/predictions', getPredictions);
router.get('/predictions/:id', getPredictionById);
router.delete('/predictions/:id', deletePrediction);
router.get('/dashboard/stats', getDashboardStats);
router.get('/model-info', getModelInfo);
router.get('/health', getHealthCheck);
router.post('/train-model', trainModelController);
```

This means:

- `POST /api/predict` → create a prediction
- `GET /api/predictions` → get all stored predictions
- `GET /api/predictions/:id` → fetch one record
- `DELETE /api/predictions/:id` → delete one record
- `GET /api/dashboard/stats` → dashboard metrics
- `GET /api/model-info` → show model metadata
- `GET /api/health` → check ML health
- `POST /api/train-model` → retrain the model

### `backend/src/controllers/predictionController.js`
This is the most important backend business logic file.

It receives the request, normalizes the input, validates it, calls the ML service, saves the result, and sends the response back.

#### `normalizeInput(data = {})`
This standardizes different key names.

```js
job_title: data.job_title || data.jobTitle || '',
company_name: data.company_name || data.companyName || '',
salary_range: data.salary_range || data.salaryRange || '',
```

The frontend sends snake_case names, like `job_title`, but the app may also handle camelCase. This keeps the system flexible.

#### `analyzeJob(req, res, next)`
This function is triggered when the user sends a prediction request.

```js
const input = normalizeInput(req.body);

if (!input.job_title || !input.description) {
  return res.status(400).json({
    success: false,
    message: 'Job title and description are required.',
  });
}
```

This means the backend rejects incomplete submissions. It requires at least a job title and description.

Then it calls the ML service:

```js
const result = await predictAdvertisement(input);
const record = sanitizePredictionRecord(input, result);
const saved = await createPrediction(record);
```

Here:

- `predictAdvertisement` calls Python ML service
- `sanitizePredictionRecord` formats the data for storage
- `createPrediction` saves the result in JSON storage

Finally it sends a response back to the user:

```js
res.status(200).json({
  success: true,
  data: {
    ...result,
    id: saved._id,
  },
});
```

### `backend/src/services/mlService.js`
This file is the bridge between Node.js and the Python ML service.

```js
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
```

This sets the Python server URL. The backend calls this service over HTTP.

Then there is a general helper:

```js
async function request(path, method = 'get', data = null) {
```

This sends requests to the ML service using Axios.

Examples:

```js
export async function predictAdvertisement(input) {
  return request('/predict', 'post', input);
}

export async function trainModel() {
  return request('/train', 'post', {});
}
```

So the backend is simply a client calling the ML service.

### `backend/src/storage/jsonStore.js`
This file stores prediction history in a local JSON file instead of a database.

```js
const dataPath = fileURLToPath(new URL('../../data/store.json', import.meta.url));
```

This points to the file that stores all records:

`backend/data/store.json`

It writes data safely with temporary files and atomic rename:

```js
const temporaryPath = `${dataPath}.${randomUUID()}.tmp`;
await writeFile(temporaryPath, JSON.stringify(store, null, 2), 'utf8');
await rename(temporaryPath, dataPath);
```

This makes the write process safer and reduces the chance of corrupting the JSON file.

The store keeps two arrays:

- `predictions`
- `trainingRuns`

This is a simple database replacement for a beginner project.

---

## 9. ML service explanation

The Python ML service is the “brain” of the project.

### `ml-service/src/config.py`
This file defines folder paths and suspicious keyword lists.

```python
BASE_DIR = Path(__file__).resolve().parents[1]
DATASET_PATH = BASE_DIR / 'data' / 'emscad.csv'
MODEL_DIR = BASE_DIR / 'models'
VECTORIZER_PATH = MODEL_DIR / 'tfidf_vectorizer.joblib'
MODEL_PATH = MODEL_DIR / 'svm_model.joblib'
MODEL_METADATA_PATH = MODEL_DIR / 'model_metadata.json'
```

This tells Python where:

- the dataset is stored
- the model files should be saved
- metadata is saved

It also defines common suspicious phrases such as:

- `urgent hiring`
- `easy money`
- `guaranteed job`
- `pay upfront`
- `whatsapp only`
- `registration fee`

These are used to detect fraud patterns.

### `ml-service/src/preprocessing.py`
This file cleans the text before machine learning. It makes messy job ad text easier for the model to understand.

Typical preprocessing includes:

- lowercasing text
- removing punctuation
- removing extra spaces
- combining key fields into one text blob
- normalizing the input

This matters because ML models do not understand raw text directly very well. They work better with clean, formatted text.

### `ml-service/src/train_model.py`
This is where the model is trained.

It does the following:

1. reads the dataset (`emscad.csv`)
2. fills missing values
3. converts label values such as `fake` and `genuine` into numeric values
4. combines multiple text fields into one text field
5. cleans the text
6. uses `TfidfVectorizer` to convert text into numbers
7. trains a `LinearSVC` model
8. saves the trained model and vectorizer
9. saves evaluation metrics to metadata

This is where the “learning” happens.

The most important part is:

```python
vectorizer = TfidfVectorizer(...)
X_train_tfidf = vectorizer.fit_transform(X_train)
svm_model = LinearSVC(C=1.0, class_weight='balanced')
calibrated_model = CalibratedClassifierCV(estimator=svm_model, cv=3)
calibrated_model.fit(X_train_tfidf, y_train)
```

This means:

- `TfidfVectorizer` transforms text into numbers
- `LinearSVC` learns how to separate genuine vs fake jobs
- `CalibratedClassifierCV` improves probability confidence estimation

The result is saved as:

- `models/tfidf_vectorizer.joblib`
- `models/svm_model.joblib`
- `models/model_metadata.json`

### `ml-service/src/predict.py`
This file handles real-time prediction for one ad or many ads.

The function `predict_single_ad()` is the core of the prediction engine.

It does this:

- loads the trained model and vectorizer
- combines job fields into one text string
- preprocesses the text
- converts text to TF-IDF features
- predicts whether the ad is fake or genuine
- computes confidence
- checks suspicious fraud indicators
- performs salary inspection
- checks company/recruiter verification context
- calculates overall risk score

It finally returns a dictionary like:

```python
return {
    'prediction': final_prediction,
    'ml_prediction': model_label,
    'ml_class': ml_class,
    'confidence': round(confidence, 4),
    'risk_score': risk['risk_score'],
    'risk_level': risk['risk_level'],
    'fraud_indicators': risk['fraud_indicators'],
    'indicator_details': indicator_matches,
    'verification': verification,
    'salary_analysis': salary_info,
    'model_metadata': metadata,
}
```

This is what the backend sends back to the frontend.

### `ml-service/src/risk_engine.py`
This file calculates the final risk score.

The risk logic is not based only on the ML model. It also checks if the advertisement contains suspicious patterns.

For example:

```python
if 'payment' in normalized or 'deposit' in normalized or 'bank details' in normalized:
    return 18
```

A message with payment-related content gets a strong weight because it is highly suspicious.

Then overall risk is calculated and mapped to categories:

- 0–30 → Low Risk → Genuine
- 31–60 → Medium Risk → Suspicious
- 61–100 → High Risk → Fake

This is a rule-based safety layer added on top of the ML prediction.

### `ml-service/src/fraud_indicators.py`
This file checks for suspicious language patterns.

It looks for things such as:

- unpaid internship scam language
- WhatsApp-only recruitment
- urgent pressure tactics
- requests for money or bank details
- unrealistic promise of high earnings

### `ml-service/src/verification.py`
This file checks whether the recruiter/company information looks trustworthy.

It may check:

- company website presence
- recruiter email validity
- job source link quality
- whether the company identity appears legitimate

### `ml-service/src/salary_analysis.py`
This file inspects salary information and looks for unusual values.

It checks if salary is unrealistic or suspicious compared to normal thresholds.

### `ml-service/src/main.py`
This is the FastAPI application entry point.

```python
app = FastAPI(title='Smart Employment Fraud Detection ML Service')
```

Then it defines endpoints:

```python
@app.get('/health')
@app.post('/predict')
@app.post('/train')
@app.get('/model-info')
@app.post('/batch-predict')
```

This means the Python service exposes an API that the Node.js backend can call.

---

## 10. Full end-to-end flow with a real example

Imagine the user enters this job:

- job title: `Data Analyst Intern`
- company: `FutureNet Solutions`
- description: `We need people to process data and send us an upfront registration fee of $150.`
- recruiter email: `jobs@personalmail.com`
- source URL: no company website

What happens?

1. Frontend sends this data to the backend
2. Backend validates it
3. Backend sends it to the ML service `/predict`
4. The ML service:
   - combines all text fields
   - cleans the text
   - transforms it into numeric features
   - uses the trained model
   - sees suspicious phrases like “registration fee” and “personal email”
   - calculates a high risk score
5. The backend receives the result
6. The backend stores it in `backend/data/store.json`
7. Frontend displays the final result page

This is where the model logic and fraud rules come together.

---

## 11. Data storage flow

The app stores prediction records locally in JSON instead of a database.

File:

`backend/data/store.json`

This file stores:

- previous predictions
- metadata
- timestamps
- training runs

This is useful for demos and academic projects, because it avoids needing MongoDB or PostgreSQL.

---

## 12. Model training flow

The ML model is trained only when the dataset is ready.

The required dataset is: `ml-service/data/emscad.csv`

If it does not exist, the app will show an appropriate message and the service cannot train the model.

The training command is:

```powershell
Set-Location ml-service
.\.venv\Scripts\python.exe .\src\train_model.py
```

After training, the project produces:

- `ml-service/models/tfidf_vectorizer.joblib`
- `ml-service/models/svm_model.joblib`
- `ml-service/models/model_metadata.json`

These are the trained artifacts that the prediction service uses.

---

## 13. How to run the project locally

### 1. Copy environment variables

From the root folder:

```powershell
Copy-Item .env.example .env
```

### 2. Install backend dependencies

```powershell
Set-Location backend
npm install
```

### 3. Install frontend dependencies

```powershell
Set-Location ..\frontend
npm install
```

### 4. Create Python virtual environment and install ML packages

```powershell
Set-Location ..\ml-service
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 5. Start the ML service

```powershell
Set-Location ml-service
.\.venv\Scripts\python.exe .\src\main.py
```

This starts FastAPI on port `8000`.

### 6. Start the backend

Open a new terminal:

```powershell
Set-Location backend
npm start
```

This starts the Node.js server on port `5000`.

### 7. Start the frontend

Open a third terminal:

```powershell
Set-Location frontend
npm run dev
```

This usually opens a local React app at `http://localhost:5173`.

---

## 14. Common endpoints

### ML service endpoints

- `GET /health` → checks if the Python ML service is alive
- `POST /predict` → analyzes a single job advertisement
- `POST /batch-predict` → analyzes multiple job ads at once
- `GET /model-info` → returns model metadata
- `POST /train` → trains the model

### Backend endpoints

- `GET /api/health` → checks backend status
- `POST /api/predict` → analyze a single job advertisement
- `GET /api/predictions` → list previous predictions
- `GET /api/predictions/:id` → fetch one result
- `DELETE /api/predictions/:id` → delete one result
- `GET /api/dashboard/stats` → get summary metrics
- `GET /api/model-info` → get model information
- `POST /api/train-model` → trigger training

---

## 15. Beginner understanding: what each technology is doing

### React
This is the visual layer. It displays forms, tables, graphs, and result pages.

### Express.js
This is the API layer. It handles requests, routes, validation, and communication with the ML service.

### FastAPI
This is the Python web API for machine learning.

### Tensor/ML concepts
The app uses text classification with:

- preprocessing
- word vectorization (TF-IDF)
- classification with Linear SVM
- rule-based risk detection

This is a classic NLP approach for text classification problems.

---

## 16. What is TF-IDF?

TF-IDF stands for Term Frequency-Inverse Document Frequency.

This technique converts text into numbers so a machine learning model can understand it.

Example:

- if a word like “urgent” appears many times in suspicious ads, it gets more importance
- if a word appears in many normal ads, it may be less relevant

Then the model learns which patterns are more associated with fake advertisements.

---

## 17. What is Linear SVM?

Support Vector Machine (SVM) is a machine learning method used for classification.

A Linear SVM is a version designed for high-dimensional data like text. It is often effective for:

- spam detection
- fraud detection
- text classification

This project uses it because job ads are text-heavy and the model is lightweight and interpretable.

---

## 18. Why the system also checks fraud rules

Even if the ML model is good, fraud detection is more reliable when you also use domain rules.

Examples:

- suspicious payment request
- personal email instead of company email
- urgent hiring pressure
- no interview
- unrealistic salary
- WhatsApp-only contact

These patterns are not always captured by the model alone, so the project adds a rule-based risk layer.

---

## 19. How to understand the code if you are new

A good order is:

1. Read `frontend/src/services/api.js`
2. Read `frontend/src/pages/AnalyzeJobPage.jsx`
3. Read `backend/src/routes/predictionRoutes.js`
4. Read `backend/src/controllers/predictionController.js`
5. Read `backend/src/services/mlService.js`
6. Read `ml-service/src/main.py`
7. Read `ml-service/src/predict.py`
8. Read `ml-service/src/train_model.py`
9. Read `ml-service/src/risk_engine.py`

This path follows the actual request from the browser to the ML model and back.

---

## 20. A short summary in one sentence

This project takes a job ad from a browser, sends it to a backend API, forwards it to a Python machine learning service, evaluates it with a trained text-classification model plus fraud rules, and sends the final result back to the user.

---

## 21. Important beginner note

You do not need to understand every line of code at once. The key idea is:

- frontend collects input
- backend handles API logic
- ML service makes the prediction
- stored JSON keeps a history

If you understand this pattern, you can understand the whole project.

---

## 22. Next steps for learning

If you want to become strong in this project, learn these topics next:

- JavaScript basics
- React component state
- HTTP requests with Axios
- Express routing and controllers
- Python FastAPI basics
- TF-IDF and text vectorization
- Linear SVM
- JSON file storage
- environment variables

---

## 23. Final conclusion

This project is a very practical example of a real-world AI application:

- user-facing form
- API backend
- machine learning model
- risk scoring
- dashboard and analytics
- local storage for demo purposes

It is a great beginner project because it combines frontend, backend, and AI together in one complete system.

If you study this README together with the project files in the order above, you will quickly understand how the project is connected and how each file contributes to the whole system.

## Notes

- The frontend and backend must communicate through the configured environment variable `ML_SERVICE_URL`.
- The project includes a clear distinction between ML prediction and rule-based fraud indicator output.
- The JSON store is intended for local, single-process use; it is not suitable for multiple backend instances writing concurrently.
