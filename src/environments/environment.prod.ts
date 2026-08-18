// Production environment configuration.
//
// This file REPLACES environment.ts at build time via the `fileReplacements`
// entry in angular.json's `production` configuration. Keep its shape
// identical to environment.ts - any key added there must be added here too,
// or the production build will fail to compile.
export const environment = {
  production: true,
  firebase: {
    apiKey: "AIzaSyCs7vGCEkCJPashW45zfByehd3fheFKcFk",
    authDomain: "naan-builders.firebaseapp.com",
    projectId: "naan-builders",
    storageBucket: "naan-builders.firebasestorage.app",
    messagingSenderId: "240175743963",
    appId: "1:240175743963:web:fead338db1325e22489dfe",
  },
  // Canonical origin for this site, WITHOUT a trailing slash.
  // Used to build <link rel="canonical">, og:url and the sitemap.
  // >>> WHEN YOUR CUSTOM DOMAIN GOES LIVE, CHANGE IT HERE (and in
  // >>> src/index.html + re-run scripts/generate-sitemap.mjs). This is the
  // >>> only place the app itself reads it from.
  siteUrl: 'https://naan-builders.web.app',
  contact: {
    phone: '+91 90000 00000',
    whatsapp: '919000000000',
    email: 'contact@naanbuilders.com',
    address: 'Chennai, Tamil Nadu, India'
  }
};
