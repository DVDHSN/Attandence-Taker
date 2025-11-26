<h1 align="center">Attendance Taker</h1>

<div align="center">
  A modern, client-side web application for tracking class attendance. Built with React and TypeScript, it offers a clean, dark-mode interface for managing students, recording sessions, and visualizing attendance data.
</div>

<br />

<div align="center">
  <a href="#-key-features">Key Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-installation--setup">Installation</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-file-structure">File Structure</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</div>

---

## 📋 Description

Attendance Taker is a responsive and intuitive web application designed to simplify the process of tracking attendance for classes, groups, or events. All data is stored locally in your browser's LocalStorage, ensuring your information remains private and accessible without needing an internet connection or a user account.

The application is split into three main sections: a dashboard for a high-level overview, an attendance marking page, and a comprehensive student roster manager. It's built as a single-page application using modern web technologies, providing a fast and seamless user experience.

## ✨ Key Features

- **📊 Interactive Dashboard**: Get a quick overview of key metrics like total students, sessions held, average attendance, and overall attendance rate.
- **📈 Attendance Trends**: Visualize attendance history with an interactive bar chart, filterable by month.
- **👨‍🎓 Student Roster Management**: Easily add, remove, and search for students. Manage student details like guardian information and contact numbers.
- **📚 Class Organization**: Create, rename, and delete classes to group and organize your students effectively.
- **💪 Bulk Actions**: Select multiple students to assign them to a class or delete them all at once, saving you time.
- **✅ Simple Attendance Marking**: Mark attendance with a single click. Features include "Mark All Present/Absent" and optional topic notes for each session.
- **🔄 Session History & Editing**: View a list of all past sessions and edit any previous attendance record if needed.
- **💾 Data Export**: Export your complete attendance history to a CSV file for backup, reporting, or use in other applications.
- **🔐 Privacy-Focused**: All data is stored exclusively on your device in the browser's Local Storage. No data is ever sent to a server.
- **📱 Responsive Design**: A clean, dark-mode interface that works seamlessly on both desktop and mobile devices.

## 🛠️ Tech Stack

The project is built using a modern frontend stack:

- **Frontend:** [React](https://reactjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (via CDN)
- **Charting:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/guide/packages/lucide-react)

## 🚀 Installation & Setup

To get a local copy up and running, follow these simple steps.

**Prerequisites:**
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or any other package manager like Yarn or pnpm.

**Steps:**

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/DVDHSN/Attandence-Taker.git
    ```

2.  **Navigate to the project directory:**
    ```sh
    cd Attandence-Taker
    ```

3.  **Install dependencies:**
    ```sh
    npm install
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

The application will now be running at `http://localhost:3000`.

## 🖥️ Usage

Once the application is running, you can start tracking attendance right away:

1.  **Manage Roster**: Navigate to the **"Student Roster"** tab.
    - Use the "Add New Student" form to add students to your list.
    - Use the "Manage Classes" section to create different classes or groups (e.g., "Grade 5", "Sunday School").
    - Assign students to a class either individually or by using the bulk selection tools.

2.  **Take Attendance**: Go to the **"Take Attendance"** tab.
    - Select the date for the session.
    - Add an optional topic for the lesson.
    - Click on each student's name to toggle their status between "Present" and "Absent".
    - Use the "Mark All" buttons for convenience.
    - Click "Save Attendance" to log the session.

3.  **View Dashboard**: Visit the **"Dashboard"** tab.
    - Here you will see summary statistics and a chart visualizing attendance trends.
    - The "Recent Sessions" list allows you to view and edit past records.
    - Use the "Export CSV" button to download your data.

## 📁 File Structure

Here is an overview of the key files and directories in the project:

```
Attandence-Taker/
├── components/
│   ├── AttendanceTaker.tsx   # Component for marking attendance
│   ├── Button.tsx            # Reusable button component
│   ├── Dashboard.tsx         # Dashboard view with stats and charts
│   └── StudentManager.tsx    # Component for managing students and classes
├── services/
│   └── storageService.ts     # Handles all interactions with LocalStorage and CSV export
├── App.tsx                   # Main application component, manages state and routing
├── index.html                # The main HTML file
├── index.tsx                 # React application entry point
├── package.json              # Project dependencies and scripts
├── types.ts                  # TypeScript type definitions
└── vite.config.ts            # Vite configuration file
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  **Fork the Project**
2.  **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Push to the Branch** (`git push origin feature/AmazingFeature`)
5.  **Open a Pull Request**

## 📄 License

Distributed under the MIT License. See `LICENSE` file for more information.
