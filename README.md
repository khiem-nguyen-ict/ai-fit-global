# AI-Fit Global 🏋️‍♂️

An AI-powered fitness application that uses computer vision to track your workouts in real-time. Get instant feedback on your form and count your reps automatically using MediaPipe pose detection.

## ✨ Features

- **Real-time Pose Detection** - Uses MediaPipe Pose to track 33 body landmarks and analyze exercise form
- **Automatic Rep Counting** - Counts repetitions automatically based on joint angles with UP/DOWN state machine
- **Voice Commands** - Control the app hands-free with Web Speech API recognition
- **Audio Feedback** - Receive spoken feedback, rep counts, and milestone celebrations during workouts
- **Beep Sounds** - Audio beeps using Web Audio API for countdown and rep feedback
- **Multi-language Support** - Available in English (EN), Vietnamese (VI), and Finnish (FI)
- **Weather-aware Tips** - Get contextual workout tips based on your local weather using Open-Meteo API
- **Countdown Timer** - 3-second countdown with audio before workout starts
- **Milestone Celebrations** - Special voice feedback at 5, 10, 15, 20, and 25 reps
- **Supported Exercises**:
  - 🦵 Squats (knee angle tracking)
  - 💪 Push-ups (elbow angle tracking)
  - 🏃 Lunges (knee angle tracking)

## 🛠️ Tech Stack

- **Frontend**: React 19.2.4 with TypeScript
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS (via CDN)
- **Pose Detection**: MediaPipe Pose (via CDN)
- **Speech**: Web Speech API (Recognition & Synthesis)
- **Audio**: Web Audio API for beep sounds
- **Weather**: Open-Meteo API (free, no API key required)
- **Geocoding**: OpenStreetMap Nominatim API

## 📁 Project Structure

