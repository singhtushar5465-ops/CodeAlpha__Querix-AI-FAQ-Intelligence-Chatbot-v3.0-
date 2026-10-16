# Querix v3.0 — Interactive Demo & Presentation Script

This script walks through the end-to-end features of **Querix — AI FAQ Intelligence Chatbot (v3.0)**.

---

## Scene 1: First Impression & Instant Launch with 3D Glassmorphic Logo
1. Open `http://localhost:8000` in Google Chrome or Microsoft Edge.
2. **Observe:** The app loads immediately with zero delay:
   - Beautiful custom 3D glassmorphic Querix logo icon in the sidebar and empty-state hero.
   - Clean browser favicon displaying the glowing Querix glyph.
   - Immediate access to the chat prompt, topic contexts, and token meter.

---


## Scene 2: High-Precision NLP & Topic Matching
1. In the chat prompt box, type:
   ```text
   how do I get my money back
   ```
   *(or click the starter card on the empty-state hero).*
2. Press **Enter** or click the Send button.
3. **Observe:**
   - Sub-250ms answer arrives with smooth text reveal.
   - Badge displays **Returns & Refunds** context.
   - Confidence meter displays **~85.5% Confidence** (green pill).
   - Answer clearly outlines the 30-day physical return window and 7-day software subscription money-back guarantee.
   - Dynamic related question chips appear below the answer.
   - Thumbs up/down, Copy, Share, and Speak aloud buttons are active.

---

## Scene 3: Jarvix Voice Agent & Full-Screen Voice Mode
1. Click the **Jarvix Voice** button in the header or click the microphone icon in the chat bar (or press `Ctrl+M`).
2. **Observe the 4-State Animated 3D/Canvas Voice Orb:**
   - **IDLE:** Gentle rhythmic breathing glow.
   - **LISTENING:** Multi-frequency reactive wave rings (amber/cyan pulse).
   - **THINKING:** Swirling particle vortex.
   - **SPEAKING:** Radiant pulsing expansion with voice modulation.
3. Speak or select a language (English, Hindi, Hinglish) and speech speed (0.9x to 1.15x).
4. **Barge-In Demonstration:** Tap the orb or click *"Interrupt Speech"* mid-answer to immediately silence Jarvix and ask a follow-up inquiry.

---

## Scene 4: Token Meter & Guest Mode Experience
1. Notice the **Live Token Meter** in the left sidebar:
   - Shows current tokens consumed and total quota limit (`1,450 / 10,000`).
   - Progress bar dynamically animates with color triggers:
     - Blue/Cyan (< 70%)
     - Amber Warning (70%–89%)
     - Coral Red (>= 90%)
2. Click **"Ledger"** above the meter:
   - Opens the detailed accounting table showing timestamp, query preview, type (Text vs Voice), and token deductions.

---

## Scene 5: User Sign-Up & Authentication
1. Click the User bar at the bottom of the sidebar or click **"Sign In"**.
2. Toggle to **Sign Up**:
   - Enter name: `Sarah Jenkins`
   - Enter email: `sarah@company.com`
   - Enter password: `Password123`
3. Click **"Create Free Account"** (or use the simulated *"Continue with Google"* button).
4. **Observe:**
   - Account is created with salted bcrypt password hashing and JWT cookie session.
   - Sidebar reflects `Sarah Jenkins` with **10,000 Free Monthly Tokens**.

---

## Scene 6: Plans & Instant Upgrade to Pro
1. Click **"Upgrade to Pro"** in the sidebar Go Pro card or open via Command Palette (`Ctrl+K` &rarr; Upgrade).
2. Toggle between **Monthly** and **Yearly** (noticing the *"2 Months Free"* calculation).
3. Click **"Upgrade to Pro"** (₹499/mo).
4. **Observe:**
   - Tier instantly upgrades to **Pro**.
   - Monthly token limit jumps from 10,000 to **500,000 tokens**.
   - Sidebar token meter updates in real-time.
5. Demonstrate the **Top-Up Pack**: Click *"Buy +100K Pack for ₹99"* to add booster tokens.

---

## Scene 7: Admin Analytics & Custom FAQ Ingestion
1. Click the **Admin Analytics** bar chart icon in the top header.
2. **Review Real-Time KPIs:**
   - Total Processed Queries
   - Average Confidence Score (> 85%)
   - Customer Satisfaction Rate (96% 👍)
   - Top Asked Questions & Unanswered / Low Confidence queries.
3. Switch to the **"Custom FAQ Upload"** tab:
   - Drag & drop a `.csv` or `.json` file containing custom enterprise FAQs.
   - Notice the instant notification confirming automatic retraining of the TF-IDF vectorizer index without server restart!

---

## Scene 8: Power Shortcuts & Accessibility
1. Press `Ctrl+K`: Opens the **Command Palette** for fast navigation.
2. Press `/`: Automatically focuses the chat prompt bar.
3. Toggle Theme: Click the Moon/Sun icon to experience both dark glassmorphism and crisp light modes.
4. Export: Open Profile &rarr; **Export Chat History** to download full JSON conversation transcripts.
