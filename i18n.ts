import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// In a real app, these would be in separate JSON files.
// For this project, we define them here.
const resources = {
  en: {
    translation: {
      // General
      "common": {
        "ratelAI": "Ratel AI",
        "cancel": "Cancel",
        "close": "Close",
        "generating": "Generating...",
        "editing": "Editing...",
        "loading": "Loading..."
      },
      // Chat Window
      "chatWindow": {
        "welcomeTitle": "Ratel AI",
        "welcomeSubtitle": "Your friendly AI companion for Africa.",
        "chatTone": "Tone",
        "tones": {
            "normal": "Normal",
            "formal": "Formal",
            "funny": "Funny",
            "pidgin": "Pidgin"
        },
        "examples": {
            "hustle_title": "Get hustle ideas",
            "hustle_desc": "...for a student in Lagos",
            "hustle_prompt": "Give me 5 side hustle ideas for a student in Lagos",
            "image_title": "Create an image",
            "image_desc": "...of a futuristic matatu flying over Nairobi",
            "image_prompt": "Create a photorealistic image of a futuristic matatu flying over Nairobi",
            "explain_title": "Explain a concept",
            "explain_desc": "...like 'inflation' using Nigerian examples",
            "explain_prompt": "Explain 'inflation' to me like I'm 10, using Nigerian examples",
            "story_title": "Tell a story",
            "story_desc": "...about Anansi the Spider",
            "story_prompt": "Tell me a short story about Anansi the Spider"
        }
      },
      // Landing Page
      "landing": {
        "title": "Ratel AI",
        "subtitle": "Your culturally-aware AI companion for Africa. Helping you learn, earn, and grow.",
        "startChatting": "don't play let's dive in",
        "footer": "Empowering the next generation of African hustlers and innovators."
      },
      // Auth Modal
      "authModal": {
        "signupTitle": "Create an Account",
        "signupDescription": "Join the Ratel AI family to get started.",
        "nicknameLabel": "Your Nickname",
        "nicknamePlaceholder": "e.g., Cool Cat",
        "emailLabel": "Email Address",
        "emailPlaceholder": "you@example.com",
        "passwordLabel": "Password (min. 6 characters)",
        "confirmPasswordLabel": "Confirm Password",
        "signupButton": "Create Account",
        "switchToLogin": "Already have an account?",
        "switchToLoginLink": "Log In",
        "loginTitle": "Welcome Back!",
        "loginDescription": "Log in to continue your journey.",
        "rememberMe": "Remember me",
        "forgotPasswordLink": "Forgot password?",
        "loginButton": "Log In",
        "switchToSignup": "Don't have an account?",
        "switchToSignupLink": "Sign Up",
        "forgotPasswordTitle": "Reset Password",
        "forgotPasswordDescription": "Enter your email and we'll send you a reset link.",
        "forgotPasswordButton": "Send Reset Link",
        "backToLogin": "Back to Login",
        "resetLinkSent": "If an account exists for this email, a reset link has been sent.",
        "error": {
          "nicknameRequired": "Nickname is required.",
          "emailRequired": "Please enter a valid email.",
          "passwordRequired": "Password must be at least 6 characters.",
          "passwordsDoNotMatch": "Passwords do not match.",
          "userExists": "A user with this email already exists.",
          "invalidCredentials": "Invalid email or password."
        }
      },
      // Sidebar
      "sidebar": {
        "newChat": "New Chat",
        "history": "History",
        "search": "Search history...",
        "noHistory": "No chats yet.",
        "level": "Level {{level}}",
        "hustleStudio": "Hustle Studio",
        "learnStudio": "Learn Studio",
        "marketSquare": "Market",
        "mobileWorkers": "Workers",
        "communityStudio": "Community",
        "imageStudio": "Image",
        "audioStudio": "Audio",
        "settings": "Settings",
        "contactUs": "Contact Us",
        "logout": "Logout",
        "deleteChatTitle": "Delete Chat",
        "deleteChatMessage": "Are you sure you want to permanently delete this chat session?",
        "deleteButton": "Delete"
      },
      // Chat Input
      "chatInput": {
        "placeholder": "Ask Ratel anything...",
        "listening": "Listening...",
        "noSpeechError": "Didn't catch that. Try again?",
        "removeImage": "Remove image",
        "attachImage": "Attach image",
        "startRecording": "Start voice input",
        "stopRecording": "Stop voice input",
        "sendMessage": "Send message"
      },
      // Studios
      "imageStudio": {
        "title": "Image Studio",
        "generateTab": "Generate",
        "editTab": "Edit",
        "promptLabel": "What do you want to create?",
        "promptPlaceholder": "e.g., A futuristic Lagos skyline at sunset, photorealistic",
        "aspectRatioLabel": "Aspect Ratio",
        "square": "Square (1:1)",
        "landscape": "Landscape (16:9)",
        "portrait": "Portrait (9:16)",
        "generateButton": "Generate Image",
        "uploadLabel": "Upload an image to edit",
        "removeImage": "Remove",
        "uploadPlaceholderClick": "Click to upload",
        "uploadPlaceholderDrag": "or drag and drop",
        "uploadPlaceholderFormats": "PNG, JPG, WEBP",
        "editPromptLabel": "How should I edit this image?",
        "editPromptPlaceholder": "e.g., Add a futuristic car flying in the sky",
        "applyEditsButton": "Apply Edits"
      },
      "audioStudio": {
        "title": "Audio Studio",
        "textLabel": "Text to convert to speech",
        "textPlaceholder": "Enter your text here...",
        "voiceLabel": "Select a Voice",
        "generateButton": "Generate Audio",
        "generatingFeedback": "Generating audio, please wait...",
        "generationFailed": "Audio generation failed: {{error}}",
        "unknownError": "An unknown error occurred.",
        "playbackFailed": "Playback failed: {{error}}",
        "previewFailed": "Preview generation failed.",
        "previewText": "Hello, I am a voice from Ratel AI.",
        "previewVoice": "Preview {{voiceName}}",
        "generatedAudio": "Generated Audio",
        "play": "Play",
        "stop": "Stop",
        "download": "Download",
        "delete": "Delete"
      },
      "examplesStudio": {
          "title": "Prompt Examples",
          "description": "Not sure what to ask? Get inspired by these examples. Click 'Try it' to start a chat with that prompt.",
          "tabs": {
              "hustle": "Hustle",
              "learn": "Learn",
              "image": "Image",
              "story": "Story"
          },
          "hustlePrompts": [
              "Give me 5 side hustle ideas I can start with ₦20,000 in Nigeria.",
              "Write a short, catchy Instagram bio for my new fashion design business.",
              "What are the current market prices for tomatoes and peppers in Mile 12 market, Lagos?",
              "Create a simple one-page business plan for a local delivery service in Accra."
          ],
          "learnPrompts": [
              "Explain the concept of 'inflation' to me like I'm 10 years old, using Nigerian examples.",
              "Teach me 5 basic phrases in Swahili for greeting someone.",
              "Give me a step-by-step guide on how to start a small poultry farm.",
              "I want to learn basic coding. What's the difference between HTML, CSS, and JavaScript?"
          ],
          "imagePrompts": [
              "A vibrant, busy market scene in Onitsha, digital art style.",
              "A photorealistic image of a futuristic matatu flying over Nairobi.",
              "A logo for a coffee shop called 'Addis Sunrise', with Ethiopian cultural elements.",
              "A beautiful woman wearing traditional Yoruba Aso-Oke, standing in a field of sunflowers."
          ],
          "storyPrompts": [
              "Tell me a short bedtime story about Anansi the Spider.",
              "Create a folk tale about why the cheetah has spots.",
              "Write a modern story about a young tech entrepreneur in Kigali.",
              "A funny story about a goat that thinks it's a dog."
          ]
      },
       // ... other translations
      "tasks": {
        "noTasks": "You have no tasks here."
      },
      "voiceGroups": {
        "premium": "Premium Voices (Gemini)",
        "standard": "Standard Voices (Browser)"
      },
      "settings": {
        "title": "Settings",
        "language": {
            "title": "Language & Region",
            "label": "Select your preferred language",
            "en": "English (International)",
            "ng": "Pidgin (Nigeria)",
            "sw": "Kiswahili",
            "fr": "Français",
            "am": "አማርኛ (Amharic)"
        },
        "customInstructions": {
            "title": "Custom Instructions",
            "nicknameLabel": "How should Ratel call you?",
            "nicknamePlaceholder": "e.g., Oga John, Mama T, CodeMaster",
            "aboutYouLabel": "What would you like Ratel to know about you to provide better responses?",
            "aboutYouPlaceholder": "e.g., I'm a 25-year-old student in Accra studying marketing. I love football, afrobeats music, and my side hustle is graphic design.",
            "expectationsLabel": "How would you like Ratel to respond?",
            "expectationsPlaceholder": "e.g., Be direct and to the point. Use simple language. Feel free to use emojis. Always respond in Nigerian Pidgin unless I ask otherwise."
        },
        "appearance": {
            "title": "Appearance",
            "galleryLabel": "Choose a background from the gallery",
            "uploadButton": "Upload Your Own",
            "removeButton": "Remove Background"
        },
        "memory": {
            "title": "Memory & History",
            "savedMemories": "Reference saved memories",
            "chatHistory": "Reference recent chat history"
        },
        "responses": {
            "title": "Voice & Responses",
            "voicePreference": "Default Voice for Audio Responses"
        },
        "notifications": {
            "title": "Security & Notifications",
            "pushLabel": "Enable Push Notifications",
            "pushDescription": "Get notified for task reminders and important updates.",
            "mfaLabel": "Enable Two-Factor Authentication (MFA)",
            "mfaDescription": "Add an extra layer of security to your account."
        },
        "logout": "Log Out"
      },
      "contact": {
          "title": "Contact & Support",
          "getInTouch": "Get in Touch",
          "intro": "Have questions, feedback, or need help? We'd love to hear from you. The best way to reach us is by email.",
          "supportEmail": "Support Email:",
          "supportEmailAddress": "support@ratel.ai",
          "formTitle": "Or Send Us a Message Directly",
          "nameLabel": "Your Name",
          "namePlaceholder": "Enter your name",
          "emailLabel": "Your Email",
          "emailPlaceholder": "Enter your email",
          "messageLabel": "Your Message",
          "messagePlaceholder": "How can we help you today?",
          "sendMessage": "Send Message",
          "sending": "Sending...",
          "submitSuccess": "Message sent! We'll get back to you soon.",
          "submitError": "Failed to send message. Please try again or email us directly."
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
        "leaderboardTitle": "Leaderboard",
        "weeklyRanking": "Ranking based on weekly activity",
        "points": "pts",
        "rewardsTitle": "Rewards",
        "telegramTitle": "Connect Telegram",
        "myWalletTitle": "My Wallet",
        "redeemTitle": "Redeem",
        "adminTitle": "Admin",
        "feedTitle": "Feed",
        "telegramDescription": "Connect your Telegram account to receive notifications about your community points and redemption status.",
        "connectedStatus": "Connected as @{{username}}",
        "disconnectButton": "Disconnect",
        "telegramUsernameLabel": "Your Telegram Username",
        "telegramUsernamePlaceholder": "e.g., your_username (without the @)",
        "connectButton": "Connect Account",
        "walletTitle": "My Wallet",
        "yourRatelCoins": "Your Available Ratel Coins",
        "cashValue": "Estimated Cash Value",
        "redeemNow": "Redeem Now",
        "activitySummary": "Activity Summary",
        "earnedToday": "Earned Today",
        "totalEarned": "Total Earned",
        "totalRedeemed": "Total Redeemed",
        "redeemRewardsTitle": "Redeem Your Rewards",
        "yourBalance": "Your Current Balance",
        "amountToRedeem": "Amount of Points to Redeem",
        "paymentMethod": "How would you like to receive your payment?",
        "airtime": "Airtime Top-up",
        "bankTransfer": "Bank Transfer",
        "phoneNumber": "Your Phone Number",
        "bankDetails": "Your Bank Details (Acc No, Bank Name)",
        "submitRequest": "Submit Redemption Request",
        "requestSubmitted": "Request Submitted!",
        "requestSubmittedDesc": "Your redemption request has been received. Our team will review it and process your payment within 24-48 hours.",
        "redeemMinimum": "Minimum {{min}} points to redeem.",
        "notEnoughCoins": "Not enough coins",
        "adminPanel": {
            "title": "Community Admin Panel",
            "redemptionRequests": "Redemption Requests",
            "userManagement": "User Management",
            "mobileWorkers": "Mobile Workers",
            "settings": "Settings",
            "noPendingRequests": "No pending redemption requests.",
            "approve": "Approve",
            "reject": "Reject",
            "adjustBalance": "Adjust",
            "totalUsers": "Total Users",
            "totalPoints": "Total Points in Circulation",
            "conversionRate": "Conversion Rate (1 Point = X NGN)",
            "update": "Update",
            "telegramNotifications": "Telegram Notifications",
            "enableTeleNotifications": "Enable Bot Notifications",
            "enableTeleNotificationsDesc": "Send automated messages to users about points and redemptions.",
            "triggerWeeklyPost": "Manually Trigger Weekly Top Users Post"
        }
      },
      "hustleStudio": {
          "title": "Hustle Studio",
          "description": "Tell me about your interests, skills, or available capital, and I'll generate personalized business ideas for you.",
          "placeholder": "e.g., I have ₦50,000 and I'm good at cooking",
          "button": "Get Hustle Ideas"
      },
      "learnStudio": {
          "title": "Learn Studio",
          "description": "Pick a topic below to start a focused learning session with a specialized AI tutor.",
          "skills": {
              "video": "Video Editing",
              "coding": "Coding Basics",
              "canva": "Canva Design",
              "ai": "Using AI"
          },
          "subjects": {
              "finance": "Personal Finance",
              "marketing": "Digital Marketing",
              "agribusiness": "Agribusiness"
          },
          "tutorTitle": "Talk to a Tutor",
          "skillsTitle": "Learn a Skill"
      },
      "marketSquare": {
          "title": "Market Square",
          "description": "Describe what you're looking for and where. I'll search the marketplace for you.",
          "itemLabel": "What item are you looking for?",
          "itemPlaceholder": "e.g., a used iPhone 12, Toyota Camry 2010",
          "locationLabel": "What city or area?",
          "locationPlaceholder": "e.g., Ikeja, Lagos",
          "button": "Find Item",
          "tabs": {
              "browse": "Browse",
              "sell": "Sell Item",
              "find": "Find with AI"
          },
          "browse": {
              "welcome": "Welcome to the Market!",
              "searchPlaceholder": "Search items, sellers, or locations...",
              "fetchError": "Could not load market items. Please check your connection.",
              "noItems": "No items found. Why not be the first to list something?",
              "deleteConfirm": "Are you sure you want to delete this listing?",
              "deleteError": "Could not delete item. You may not be the owner."
          },
          "sell": {
              "sellerNameLabel": "Seller Name",
              "phoneLabel": "Contact Phone",
              "emailLabel": "Contact Email",
              "photoLabel": "Item Photo",
              "itemNameLabel": "Item Name",
              "priceLabel": "Price",
              "currencyLabel": "Currency",
              "descriptionLabel": "Description",
              "locationHeader": "Item Location",
              "countryLabel": "Country",
              "stateLabel": "State/Region",
              "cityLabel": "City",
              "areaLabel": "Area",
              "areaPlaceholder": "e.g., Yaba, Osu, etc.",
              "contactHeader": "Contact Information",
              "error": {
                  "allFields": "Please fill in all required fields and upload a photo.",
                  "generic": "An error occurred. Please try again."
              },
              "success": "Your item has been listed successfully!",
              "submitButton": "List Your Item"
          }
      },
      "mobileWorkersStudio": {
        "title": "Mobile Workers",
        "tabs": {
            "find": "Find a Worker",
            "list": "List Your Skill"
        },
        "find": {
            "searchPlaceholder": "Ask AI to find a worker, e.g., 'I need a tiler in Abuja'",
            "skillFilter": "Filter by skill",
            "locationFilter": "Filter by location",
            "noResults": "No workers found matching your criteria.",
            "verified": "Verified"
        },
        "list": {
            "formTitle": "List Your Skill",
            "formDescription": "Join our network of trusted mobile workers. Fill out your details below to be listed.",
            "photoLabel": "Your Profile Photo",
            "fullNameLabel": "Full Name",
            "phoneLabel": "Phone Number",
            "skillLabel": "Primary Skill/Trade",
            "selectSkill": "Select your skill",
            "locationLabel": "Your Location",
            "locationPlaceholder": "e.g., Ikeja, Lagos",
            "bioLabel": "Short Bio",
            "bioPlaceholder": "Tell clients about your experience and what makes you reliable.",
            "whatsappLabel": "WhatsApp Link (Optional)",
            "whatsappPlaceholder": "e.g., https://wa.me/2348012345678",
            "error": {
                "allFields": "Please fill in all required fields and upload a photo.",
                "generic": "Failed to submit your listing. Please try again."
            },
            "success": "Your profile has been submitted for review!",
            "submitting": "Submitting...",
            "submitButton": "Submit Listing"
        }
      },
      "proModal": {
        "comingSoonTitle": "Ratel Pro Coming Soon!",
        "comingSoonDescription": "This feature is part of our upcoming Pro plan, which will include unlimited access, more powerful models, and exclusive tools. Stay tuned!",
        "gotIt": "Got It"
      },
      "supportModal": {
        "title": "Support Ratel AI",
        "description": "Your contribution helps us keep the servers running and develop new features for the community.",
        "flutterwave": "Pay with Flutterwave (NGN)",
        "telebirr": "Pay with Telebirr (ETB)",
        "maybeLater": "Maybe Later",
        "backButton": "Back",
        "enterAmount": "Enter amount (NGN)",
        "payButton": "Continue to Payment",
        "telebirrInstructionsTitle": "Pay with Telebirr",
        "telebirrInstructions": "Please send your contribution to the following Telebirr number:",
        "configureKeyError": "Payment gateway is not configured correctly. Please contact support."
      },
      "profileStudio": {
          "title": "My Profile",
          "noInterests": "Not yet determined",
          "topInterest": "Top Interest"
      }
    }
  },
  fr: {
    translation: {
        "sidebar": {
            "newChat": "Nouveau Tchat",
            "hustleStudio": "Studio Hustle",
            "learnStudio": "Studio Apprendre",
            "marketSquare": "Marché",
            "communityStudio": "Communauté",
            "settings": "Paramètres"
        },
        "chatInput": {
            "placeholder": "Demandez n'importe quoi à Ratel..."
        },
        "chatWindow": {
            "welcomeTitle": "Ratel AI",
            "welcomeSubtitle": "Votre compagnon IA pour l'Afrique.",
            "modeNormal": "Normal",
            "modeFormal": "Formel",
            "modeHumorous": "Humoristique",
            "modeAdvanced": "Avancé"
        },
        "settings": {
            "title": "Paramètres",
            "language": {
                "title": "Langue & Région",
                "label": "Choisissez votre langue préférée",
                "en": "English (International)",
                "sw": "Kiswahili",
                "fr": "Français",
                "am": "አማርኛ (Amharique)"
            }
        }
    }
  },
  am: {
    translation: {
        "sidebar": {
            "newChat": "አዲስ ውይይት",
            "history": "ታሪክ",
            "hustleStudio": "የሥራ ስቱዲዮ",
            "learnStudio": "የመማሪያ ስቱዲዮ",
            "marketSquare": "ገበያ",
            "communityStudio": "ማህበረሰብ",
            "settings": "ቅንብሮች",
            "logout": "ውጣ"
        },
        "chatInput": {
            "placeholder": "ራቴልን ማንኛውንም ነገር ይጠይቁ..."
        },
        "settings": {
            "title": "ቅንብሮች",
            "language": {
                "title": "ቋንቋ እና ክልል",
                "label": "የሚመርጡትን ቋንቋ ይምረጡ",
                "en": "እንግሊዝኛ (ዓለም አቀፍ)",
                "sw": "ስዋሂሊ",
                "fr": "ፈረንሳይኛ",
                "am": "አማርኛ"
            }
        }
    }
  },
  sw: {
    translation: {
        "sidebar": {
            "newChat": "Soga Mpya",
            "history": "Historia",
            "hustleStudio": "Studio ya Kazi",
            "learnStudio": "Studio ya Kujifunza",
            "marketSquare": "Sokoni",
            "communityStudio": "Jumuiya",
            "settings": "Mipangilio",
            "logout": "Toka"
        },
        "chatInput": {
            "placeholder": "Uliza Ratel chochote..."
        },
        "chatWindow": {
            "welcomeTitle": "Ratel AI",
            "welcomeSubtitle": "Msaidizi wako wa AI kwa Afrika.",
            "modeNormal": "Kawaida",
            "modeFormal": "Rasmi",
            "modeHumorous": "Ucheshi",
            "modeAdvanced": "Juu"
        },
        "settings": {
            "title": "Mipangilio",
            "language": {
                "title": "Lugha na Eneo",
                "label": "Chagua lugha unayopendelea",
                "en": "Kiingereza (Kimataifa)",
                "sw": "Kiswahili",
                "fr": "Kifaransa",
                "am": "Kiamhari"
            }
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
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ratel_language',
    },
  });

export default i18n;