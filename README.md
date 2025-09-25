# NanoGPT Model Browser

A modern, responsive web application for browsing and exploring AI models available through the NanoGPT API. Built with Python Flask and vanilla HTML/CSS/JavaScript, featuring a sleek dark theme with glassmorphism design.

## ✨ Features

- **Modern Dark Theme**: Beautiful gradient-based design with glassmorphism effects
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Search**: Instant search through model IDs and descriptions
- **Advanced Filtering**: Filter models by type (ChatGPT, Claude, Gemini, etc.)
- **Dual View Modes**: Switch between grid and list views
- **Model Details**: Detailed modal view with comprehensive model information
- **Auto-refresh**: Optional automatic model list updates every 30 seconds
- **Settings Management**: Secure API key storage and configuration
- **Error Handling**: Robust error handling with user-friendly messages
- **Loading States**: Smooth loading animations and skeleton screens

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone or download** this repository
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up your API key**:
   - Copy `.env.example` to `.env`
   - Add your NanoGPT API key:
     ```
     NANOGPT_API_KEY=your_api_key_here
     ```

4. **Run the application**:
   ```bash
   python app.py
   ```

5. **Open your browser** and navigate to `http://localhost:5000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
NANOGPT_API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here
```

### Settings

Access the settings panel by clicking the ⚙️ button:

- **API Key Management**: Securely store and manage your NanoGPT API key
- **Auto-refresh**: Toggle automatic model list updates
- **Display Options**: Customize the viewing experience

## 🏗️ Architecture

### Backend (Python Flask)
- **API Client**: Dedicated NanoGPT API integration
- **Models Service**: Data processing and caching
- **Error Handling**: Comprehensive error management
- **Configuration**: Secure settings management

### Frontend (Vanilla HTML/CSS/JS)
- **Modern CSS**: Dark theme with glassmorphism effects
- **Responsive Design**: Mobile-first approach
- **Dynamic JavaScript**: Real-time interactions and updates
- **Modular Architecture**: Clean, maintainable code structure

## 📁 Project Structure

```
nanogpt-browser/
├── app.py                 # Flask backend application
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (create this)
├── .gitignore            # Git ignore rules
├── README.md             # This file
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── css/
    │   └── styles.css    # Modern CSS styling
    └── js/
        └── app.js        # Frontend JavaScript
```

## 🎨 Design Features

### Visual Design
- **Dark Theme**: Modern dark color palette with navy/charcoal backgrounds
- **Gradient Text**: Teal-to-pink gradient text for headings and accents
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Smooth Animations**: CSS transitions and hover effects
- **Modern Typography**: Clean Inter font with proper hierarchy

### User Experience
- **Intuitive Navigation**: Clear, accessible interface
- **Loading States**: Visual feedback during data loading
- **Error Handling**: User-friendly error messages
- **Responsive Layout**: Optimized for all screen sizes
- **Keyboard Support**: Full keyboard navigation support

## 🔒 Security

- **API Key Protection**: Secure storage in environment variables
- **Input Validation**: Client and server-side validation
- **Error Sanitization**: No sensitive data exposed in errors
- **HTTPS Ready**: Designed for secure deployment

## 🚀 Deployment

### Local Development
```bash
python app.py
```

### Production Deployment
```bash
# Using Gunicorn (recommended for production)
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Or using Flask's built-in server (development only)
python app.py
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "app.py"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 API Reference

The application integrates with the NanoGPT Models API:

- **Endpoint**: `GET /api/v1/models`
- **Authentication**: Bearer token in Authorization header
- **Response Format**: OpenAI-compatible model list

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to load models"**
   - Check your API key in the `.env` file
   - Verify the NanoGPT API is accessible
   - Check your internet connection

2. **"Module not found" errors**
   - Run `pip install -r requirements.txt`
   - Ensure Python 3.8+ is installed

3. **Port already in use**
   - Change the port in `app.py`: `app.run(port=5001)`
   - Or kill the process using the port

### Debug Mode

Run with debug logging:
```bash
export FLASK_DEBUG=1
python app.py
```

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **NanoGPT** for providing the AI models API
- **Flask** for the lightweight web framework
- **Modern CSS** techniques and glassmorphism design trends

---

**Built with ❤️ using modern web technologies**