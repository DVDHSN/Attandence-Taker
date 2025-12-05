
# [Attendance Manager: A Modern Class & Student Tracker](https://attendancemgr.netlify.app/)

A modern, responsive, and offline-first web application designed for managing class attendance. It allows teachers, club leaders, and administrators to effortlessly track student presence, manage student rosters, and visualize attendance data over time.

This application runs entirely in your browser and uses localStorage for data persistence, ensuring your data is private and the app is fully functional without an internet connection or a backend server.

## Key Features

*   **📊 Interactive Dashboard:** Get a quick overview of key statistics like total students, sessions, and average attendance. Visualize attendance trends with interactive bar charts and review recent session history.
*   **🎂 Birthday Tracker:** Never miss a student's birthday with a handy monthly birthday list on the dashboard.
*   **✅ Easy Attendance Taking:** A simple and intuitive interface to mark students as present or absent. Add optional topics for each session and edit past records with ease.
*   **🧑‍🎓 Comprehensive Student Management:** Add, edit, and delete student profiles. Store important details like photos, guardian information, contact details, and birthdays.
*   **📂 Class Organization:** Create and manage multiple classes. Assign students to classes and configure age ranges for automatic class suggestions when adding new students.
*   **🚀 Bulk Operations:** Quickly populate your roster by bulk importing students from a CSV file or a simple text list. Bulk assign classes or delete multiple students at once.
*   **💾 Data Portability:**
    *   Export detailed attendance history for all students and sessions to a CSV file.
    *   Create a full JSON backup of all application data (students, sessions, classes).
    *   Restore your data from a JSON backup file with a smart-merge feature.
*   **🔒 Offline & Private:** Works entirely in your browser. No data is sent to any server. Your information stays on your device.
*   **🎨 Modern UI:** A sleek, responsive, dark-mode interface built with Tailwind CSS that works beautifully on desktop and mobile.

## Tech Stack

*   **Frontend:** React, TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **Icons:** Lucide React
*   **Charting:** Recharts

## Installation & Setup

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or later)
*   npm or yarn

### Steps

1.  Clone the repository:
    ```bash
    git clone https://github.com/DVDHSN/Attandence-Taker.git
    ```

2.  Navigate to the project directory:
    ```bash
    cd Attandence-Taker
    ```

3.  Install the dependencies:
    ```bash
    npm install
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```

5.  Open your browser and go to `http://localhost:3000` (or the URL provided in your terminal).

## Usage

After running the application, you can navigate through the different sections using the sidebar:

*   **Dashboard:** View your attendance summary, charts, and recent activity.
*   **Attendance:** Start a new attendance session. Click on a student's card to cycle through their status (Present -> Absent -> Unmarked).
*   **Students:** Add new students one by one or use the bulk import feature. Click on a student to view their detailed profile, attendance stats, and edit their information. Manage your class lists from this page as well.
*   **Settings:** Backup your data to a JSON file, restore from a backup, or reset the application to its initial state. It is highly recommended to perform regular backups.

**All data is automatically saved in your browser's local storage as you make changes.**

## File Structure

Here's a brief overview of the key files and directories in the project:

```text
.
├── src
│   ├── components/      # React components for each feature/view
│   │   ├── AttendanceTaker.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Settings.tsx
│   │   └── StudentManager.tsx
│   ├── services/        # Logic for data handling (e.g., localStorage)
│   │   └── storageService.ts
│   ├── types.ts         # TypeScript type definitions for data models
│   └── App.tsx          # Main application component and layout
├── index.html           # HTML entry point
├── package.json         # Project dependencies and scripts
└── vite.config.ts       # Vite configuration
```

## Contributing

Contributions are welcome! If you'd like to help improve the application, please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix (`git checkout -b feature/your-feature-name`).
3.  Make your changes and commit them (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/your-feature-name`).
5.  Open a Pull Request.

## License

This project is licensed under the MIT License.
