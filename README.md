# 🌟 AuraStudy

> **Elevate your study sessions with ambient environments and focused productivity.**

AuraStudy is a lightweight, interactive web application designed to help users achieve deep work and maintain focus. By combining productivity tools with immersive, aesthetic environments, AuraStudy creates the perfect digital atmosphere for studying, coding, or reading.

## ✨ Features

* **Ambient Environments:** Immerse yourself in customizable aesthetic backgrounds (Cozy Fireplace, Rainy Cafe, Lofi Girl, Cyberpunk Rain).
* **Bento Grid Workspace:** Customisable dashboard with toggleable modules:
  * **Pomodoro Timer & Stopwatch:** Standard focus and session timers.
  * **To-Do List & Study Logger:** Log tasks and track focus sessions directly from the workspace.
  * **Clock Station:** World clocks for global synchronization.
  * **Daily Streaks & Gamification:** Build daily streaks with custom goals and confetti celebrations.
  * **Focus Analytics:** Track and visualize study patterns using integrated charts.
  * **Audio Mixer:** Soundscape controller to mix ambient rain and fireplace sounds.
* **Lightweight & Fast:** Built on vanilla JS to ensure instant load times and zero lag.

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
* **Libraries & Assets:**
  * **Chart.js:** For visualizing focus analytics.
  * **Canvas Confetti:** For celebrating study milestones and streak increases.
  * **Lucide Icons:** Premium, modern icon set.
  * **Google Fonts:** Custom fonts tailored for different visual styles (Comfortaa, Orbitron, Fira Code, etc.).

## 📂 Repository Structure

```
AuraStudy/
│
├── server.py                       # Python local host server script
├── run_server.bat                  # Runs server.py and opens AuraStudy in your default browser
├── app.js                          # Main application logic, state, and interactivity
├── style.css                       # Main application styling (aesthetic, minimalist, cyberpunk, anime themes)
├── index.html                      # Main HTML structure and onboarding experience
│
├── images/                         # Ambient background assets
│   ├── cozy fireplace.png
│   ├── cyberpunk rain.png
│   ├── lofi girl.png
│   └── rainy cafe.png
│
├── sounds/                         # Ambient audio assets
│   ├── ambient_rain.m4a           
│   ├── fireplace.mp3
│   ├── fireplace2.mp3
│   └── rainy down with birds singing.mp3
│
├── LICENSE                         # Repository license
└── README.md                       # Project documentation
```

## 🚀 Getting Started

To run AuraStudy locally on your machine, follow these simple steps:

### Prerequisites
You only need a modern web browser (Chrome, Firefox, Safari, Edge) to run this application. If you want to run the local server script, you will need Python installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/AuraStudy.git
   ```
2. **Navigate to the project directory:**
   ```bash
   cd AuraStudy
   ```
3. **Launch the app:**
   Simply double-click the `run_server.bat` file to start a local server and open the app in your default browser, or open `index.html` directly in your browser.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! If you have ideas to make the study environments more immersive or want to add new productivity features:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the terms specified in the `LICENSE` file. See `LICENSE` for more information.
