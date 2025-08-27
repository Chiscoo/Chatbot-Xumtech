const express = require('express');
const cors = require('cors');
const db = require('./database');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente!' });
});

// Ruta para obtener respuesta del chatbot (con logging)
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  // Buscar respuesta en la base de datos
  const query = `
    SELECT question, answer 
    FROM qa_pairs 
    WHERE keywords LIKE ? OR question LIKE ?
  `;
  
  const searchTerm = `%${message.toLowerCase()}%`;
  
  db.get(query, [searchTerm, searchTerm], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    
    let response, understood;
    
    if (row) {
      response = row.answer;
      understood = true;
    } else {
      response = 'Lo siento, no entendí tu pregunta. ¿Podrías reformularla?';
      understood = false;
    }

    // Guardar log de la conversación
    db.run(
      'INSERT INTO chat_logs (user_message, bot_response, understood) VALUES (?, ?, ?)',
      [message, response, understood],
      (logErr) => {
        if (logErr) console.error('Error logging conversation:', logErr);
      }
    );
    
    res.json({ response, understood });
  });
});

// Ruta para obtener todas las preguntas disponibles
app.get('/api/questions', (req, res) => {
  db.all('SELECT question FROM qa_pairs', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    res.json({ questions: rows.map(row => row.question) });
  });
});

// ===== RUTAS DE ADMINISTRACIÓN =====

// Obtener todas las preguntas con detalles completos
app.get('/api/admin/questions', (req, res) => {
  db.all('SELECT * FROM qa_pairs ORDER BY id ASC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    res.json({ questions: rows });
  });
});

// Agregar nueva pregunta
app.post('/api/admin/questions', (req, res) => {
  const { question, keywords, answer } = req.body;
  
  if (!question || !keywords || !answer) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const query = `
    INSERT INTO qa_pairs (question, keywords, answer) 
    VALUES (?, ?, ?)
  `;
  
  db.run(query, [question, keywords, answer], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al guardar pregunta' });
    }
    
    res.json({ 
      message: 'Pregunta agregada exitosamente',
      id: this.lastID 
    });
  });
});

// Eliminar pregunta
app.delete('/api/admin/questions/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM qa_pairs WHERE id = ?', [id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al eliminar pregunta' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    res.json({ message: 'Pregunta eliminada exitosamente' });
  });
});

// Obtener estadísticas del chatbot
app.get('/api/admin/stats', (req, res) => {
  const statsQueries = [
    // Total de conversaciones
    'SELECT COUNT(*) as total_conversations FROM chat_logs',
    // Preguntas entendidas vs no entendidas
    'SELECT understood, COUNT(*) as count FROM chat_logs GROUP BY understood',
    // Preguntas más frecuentes
    'SELECT user_message, COUNT(*) as frequency FROM chat_logs WHERE understood = 1 GROUP BY user_message ORDER BY frequency DESC LIMIT 5',
    // Preguntas no entendidas
    'SELECT user_message, COUNT(*) as frequency FROM chat_logs WHERE understood = 0 GROUP BY user_message ORDER BY frequency DESC LIMIT 5'
  ];

  let stats = {};
  let completed = 0;

  // Total de conversaciones
  db.get(statsQueries[0], (err, row) => {
    if (err) console.error(err);
    stats.totalConversations = row ? row.total_conversations : 0;
    if (++completed === 4) res.json(stats);
  });

  // Entendidas vs no entendidas
  db.all(statsQueries[1], (err, rows) => {
    if (err) console.error(err);
    stats.understood = rows ? rows.find(r => r.understood === 1)?.count || 0 : 0;
    stats.notUnderstood = rows ? rows.find(r => r.understood === 0)?.count || 0 : 0;
    if (++completed === 4) res.json(stats);
  });

  // Preguntas más frecuentes
  db.all(statsQueries[2], (err, rows) => {
    if (err) console.error(err);
    stats.topQuestions = rows || [];
    if (++completed === 4) res.json(stats);
  });

  // Preguntas no entendidas
  db.all(statsQueries[3], (err, rows) => {
    if (err) console.error(err);
    stats.missedQuestions = rows || [];
    if (++completed === 4) res.json(stats);
  });
});

// Exportar conversaciones
app.get('/api/admin/export', (req, res) => {
  db.all('SELECT user_message, bot_response, understood, datetime(timestamp, "localtime") as date FROM chat_logs ORDER BY timestamp DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    
    // Convertir a CSV
    const csvHeader = 'Mensaje Usuario,Respuesta Bot,Entendida,Fecha\n';
    const csvData = rows.map(row => 
      `"${row.user_message}","${row.bot_response}",${row.understood ? 'Sí' : 'No'},"${row.date}"`
    ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=conversaciones.csv');
    res.send(csvHeader + csvData);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

