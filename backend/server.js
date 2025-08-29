const express = require('express');
const cors = require('cors');
const db = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Servidor principal del chatbot XUMTECH
 * Maneja autenticación, procesamiento de mensajes y administración
 */

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'xumtech-chatbot-secret-key-2024';

// Middleware de autenticación JWT
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

// Configuración de CORS para producción y desarrollo
app.use(cors({
  origin: [
    'https://chatbot-xumtech.vercel.app',
    'https://chatbot-xumtech-fqhv4mh5i-franciscos-projects-80bf3685.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());

// Endpoint de verificación del servidor
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente!' });
});

// Motor principal del chatbot - procesamiento de lenguaje natural
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  // Filtrar palabras significativas del mensaje del usuario
  const userWords = message.toLowerCase().split(/\s+/).filter(word => word.length >= 3);

  // Validar que hay contenido procesable
  if (userWords.length === 0) {
    const response = 'Lo siento, no entendí tu pregunta. ¿Podrías reformularla?';
    logConversation(message, response, false);
    return res.json({ response, understood: false });
  }

  // Buscar coincidencias en la base de conocimiento
  db.all('SELECT question, answer, keywords FROM qa_pairs', (err, rows) => {
    if (err) {
      console.error('Error base de datos:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }

    // Algoritmo de matching inteligente
    let bestMatch = null;
    let maxMatches = 0;

    rows.forEach(row => {
      const keywords = row.keywords.toLowerCase().split(',').map(k => k.trim());
      const questionWords = row.question.toLowerCase().split(/\s+/).filter(word => word.length >= 3);
      const searchTerms = [...keywords, ...questionWords];
      
      let matches = 0;
      userWords.forEach(userWord => {
        searchTerms.forEach(term => {
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

    // Evaluar confianza de la respuesta
    let response, understood;
    if (bestMatch && maxMatches >= 1) {
      response = bestMatch.answer;
      understood = true;
    } else {
      response = 'Lo siento, no entendí tu pregunta. ¿Podrías reformularla?';
      understood = false;
    }

    logConversation(message, response, understood);
    res.json({ response, understood });
  });
});

// Función auxiliar para registrar conversaciones
function logConversation(userMessage, botResponse, understood) {
  db.run(
    'INSERT INTO chat_logs (user_message, bot_response, understood) VALUES (?, ?, ?)',
    [userMessage, botResponse, understood],
    (err) => {
      if (err) console.error('Error guardando log:', err);
    }
  );
}

// Endpoint público para listar preguntas disponibles
app.get('/api/questions', (req, res) => {
  db.all('SELECT question FROM qa_pairs', (err, rows) => {
    if (err) {
      console.error('Error obteniendo preguntas:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    res.json({ questions: rows.map(row => row.question) });
  });
});

// ===== SISTEMA DE AUTENTICACIÓN =====

// Inicio de sesión de administradores
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  db.get('SELECT * FROM admin_users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Error autenticación:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña hasheada
    bcrypt.compare(password, user.password_hash, (err, isValid) => {
      if (err || !isValid) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Generar token de sesión
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login exitoso',
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });
    });
  });
});

// Registro de nuevos administradores
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  // Hash de la contraseña
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
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
          console.error('Error registro:', err);
          return res.status(500).json({ error: 'Error del servidor' });
        }

        // Auto-login después del registro
        const token = jwt.sign(
          { id: this.lastID, username, email },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          message: 'Usuario registrado exitosamente',
          token,
          user: { id: this.lastID, username, email }
        });
      }
    );
  });
});

// Verificación de token para mantener sesión
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ===== PANEL DE ADMINISTRACIÓN - RUTAS PROTEGIDAS =====

