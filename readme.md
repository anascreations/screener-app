# 📊 TradeMatrix — MA / EMA Calculator

A lightweight, browser-based trading signal calculator built using pure HTML, CSS, and JavaScript.

No backend, no frameworks — fast, simple, and deployable anywhere.

---

# 🚀 Features

* 📈 MA (Moving Average) 6-filter analysis
* 📉 EMA (Exponential Moving Average) 5-filter analysis
* 🧠 Smart signal scoring (0–100)
* 🎯 Trade decision guidance (BUY / WAIT / SKIP)
* 📊 Visual dashboards (gauge, pie chart, checklist)
* 💡 Trade plan generation (with ATR)
* ⚡ Fully client-side (no server required)

---

# 🧩 Project Structure

```
tradematrix-app/
│── index.html
│── tradematrix.css
│── tradematrix.js
```

---

# ▶️ How to Run

### Option 1 (Simple)

Open directly in browser:

```
index.html
```

---

### Option 2 (Recommended)

Use Visual Studio Code:

1. Install **Live Server**
2. Right-click `index.html`
3. Click **Open with Live Server**

---

### Option 3 (Local Server)

```
python -m http.server 8000
```

Open:

```
http://localhost:8000
```

---

# 🌐 Deployment

This app can be deployed as a **static site** on:

* Render
* Vercel
* Netlify

### Render Settings:

* Build Command: *(empty)*
* Publish Directory: `.`

---

# 📘 User Guide

## 🔁 Step 1: Choose Calculator

Use the top tabs:

* **MA Calculator** → Trend + stability focus
* **EMA Calculator** → Momentum + fast signals

---

## 📥 Step 2: Enter Data

### MA Calculator Inputs

| Field             | Description                 |
| ----------------- | --------------------------- |
| Market Price      | Current stock price         |
| MA5 / MA20 / MA50 | Moving averages             |
| K, D, J           | KDJ oscillator values       |
| DIF / DEA         | MACD indicators             |
| Volume Ratio      | Volume strength             |
| RSI14             | Momentum strength           |
| ATR14             | Volatility (for trade plan) |

---

### EMA Calculator Inputs

| Field                | Description           |
| -------------------- | --------------------- |
| EMA8 / EMA21 / EMA55 | Trend layers          |
| Open / High / Low    | Daily context         |
| 52wk High/Low        | Long-term positioning |
| KDJ / MACD           | Confirmation signals  |
| Bid/Ask %            | Market pressure       |
| Beta                 | Volatility vs market  |

---

## ⚙️ Step 3: Auto Calculation

* System calculates automatically on input
* No need to press "Calculate"

---

## 📊 Step 4: Interpret Results

### 🎯 Decision Strip

Shows:

* BUY / WAIT / SKIP
* Risk level
* Signal grade

---

### 📈 Score Gauge

* 0–40 → Weak ❌
* 40–70 → Neutral ⚠️
* 70–100 → Strong ✅

---

### 📋 Filter Checklist

Shows which conditions passed:

* Trend alignment
* Momentum confirmation
* Volume strength

---

### 📉 Charts

* Gauge → overall score
* Pie chart → signal composition
* Range bar → overextension

---

### 💰 Trade Plan (if ATR provided)

Includes:

* Entry zone
* Stop loss
* Target levels

---

# ⚠️ Notes

* No backend required
* Runs fully in browser
* Data is NOT stored (unless you add localStorage)

---

# 🔮 Future Improvements

* 📡 API integration (real stock data)
* 📊 Advanced charts (TradingView style)
* 💾 Save user sessions
* 📱 Mobile app version (PWA)

---

# 📄 License

Free for personal and educational use.
