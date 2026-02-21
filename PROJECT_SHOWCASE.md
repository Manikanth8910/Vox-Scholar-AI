# 🎓 VoxScholar AI: High-Performance Research Intelligence Platform

**VoxScholar AI** is a state-of-the-art, full-stack application engineered to revolutionize how researchers, students, and academics interact with complex scientific literature. By combining advanced **Retrieval-Augmented Generation (RAG)** with **high-fidelity audio synthesis**, VoxScholar turns static PDFs into dynamic, actionable intelligence.

---

## 🛠️ Full Technical Stack

### **Backend (The Intelligence Engine)**
*   **Core Framework**: `FastAPI` (Asynchronous Python) - Chosen for high-concurrency performance.
*   **Database & ORM**: `SQLite` with `SQLAlchemy` (Async Sessions) for robust data persistence.
*   **AI & LLM Orchestration**: 
    *   `OpenAI GPT-4o` Integration for deep document reasoning.
    *   **Custom RAG Implementation**: Features a proprietary **100,000 character context window** to eliminate "context stripping" in long papers.
*   **PDF Processing**: `PyMuPDF` (Fitz) & `PDF.co API` for high-accuracy text and metadata extraction from complex layouts.
*   **Voice Synthesis**: `edge-tts` & `ElevenLabs` integration for human-like, multi-lingual audio generation.
*   **Security**: `JWT` (JSON Web Tokens) with `OAuth2` password hashing for secure user authentication.

### **Frontend (The Luxury Interface)**
*   **Library & Tooling**: `React 18`, `TypeScript`, `Vite`.
*   **Design System**: `Tailwind CSS` with a custom **"Deep Plum" Glassmorphic Theme**.
*   **Component Architecture**: `Radix UI` and `Shadcn/UI` for accessible, premium-feel components.
*   **Animations**: `Framer Motion` for smooth micro-interactions and page transitions.
*   **Icons**: `Lucide React` for a consistent, professional visual language.
*   **API Client**: `Axios` with centralized interceptors for authenticated requests.

---

## 🚀 Complete Feature Ecosystem

### 1. **AI Podcast Factory**
*   **Narrative Transformation**: Converts monolithic 30-page papers into 5-minute engaging podcasts.
*   **Style Profiles**: Users can select between **Narrative Storytelling**, **Bullet Summaries**, or **Technical Deep Dives**.
*   **Professional Audio Player**: Custom UI featuring seeking logic, volume control, and adjustable playback speed (0.5x to 2.0x).
*   **MP3 Export**: Direct download of generated podcasts for offline study.
*   **Voice Customization**: Choose from a library of premium AI voices (Indian, British, and American accents supported).

### 2. **Context-Aware Q&A Hub**
*   **Math-Ready Chatbot**: Full **LaTeX support** for rendering mathematical formulas (Stochastic Calculus, Lagrangians, etc.).
*   **Formula Reference Section**: AI automatically organizes technical definitions into structured tables for quick retrieval.
*   **Cited Answers**: The bot provides answers based **ONLY** on the paper context to prevent AI hallucinations.
*   **Long-Form Reasoning**: Supports complex queries about methodology, results, and expert-level analysis.

### 3. **Visual Methodology (AI Flowcharts)**
*   **Methodology Extraction**: Automatically identifies the sequential logic of a research paper's methodology.
*   **Visual Logic Engine**: Generates a color-coded, step-by-step flowchart to visualize the experimental or theoretical pipeline.
*   **In-Page Selection**: Quickly switch between different papers to view their respective visual overviews.

### 4. **Smart Research Library (Memory)**
*   **Progressive Analytics**: Track "Reading Progress" percentages based on interaction density.
*   **Automated Topic Indexing**: AI tags every paper with the top 5 relevant research domains.
*   **Global Statistics**: Real-time dashboard showing total papers studied, topics analyzed, and average completion rates.

### 5. **Data Lifecycle & Workspace Management**
*   **Unified Dashboard**: High-level overview of recent activity, activity stats, and quick-access utility buttons.
*   **Secure Cleanup**: Single-click deletion that purges associated PDFs, database records, and audio files from the server.
*   **Responsive Workspace**: Full-screen sidebar navigation optimized for deep research sessions.

---

## 🎨 Design Philosophy: "Luxury for Researchers"
VoxScholar is not just a tool; it's a premium environment. We use a **Deep Plum (#2D1B4E)** and **Gold (#FFD700)** color palette to create a high-focus, executive atmosphere. Every interaction is designed to be **WOW-worthy**, from the glowing card effects to the smooth AI response streaming.

---
*Developed for the next generation of scholars who demand intelligence and elegance.*
