import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
        "landing": {
            "title": "I am Ratel AI",
            "subtitle": "Your friendly, culturally-aware assistant designed for a diverse African audience. Let's learn, grow, and earn together.",
            "startChatting": "Start Chatting",
            "footer": "Built for Africa."
        },
        "common": {
            "ratelAI": "Ratel AI",
            "cancel": "Cancel",
            "generating": "Generating...",
            "editing": "Editing...",
            "thinking1": "Thinking...",
            "thinking2": "Cooking up a response...",
            "thinking3": "Just a moment...",
            "error": "Sorry, an error occurred. Please try again.",
            "close": "Close"
        },
        "sidebar": {
            "newChat": "New Chat",
            "hustleStudio": "Hustle",
            "learnStudio": "Learn",
            "marketFinder": "Market",
            "imageStudio": "Image",
            "audioStudio": "Audio",
            "videoStudio": "Video",
            "communityStudio": "Community",
            "history": "History",
            "search": "Search...",
            "noHistory": "No chats yet.",
            "level": "Level {{level}}",
            "settings": "Settings",
            "contactUs": "Contact Us",
            "logout": "Logout",
            "supportUs": "Support Us",
            "openMenu": "Open menu"
        },
        "chatWindow": {
            "placeholderTitle": "How can I help you?",
            "placeholderSubtitle": "Ask me anything about your hustle, a new skill you want to learn, or what's trending in the market.",
            "suggestion1": "Give me 3 side hustle ideas I can start with ₦10,000",
            "suggestion2": "Teach me the basics of digital marketing",
            "suggestion3": "What's the current price of tomatoes in Lagos?",
            "suggestion4": "Create an image of an African superhero"
        },
        "chatMessage": {
            "userUploadAlt": "User upload",
            "generatedImageAlt": "Generated image",
            "expandedImageAlt": "Expanded generated image",
            "generatedVideoAlt": "Generated video",
            "copy": "Copy",
            "readAloud": "Read aloud",
            "stopSpeaking": "Stop speaking",
            "delete": "Delete",
            "expandImage": "Expand Image",
            "downloadImage": "Download Image",
            "downloadVideo": "Download Video",
            "editPrompt": "Edit Prompt",
            "showLess": "Show less",
            "showMore": "Show more",
            "sources": "Sources"
        },
        "chatInput": {
            "placeholder": "Type your message or use the mic...",
            "listening": "Listening...",
            "noSpeechError": "Didn't catch that. Please try again.",
            "removeImage": "Remove image",
            "attachImage": "Attach image",
            "startRecording": "Start recording",
            "stopRecording": "Stop recording",
            "sendMessage": "Send message"
        },
        "dialogs": {
            "newChatTitle": "Start New Chat?",
            "newChatMessage": "Are you sure you want to start a new chat? Your current conversation will be saved.",
            "newChatConfirm": "New Chat",
            "deleteChatTitle": "Delete Chat?",
            "deleteChatMessage": "This chat will be permanently deleted.",
            "deleteChatConfirm": "Delete"
        },
        "tones": {
            "normal": "Normal",
            "funny": "Funny",
            "pidgin": "Pidgin"
        },
        "imageStudio": {
            "title": "Image Studio",
            "generateTab": "Generate",
            "editTab": "Edit",
            "promptLabel": "Prompt",
            "promptPlaceholder": "e.g., A futuristic Lagos with flying cars",
            "aspectRatioLabel": "Aspect Ratio",
            "square": "Square",
            "landscape": "Landscape",
            "portrait": "Portrait",
            "generateButton": "Generate",
            "uploadLabel": "Upload an Image to Edit",
            "removeImage": "Remove image",
            "uploadPlaceholderClick": "Click to upload",
            "uploadPlaceholderDrag": "or drag and drop",
            "uploadPlaceholderFormats": "PNG, JPG, or WEBP",
            "editPromptLabel": "Editing Instructions",
            "editPromptPlaceholder": "e.g., Add a hat to the person",
            "applyEditsButton": "Apply Edits"
        },
        "audioStudio": {
            "title": "Audio Studio (Text-to-Speech)",
            "textLabel": "Text to Convert",
            "textPlaceholder": "Enter text here...",
            "voiceLabel": "Select Voice",
            "generateButton": "Generate Audio",
            "generatingFeedback": "Generating audio, this may take a moment...",
            "generationFailed": "Audio generation failed: {{error}}",
            "unknownError": "An unknown error occurred.",
            "playbackFailed": "Playback failed: {{error}}",
            "generatedAudio": "Generated Audio",
            "play": "Play",
            "stop": "Stop",
            "download": "Download",
            "delete": "Delete",
            "previewText": "Hello, I am a voice from Ratel AI.",
            "previewVoice": "Preview voice {{voiceName}}",
            "previewFailed": "Preview failed. Please try another voice."
        },
        "videoStudio": {
            "title": "Video Studio",
            "promptLabel": "Prompt",
            "promptPlaceholder": "e.g., A drone shot of Victoria Falls",
            "uploadLabel": "Add an image (optional)",
            "removeImage": "Remove image",
            "imageToVideoDisclaimer": "The model will use your image as inspiration to generate the video.",
            "aspectRatioLabel": "Aspect Ratio",
            "square": "1:1",
            "landscape": "16:9",
            "portrait": "9:16",
            "qualityLabel": "Quality",
            "qualityStandard": "Standard",
            "qualityHigh": "High",
            "info": "Video generation can take a few minutes. We'll notify you when it's ready!",
            "generateButton": "Generate Video"
        },
        "hustleStudio": {
            "title": "Hustle Studio",
            "description": "Tell me about your skills or budget, and I'll suggest some side hustles for you.",
            "placeholder": "e.g., I have ₦20,000, or I'm good at writing",
            "button": "Get Hustle Ideas"
        },
        "learnStudio": {
            "title": "Learn Studio",
            "description": "What skill do you want to master today? Let's start with your first lesson.",
            "skills": {
                "video": "Video Editing",
                "coding": "Basic Coding",
                "canva": "Canva Design",
                "ai": "Using AI Tools"
            }
        },
        "marketStudio": {
            "title": "Market Finder",
            "description": "Looking for something? Tell me what item and your location to find it.",
            "itemLabel": "What are you looking for?",
            "itemPlaceholder": "e.g., Ankara fabric, fresh ginger",
            "locationLabel": "What is your location?",
            "locationPlaceholder": "e.g., Accra, Ghana or Computer Village, Ikeja",
            "button": "Find in Market"
        },
        "profileStudio": {
            "title": "My Profile",
            "noInterests": "Not yet defined",
            "topInterest": "Top Interest"
        },
        "community": {
            "fromTelegram": "from Telegram",
            "postPlaceholder": "What's on your mind, {{name}}?",
            "uploadImage": "Upload Image",
            "postButton": "Post",
            "likedByYou": "Liked",
            "like": "Like",
            "comment": "Comment",
            "commentPlaceholder": "Add a comment...",
            "feedTitle": "Feed",
            "leaderboardTitle": "Leaderboard",
            "rewardsTitle": "Rewards",
            "telegramTitle": "Connect",
            "myWalletTitle": "My Wallet",
            "redeemTitle": "Redeem",
            "adminTitle": "Admin",
            "weeklyRanking": "Based on weekly community points",
            "points": "pts",
            "walletTitle": "My Wallet",
            "yourRatelCoins": "Your Ratel Coins Balance",
            "cashValue": "Estimated Cash Value",
            "activitySummary": "Activity Summary",
            "earnedToday": "Earned Today",
            "totalEarned": "Total Earned",
            "totalRedeemed": "Total Redeemed",
            "redeemNow": "Redeem Now",
            "redeemCoins": "Redeem Coins",
            "viewLeaderboard": "View Leaderboard",
            "telegramDescription": "Connect your Telegram account to sync your points and get community updates directly.",
            "telegramUsernameLabel": "Your Telegram Username",
            "telegramUsernamePlaceholder": "e.g., your_username",
            "connectButton": "Connect",
            "disconnectButton": "Disconnect",
            "connectedStatus": "Connected as @{{username}}",
            "redeemRewardsTitle": "Redeem Rewards",
            "redeemDescription": "You can convert your coins to airtime or other rewards.",
            "yourBalance": "Your Balance",
            "coins": "Coins",
            "amountToRedeem": "Amount to Redeem (Points)",
            "paymentMethod": "Payment Method",
            "airtime": "Airtime",
            "bankTransfer": "Bank Transfer",
            "phoneNumber": "Phone Number",
            "bankDetails": "Bank Details (Account No, Bank)",
            "submitRequest": "Submit Request",
            "notEnoughCoins": "Not enough coins to redeem",
            "redeemMinimum": "Minimum {{min}} coins to redeem.",
            "requestSubmitted": "Request Submitted!",
            "requestSubmittedDesc": "Your redemption request has been received and is pending approval.",
            "adminPanel": {
                "title": "Admin Panel",
                "redemptionRequests": "Redemption Requests",
                "userManagement": "User Management",
                "settings": "Settings",
                "noPendingRequests": "No pending requests.",
                "approve": "Approve",
                "reject": "Reject",
                "adjustBalance": "Adjust Balance",
                "update": "Update",
                "conversionRate": "Conversion Rate (1 Point = ₦)",
                "totalUsers": "Total Users",
                "totalPoints": "Total Points in Circulation"
            }
        },
        "settings": {
            "title": "Settings",
            "language": {
                "title": "Language",
                "label": "App Language",
                "en": "English",
                "fr": "Français (French)",
                "am": "አማርኛ (Amharic)",
                "ng": "Nigerian Pidgin",
                "sw": "Kiswahili"
            },
            "customInstructions": {
                "title": "Custom Instructions",
                "nicknameLabel": "What would you like Ratel to call you?",
                "nicknamePlaceholder": "e.g., Oga John, Hustler Bee",
                "aboutYouLabel": "What would you like Ratel to know about you to provide better responses?",
                "aboutYouPlaceholder": "e.g., I'm a student in Accra studying marketing. I'm trying to start a side business.",
                "expectationsLabel": "How would you like Ratel to respond?",
                "expectationsPlaceholder": "e.g., Be direct and to the point. Use bullet points. Always provide examples."
            },
            "appearance": {
                "title": "Appearance",
                "themeLabel": "Theme",
                "light": "Light",
                "dark": "Dark",
                "galleryLabel": "Background Gallery",
                "uploadButton": "Upload Your Own",
                "removeButton": "Remove Background"
            },
            "memory": {
                "title": "Memory",
                "savedMemories": "Reference saved memories",
                "chatHistory": "Use chat history for context"
            },
            "responses": {
                "title": "Voice & Responses",
                "voicePreference": "Voice Preference for Read Aloud"
            },
            "notifications": {
                "title": "Security & Notifications",
                "pushLabel": "Push Notifications",
                "pushDescription": "For task reminders and updates",
                "mfaLabel": "Two-Factor Authentication (2FA)",
                "mfaDescription": "Enhance your account security"
            },
            "logout": "Log Out"
        },
        "authModal": {
            "signupTitle": "Create an Account",
            "signupDescription": "Join the Ratel community to get started.",
            "loginTitle": "Welcome Back!",
            "loginDescription": "Sign in to continue your journey.",
            "forgotPasswordTitle": "Forgot Password?",
            "forgotPasswordDescription": "Enter your email and we'll send you a reset link.",
            "nicknameLabel": "Nickname",
            "nicknamePlaceholder": "e.g., Oga John",
            "emailLabel": "Email",
            "emailPlaceholder": "you@example.com",
            "passwordLabel": "Password",
            "confirmPasswordLabel": "Confirm Password",
            "rememberMe": "Remember me",
            "forgotPasswordLink": "Forgot password?",
            "signupButton": "Create Account",
            "loginButton": "Log In",
            "forgotPasswordButton": "Send Reset Link",
            "switchToLogin": "Already have an account?",
            "switchToLoginLink": "Log in",
            "switchToSignup": "Don't have an account?",
            "switchToSignupLink": "Sign up",
            "backToLogin": "Back to login",
            "resetLinkSent": "If an account exists for this email, a reset link has been sent.",
            "error": {
                "nicknameRequired": "Nickname is required.",
                "emailRequired": "A valid email is required.",
                "passwordRequired": "Password must be at least 6 characters.",
                "passwordsDoNotMatch": "Passwords do not match.",
                "userExists": "An account with this email already exists.",
                "invalidCredentials": "Invalid email or password."
            }
        },
        "proModal": {
            "comingSoonTitle": "Ratel Pro is Coming Soon!",
            "comingSoonDescription": "Get ready for exclusive features like unlimited generations, advanced tools, and priority support.",
            "gotIt": "Got It!"
        },
        "supportModal": {
            "title": "Support Ratel AI",
            "description": "If you find Ratel helpful, consider supporting our development. Your contribution helps us keep the lights on!",
            "flutterwave": "Support with Flutterwave",
            "telebirr": "Support with Telebirr",
            "maybeLater": "Maybe Later",
            "enterAmount": "Enter Amount (NGN)",
            "payButton": "Pay with Flutterwave",
            "telebirrInstructionsTitle": "Pay with Telebirr",
            "telebirrInstructions": "Please send your contribution to the following Telebirr number:",
            "backButton": "Back",
            "configureKeyError": "Flutterwave public key is not configured. Please follow the setup instructions to continue."
        },
        "voiceGroups": {
            "premium": "Premium Voices (Gemini)",
            "standard": "Standard Voices (Browser)"
        },
        "tasks": {
            "noTasks": "No tasks yet. You can ask me to add one for you!"
        },
        "contact": {
            "title": "Contact Us",
            "getInTouch": "Get in Touch",
            "intro": "Have questions, feedback, or a partnership idea? We'd love to hear from you. The best way to reach us is by email.",
            "supportEmail": "Support Email:",
            "supportEmailAddress": "alexeyoba9@gmail.com",
            "formTitle": "Or Send Us a Message",
            "nameLabel": "Your Name",
            "namePlaceholder": "John Doe",
            "emailLabel": "Your Email",
            "emailPlaceholder": "you@example.com",
            "messageLabel": "Your Message",
            "messagePlaceholder": "I have a suggestion for...",
            "sendMessage": "Send Message",
            "sending": "Sending...",
            "submitSuccess": "Message sent successfully! We'll get back to you soon.",
            "submitError": "Failed to send message. Please try again or email us directly."
        }
    }
  },
  ng: {
    translation: {
      "landing": {
        "title": "I am Ratel AI",
        "subtitle": "Your sharp AI padi for hustle, learning, and market gist for Africa. Make we learn, grow, and earn together.",
        "startChatting": "Start Chatting",
        "footer": "Made for Africa."
      },
      "common": {
        "ratelAI": "Ratel AI",
        "cancel": "Cancel",
        "generating": "Dey generate...",
        "editing": "Dey edit...",
        "thinking1": "I dey think...",
        "thinking2": "Dey cook response...",
        "thinking3": "Hold on small...",
        "error": "Sorry, network do something. Try again.",
        "close": "Close"
      },
      "tones": {
        "normal": "Normal",
        "funny": "Funny",
        "pidgin": "Pidgin"
      },
      "sidebar": {
        "newChat": "New Chat",
        "hustleStudio": "Hustle",
        "learnStudio": "Learn",
        "marketFinder": "Market",
        "imageStudio": "Image",
        "audioStudio": "Audio",
        "videoStudio": "Video",
        "communityStudio": "Community",
        "history": "History",
        "search": "Search...",
        "noHistory": "No chat yet.",
        "level": "Level {{level}}",
        "settings": "Settings",
        "contactUs": "Contact Us",
        "logout": "Logout",
        "supportUs": "Support Us",
        "openMenu": "Open menu"
      },
      "chatWindow": {
        "placeholderTitle": "Wetin dey sup?",
        "placeholderSubtitle": "Ask me anything about your hustle, new skill wey you wan learn, or wetin dey trend for market.",
        "suggestion1": "Give me 3 side hustle ideas wey I fit start with ₦10,000",
        "suggestion2": "Teach me digital marketing basics",
        "suggestion3": "How much dem dey sell tomatoes for Lagos now?",
        "suggestion4": "Create image of African superhero"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ratel_language',
    }
  });

export default i18n;