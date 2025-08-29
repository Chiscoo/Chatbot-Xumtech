const express = require('express');
const cors = require('cors');
const db = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Clave secreta para JWT (en producción debería estar en variables de entorno)
const JWT_SECRET = 'xumtech-chatbot-secret-key-2024';

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware
app.use(cors({
  origin: [
    'https://chatbot-xumtech.vercel.app',
    'https://chatbot-xumtech-fqhv4mh5i-franciscos-projects-80bf3685.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));

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

  // Extraer palabras clave del mensaje del usuario (mínimo 3 caracteres)
  const userWords = message.toLowerCase().split(/\s+/).filter(word => word.length >= 3);

  // Si no hay palabras válidas, responder que no entendió
  if (userWords.length === 0) {
    const response = 'Lo siento, no entendí tu pregunta. ¿Podrías reformularla?';
    
    db.run(
      'INSERT INTO chat_logs (user_message, bot_response, understood) VALUES (?, ?, ?)',
      [message, response, false],
      (logErr) => {
        if (logErr) console.error('Error logging conversation:', logErr);
      }
    );
    
    return res.json({ response, understood: false });
  }

  // Obtener todas las preguntas y respuestas
  db.all('SELECT question, answer, keywords FROM qa_pairs', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error del servidor' });
    }

    let bestMatch = null;
    let maxMatches = 0;

    // Buscar la mejor coincidencia
    rows.forEach(row => {
      const keywords = row.keywords.toLowerCase().split(',').map(k => k.trim());
      const questionWords = row.question.toLowerCase().split(/\s+/).filter(word => word.length >= 3);
      const allSearchTerms = [...keywords, ...questionWords];
      
      let matches = 0;
      userWords.forEach(userWord => {
        allSearchTerms.forEach(term => {
          if (term.includes(userWord) || userWord.includes(term)) {
            matches++;
          }
        });
      });

      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = row;
      }
    });

    let response, understood;
    
    // Requiere al menos 2 coincidencias para considerar válida la respuesta
    if (bestMatch && maxMatches >= 2) {
      response = bestMatch.answer;
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

// ===== RUTAS DE AUTENTICACIÓN =====

// Ruta de login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  db.get('SELECT * FROM admin_users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error del servidor' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    bcrypt.compare(password, user.password_hash, (err, isValid) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error del servidor' });
      }

      if (!isValid) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    });
  });
});

// Ruta de registro
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error del servidor' });
    }

    db.run(
      'INSERT INTO admin_users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Usuario o email ya existe' });
          }
          console.error(err);
          return res.status(500).json({ error: 'Error del servidor' });
        }

        const token = jwt.sign(
          { id: this.lastID, username, email },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          message: 'Usuario registrado exitosamente',
          token,
          user: {
            id: this.lastID,
            username,
            email
          }
        });
      }
    );
  });
});

// Ruta para verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// ===== RUTAS DE ADMINISTRACIÓN PROTEGIDAS =====

// Obtener todas las preguntas con detalles completos
app.get('/api/admin/questions', authenticateToken, (req, res) => {
  db.all('SELECT * FROM qa_pairs ORDER BY id ASC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    res.json({ questions: rows });
  });
});

// Agregar nueva pregunta
app.post('/api/admin/questions', authenticateToken, (req, res) => {
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
app.delete('/api/admin/questions/:id', authenticateToken, (req, res) => {
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

// Editar pregunta existente
app.put('/api/admin/questions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { question, keywords, answer } = req.body;
  
  if (!question || !keywords || !answer) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const query = `
    UPDATE qa_pairs 
    SET question = ?, keywords = ?, answer = ? 
    WHERE id = ?
  `;
  
  db.run(query, [question, keywords, answer, id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al actualizar pregunta' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    res.json({ 
      message: 'Pregunta actualizada exitosamente'
    });
  });
});

// Obtener estadísticas del chatbot
app.get('/api/admin/stats', authenticateToken, (req, res) => {
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
app.get('/api/admin/export', authenticateToken, (req, res) => {
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