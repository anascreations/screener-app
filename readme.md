# 🏆 TradeMatrix Pro — Trading Guide
---

## 📋 Table of Contents

1. [What You Need Before Starting](#1-what-you-need)
2. [Chart Setup](#2-chart-setup)
3. [Screener Setup](#3-screener-setup)
4. [Daily Pre-Session Routine](#4-daily-pre-session-routine)
5. [Step-by-Step Trade Execution](#5-step-by-step-trade-execution)
6. [TradeMatrix Tab Reference](#6-tradematrix-tab-reference)
7. [US Market Session Times (MYT)](#7-us-market-session-times-myt)
8. [Risk Management Rules](#8-risk-management-rules)
9. [Quick Value Reference](#9-quick-value-reference)
10. [External Resources & Links](#10-external-resources--links)
11. [Common Mistakes to Avoid](#11-common-mistakes-to-avoid)

---

## 1. What You Need

### Apps & Platforms
| Tool | Purpose | Cost |
|---|---|---|
| **Malaysia** | Broker + Charts + Level 2 data | Free |
| **TradeMatrix Pro** | Signal calculator & Dashboard | Included |
| **CNN Business** | Fear & Greed Index | Free |
| **CBOE** | Put/Call Ratio | Free |
| **Unusual Whales** | Dark Pool activity | Free (basic) |
| **ForexFactory** | Economic calendar | Free |

### Account Requirements
* **Minimum capital:** RM 5,000 recommended for proper position sizing.
* **Data:** Enable **Level 2 US Market Data** in (Free activation in settings).
* **Access:** Enable **Extended Hours** trading for pre-market data.

---

## 2. Chart Setup

Apply these settings once and save as a template named **"TradeMatrix Setup"**.

### Main Chart (Overlays)
* **MA:** 5, 20, 50, 200
* **EMA:** 8, 21, 55, 200
* **BOLL:** 20, 2
* **VWAP:** Default
* **Supertrend:** 10, 3

### Sub Chart (Indicators)
* **MACD:** 12, 26, 9
* **KDJ:** 9, 3, 3
* **ADX/ATR/RSI:** Period 14
* **VOL:** With 20-period MA

---

## 3. Screener Setup

### "TradeMatrix Ready" Filter
Use this to find top momentum stocks at **8:00 PM MYT**.
* **Price:** $5 – $200
* **Volume:** > 1,000,000
* **Relative Volume:** > 1.5×
* **Technical:** Price > MA5, MA20, and MA50
* **RSI(14):** 50 – 72 (Bullish, not overbought)
* **ADX(14):** > 25 (Strong trend)

---

## 4. Daily Pre-Session Routine

### ⏰ 7:00 PM MYT — Market Intelligence
1.  **Fear & Greed:** [CNN Fear & Greed Index](https://www.cnn.com/markets/fear-and-greed)
2.  **Put/Call Ratio:** [CBOE Equity P/C Ratio](https://www.cboe.com/us/options/market_statistics/daily/)
3.  **Economic Calendar:** [ForexFactory](https://www.forexfactory.com/calendar) (Look for **Red Folders**).

### ⏰ 8:30 PM MYT — The 4 Gates Analysis
Before entering any trade, confirm these 4 gates are **GREEN**:

> 🟢 **Gate 1: Institutional Bias** (Smart Money Tab) → Score **≥ 5/8** > 🟢 **Gate 2: Technical Signal** (EMA Tab) → Score **≥ 70/100** > 🟢 **Gate 3: MTF Alignment** (Momentum Tab) → **3+ of 4** timeframes Bullish  
> 🟢 **Gate 4: Risk/Reward** (S/R Tab) → R:R Ratio **≥ 1.5:1**

---

## 5. Step-by-Step Trade Execution

1.  **The 5-Minute Rule:** Wait until 9:35 PM MYT before entering. Let the opening volatility settle.
2.  **Entry:** Look for a pullback to the **EMA8** on the 5m or 15m chart.
3.  **Execution:** Use **Limit Orders**. Never "market in" during high volatility.
4.  **Scaling:** * Take 50% profit at **TP1** (ATR 1.5 distance).
    * **Move Stop Loss to Breakeven** immediately.
    * Trail the rest using the EMA21 or Supertrend.

---

## 7. US Market Session Times (MYT)

| Session | Summer (EDT) | Winter (EST) | Strategy |
|---|---|---|---|
| **Prime Window** | 9:30 PM - 11:00 PM | 10:30 PM - 12:00 AM | Highest Volume - Trade Here |
| **Lunch Lull** | 11:30 PM - 1:30 AM | 12:30 AM - 2:30 AM | **AVOID** - Low Liquidity |
| **Power Hour** | 3:00 AM - 4:00 AM | 4:00 AM - 5:00 AM | Trend Continuation/Reversals |

---

## 8. Risk Management Rules

* **The 1% Rule:** Never risk more than 1% of total capital on a single trade.
* **ATR-Based Stops:** Hard stops should be at $Entry - (ATR \times 1.5)$.
* **Daily Circuit Breaker:** If you lose **3%** of your total account in one day, **stop trading.**

---

## 10. External Resources & Links

* **Sentiment:** [CNN Fear & Greed](https://www.cnn.com/markets/fear-and-greed)
* **Options Data:** [CBOE Market Statistics](https://www.cboe.com/us/options/market_statistics/daily/)
* **News:** [ForexFactory Calendar](https://www.forexfactory.com/calendar)
* **Flow:** [Unusual Whales](https://unusualwhales.com/live-options-flow)
* **Charts:** [TradingView](https://www.tradingview.com/)

---

## 11. Common Mistakes to Avoid

* ❌ **Chasing the Open:** Buying at 9:30:01 PM. (Result: Getting stopped out by the "wicks").
* ❌ **Ignoring News:** Trading 5 minutes before an FOMC or CPI release.
* ❌ **Revenge Trading:** Breaking the "Daily Circuit Breaker" to win back losses.
* ❌ **Over-leveraging:** Ignoring the "Suggested Units" in the TradeMatrix calculator.

---

## 🚀 How to Run TradeMatrix Pro

To launch the local dashboard:

1. Open your terminal/command prompt.
2. Navigate to the folder containing this file.
3. Run the following command:
   ```bash
   python -m http.server 8000