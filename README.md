# Personal Study Planner & Roadmap

## 🎯 Objective
A custom web-based personal study planner and roadmap application designed to track learning progress from April to December 2025. The overarching goal of this roadmap is to build a strong foundation in Cloud, DevOps, and Security to land a remote job or relocate to Germany by 2026.

## ✨ Features
*   **Interactive Study Phases:** The roadmap is divided into 4 distinct phases (Deadline Sprint, Technical Base, Cloud & Certs, Python & Java) plus a Final Capstone Project.
*   **Persistent Checklists:** Interactive task checklists that save your progress locally using the browser's `localStorage`.
*   **Weekly Agenda:** A detailed day-by-day breakdown of study topics, live classes, and fixed routines.
*   **Push Notifications:** Built-in web notifications to remind you of study sessions, daily stand-up meetings, and language classes.
*   **PWA Ready:** Can be installed as a Progressive Web App (PWA) on mobile and desktop devices for a native app-like experience.
*   **Course Progress Tracker:** Visual progress tracking for long-term continuous courses (e.g., LinuxTips/PICK).

## 🛠️ Technologies Used
*   **HTML5 & CSS3:** Responsive, dark-themed user interface built entirely with custom CSS (Flexbox, Grid, CSS Variables) without external CSS frameworks.
*   **Vanilla JavaScript:** Handles tab navigation, checklist persistence, and DOM manipulation without relying on libraries like React or Vue.
*   **Web APIs:** 
    *   `localStorage` for data persistence.
    *   `Service Workers` and `Notifications API` for background task scheduling and local push alerts.

## 🚀 How to Run
1. Clone or download the repository.
2. To view the UI and use the checklists, simply double-click and open the `index.html` file in any modern web browser.
3. **Important Note:** To test the Push Notifications and PWA installation features, you must serve the files using a local web server (e.g., VS Code Live Server, Python's `python -m http.server`, or Node's `http-server`). Browsers block Service Workers and Notifications on standard `file://` protocols for security reasons.

## 🗺️ Roadmap Overview
*   **Phase 1 (Apr - May):** Deadline Sprint
    *   Focus: Post-grad Pentest Challenge, Docker basics, German & English practice.
*   **Phase 2 (Jun - Jul):** Technical Base
    *   Focus: Data Structures in C, Computer Networking, AWS Fundamentals.
*   **Phase 3 (Aug - Sep):** Cloud & Certifications
    *   Focus: AWS Cloud Practitioner Certification, Cloud Infrastructure, K8s.
*   **Phase 4 (Oct - Nov):** Python, Java & Portfolio
    *   Focus: Python Automation, Java OOP, API building, and preparing the GitHub/LinkedIn portfolio.
*   **December:** Final Project ("SecureOps Platform")
    *   Integrating all learned skills into a single platform with CI/CD, containerization, and security best practices.

## 📜 Project Rules
The planner embeds strict consistency rules:
*   **German Every Day:** 30 minutes daily, non-negotiable.
*   **Sacred Sundays:** Reserved for family and rest; zero studying allowed.
*   **Light Fridays:** Minimal studying to prevent burnout.
*   **Gym Routine:** Fixed morning workouts for mental and physical health.

---

*Designed and developed as a personal accountability tool.*


## Integração adicionada
Este pacote integra o Planner com o Cert Guide em um único `index.html`, mantendo PWA, Service Worker, notificações, checklists do planner e progresso das certificações via `localStorage`.