```
ai-fit-global/
├── App.tsx                    # Main application component with language/exercise state
├── index.tsx                  # React 19 entry point with StrictMode
├── index.html                 # HTML template with MediaPipe & Tailwind CDN scripts
├── types.ts                   # TypeScript type definitions (Language, ExerciseType, etc.)
├── i18n.ts                    # Internationalization translations (EN, VI, FI)
├── components/
│   ├── WorkoutScreen.tsx      # Main workout interface with pose detection & voice
│   └── RepDisplay.tsx         # Rep counter overlay component
├── services/
│   ├── poseService.ts         # Angle calculation and exercise thresholds
│   ├── speechService.ts       # Text-to-speech, voice recognition & beep sounds
│   └── weatherService.ts      # Geolocation-based weather via Open-Meteo
├── backend_demo.js            # Reference Stripe integration code (commented)
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration (ES2022, bundler)
└── vite.config.ts             # Vite build configuration with path aliases
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A modern browser with webcam access (Chrome, Edge, Firefox)
- Microphone access (optional, for voice commands)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-fit-global.git
   cd ai-fit-global
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   
   Create a `.env.local` file if you need Gemini API integration:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 📖 Usage

1. **Select an Exercise** - Choose from Squats, Push-ups, or Lunges using the buttons at the bottom
2. **Allow Camera Access** - Grant permission when prompted to enable pose detection
3. **Allow Microphone** (optional) - Enable voice commands for hands-free control
4. **Start Workout** - Click the "Start" button to begin (triggers 3-second countdown)
5. **Exercise** - Perform your exercises while the AI tracks your movements and counts reps
6. **Voice Commands**:
   - **English**: "start", "begin", "go" / "stop", "pause", "finish" / "squats", "push-ups", "lunges"
   - **Vietnamese**: "bắt đầu", "tập", "chạy" / "dừng", "dừng lại", "thôi", "nghỉ"
   - **Finnish**: "aloita", "mene" / "lopeta", "seis"

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 🌐 Internationalization

The app supports multiple languages. Translations are defined in [`i18n.ts`](i18n.ts):

- **English (EN)** - Default
- **Vietnamese (VI)** - Tiếng Việt
- **Finnish (FI)** - Suomi

Each language includes:
- UI labels and buttons
- Voice command keywords
- Exercise instructions
- Milestone celebration messages
- Random encouragements

To add a new language:
1. Add the language code to the [`Language`](types.ts:2) enum in `types.ts`
2. Add translations object in [`i18n.ts`](i18n.ts)
3. Add the option to the language selector in [`App.tsx`](App.tsx:50)

## 🏗️ Architecture

### Pose Detection Flow
1. Camera captures video frames at 1280x720 resolution
2. MediaPipe Pose processes each frame to detect 33 body landmarks
3. Joint angles are calculated using the [`calculateAngle()`](services/poseService.ts:8) function
4. Rep state machine tracks UP/DOWN/INIT positions based on angle thresholds
5. Audio feedback is provided via Web Speech API with beep fallback

### Exercise Angle Tracking
| Exercise | Body Points | Angle Measured |
|----------|-------------|----------------|
| Squat | Hip → Knee → Ankle | Knee flexion |
| Push-up | Shoulder → Elbow → Wrist | Elbow flexion |
| Lunge | Hip → Knee → Ankle | Knee flexion |

### Exercise Thresholds (Lenient for easier detection)
| Exercise | Down Threshold | Up Threshold |
|----------|---------------|--------------|
| Squat | 120° | 145° |
| Push-up | 110° | 150° |
| Lunge | 120° | 150° |

### State Machine
```
INIT → (angle < down_threshold) → DOWN
DOWN → (angle > up_threshold) → UP (+1 rep, speak feedback)
UP → (angle < down_threshold) → DOWN
```

### Weather Integration
- Uses browser Geolocation API to get user coordinates
- Fetches weather from Open-Meteo API (free, no key required)
- Reverse geocoding via OpenStreetMap Nominatim
- Displays temperature, condition, wind speed, and contextual tips
- Cold weather (< 10°C) triggers warm-up reminder
- Warm weather triggers hydration reminder

### Speech System
- **Text-to-Speech**: Native Web Speech API with voice selection
- **Speech Recognition**: Continuous listening for voice commands
- **Beep Sounds**: Web Audio API oscillator for countdown/rep feedback
- **Debouncing**: Prevents duplicate speech within 300ms

## 🎯 Key Components

### [`WorkoutScreen.tsx`](components/WorkoutScreen.tsx)
Main workout interface handling:
- MediaPipe Pose initialization and camera setup
- Real-time pose landmark processing
- Rep counting state machine
- Voice command recognition
- Countdown timer before workout
- Exercise switching

### [`RepDisplay.tsx`](components/RepDisplay.tsx)
Overlay component showing:
- Current rep count (large display)
- Current status (UP/DOWN) with color coding
- Glassmorphism styling with backdrop blur

### [`speechService.ts`](services/speechService.ts)
Audio services including:
- [`speak()`](services/speechService.ts:49) - Text-to-speech with language support
- [`initSpeech()`](services/speechService.ts:9) - Audio context initialization (required for Chrome)
- [`createSpeechRecognition()`](services/speechService.ts:113) - Voice command setup
- [`playBeep()`](services/speechService.ts:27) - Web Audio API beep generation

### [`poseService.ts`](services/poseService.ts)
Pose analysis utilities:
- [`calculateAngle()`](services/poseService.ts:8) - Three-point angle calculation
- Exercise threshold constants for rep detection

### [`weatherService.ts`](services/weatherService.ts)
Weather integration:
- [`getLocalWeather()`](services/weatherService.ts:22) - Geolocation + weather fetch
- WMO weather code interpretation with emoji icons

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- [MediaPipe](https://mediapipe.dev/) for pose detection
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vite](https://vitejs.dev/) for the blazing fast build tool
- [Open-Meteo](https://open-meteo.com/) for free weather API
- [OpenStreetMap Nominatim](https://nominatim.org/) for geocoding
