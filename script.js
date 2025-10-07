document.addEventListener('DOMContentLoaded', function onReady() {
  var chatEl = document.getElementById('chat');
  var formEl = document.getElementById('chat-form');
  var inputEl = document.getElementById('user-input');
  var settingsBtn = document.getElementById('settings-btn');
  var modalOverlay = document.getElementById('settings-modal');
  var modalClose = document.getElementById('settings-close');
  var modalCancel = document.getElementById('settings-cancel');
  var modalSave = document.getElementById('settings-save');
  var keyInput = document.getElementById('gemini-key');

  // Valid tracking numbers (only these 10 are accepted)
  var VALID_TRACKING_NUMBERS = [
    // First 5 tracking numbers are in transit
    '123456789',
    '987654321',
    '111222333',
    '222333444',
    '333444555',

    // Last 5 tracking numbers have been delivered already
    '444555666',
    '555666777',
    '666777888',
    '777888999',
    '101112131'
  ];

  // Split half in-transit, half delivered
  var IN_TRANSIT = new Set(VALID_TRACKING_NUMBERS.slice(0, 5));
  var DELIVERED = new Set(VALID_TRACKING_NUMBERS.slice(5));

  // Random US locations for in-transit packages
  var US_LOCATIONS = [
    'Los Angeles, CA', 'San Francisco, CA', 'Seattle, WA', 'Portland, OR', 'Phoenix, AZ',
    'Denver, CO', 'Dallas, TX', 'Austin, TX', 'Houston, TX', 'Chicago, IL',
    'Minneapolis, MN', 'Kansas City, MO', 'St. Louis, MO', 'Atlanta, GA', 'Miami, FL',
    'Orlando, FL', 'New Orleans, LA', 'Nashville, TN', 'Charlotte, NC', 'Raleigh, NC',
    'Washington, DC', 'Baltimore, MD', 'Philadelphia, PA', 'Pittsburgh, PA', 'Boston, MA',
    'New York, NY', 'Buffalo, NY', 'Cleveland, OH', 'Columbus, OH', 'Detroit, MI',
    'Albuquerque, NM', 'Salt Lake City, UT', 'Boise, ID', 'Las Vegas, NV', 'Reno, NV'
  ];

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickRandomLocation() {
    return US_LOCATIONS[randomInt(0, US_LOCATIONS.length - 1)];
  }

  var TRACKING_TO_LOCATION = {};
  IN_TRANSIT.forEach(function (tn) {
    TRACKING_TO_LOCATION[tn] = pickRandomLocation();
  });

  function formatDate(date) {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Conversation state: awaiting confirmation after delivered message
  var awaitingDeliveredConfirmation = false;
  // Conversation state: awaiting response to "another package" question
  var awaitingAnotherPackageResponse = false;

  function appendMessage(role, text) {
    var bubble = document.createElement('div');
    bubble.className = 'message ' + role;
    bubble.textContent = text;
    chatEl.appendChild(bubble);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  appendMessage(
    'bot',
    'Hi! I can help you with your lost package. Can you provide me with the tracking number?'
  );

  // Initialize API key from localStorage
  try {
    var savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      window.GEMINI_API_KEY = savedKey;
    }
  } catch (e) {}

  function openModal() {
    if (modalOverlay) {
      // Pre-fill current key
      try {
        keyInput.value = window.GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
      } catch (e) {
        keyInput.value = window.GEMINI_API_KEY || '';
      }
      modalOverlay.setAttribute('aria-hidden', 'false');
      keyInput.focus();
    }
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.setAttribute('aria-hidden', 'true');
    }
  }

  if (settingsBtn) settingsBtn.addEventListener('click', openModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalCancel) modalCancel.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }

  if (modalSave) {
    modalSave.addEventListener('click', function () {
      var val = keyInput.value.trim();
      window.GEMINI_API_KEY = val;
      try {
        if (val) localStorage.setItem('gemini_api_key', val);
        else localStorage.removeItem('gemini_api_key');
      } catch (e) {}
      closeModal();
    });
  }

  // Call Gemini API (gemini-2.5-flash) to extract ONLY the tracking number from user input
  async function extractTrackingNumber(userText) {
    var apiKey = window.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.error('Gemini API key missing. Set window.GEMINI_API_KEY before submitting.');
      return '';
    }

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey);

    var requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'You are given a user message. Extract ONLY the tracking number it contains. Return just the tracking number without any extra words or punctuation. If none is present, return an empty string.\n\nUser message: "' + userText + '"'
            }
          ]
        }
      ]
    };

    try {
      var resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (!resp.ok) {
        console.error('Gemini request failed with status', resp.status);
        return '';
      }
      var data = await resp.json();
      var text =
        data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text
          ? String(data.candidates[0].content.parts[0].text).trim()
          : '';

      // Log ONLY the tracking number
      console.log(text);
      return text;
    } catch (err) {
      console.error('Gemini request error', err);
      return '';
    }
  }

  // Call Gemini API to detect user intent for conversation branching
  async function detectUserIntent(userText, context) {
    var apiKey = window.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.error('Gemini API key missing. Set window.GEMINI_API_KEY before submitting.');
      return 'unknown';
    }

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey);

    var prompt = '';
    if (context === 'delivered_confirmation') {
      prompt = 'You are analyzing a user response to a question about whether they have checked their mailbox, porch, or asked neighbors for a delivered package. Determine the user\'s intent and respond with ONLY one of these exact words: "negative" (if they haven\'t found it), "affirmative" (if they have checked but still can\'t find it), or "unclear" (if the intent is ambiguous).\n\nUser response: "' + userText + '"';
    } else if (context === 'another_package') {
      prompt = 'You are analyzing a user response to a question about whether they need help with another package. Determine the user\'s intent and respond with ONLY one of these exact words: "negative" (if they don\'t need help with another package), "affirmative" (if they want to track another package), or "unclear" (if the intent is ambiguous).\n\nUser response: "' + userText + '"';
    } else {
      return 'unknown';
    }

    var requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    try {
      var resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (!resp.ok) {
        console.error('Gemini request failed with status', resp.status);
        return 'unknown';
      }
      var data = await resp.json();
      var text =
        data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text
          ? String(data.candidates[0].content.parts[0].text).trim().toLowerCase()
          : 'unknown';

      // Ensure we only return valid intents
      if (['negative', 'affirmative', 'unclear'].includes(text)) {
        return text;
      }
      return 'unclear';
    } catch (err) {
      console.error('Gemini request error', err);
      return 'unknown';
    }
  }

  formEl.addEventListener('submit', function onSubmit(e) {
    e.preventDefault();
    var userText = (inputEl.value || '').trim();
    if (!userText) return;

    appendMessage('user', userText);
    inputEl.value = '';

    // If awaiting confirmation after delivered message, use Gemini to detect intent
    if (awaitingDeliveredConfirmation) {
      detectUserIntent(userText, 'delivered_confirmation').then(function(intent) {
        if (intent === 'negative') {
          appendMessage('bot', "I recommend checking with your neighbors and thoroughly searching your mailbox and porch area. If you're still unable to locate the package, please contact us again and we'll be happy to file a lost package claim for you.");
          appendMessage('bot', 'Do you need help with another package? If so, please provide the tracking number.');
          awaitingDeliveredConfirmation = false;
          awaitingAnotherPackageResponse = true;
          return;
        }
        if (intent === 'affirmative') {
          appendMessage('bot', "I'm sorry to hear that. I have filed a lost package claim. An email containing the claim information was sent to the email address used when placing your order.");
          appendMessage('bot', 'Do you need help with another package? If so, please provide the tracking number.');
          awaitingDeliveredConfirmation = false;
          awaitingAnotherPackageResponse = true;
          return;
        }
        // If unclear or unknown, continue to treat as possibly another tracking number
        awaitingDeliveredConfirmation = false;
        // Continue with tracking number processing
        processTrackingNumber(userText);
      });
      return;
    }

    // If awaiting response to "another package" question, use Gemini to detect intent
    if (awaitingAnotherPackageResponse) {
      detectUserIntent(userText, 'another_package').then(function(intent) {
        if (intent === 'negative') {
          appendMessage('bot', "I'm glad I could help you! If you have any more questions or need further assistance, feel free to contact us at anytime.");
          awaitingAnotherPackageResponse = false;
          return;
        }
        
        // If affirmative or unclear, treat as potentially another tracking number
        awaitingAnotherPackageResponse = false;
        // Continue with tracking number processing
        processTrackingNumber(userText);
      });
      return;
    }

    // Process tracking number
    processTrackingNumber(userText);
  });

  // Function to process tracking number (extracted for reuse)
  function processTrackingNumber(userText) {
    // Send to Gemini to read and extract tracking number only
    extractTrackingNumber(userText).then(function (tn) {
      var tracking = (tn || '').replace(/[^0-9]/g, '');
      if (!tracking) {
        appendMessage('bot', 'Please enter a valid tracking number.');
        return;
      }

      // Validate against fixed list
      var isValid = VALID_TRACKING_NUMBERS.indexOf(tracking) !== -1;
      if (!isValid) {
        appendMessage('bot', 'Sorry, the tracking number ' + tracking + ' is invalid. Please enter a valid tracking number.');
        return;
      }

      var now = new Date();

      if (IN_TRANSIT.has(tracking)) {
        var location = TRACKING_TO_LOCATION[tracking] || pickRandomLocation();
        var daysAhead = Math.max(1, Math.min(5, Math.floor(Math.random() * 5) + 1));
        var eta = new Date(now.getTime());
        eta.setDate(now.getDate() + daysAhead);
        appendMessage(
          'bot',
          "Your package is on its way! It's currently in " + location + " and is expected to be delivered on " + formatDate(eta) + "."
        );
        appendMessage(
          'bot',
          'Do you need help with another package? If so, please provide the tracking number.'
        );
        awaitingAnotherPackageResponse = true;
      } else if (DELIVERED.has(tracking)) {
        var deliveredDaysAgo = Math.floor(Math.random() * 4) - 3; // -3..0
        // constrain to 0..3 days in the past where 0 means today
        if (deliveredDaysAgo > 0) deliveredDaysAgo = 0;
        if (deliveredDaysAgo < -3) deliveredDaysAgo = -3;
        var deliveredDate = new Date(now.getTime());
        deliveredDate.setDate(now.getDate() + deliveredDaysAgo);
        appendMessage(
          'bot',
          'Good news! Your package was delivered on ' + formatDate(deliveredDate) + ". Have you checked your mailbox, porch, or asked your neighbors?"
        );
        awaitingDeliveredConfirmation = true;
      }
    });
  }
});


