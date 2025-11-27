# Modern Attendance Taker

A sleek, modern, and entirely client-side application for tracking class attendance. Built with React and TypeScript, this tool helps educators and group organizers manage student rosters, record attendance for sessions, and visualize trends over time. All data is stored securely in your browser's local storage—no backend or internet connection required after the initial load.

## Key Features

-   **Comprehensive Student Management**: Add, edit, and delete students with details like name, photo, guardian information, contact, and birthday.
-   **Flexible Class Organization**: Create and manage custom classes. Assign students to classes manually or use the age-based auto-assignment feature.
-   **Interactive Attendance Taking**: A dedicated interface to mark students as present or absent for each session. View and sort the student list by name, class, or age.
-   **Insightful Dashboard**: Get an at-a-glance overview of your stats, including total students, sessions held, average attendance, and attendance rate.
-   **Attendance Trends Chart**: Visualize attendance data over time with an interactive bar chart, filterable by month and view type (present, absent, or combined).
-   **Data Portability**:
    -   **CSV Export**: Export all historical attendance data to a CSV file for record-keeping or external analysis.
    -   **Bulk Import**: Quickly populate your roster by importing students from a CSV file or a simple list of names.
-   **Local Storage Persistence**: Your data is automatically saved in the browser, ensuring your information is private and available offline.
-   **Responsive Design**: A clean, dark-mode UI that works seamlessly on both desktop and mobile devices.

## Tech Stack

-   **Frontend:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Charting:** [Recharts](https://recharts.org/)
-   **Icons:** [Lucide React](https://lucide.dev/)

## Installation & Setup

To get a local copy up and running, follow these simple steps.

**Prerequisites:**
*   [Node.js](https://nodejs.org/) (v18 or later recommended)
*   [npm](https://www.npmjs.com/) or a compatible package manager

**Installation:**

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/DVDHSN/Attandence-Taker.git
    ```

2.  **Navigate to the project directory:**
    ```sh
    cd Attandence-Taker
    ```

3.  **Install NPM packages:**
    ```sh
    npm install
    ```

## Usage

Once the installation is complete, you can run the application locally.

1.  **Start the development server:**
    ```sh
    npm run dev
    ```
    This command will start the Vite development server, and you can view the application by navigating to `http://localhost:3000` in your web browser.

2.  **Using the App:**
    -   **Students Tab**: Begin by adding classes and then populating your student roster. You can add students one by one or use the "Bulk Import" feature.
    -   **Attendance Tab**: Select a date and mark each student as present or absent. Save the session to record the data.
    -   **Dashboard Tab**: Return here at any time to see your summary statistics, attendance trends, and a list of recent sessions. You can also edit past sessions directly from the history list.

## File Structure

Here's an overview of the key files and directories in the project:

```
Attandence-Taker/
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable React components
│   │   ├── AttendanceTaker.tsx
│   │   ├── Dashboard.tsx
│   │   └── StudentManager.tsx
│   ├── services/          # Business logic and external services
│   │   └── storageService.ts # Handles localStorage interactions and CSV export
│   ├── App.tsx            # Main application component and layout
│   ├── index.tsx          # React application entry point
│   └── types.ts           # TypeScript type definitions
├── index.html             # Main HTML file
├── package.json           # Project dependencies and scripts
└── vite.config.ts         # Vite configuration
```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for more information.
