import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

function AdminPanel({ darkMode, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    keywords: '',
    answer: ''
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    // Datos simulados para mostrar la interfaz
    setQuestions([
      { id: 1, question: '¿Qué servicios ofrece XUMTECH?', keywords: 'servicios,cx,oracle', answer: 'XUMTECH se especializa en Customer Experience...' },
      { id: 2, question: '¿Cómo contactar XUMTECH?', keywords: 'contacto,telefono', answer: 'Teléfono +506 2205-5458...' }
    ]);
  }, []);

  const fetchQuestions = async () => {
    // Función deshabilitada temporalmente
    console.log('Función de administración no disponible en producción');
  };

  const fetchStats = async () => {
    // Datos simulados de estadísticas
    setStats({
      totalConversations: 0,
      understood: 0,
      notUnderstood: 0,
      topQuestions: [],
      missedQuestions: []
    });
  };

  const exportData = () => {
    alert('Función de exportación no disponible en la versión de demostración');
  };

  const addQuestion = async () => {
    alert('Panel de administración no disponible en la versión de demostración. Esta funcionalidad estaría conectada a Firebase en producción.');
  };

  const deleteQuestion = async (id) => {
    alert('Panel de administración no disponible en la versión de demostración.');
  };

  return (
    <div className={`admin-overlay ${darkMode ? 'dark' : 'light'}`}>
      <div className={`admin-panel ${darkMode ? 'dark' : 'light'}`}>
        <div className="admin-header">
          <h2>Panel de Administración</h2>
          <div className="admin-nav">
            <button 
              className={`nav-btn ${!showStats ? 'active' : ''}`}
              onClick={() => setShowStats(false)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              Gestión
            </button>
            <button 
              className={`nav-btn ${showStats ? 'active' : ''}`}
              onClick={() => {setShowStats(true); fetchStats();}}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon">
                <path d="M22,21H2V3H4V19H6V17H10V19H12V16H16V19H18V17H22V21M16,8H18V15H16V8M12,2H14V15H12V2M8,13H10V15H8V13M4,15H6V19H4V15Z"/>
              </svg>
              Estadísticas
            </button>
            <button className="export-btn" onClick={exportData}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="export-icon">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              Exportar
            </button>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="admin-content">
          {!showStats ? (
            <>
              {/* Formulario para agregar pregunta */}
              <div className="add-question-section">
                <h3>Agregar Nueva Pregunta</h3>
                <div className="form-group">
                  <label>Pregunta:</label>
                  <input
                    type="text"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                    placeholder="¿Cuál es el horario?"
                  />
                </div>
                <div className="form-group">
                  <label>Palabras Clave (separadas por coma):</label>
                  <input
                    type="text"
                    value={newQuestion.keywords}
                    onChange={(e) => setNewQuestion({...newQuestion, keywords: e.target.value})}
                    placeholder="horario,tiempo,horas"
                  />
                </div>
                <div className="form-group">
                  <label>Respuesta:</label>
                  <textarea
                    value={newQuestion.answer}
                    onChange={(e) => setNewQuestion({...newQuestion, answer: e.target.value})}
                    placeholder="Nuestro horario es..."
                    rows="3"
                  />
                </div>
                <button 
                  className="add-btn"
                  onClick={addQuestion}
                  disabled={loading}
                >
                  {loading ? 'Agregando...' : 'Agregar Pregunta'}
                </button>
              </div>

              {/* Lista de preguntas existentes */}
              <div className="questions-list-section">
                <h3>Preguntas Existentes ({questions.length})</h3>
                <div className="questions-list">
                  {questions.map((q, index) => (
                    <div key={index} className="question-item">
                      <div className="question-content">
                        <strong>P: {q.question}</strong>
                        <p>R: {q.answer}</p>
                        <small>Keywords: {q.keywords}</small>
                      </div>
                      <button 
                        className="delete-btn"
                        onClick={() => deleteQuestion(q.id)}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Sección de Estadísticas */
            <div className="stats-section">
              {stats ? (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <h4>Total Conversaciones</h4>
                      <div className="stat-number">{stats.totalConversations}</div>
                    </div>
                    <div className="stat-card">
                      <h4>Preguntas Entendidas</h4>
                      <div className="stat-number success">{stats.understood}</div>
                    </div>
                    <div className="stat-card">
                      <h4>No Entendidas</h4>
                      <div className="stat-number error">{stats.notUnderstood}</div>
                    </div>
                    <div className="stat-card">
                      <h4>Tasa de Éxito</h4>
                      <div className="stat-number">
                        {stats.totalConversations > 0 
                          ? Math.round((stats.understood / stats.totalConversations) * 100) 
                          : 0}%
                      </div>
                    </div>
                  </div>

                  <div className="stats-details">
                    <div className="stat-section">
                      <h4>Preguntas Más Frecuentes</h4>
                      {stats.topQuestions.length > 0 ? (
                        <ul>
                          {stats.topQuestions.map((q, i) => (
                            <li key={i}>{q.user_message} ({q.frequency} veces)</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No hay datos suficientes</p>
                      )}
                    </div>

                    <div className="stat-section">
                      <h4>Preguntas No Entendidas</h4>
                      {stats.missedQuestions.length > 0 ? (
                        <ul>
                          {stats.missedQuestions.map((q, i) => (
                            <li key={i}>{q.user_message} ({q.frequency} veces)</li>
                          ))}
                        </ul>
                      ) : (
                        <p>¡Excelente! No hay preguntas sin respuesta</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="loading-stats">Cargando estadísticas...</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;