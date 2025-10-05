import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';  // Optional

const firebaseConfig = {
  apiKey: "AIzaSyJinNNCNDB2KTSV5rUg3NpY",  // Your exact value
  authDomain: "event-tracker-cec96.firebaseapp.com",
  projectId: "event-tracker-cec96",
  storageBucket: "event-tracker-cec96.firebasestorage.app",
  messagingSenderId: "2954546771",
  appId: "1:2954546771:web:80df5d1cd9736c8fe"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);  // Optional analytics

export { app, analytics };

