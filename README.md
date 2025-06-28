# 🛡️ AI-Powered Steganographic Communication System

<img src="https://github.com/RaoHai29/DUET-FYP-CYBER-2025/blob/main/POSTER.jpeg?raw=true" alt="Poster" width="100%" />


## 🔍 Overview

In a world increasingly challenged by surveillance, censorship, and privacy breaches, our project **"AI-Powered Steganographic Communication System"** offers a future-ready, intelligent solution for **covert and secure multimedia communication**.

This MERN-stack powered platform combines **hybrid cryptography**, **AI-based steganography**, and **deep learning compression** to protect sensitive data in real-time.

---

## 🚀 What We Built

We developed a **secure web communication system** that:

- Encrypts messages and images using **AES-128 + RSA-1024**
- Hides encrypted data inside **images using steganography**
- Compresses stego-media using **autoencoders (trained in Python)**
- Transmits data via a secure **MERN + WebSocket** infrastructure
- Ensures end-to-end protection and detection resistance

---

## 🌟 Key Highlights

### 🔐 AI-Driven Encryption
- AES-128 encryption for message confidentiality
- RSA-1024 for secure key distribution

### 🖼️ Steganographic Concealment
- Adaptive LSB image embedding
- U-Net and Wav2Vec assisted concealment

### 📦 Optimized Data Compression
- Autoencoder-based compression trained in Python
- Reduced file size without losing embedded payload

### 🌐 Secure Web Transmission
- Real-time APIs with Express.js & Socket.IO
- Cloudinary integration for secure file handling

### ⏱️ Real-Time Data Protection
- End-to-end secure message exchange
- Live delivery and socket-based decryption on receipt

---

## ⚙️ Tech Stack

| Layer             | Technology/Tool                          |
|------------------|------------------------------------------|
| 🧠 AI Models      | Python, TensorFlow (U-Net, Autoencoders)  |
| 💬 Frontend       | React.js                                 |
| 🔌 Backend        | Node.js, Express.js                      |
| 🗃️ Database       | MongoDB (Mongoose)                       |
| 🔐 Cryptography   | Node.js Crypto module                    |
| 🖼️ Steganography  | Jimp (Node.js), OpenCV (Python)          |
| ☁️ Cloud Hosting  | Cloudinary                               |
| 🔊 Realtime       | Socket.IO                                |

---

## 🧪 Results Summary

| Metric                        | Result              |
|------------------------------|---------------------|
| PSNR (image quality)         | ~39.5 dB            |
| SSIM (structural similarity) | ~0.97               |
| Steganalysis resistance      | 96% success         |
| Embedding capacity           | ~512 KB             |
| Compression gain             | ~42% size reduction |

---

## 👨‍💻 Team & Contributors

| Name                      | Roll Number   | LinkedIn                                         |
|---------------------------|---------------|--------------------------------------------------|
| **Rao Abdul Hai**         | 21F-BSCY-29   | [🔗 Profile](https://www.linkedin.com/in/rao-abdul-hai-87aa9b1b4/)      |
| Muhammad Youshaa Ali      | 21F-BSCY-02   | [🔗 Profile](https://www.linkedin.com/in/youshaa/)                      |
| Hassan Ahmed Farooqi      | 21F-BSCY-34   | [🔗 Profile](https://www.linkedin.com/in/hassan-farooqi-b67561248/)     |
| Syed Ali Yousha Naqvi     | 21F-BSCY-48   | [🔗 Profile](https://www.linkedin.com/in/ali-yousha-162090254/)         |
| Shahbaz Ali               | 21F-BSCY-41   | —                                                |

**Supervisor:** Dr. Ahmed Sikandar  
**Department:** Cybersecurity, Dawood University of Engineering and Technology (DUET)


---

## 🛠️ How to Run Locally

```bash
# Clone the repository
git clone https://github.com/RaoHai29/DUET-FYP-CYBER-2025.git
cd your-repo-name

# Install dependencies
npm install

# Run the server
npm run start
