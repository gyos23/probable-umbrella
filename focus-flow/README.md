# Focus Flow

A beautiful, cross-platform task management app inspired by OmniFocus, built with React Native and Expo. Focus Flow helps you manage tasks and projects with advanced features like dependencies, Gantt charts, and calendar views.

## Features

### Core Functionality
- **Task Management**: Create, organize, and track tasks with rich metadata
- **Project Organization**: Group related tasks into projects with progress tracking
- **Focus Areas**: Categorize your work with custom focus areas
- **Dependencies**: Define task dependencies and track blockers
- **Multiple Views**: Switch between List, Projects, Calendar, and Gantt chart views

### Task Features
- Priority levels (Low, Medium, High, Critical)
- Status tracking (Todo, In Progress, Completed, Blocked, Deferred)
- Due dates and planned dates
- Start dates and completion dates
- Progress tracking (0-100%)
- Notes and descriptions
- Tags for organization

### Views
1. **Tasks View**: List all tasks with filtering by status
2. **Projects View**: Manage projects and see task progress
3. **Calendar View**: View tasks by date with due and planned dates
4. **Gantt Chart**: Timeline view showing task dependencies and durations

### Design
- Beautiful UI following Apple's Human Interface Guidelines
- Automatic dark mode support
- Smooth animations and transitions
- Polished, professional appearance worthy of an Apple Design Award

## Tech Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tooling
- **TypeScript**: Type-safe development
- **Expo Router**: File-based navigation
- **Zustand**: State management
- **React Native Reanimated**: Smooth animations
- **AsyncStorage**: Local data persistence
- **date-fns**: Date manipulation
- **React Native SVG**: Graphics for charts

## Platform Support

- **iOS**: Full support with native feel
- **Android**: Full support with Material Design adaptations
- **Web**: Progressive Web App support

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- For iOS development: macOS with Xcode
- For Android development: Android Studio and SDK

### Installation

1. Clone the repository:
```bash
cd focus-flow
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

### Running on Different Platforms

#### iOS (macOS only)
```bash
npm run ios
```

#### Android
```bash
npm run android
```

#### Web
```bash
npm run web
```

### Using Expo Go

1. Install Expo Go on your mobile device:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start the development server:
```bash
npm start
```

3. Scan the QR code with your device:
   - iOS: Use the Camera app
   - Android: Use the Expo Go app

## Project Structure

```
focus-flow/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Tasks view
│   │   ├── projects.tsx   # Projects view
│   │   ├── calendar.tsx   # Calendar view
│   │   └── gantt.tsx      # Gantt chart view
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Button.tsx
│   │   └── TaskRow.tsx
│   ├── store/            # State management
│   │   └── taskStore.ts
│   ├── theme/            # Design system
│   │   ├── colors.ts
│   │   └── useTheme.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── utils/            # Utility functions
│       └── sampleData.ts
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

## Usage

### Creating a Task

1. Navigate to the Tasks view
2. Tap the + button in the bottom right
3. Enter task details:
   - Title (required)
   - Notes (optional)
   - Priority level
   - Status
4. Tap "Done" to save

### Creating a Project

1. Navigate to the Projects view
2. Tap the + button
3. Enter project details:
   - Name (required)
   - Description (optional)
   - Choose a color
4. Tap "Done" to save

### Viewing Tasks by Date

1. Navigate to the Calendar view
2. Select a date to see tasks due or planned for that day
3. Navigate between months using the arrow buttons
4. Tap on a task to view details

### Viewing Gantt Chart

1. Navigate to the Gantt view
2. See all tasks with dates on a timeline
3. Scroll horizontally to see different time periods
4. Task bars show duration and progress

## Sample Data

The app automatically loads with sample data on first launch to demonstrate features. You can delete these tasks and projects and start fresh with your own data.

## Data Persistence

All data is stored locally on your device using AsyncStorage. Your tasks, projects, and focus areas are automatically saved as you make changes.

## Future Enhancements

- [ ] Task templates
- [ ] Recurring tasks
- [ ] Subtasks and nested projects
- [ ] File attachments
- [ ] Reminders and notifications
- [ ] Cloud sync across devices
- [ ] Collaboration features
- [ ] Time tracking
- [ ] Reports and analytics
- [ ] Widgets for iOS and Android
- [ ] Siri shortcuts integration
- [ ] Import/export functionality

## Development

### Building for Production

#### iOS
```bash
eas build --platform ios
```

#### Android
```bash
eas build --platform android
```

#### Web
```bash
npm run web:build
```

### Testing

The app includes TypeScript type checking. Run type checking with:
```bash
npx tsc --noEmit
```

## Contributing

This is a demonstration project built to showcase a production-quality task management app. Feel free to use it as a reference for your own projects!

## License

MIT License - feel free to use this code for your own projects.

## Acknowledgments

- Inspired by OmniFocus and other professional task management apps
- Built with React Native and Expo
- Design follows Apple's Human Interface Guidelines
- Aims for Apple Design Award quality

---

Built with ❤️ using React Native and Expo
