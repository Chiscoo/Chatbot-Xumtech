const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Crear base de datos
const dbPath = path.join(__dirname, 'chatbot.db');
const db = new sqlite3.Database(dbPath);

// Crear tablas y datos iniciales
db.serialize(() => {
  // Crear tabla de preguntas y respuestas
  db.run(`
    CREATE TABLE IF NOT EXISTS qa_pairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      keywords TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear tabla de estadísticas
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_message TEXT NOT NULL,
      bot_response TEXT NOT NULL,
      understood BOOLEAN NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear tabla de usuarios admin
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear usuario admin por defecto
  const defaultPassword = bcrypt.hashSync('admin123', 10);
  const adminStmt = db.prepare(`
    INSERT OR IGNORE INTO admin_users (id, username, email, password_hash) 
    VALUES (?, ?, ?, ?)
  `);
  adminStmt.run([1, 'admin', 'admin@xumtech.com', defaultPassword]);
  adminStmt.finalize();

  // Insertar datos de ejemplo
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO qa_pairs (id, question, keywords, answer) 
    VALUES (?, ?, ?, ?)
  `);

  const sampleData = [
    [1, '¿Qué servicios ofrece XUMTECH?', 'servicios,cx,customer experience,oracle,crm', 'XUMTECH se especializa en Customer Experience (CX), consultoría e implementación de soluciones Oracle Cloud, transformación digital, CRM, ERP, automatización de ventas y omnicanalidad en atención al cliente.'],
    
    [2, '¿Cómo puedo contactar a XUMTECH?', 'contacto,telefono,email,comunicar,ubicacion', 'Puedes contactarnos al teléfono +506 2205-5458 o visitar nuestro sitio web www.xum-tech.com. Estamos ubicados en Belén, Heredia, Costa Rica.'],
    
    [3, '¿Qué es XUMTECH y desde cuándo opera?', 'empresa,historia,fundacion,xumtech,suum', 'XUMTECH (anteriormente SUUM Technologies) es una empresa fundada en 2015, especializada en Customer Experience y transformación digital. Somos Partner Oracle galardonado en Centroamérica y Caribe durante dos años consecutivos.'],
    
    [4, '¿Qué significa ser Partner Oracle galardonado?', 'oracle,partner,premio,certificacion,galardon', 'XUMTECH ha sido galardonado como Partner del Año de Oracle en Centroamérica y Caribe durante dos años consecutivos, reconociendo nuestra experiencia y excelentes resultados en implementaciones de Oracle Cloud Applications.'],
    
    [5, '¿Qué metodología utilizan para las implementaciones?', 'metodologia,implementacion,cloud,aplicaciones', 'Utilizamos la metodología Cloud Application Services que asegura implementaciones exitosas, el logro de objetivos de negocio e impacto en los procesos de mercadeo, ventas, servicio, lealtad y comercio digital.'],
    
    [6, '¿En qué se especializa XUMTECH en transformación digital?', 'transformacion,digital,procesos,negocio', 'Nos especializamos en transformación organizacional y de procesos de negocio, habilitados por Oracle Cloud, enfocándonos en mejorar la experiencia del cliente y la permanencia de las organizaciones en el mercado.'],
    
    [7, '¿Qué tamaño tiene el equipo de XUMTECH?', 'equipo,empleados,tamaño,consultores', 'XUMTECH cuenta con un equipo de 51-200 empleados especializados, incluyendo consultores certificados en constante renovación de conocimientos según los estándares más recientes de Oracle.'],
    
    [8, '¿Trabajan con comercio electrónico?', 'ecommerce,comercio,digital,ventas,online', 'Sí, ofrecemos soluciones de eCommerce y comercio digital como parte de nuestros servicios de transformación digital, integrando experiencias omnicanales para maximizar las ventas.']
  ];

  sampleData.forEach(data => {
    insertStmt.run(data);
  });

  insertStmt.finalize();
});

console.log('Base de datos inicializada correctamente');

module.exports = db;