// Listar todas las preguntas para administración
app.get('/api/admin/questions', authenticateToken, (req, res) => {
  db.all('SELECT * FROM qa_pairs ORDER BY id ASC', (err, rows) => {
    if (err) {
      console.error('Error obteniendo preguntas admin:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    res.json({ questions: rows });
  });
});

// Crear nueva pregunta
app.post('/api/admin/questions', authenticateToken, (req, res) => {
  const { question, keywords, answer } = req.body;
  
  if (!question || !keywords || !answer) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  db.run(
    'INSERT INTO qa_pairs (question, keywords, answer) VALUES (?, ?, ?)',
    [question, keywords, answer],
    function(err) {
      if (err) {
        console.error('Error creando pregunta:', err);
        return res.status(500).json({ error: 'Error al guardar pregunta' });
      }
      
      res.json({ 
        message: 'Pregunta agregada exitosamente',
        id: this.lastID 
      });
    }
  );
});

// Actualizar pregunta existente
app.put('/api/admin/questions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { question, keywords, answer } = req.body;
  
  if (!question || !keywords || !answer) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  db.run(
    'UPDATE qa_pairs SET question = ?, keywords = ?, answer = ? WHERE id = ?',
    [question, keywords, answer, id],
    function(err) {
      if (err) {
        console.error('Error actualizando pregunta:', err);
        return res.status(500).json({ error: 'Error al actualizar pregunta' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Pregunta no encontrada' });
      }
      
      res.json({ message: 'Pregunta actualizada exitosamente' });
    }
  );
});

// Eliminar pregunta
app.delete('/api/admin/questions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM qa_pairs WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error eliminando pregunta:', err);
      return res.status(500).json({ error: 'Error al eliminar pregunta' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    res.json({ message: 'Pregunta eliminada exitosamente' });
  });
});

// Dashboard - estadísticas de uso
app.get('/api/admin/stats', authenticateToken, (req, res) => {
  const stats = {};
  let completed = 0;

  // Recopilar métricas de uso
  const queries = [
    'SELECT COUNT(*) as total_conversations FROM chat_logs',
    'SELECT understood, COUNT(*) as count FROM chat_logs GROUP BY understood',
    'SELECT user_message, COUNT(*) as frequency FROM chat_logs WHERE understood = 1 GROUP BY user_message ORDER BY frequency DESC LIMIT 5',
    'SELECT user_message, COUNT(*) as frequency FROM chat_logs WHERE understood = 0 GROUP BY user_message ORDER BY frequency DESC LIMIT 5'
  ];

  // Total de conversaciones
  db.get(queries[0], (err, row) => {
    if (err) console.error('Error stats total:', err);
    stats.totalConversations = row ? row.total_conversations : 0;
    if (++completed === 4) res.json(stats);
  });

  // Distribución understood/not understood
  db.all(queries[1], (err, rows) => {
    if (err) console.error('Error stats understood:', err);
    stats.understood = rows ? rows.find(r => r.understood === 1)?.count || 0 : 0;
    stats.notUnderstood = rows ? rows.find(r => r.understood === 0)?.count || 0 : 0;
    if (++completed === 4) res.json(stats);
  });

  // Top preguntas exitosas
  db.all(queries[2], (err, rows) => {
    if (err) console.error('Error stats top:', err);
    stats.topQuestions = rows || [];
    if (++completed === 4) res.json(stats);
  });

  // Preguntas no comprendidas
  db.all(queries[3], (err, rows) => {
    if (err) console.error('Error stats missed:', err);
    stats.missedQuestions = rows || [];
    if (++completed === 4) res.json(stats);
  });
});

// Exportar logs de conversación a CSV
app.get('/api/admin/export', authenticateToken, (req, res) => {
  db.all(
    'SELECT user_message, bot_response, understood, datetime(timestamp, "localtime") as date FROM chat_logs ORDER BY timestamp DESC',
    (err, rows) => {
      if (err) {
        console.error('Error export:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      
      // Generar CSV
      const csvHeader = 'Mensaje Usuario,Respuesta Bot,Entendida,Fecha\n';
      const csvData = rows.map(row => 
        `"${row.user_message}","${row.bot_response}",${row.understood ? 'Sí' : 'No'},"${row.date}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=conversaciones-xumtech.csv');
      res.send(csvHeader + csvData);
    }
  );
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor XUMTECH ChatBot corriendo en puerto ${PORT}`);
});