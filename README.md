# Article Assistant Chrome Extension

A powerful Chrome extension that enhances article reading with AI-powered insights, summaries, and interactive Q&A capabilities.

## Features

### 1. Article Analysis
- **Automatic Content Detection**: Intelligently identifies and extracts article content from web pages
- **Key Points Extraction**: Highlights the most important points from the article
- **Smart Summarization**: Generates concise, structured summaries of article content
- **Supporting Evidence**: Automatically identifies and highlights relevant quotes from the text

### 2. Interactive Q&A
- **Context-Aware Questions**: Ask questions about the article and get AI-powered responses
- **General Knowledge Integration**: Combines article context with broader knowledge for comprehensive answers
- **Real-time Processing**: Get instant responses to your questions
- **Natural Conversation**: Engage in a natural dialogue about the article content

### 3. User Interface
- **Floating Card**: A movable, resizable interface that doesn't interfere with article reading
- **Highlight Navigation**: Click on supporting evidence to jump to relevant article sections
- **Minimizable Interface**: Collapse the interface when not needed
- **Clean Design**: Modern, unobtrusive design that complements any website

## Installation

### From Chrome Web Store
1. Visit the Chrome Web Store (link coming soon)
2. Click "Add to Chrome"
3. Follow the installation prompts

### For Development
1. Clone the repository:
   ```bash
   git clone https://github.com/jaswinder9051998/AiAirticleAssistant.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Configuration

### API Key Setup
1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Click the extension icon to open the popup
3. Enter your API key in the settings
4. Select your preferred model (default: google/gemini-2.0-flash-001)

## Usage

### Basic Usage
1. Navigate to any article page
2. Click the extension icon or use the keyboard shortcut
3. The assistant will automatically analyze the article
4. View key points and supporting evidence in the floating card

### Asking Questions
1. Click the "Ask a Question" button
2. Type your question about the article
3. Get an AI-powered response that combines article context with general knowledge
4. View the answer in the floating card

### Interface Controls
- **Drag**: Click and drag the header to move the card
- **Resize**: Drag the sides to resize the card
- **Minimize**: Click the minimize button to collapse
- **Close**: Click the close button to hide the interface
- **Navigation**: Click on quotes to jump to their location in the article

## Project Structure

```
├── src/
│   └── js/
│       ├── components/     # UI components
│       ├── services/       # Core services
│       └── utils/          # Utility functions
├── background.js          # Service worker
├── manifest.json          # Extension manifest
├── popup.html            # Extension popup
├── popup.js              # Popup functionality
├── Readability.js        # Article parsing
└── styles.css           # Global styles
```

## Technical Details

### Architecture
- **Modular Design**: Organized into components, services, and utilities
- **Event-Based Communication**: Uses Chrome's message passing system
- **State Management**: Maintains article context across components
- **Error Handling**: Robust error handling and user feedback

### Technologies
- JavaScript (ES6+)
- Chrome Extension APIs
- OpenRouter API
- Mozilla's Readability

### Models
- Default: google/gemini-2.0-flash-001
- Configurable through settings

## Development

### Setup
1. Clone the repository
2. Install dependencies (if any)
3. Load the extension in Chrome

### Building
- No build process required
- Direct loading of source files

### Testing
1. Load the unpacked extension
2. Navigate to any article
3. Test features and functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Security

- API keys are stored securely in Chrome's local storage
- No sensitive data is transmitted except to OpenRouter API
- All communication is encrypted

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issues page.

## Acknowledgments

- Mozilla's Readability library
- OpenRouter API
- Chrome Extensions API

## Roadmap

- [ ] Additional language model support
- [ ] Custom highlighting colors
- [ ] Export summaries and notes
- [ ] Integration with note-taking apps
- [ ] Offline mode support 