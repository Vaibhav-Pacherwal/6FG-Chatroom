# 💬 6FG-Chatroom

**6FG-Chatroom** is a real-time chatroom application built with **Node.js**, **Socket.IO**, **MySQL**, and **OTP-based email authentication** powered by **Brevo**. It enables users to authenticate via email OTP and chat in real time with message alignment based on the sender.

---

## 🚀 Features

- Real-time messaging with **Socket.IO**
- OTP-based email authentication using **Brevo**
- Messages aligned: current user messages on the right, others on the left
- Dynamic UI with **EJS templates**
- Persistent storage using **MySQL**
- Dockerized for easy setup and deployment

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Real-time communication:** Socket.IO
- **Authentication:** Brevo Email OTP
- **Templating engine:** EJS
- **Environment variables:** dotenv
- **Containerization:** Docker & Docker Compose

---

## 📦 Docker Setup

This project is containerized with Docker for easy dependency management and environment consistency.

### Requirements

- Docker
- Docker Compose

### Environment Variables

Create a `.env` file in the root directory with the following content (replace placeholders with your actual credentials):

```env
EMAIL=your_email@example.com
EMAIL_PASS=your_email_password
DB_HOST=db
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=chatroom
BREVO_API_KEY=your_brevo_api_key
PORT=3036

###Running the app with Docker

docker-compose up --build