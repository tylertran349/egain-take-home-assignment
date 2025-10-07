# [Lost Package Tracking Chatbot](https://tylertran349.github.io/egain-take-home-assignment/)

A simple web-based chatbot that helps users track their packages using Google's Gemini AI. The chatbot can determine if packages are in transit or already delivered, and provides helpful responses based on the package status.

## Setup/Installation Instructions

### Getting Your Google Gemini API Key

1. Open your web browser and navigate to https://console.cloud.google.com/projectcreate (log in with your Google account if prompted).

2. Under the "Project name" input field, give your project any name, and click on the "Create" button.

3. Go to https://aistudio.google.com/apikey and log in with your Google account if prompted.

4. Click on "Get API key"

5. Click on the blue "+ Create API key" button near the top right corner of the page.

6. Click on the "Search Google Cloud projects" input field and in the dropdown menu, select the Google Cloud project you created in step 2.

7. Click the blue "Create API key in existing project" button. Copy the generated API key (it is a long string of random letters and numbers) and save it somewhere safe like a temporary text file.

8. On the chatbot, click on "Settings" near the top of the website and paste the API key you copied from step 7 in the "Gemini API Key" field of the settings menu.

## How It Works

The chatbot uses a simple approach to help users with package tracking:

### Package Status Detection

- The bot accepts 10 predefined tracking numbers
- 5 tracking numbers represent packages that are "in transit"
- 5 tracking numbers represent packages that have been "delivered"

### AI-Powered Features

- **Tracking Number Extraction**: Uses Google Gemini AI to extract tracking numbers from user messages, even if they include extra text
- **Intent Detection**: Uses AI to understand user responses to questions like "Have you checked your mailbox?" or "Do you need help with another package?"

### Conversation Flow

1. User provides a tracking number (or text containing a tracking number)
2. The AI extracts the tracking number from the user's message
3. The bot checks if the tracking number is valid
4. If valid, the bot determines if the package is in transit or delivered
5. For in-transit packages: Shows current location and estimated delivery date
6. For delivered packages: Asks if the user has checked their mailbox/porch
7. Based on user response, the bot either provides help or offers to track another package

### Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- Uses Google Gemini 2.5 Flash model for AI processing
- Stores API key locally in browser storage
- Responsive design that works on desktop and mobile
- Includes loading animations and smooth transitions

## Screenshots/Examples

### Main Chat Interface

The chatbot has a clean, modern interface with:

- A chat area that displays conversation history
- An input field for typing messages
- A settings button to configure the API key
- Color-coded messages (blue for bot, green for user)

### Settings Modal

- Secure password field for entering the Gemini API key
- Help text explaining that the key is stored locally
- Save and Cancel buttons for managing settings

### Example Conversations

**Tracking an In-Transit Package:**

```
Bot: Hi! I can help you with your lost package. Can you provide me with the tracking number?
User: My tracking number is 123456789
Bot: Your package is on its way! It's currently in Los Angeles, CA and is expected to be delivered on Dec 15, 2024.
Bot: Do you need help with another package? If so, please provide the tracking number.
```

**Tracking a Delivered Package:**

```
Bot: Hi! I can help you with your lost package. Can you provide me with the tracking number?
User: 444555666
Bot: Good news! Your package was delivered on Dec 12, 2024. Have you checked your mailbox, porch, or asked your neighbors?
User: Yes, I checked everywhere but can't find it
Bot: I'm sorry to hear that. I have filed a lost package claim. An email containing the claim information was sent to the email address used when placing your order.
Bot: Do you need help with another package? If so, please provide the tracking number.
```

## Valid Tracking Numbers

The chatbot accepts these 10 tracking numbers for testing:

- **In Transit**: 123456789, 987654321, 111222333, 222333444, 333444555
- **Delivered**: 444555666, 555666777, 666777888, 777888999, 101112131

## Features

- **Smart Text Processing**: Can extract tracking numbers from natural language
- **Conversation Management**: Handles multi-turn conversations intelligently
- **Local Storage**: Saves your API key securely in your browser
- **Responsive Design**: Works on all screen sizes
- **Loading Indicators**: Shows when the AI is processing your request
- **Error Handling**: Provides clear error messages for invalid tracking numbers

## Troubleshooting

**The bot isn't responding to my messages:**

- Make sure you've entered a valid Google Gemini API key in the settings
- Check that your internet connection is working
- Try refreshing the page

**The bot says my tracking number is invalid:**

- Make sure you're using one of the 10 valid tracking numbers listed above
- The tracking number should contain only numbers (no letters or special characters)

**The settings modal won't open:**

- Try refreshing the page
- Make sure JavaScript is enabled in your browser
