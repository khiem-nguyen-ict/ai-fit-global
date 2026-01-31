# AI-Fit Global 🏋️‍♂️

<div align="center">
<img width="1200" height="475" alt="AI-Fit Global Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

An AI-powered fitness application that uses computer vision to track your workouts in real-time. Get instant feedback on your form and count your reps automatically using MediaPipe pose detection.

## ✨ Features

- **Real-time Pose Detection** - Uses MediaPipe Pose to track body landmarks and analyze exercise form
- **Automatic Rep Counting** - Counts repetitions automatically based on joint angles
- **Voice Commands** - Control the app hands-free with speech recognition
- **Audio Feedback** - Receive spoken feedback and rep counts during workouts
- **Multi-language Support** - Available in English (EN), Vietnamese (VI), and Finnish (FI)
- **Weather-aware Tips** - Get contextual workout tips based on your local weather
- **Supported Exercises**:
  - 🦵 Squats
  - 💪 Push-ups
  - 🏃 Lunges

## 🛠️ Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Pose Detection**: MediaPipe Pose
- **Speech**: Web Speech API (Recognition & Synthesis)

## 📁 Project Structure

```
ai-fit-global/
├── App.tsx                    # Main application component
├── index.tsx                  # React entry point
├── index.html                 # HTML template with MediaPipe scripts
├── types.ts                   # TypeScript type definitions
├── i18n.ts                    # Internationalization translations
├── components/
│   ├── WorkoutScreen.tsx      # Main workout interface with pose detection
│   └── RepDisplay.tsx         # Rep counter display component
├── services/
│   ├── poseService.ts         # Angle calculation and exercise thresholds
│   ├── speechService.ts       # Text-to-speech and voice recognition
│   └── weatherService.ts      # Geolocation-based weather service
├── backend_demo.js            # Reference Stripe integration code
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite build configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A modern browser with webcam access
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
4. **Start Workout** - Click the "Start" button or say "Start" to begin
5. **Exercise** - Perform your exercises while the AI tracks your movements and counts reps
6. **Voice Commands**:
   - "Start" / "Begin" / "Go" - Start the workout
   - "Stop" / "Pause" / "Finish" - Stop the workout
   - "Squats" - Switch to squats
   - "Push-ups" - Switch to push-ups
   - "Lunges" - Switch to lunges

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 🌐 Internationalization

The app supports multiple languages. Translations are defined in `i18n.ts`:

- **English (EN)** - Default
- **Vietnamese (VI)** - Tiếng Việt
- **Finnish (FI)** - Suomi

To add a new language:
1. Add the language code to the `Language` enum in `types.ts`
2. Add translations in `i18n.ts`
3. Add the option to the language selector in `App.tsx`

## 🏗️ Architecture

### Pose Detection Flow
1. Camera captures video frames
2. MediaPipe Pose processes each frame to detect body landmarks
3. Joint angles are calculated using the `calculateAngle` function
4. Rep state machine tracks UP/DOWN positions based on angle thresholds
5. Audio feedback is provided via Web Speech API

### Exercise Thresholds
| Exercise | Down Threshold | Up Threshold |
|----------|---------------|--------------|
| Squat | 95° | 160° |
| Push-up | 90° | 160° |
| Lunge | 100° | 160° |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- [MediaPipe](https://mediapipe.dev/) for pose detection
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vite](https://vitejs.dev/) for the blazing fast build tool
