// Configuração do Firebase do site — Partido Missão por Altávia (PMA).
//
// Os valores abaixo identificam o app web do Firebase junto ao projeto
// "texnk-87824". Segundo a documentação oficial do Firebase, os valores de
// configuração web NÃO são segredos: eles apenas identificam o projeto, e o
// acesso aos dados é controlado pelas regras de segurança do Realtime
// Database.
//
// Uso no site:
// - Realtime Database (databaseURL): camada de dados persistente online,
//   usada pelas rotas de API no servidor (via REST, em src/lib/firebase-rtdb.ts)
//   quando não há DATABASE_URL configurada — mantém notícias, candidaturas,
//   filiados, mensagens e estatísticas salvos na nuvem no deploy da Vercel.
// - Google Analytics (measurementId G-EKQEZZP9JG): Firebase Analytics,
//   carregado no layout do site via gtag.js.

export const firebaseConfig = {
  apiKey: 'AIzaSyDJ_eZ66s9XEXabIft00XqexAfln1VVfuw',
  authDomain: 'texnk-87824.firebaseapp.com',
  databaseURL: 'https://texnk-87824-default-rtdb.firebaseio.com',
  projectId: 'texnk-87824',
  storageBucket: 'texnk-87824.firebasestorage.app',
  messagingSenderId: '779926061521',
  appId: '1:779926061521:web:ef0cc574a719f0a682a0f0',
  measurementId: 'G-EKQEZZP9JG',
}

// URL base da REST API do Realtime Database.
export const FIREBASE_RTDB_BASE = firebaseConfig.databaseURL

// Identidade do Google Analytics (Firebase Analytics) usada no layout.
export const FIREBASE_GA_ID = firebaseConfig.measurementId
