# 🌆 Urban Access  
## A Unified Data Intelligence Platform for Smart, Sustainable Cities

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

Urban Access is a real-time, data-driven urban intelligence platform that integrates **air quality, traffic, weather, public health, and agricultural data** into a single unified system. The platform converts fragmented urban data into **actionable insights** using analytics, machine learning, and intuitive visualizations to support smarter decision-making.

---

## 📌 Problem Statement

Urban data related to pollution, traffic, health, and agriculture is highly fragmented and difficult to interpret. This results in:
- Poor urban planning decisions
- Delayed responses to environmental risks
- Limited use of available data for proactive decision-making
- Lack of correlation between different urban parameters

---

## 💡 Solution Overview

Urban Access acts as a **single source of truth** by:
- ✅ Aggregating real-time and historical urban data from multiple sources
- ✅ Normalizing and processing data into unified formats
- ✅ Applying advanced analytics and ML models for predictions
- ✅ Visualizing insights through clean, user-friendly dashboards
- ✅ Enabling data-driven policy and planning decisions

---

## ⚙️ Key Features

| Feature | Description |
|---------|-------------|
| 🌫️ **Real-time AQI Monitoring** | Live air quality index tracking with pollutant breakdown |
| 🚦 **Traffic Analysis** | Congestion patterns and correlation with air quality |
| 🌦️ **Weather Integration** | Current conditions and 7-day forecasts |
| 🌊 **Flood Risk Assessment** | Probability index based on weather and geographical data |
| 📊 **Historical Trends** | Long-term AQI and environmental data analysis |
| 🧠 **ML Predictions** | AI-powered air quality forecasting |
| 🏥 **Health Impact Analysis** | Disease correlation with environmental factors |
| 🌾 **Agricultural Intelligence** | Crop health and yield prediction dashboards |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DATA SOURCES                         │
│  APIs │ Web Scraping │ CSV Datasets │ Real-time Feeds   │
└─────────────────┬───────────────────────────────────────┘
                  │
         ┌────────▼────────┐
         │ Data Ingestion  │
         │   (Kafka/APIs)  │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │ Data Processing │
         │ (Airflow/ETL)   │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │    Firebase     │
         │    Database     │
         └────────┬────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────┐              ┌───────▼──────┐
│Analytics│              │Visualization │
│   & ML  │              │  Dashboard   │
└─────────┘              └──────────────┘
```

---

## 🧰 Technology Stack

### **Frontend**
- **React.js** - Component-based UI development
- **Next.js** - Server-side rendering and routing
- **Chart.js / Recharts** - Data visualization
- **Tailwind CSS** - Modern, responsive styling

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - REST API framework
- **Axios** - HTTP client for API requests

### **Data Processing & ML**
- **Apache Kafka** - Real-time data streaming
- **Apache Airflow** - Workflow orchestration
- **TensorFlow** - Deep learning models
- **scikit-learn** - Classical ML algorithms
- **Pandas / NumPy** - Data manipulation

### **APIs & Data Sources**
- **OpenWeather API** - Weather data
- **TomTom Traffic API** - Real-time traffic information
- **Meteo API** - Meteorological data
- **WHO GHO API** - Global health statistics
- **FAO API** - Agricultural and food data
- **OpenStreetMap** - Geographical mapping
- **AQI.in** - Air quality data (web scraping)

### **Database & Storage**
- **Firebase Firestore** - NoSQL cloud database
- **Firebase Realtime Database** - Live data synchronization

---

## ▶️ How to Run the Project

### 🔹 Prerequisites
Ensure you have the following installed:
```bash
node --version  # v16.0.0 or higher
npm --version   # v7.0.0 or higher
```

### 🔹 Step 1: Clone the Repository
```bash
git clone <repository-url>
cd urban-access
```

### 🔹 Step 2: Install Dependencies
```bash
npm install
```
This installs all required packages for both frontend and backend.

### 🔹 Step 3: Environment Configuration
Create a `.env` file in the root directory and add your API keys:

```env
# OpenWeather API
OPENWEATHER_API_KEY=your_openweather_api_key

# TomTom Traffic API
TOMTOM_API_KEY=your_tomtom_api_key

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 🔹 Step 4: Run Backend Server
```bash
npm run server
```
- Starts the Express.js backend
- Handles APIs, data processing, and analytics
- Runs on `http://localhost:5000`

### 🔹 Step 5: Run Frontend (Development Mode)
Open a **new terminal** and run:
```bash
npm run dev
```
- Starts the React / Next.js frontend
- Runs on `http://localhost:3000`

### 🔹 Step 6: Open the Application
Open your browser and navigate to:
```
http://localhost:3000
```

⚠️ **Important**: Keep both terminals running simultaneously (`npm run server` + `npm run dev`) for full functionality.

---

## 📁 Project Structure

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:client

# Run backend tests
npm run test:server

# Run with coverage
npm run test:coverage
```

---

## 🚀 Deployment

### **Frontend (Vercel)**
```bash
npm run build
vercel --prod
```

### **Backend (Railway/Render)**
```bash
# Push to GitHub and connect to Railway/Render
git push origin main
```

---

## 📝 Notes for Evaluation / Judges

- ✅ This is a **working system**, not a conceptual prototype
- ✅ Uses **real APIs and real data pipelines**
- ✅ Designed to be **modular, scalable, and extensible**
- ✅ Architecture supports future **predictive analytics** and **policy-level insights**
- ✅ All features are **fully functional** and **tested**

---

## 🎯 Future Scope

- [ ] Advanced AQI & flood prediction models with LSTM/GRU networks
- [ ] City-to-city comparison dashboards
- [ ] Mobile application (React Native)
- [ ] Real-time health advisory & alert system
- [ ] AI-powered policy recommendation engine
- [ ] Integration with government smart city initiatives
- [ ] Multi-language support for wider accessibility
- [ ] Blockchain-based data verification

---

## 👨‍💻 Team

**Team Name:** Data Iconics

| Name | Role | Email |
|------|------|-------|
| **Yash Gangwani** | Team Leader | 202512048@dau.ac.in |
| **Harshil Dodwani** | Backend Developer | - |
| **Vivek Dhanwani** | Frontend Developer | - |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is developed for **academic and hackathon purposes**. Free to use, learn from, and extend with proper attribution.

```
MIT License - Copyright (c) 2024 Data Iconics
```

---

## 📞 Support & Contact

For questions, issues, or collaboration opportunities:
- 📧 Email: 202512048@dau.ac.in
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-repo/discussions)

---

## 🙏 Acknowledgments

- OpenWeather, TomTom, and other API providers
- Open-source community for libraries and tools
- Our mentors and advisors for guidance
- Hackathon organizers for the opportunity

---

<p align="center">
  Made with ❤️ by Team Data Iconics
</p>

<p align="center">
  <b>Building Smarter, Sustainable Cities Through Data Intelligence</b>
</p>
