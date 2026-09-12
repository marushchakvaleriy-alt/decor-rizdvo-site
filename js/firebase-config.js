// =====================================================================
// НАЛАШТУВАННЯ FIREBASE
// =====================================================================
// Тут потрібно вставити СВОЇ дані з консолі Firebase.
// Як їх отримати — детально описано в README.md, крок 4.
//
// Просто замініть значення нижче (те, що написано ВЕЛИКИМИ ЛІТЕРАМИ
// в лапках) на свої — і збережіть файл.
// =====================================================================

const firebaseConfig = {
  apiKey: "AIzaSyCwkclq1pzoWYWKzwv7hMsgX6wcmgahzdA",
  authDomain: "decor-rizdvo.firebaseapp.com",
  projectId: "decor-rizdvo",
  storageBucket: "decor-rizdvo.firebasestorage.app",
  messagingSenderId: "967529836355",
  appId: "1:967529836355:web:7ae214bcd76eb31e6589f6"
};

// Ініціалізація Firebase (не чіпайте цей рядок)
firebase.initializeApp(firebaseConfig);
