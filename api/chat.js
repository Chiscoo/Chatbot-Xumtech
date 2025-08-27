const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB2bs_z4s2ELgXNzFErHq5opnQbvN4eVNw",
  authDomain: "xumtech-chatbot-799da.firebaseapp.com",
  projectId: "xumtech-chatbot-799da",
  storageBucket: "xumtech-chatbot-799da.firebasestorage.app",
  messagingSenderId: "762621610010",
  appId: "1:762621610010:web:80b5877a839414a3d9e9a3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  try {
    const qaPairsRef = collection(db, 'qa_pairs');
    const snapshot = await getDocs(qaPairsRef);
    
    let foundAnswer = null;
    const searchTerm = message.toLowerCase();
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const keywords = data.keywords.toLowerCase();
      const question = data.question.toLowerCase();
      
      if (keywords.includes(searchTerm) || question.includes(searchTerm)) {
        foundAnswer = data.answer;
      }
    });

    const response = foundAnswer || 'Lo siento, no entendí tu pregunta. ¿Podrías reformularla?';
    const understood = !!foundAnswer;

    // Log conversación
    await addDoc(collection(db, 'chat_logs'), {
      user_message: message,
      bot_response: response,
      understood,
      timestamp: new Date()
    });

    res.json({ response, understood });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
}