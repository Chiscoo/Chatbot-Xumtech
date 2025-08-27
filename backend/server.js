const express = require('express');
const cors = require('cors');
const { db, initializeData } = require('./database');
const { collection, addDoc, getDocs, doc, deleteDoc, query, where, orderBy } = require('firebase/firestore');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar datos si es necesario (solo ejecutar una vez)
// initializeData();

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente!' });
});

// Ruta para obtener respuesta del chatbot
app.post('/api/chat', async (req, res) => {
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

    if (foundAnswer) {
      // Log de conversación
      await addDoc(collection(db, 'chat_logs'), {
        user_message: message,
        bot_response: foundAnswer,
        understood: true,
        timestamp: new Date()
      });
      
      res.json({ 
        response: foundAnswer,
        understood: true 
      });
    } else {
      const noUnderstandResponse = 'Lo siento, no entendí tu pregunta. ¿Podrías reformularla?';
      
      // Log de conversación
      await addDoc(collection(db, 'chat_logs'), {
        user_message: message,
        bot_response: noUnderstandResponse,
        understood: false,
        timestamp: new Date()
      });
      
      res.json({ 
        response: noUnderstandResponse,
        understood: false 
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});