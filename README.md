<div align="center">
<img width="1200" height="475" alt="IntelliReview AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# IntelliReview AI 🚗 🏦 📰

A modern, AI-powered application built with React, TypeScript, and Google GenAI to provide intelligent reviews and analysis across multiple domains including automotive, finance, news, and social media.

## ✨ Features

- **🤖 AI-Powered Analysis**: Leverages Google Gemini AI for intelligent content review and generation
- **🚗 Car Reviews**: Get comprehensive AI-generated car reviews including specifications, pros/cons, and expert opinions
- **🏦 Loan Analysis**: Intelligent loan comparisons and financial recommendations
- **📰 News Summarization**: AI-powered news analysis and summarization
- **🌐 Social Media Integration**: Social media monitoring and sentiment analysis
- **⚡ Real-time Updates**: Powered by modern web technologies for fast, responsive experience
- **🔥 Firebase Backend**: Secure and scalable cloud infrastructure

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6 for fast development and optimized builds
- **AI Integration**: Google GenAI SDK (Gemini API)
- **Backend Services**: Firebase for authentication and database
- **Styling**: Modern CSS with responsive design
- **Development**: TypeScript for type safety
- **Workflow Automation**: n8n for custom integrations

## 📁 Project Structure

```
intellireview-ai/
├── components/          # React components
│   ├── CarModule.tsx    # Car review module
│   ├── LoanModule.tsx   # Loan analysis module
│   ├── NewsModule.tsx   # News summarization module
│   ├── SocialModule.tsx # Social media analysis
│   └── Footer.tsx       # Footer component
├── hooks/               # Custom React hooks
├── services/            # API and service integrations
├── n8n/                 # Workflow automation configurations
├── types.ts             # TypeScript type definitions
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
├── vite.config.ts       # Vite configuration
└── package.json         # Project dependencies
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 18 or higher recommended)
- **npm** or **yarn** package manager
- **Gemini API Key** from Google Cloud Console

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ojasz-borse/IntelliReviewAI1.0.git
   cd IntelliReviewAI1.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to view the application

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

### Preview Production Build

```bash
npm run preview
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |

### Getting Your Gemini API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gemini API
4. Create credentials (API key)
5. Add the key to your `.env.local` file

## 📊 Modules Overview

### 🚗 Car Module
- AI-generated car reviews
- Specification analysis
- Price comparison
- Expert recommendations

### 🏦 Loan Module
- Loan eligibility analysis
- Interest rate comparisons
- EMI calculator integration
- Financial recommendations

### 📰 News Module
- AI-powered news summarization
- Topic-based news aggregation
- Sentiment analysis
- Real-time news updates

### 🌐 Social Module
- Social media sentiment analysis
- Trend monitoring
- User engagement metrics
- Brand reputation tracking

## 🤝 Contributing

1. **Fork the repository**
2. **Create your feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google/) for powerful AI capabilities
- [Firebase](https://firebase.google.com/) for robust backend infrastructure
- [Vite](https://vitejs.dev/) for fast build tools
- [React](https://reactjs.org/) for the frontend framework

## 📧 Contact

For questions or support, please open an issue in the repository.

---

<div align="center">
Made with ❤️ by IntelliReview AI Team
</div>

