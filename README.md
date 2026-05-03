# 🏪 Aminah Jaya Project Ecosystem

[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-2c4f7c?style=for-the-badge&logo=solid&logoColor=c8c9cb)](https://www.solidjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

A comprehensive business management suite for **Aminah Jaya**, featuring a robust backend API, a modern CMS dashboard, and a high-performance landing page.

---

## 🏗️ Project Structure

The ecosystem is divided into several specialized modules:

| Module | Type | Tech Stack | Description |
| :--- | :--- | :--- | :--- |
| [**`api-cms-aminah-jaya`**](./api-cms-aminah-jaya) | Backend | Rust (Axum + SQLx) | Core API handling authentication, customers, and orders. |
| [**`api-integrasi-aminah-jaya`**](./api-integrasi-aminah-jaya) | Backend | Rust | Integration service for third-party systems. |
| [**`cms-aminah-jaya`**](./cms-aminah-jaya) | Frontend | SolidJS (SolidStart) | Admin dashboard for managing business operations. |
| [**`lp-aminah-jaya`**](./lp-aminah-jaya) | Frontend | SolidJS | Public-facing landing page for Aminah Jaya. |

---

## ✨ Key Features

- **🚀 High Performance**: Built with Rust for the backend and SolidJS for the frontend to ensure maximum speed and efficiency.
- **🔒 Secure Authentication**: Robust JWT-based authentication with password hashing using Bcrypt.
- **📊 Real-time Dashboard**: Interactive CMS with data tables, order tracking, and customer management.
- **📱 Responsive Design**: Fully responsive UI built with Tailwind CSS, optimized for all devices.
- **🐳 Dockerized**: Containerized services for seamless deployment and scaling.

---

## 🛠️ Tech Stack

### Backend
- **Language**: Rust 🦀
- **Framework**: Axum
- **Database**: PostgreSQL (via SQLx)
- **Utilities**: Serde, Tokio, JSONWebToken, Bcrypt, UUID

### Frontend
- **Framework**: SolidJS 💙
- **Meta-framework**: SolidStart / Vinxi
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide Solid

---

## 🚀 Getting Started

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Node.js](https://nodejs.org/) (v20 or later)
- [Docker](https://www.docker.com/get-started) & [Docker Compose](https://docs.docker.com/compose/install/)
- [PostgreSQL](https://www.postgresql.org/download/)

### Setup Instructions

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Dzuuul/aminah-jaya.git
    cd aminah-jaya
    ```

2.  **Configure Environment Variables**:
    Copy the `.env.example` (if available) or create a `.env` file in each module directory with the necessary configurations (Database URL, Secret Keys, etc.).

3.  **Run the Backend**:
    ```bash
    cd api-cms-aminah-jaya
    cargo run
    ```

4.  **Run the CMS Dashboard**:
    ```bash
    cd cms-aminah-jaya
    npm install
    npm run dev
    ```

---

## 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">Made with ❤️ for Aminah Jaya</p>