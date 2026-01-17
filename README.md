# 🌫️ AQI Monitoring & Visualization Platform

A **data-driven web platform** designed to monitor, analyze, and visualize **Air Quality Index (AQI)** using multiple trusted data sources.  
The system simplifies complex pollution data into a **single, interpretable AQI value**, enabling citizens, students, and decision-makers to make informed decisions.

---

## 📌 Problem Statement

Air pollution is a growing concern in urban cities, directly impacting public health, quality of life, and policy decisions.  
Although AQI data is available from multiple sources, it is often:

- Fragmented across platforms  
- Highly technical  
- Not user-friendly for non-technical users  

There is a need for a **centralized, simple, and real-time platform** that:
- Presents AQI data clearly  
- Supports historical trend analysis  
- Enables data-driven decision-making  

---

## 🎯 Solution Overview

The **AQI Monitoring & Visualization Platform** acts as a unified intelligence system that:

- Aggregates AQI, weather, traffic, and historical pollution data  
- Converts pollutant concentrations into a **single AQI index**  
- Visualizes real-time and historical AQI trends  
- Provides insights into **traffic–pollution correlation**

---

## 🏗️ System Architecture

The platform follows a modular and scalable architecture:

1. **Data Sources**
   - OpenWeather API (AQI, pollutants, weather)
   - TomTom Traffic API (traffic density & congestion)
   - Web scraping from AQI.in (historical AQI)
   - Government open data portals

2. **Data Ingestion**
   - API-based data fetching
   - Web scraping engine for unavailable APIs

3. **Data Processing & Normalization**
   - Unified backend data schema
   - Pollutant-to-AQI conversion
   - Time-series data cleaning

4. **Data Orchestration**
   - Apache Kafka for real-time streaming
   - Apache Airflow for pipeline scheduling

5. **Storage**
   - Centralized AQI data store (Firebase / Database)

6. **Analytics & ML**
   - Traffic vs AQI correlation analysis
   - Predictive models using ML

7. **Visualization**
   - Clean, minimal frontend
   - AQI indicators, graphs, and historical trends

---

## 🧰 Technology Stack

### Backend
- Node.js  
- Express.js  

### Frontend
- React  
- Next.js  

### Data Processing
- Apache Kafka  
- Apache Airflow  

### Analytics & Machine Learning
- TensorFlow  
- scikit-learn  

### Data Sources
- OpenWeather API  
- TomTom Traffic API  
- AQI.in (Web Scraping)  

---

## ✨ Key Features

- 🌍 Real-time AQI monitoring  
- 📊 Historical AQI trends & comparisons  
- 🚦 Traffic and pollution correlation analysis  
- 🧠 ML-ready architecture for future predictions  
- 🎨 Clean, user-friendly UI  
- ⚡ Lightweight and scalable design  

---

## 🎨 Design Philosophy

- **Clarity** – Simplified representation of complex data  
- **Usability** – Quick insights for non-technical users  
- **Extensibility** – Easy integration of new APIs and ML models  
- **Actionability** – Focus on insights, not just raw data  

---

## 📈 Impact & Benefits

- Improved public awareness of air quality  
- Data-driven urban and traffic planning  
- Support for public health decisions  
- Foundation for predictive pollution analytics  

---

## 🚀 Future Roadmap

- Short-term AQI forecasting  
- Traffic–pollution prediction models  
- Health advisory recommendations  
- Mobile application integration  
- City-level comparison dashboards  

---

## 👨‍💻 Team

**Team Name:** Data Iconics  

- Yash Gangwani (Team Leader)  
- Harshil Dodwani  
- Vivek Dhanwani  

---

## 📄 License

This project is developed for academic and hackathon purposes.  
Feel free to fork and extend with proper attribution.

---
