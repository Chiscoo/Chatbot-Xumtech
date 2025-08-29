import React, { useState, useEffect, useCallback } from 'react';
import './AdminPanel.css';

/**
 * Panel de administración para gestión del chatbot XUMTECH
 * Permite CRUD completo de preguntas, visualización de estadísticas y exportación de datos
 */

function AdminPanel({ darkMode, onClose, authToken }) {
  // Estados para la gestión de preguntas
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    keywords: '',
    answer: ''
  });
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para estadísticas
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Genera headers de autenticación para todas las peticiones
const getAuthHeaders = useCallback(() => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authToken}`
}), [authToken]);

// Maneja expiración de sesión de forma consistente
const handleSessionExpired = useCallback(() => {
  alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
  onClose();
}, [onClose]);

// Carga preguntas al inicializar el componente
useEffect(() => {
  const fetchQuestions = async () => {
    try {
      const response = await fetch('https://chatbot-xumtech-production.up.railway.app/api/admin/questions', {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        return;
      }
      
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Error cargando preguntas:', error);
    }
  };

  fetchQuestions();
}, [getAuthHeaders, handleSessionExpired]);

  // Carga estadísticas de uso del chatbot
  const fetchStats = async () => {
    try {
      const response = await fetch('https://chatbot-xumtech-production.up.railway.app/api/admin/stats', {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        return;
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Exporta conversaciones a archivo CSV
  const exportData = async () => {
    try {
      const response = await fetch('https://chatbot-xumtech-production.up.railway.app/api/admin/export', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        return;
      }

      // Procesa respuesta como archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'conversaciones-xumtech.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando datos:', error);
      alert('No se pudo exportar los datos');
    }
  };

  // Crea nueva pregunta
  const addQuestion = async () => {
    if (!newQuestion.question || !newQuestion.keywords || !newQuestion.answer) {
      alert('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://chatbot-xumtech-production.up.railway.app/api/admin/questions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newQuestion)
      });

      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        return;
      }

      if (response.ok) {
        setNewQuestion({ question: '', keywords: '', answer: '' });
        // Recarga lista actualizada
        const updatedResponse = await fetch('https://chatbot-xumtech-production.up.railway.app/api/admin/questions', {
          headers: getAuthHeaders()
        });
        const updatedData = await updatedResponse.json();
        setQuestions(updatedData.questions || []);
        alert('Pregunta agregada exitosamente!');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al agregar pregunta');
      }
    } catch (error) {
      alert('Error al agregar pregunta');
    }
    setLoading(false);
  };

  // Inicia edición de pregunta existente
  const startEdit = (question) => {
    setEditingQuestion({
      id: question.id,
      question: question.question,
      keywords: question.keywords,
      answer: question.answer
    });
  };

  // Cancela edición en curso
  const cancelEdit = () => {
    setEditingQuestion(null);
  };

  // Actualiza pregunta editada
  const updateQuestion = async () => {
    if (!editingQuestion.question || !editingQuestion.keywords || !editingQuestion.answer) {
      alert('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://chatbot-xumtech-production.up.railway.app/api/admin/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          question: editingQuestion.question,
          keywords: editingQuestion.keywords,
          answer: editingQuestion.answer
        })
      });

      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        return;
      }

      if (response.ok) {
        setEditingQuestion(null);
        // Recarga lista actualizada
        const updatedResponse = await fetch('https://chatbot-xumtech-production.up.railway.app/api/admin/questions', {
          headers: getAuthHeaders()
        });
        const updatedData = await updatedResponse.json();
        setQuestions(updatedData.questions || []);
        alert('Pregunta actualizada exitosamente!');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar pregunta');
      }
    } catch (error) {
      alert('Error al actualizar pregunta');
    }
    setLoading(false);
  };

  // Elimina pregunta con confirmación
  const deleteQuestion = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta pregunta?')) return;

    try {
      const response = await fetch(`https://chatbot-xumtech-production.up.railway.app/api/admin/questions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        return;
      }

      if (response.ok) {
        // Recarga lista actualizada
        const updatedResponse = await fetch('https://chatbot-xumtech-production.up.railway.app/api/admin/questions', {
          headers: getAuthHeaders()
        });
        const updatedData = await updatedResponse.json();
        setQuestions(updatedData.questions || []);
        alert('Pregunta eliminada exitosamente!');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al eliminar pregunta');
      }
    } catch (error) {
      alert('Error al eliminar pregunta');
    }
  };

  return (
    <div className={`admin-overlay ${darkMode ? 'dark' : 'light'}`}>
      <div className={`admin-panel ${darkMode ? 'dark' : 'light'}`}>
        {/* Header con navegación */}
        <div className="admin-header">
          <h2>Panel de Administración</h2>
          <div className="admin-nav">
            <button 
              className={`nav-btn ${!showStats ? 'active' : ''}`}
              onClick={() => setShowStats(false)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon">
                <path d="M10 4H2v16h20V6H12l-2-2z" />
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
                <path d="M5 20h14v-2H5v2zm7-18l-5.5 6h4v6h3v-6h4L12 2z"/>
              </svg>
              Exportar
            </button>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="admin-content">
          {!showStats ? (
            <>
              {/* Formulario para crear nueva pregunta */}
              {!editingQuestion && (
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
              )}

              {/* Formulario de edición */}
              {editingQuestion && (
                <div className="add-question-section">
                  <h3>Editar Pregunta</h3>
                  <div className="form-group">
                    <label>Pregunta:</label>
                    <input
                      type="text"
                      value={editingQuestion.question}
                      onChange={(e) => setEditingQuestion({...editingQuestion, question: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Palabras Clave (separadas por coma):</label>
                    <input
                      type="text"
                      value={editingQuestion.keywords}
                      onChange={(e) => setEditingQuestion({...editingQuestion, keywords: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Respuesta:</label>
                    <textarea
                      value={editingQuestion.answer}
                      onChange={(e) => setEditingQuestion({...editingQuestion, answer: e.target.value})}
                      rows="3"
                    />
                  </div>
                  <div className="edit-buttons">
                    <button 
                      className="save-btn"
                      onClick={updateQuestion}
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={cancelEdit}
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de preguntas con acciones CRUD */}
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
                      <div className="question-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => startEdit(q)}
                          disabled={editingQuestion !== null}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                          </svg>
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteQuestion(q.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Dashboard de estadísticas y métricas */
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
                        <p>No hay preguntas sin respuesta</p>
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