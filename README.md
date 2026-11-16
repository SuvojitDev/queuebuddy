# 🎟️ QueueBuddy – Digital Waiting List

**QueueBuddy** is an intelligent, privacy-first digital queue and waiting list application built with **React Native**, **Expo (SDK 58)**, and a **100% offline local SQLite database (`expo-sqlite`)**.

Designed specifically for **local salons & barbershops, healthcare clinics, and electronics/repair shops**, QueueBuddy replaces physical clipboards and chaotic waiting areas with real-time digital tokens, dynamic wait-time estimation, near-turn notifications, and a shop-owner command dashboard.

---

## ⚡ Key Features

### 1. 🎫 Generate Digital Tokens
- **Walk-in & Self-Service Kiosks**: Customers or shop staff can generate digital tokens in seconds.
- **Service-Aware Routing**: Select specific services with transparent durations and pricing (e.g., Haircut, Consultation, Screen Replacement).
- **Fast-Track / Priority Tagging**: Mark VIPs, appointments, or emergency walk-ins for automated queue priority.
- **Authentic Digital Pass**: Generates high-contrast digital ticket pass with an SVG QR code, token number (e.g., `#S-01`, `#C-03`, `#R-05`), customer details, and live status.
- **One-Tap Sharing**: Share tickets directly via WhatsApp, SMS, or system share sheet.

### 2. ⏱️ Real-Time Dynamic Wait Time Estimation
- **Multi-Server Queue Dispatch Engine**: Advanced queue estimation algorithm that factors in:
  - Total customers waiting ahead
  - Duration of specific requested services
  - Active staff stations/chairs (excluding stations on break)
  - Remaining service time at currently occupied stations
- **Clock-Time Turn Predictions**: Displays both relative wait (`~15 mins`) and estimated arrival time (`approx 02:45 PM`).

### 3. 📢 Near-Turn & Turn-Ready Customer Alerts
- **Configurable Near-Turn Threshold**: Automatically flags customers when they reach the top of the queue (e.g., <= 2 people ahead or <= 10 mins).
- **Audio Chime & Haptic Vibrations**: Dual-tone chime sound and device haptic alerts on calling next customer.
- **Instant SMS & WhatsApp Dispatch**: One-tap trigger to send pre-formatted notification messages directly to customer devices.
- **Sticky Notice Banner**: Prominent in-app notification bar with direct pass view and sound chime.
- **Notification Audit Log**: Searchable history of all alerts sent to customers.

### 4. 📊 Shop-Owner Dashboard
- **Command Center**:
  - Live Quick Stats bar: `Waiting Count`, `In Service`, `Est. Wait`, `Completed Today`.
  - **"Call Next Customer"** master action: One tap picks the top waiting ticket, sounds the audio chime, and triggers near-turn notifications.
  - **Station / Counter Carousel**: Displays active chairs/consultation rooms, currently served customer, elapsed service time, and one-tap "Complete" button.
- **Full Queue Control**:
  - Filter by `All Active`, `Waiting`, `In Service`, and `Completed`.
  - Fast search by token number, customer name, or phone.
  - Quick action buttons per ticket: `Alert Near`, `Serve`, `Complete`, `Bump Position (Up/Down)`, `No-Show / Cancel`.

### 5. 📺 Public Waiting Room TV Display
- **Dedicated TV Kiosk Screen**: Full-screen, high-contrast visual board designed for wall-mounted TVs or iPad front-desk displays.
- **Huge "NOW SERVING" Section**: Shows token numbers, customer names, and assigned counter.
- **"UP NEXT" Column**: Real-time list of upcoming customers with expected wait times.
- **QR Code Scan-to-Join**: Waiting room guests can scan the screen with their phone to join the queue directly.
- **Live Digital Clock & Announcement Ticker**.

### 6. 🏢 1-Click Multi-Industry Presets
Switch between ready-to-use business configurations:
- 💈 **Local Salon & Barber**: StyleCrafters Salon (Haircut, Beard Trim, Highlights, Facial; Stylist Chairs).
- 🩺 **Clinic & Healthcare**: CityCare Family Clinic (Doctor Consultation, Pediatrics, Triage, Diagnostics; Rooms).
- 🔧 **Repair & Tech Shop**: QuickFix Lab (Screen Replacement, Battery, Hardware Diagnostics; Workbenches).

---

## 📂 Project Architecture

```
├── App.tsx                        # Root App container & Safe Area setup
├── src/
│   ├── components/                # Modular UI components
│   │   ├── Header.tsx             # Branding, open/closed toggle, notification bell
│   │   ├── QuickStatsBar.tsx      # Real-time metrics (Waiting, Serving, Wait, Done)
│   │   ├── NowServingBanner.tsx   # Station & counter carousel with one-tap complete
│   │   ├── TokenCard.tsx          # Interactive queue card with actions & badges
│   │   ├── DigitalPassModal.tsx   # Full digital pass with SVG QR code & progress steps
│   │   ├── AddTokenModal.tsx      # Staff/Walk-in ticket generation modal
│   │   ├── NotificationModal.tsx  # Customer alert audit log & SMS/WhatsApp resend
│   │   └── NearTurnBanner.tsx     # Sticky top alert banner for turn notifications
│   ├── constants/
│   │   ├── presets.ts             # Salon, Clinic, and Repair Shop data & seed queues
│   │   └── theme.ts               # Palette with status colors (waiting, near, serving)
│   ├── context/
│   │   └── QueueContext.tsx       # State management, dispatch actions & calculations
│   ├── db/
│   │   ├── database.ts            # expo-sqlite schema setup & migrations
│   │   └── queueRepository.ts     # SQLite relational queries & aggregates
│   ├── navigation/
│   │   └── RootNavigator.tsx      # 5-tab bottom navigation (Dashboard, New, My Token, TV, Settings)
│   ├── screens/
│   │   ├── OwnerDashboardScreen.tsx # Shop-owner queue command center
│   │   ├── GenerateTokenScreen.tsx  # Customer / Self-service walk-in kiosk
│   │   ├── MyTokenScreen.tsx        # Customer live tracking with countdown & status
│   │   ├── WaitingRoomTVScreen.tsx  # Wall / TV waiting room display
│   │   └── ShopSettingsScreen.tsx   # Presets, stations, thresholds, queue reset
│   ├── types/
│   │   ├── queue.ts               # TypeScript data definitions
│   │   └── index.ts               # Barrel export
│   └── utils/
│       ├── timeEstimator.ts       # M/M/c queue wait-time calculation algorithm
│       ├── notificationHelper.ts  # SMS, WhatsApp linking, audio chime & haptics
│       └── qrCodeGenerator.tsx    # Standalone SVG QR code generator
└── package.json
```

---

## 🚀 Running the App

```bash
# 1. Start Expo dev server
npx expo start

# 2. Run directly on Android device / emulator
npx expo start --android

# 3. Run on iOS simulator (macOS)
npx expo start --ios

# 4. Run in web browser
npx expo start --web
```
