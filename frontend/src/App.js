import React, { useState, useEffect } from 'react';
import FloatingChat from './FloatingChat';
import './App.css';
import AdminPanel from './AdminPanel';
import Login from './Login';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  // Verificar autenticación al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      // Verificar si el token sigue siendo válido
      fetch('https://chatbot-xumtech-production.up.railway.app/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(response => {
        if (response.ok) {
          setIsAuthenticated(true);
          setUser(JSON.parse(userData));
          setAuthToken(token);
        } else {
          // Token inválido, limpiar storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      })
      .catch(error => {
        console.error('Error verificando token:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      });
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleAdminClick = () => {
    if (isAuthenticated) {
      setShowAdmin(true);
    } else {
      setShowLogin(true);
    }
  };

  const handleLoginSuccess = (userData, token) => {
    setIsAuthenticated(true);
    setUser(userData);
    setAuthToken(token);
    setShowLogin(false);
    setShowAdmin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setAuthToken(null);
    setShowAdmin(false);
  };

  return (
    <div className={`App ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <header className="App-header">
        <div className="header-content">
          <div>
            <h1>XUMTECH</h1>
            <p>Experiencia Digital & Transformación</p>
          </div>
          <div className="header-buttons">
            <button 
              className="modern-btn admin-btn" 
              onClick={handleAdminClick}
              title="Panel de Administración"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
              <span className="btn-text">
                {isAuthenticated ? `Admin (${user?.username})` : 'Admin'}
              </span>
            </button>

            {isAuthenticated && (
              <button 
                className="modern-btn logout-btn" 
                onClick={handleLogout}
                title="Cerrar Sesión"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                  <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
                </svg>
                <span className="btn-text">Salir</span>
              </button>
            )}

            <button 
              className="modern-btn theme-btn" 
              onClick={toggleDarkMode}
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {darkMode ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                  <path d="M12,18.5A6.5,6.5 0 0,1 5.5,12A6.5,6.5 0 0,1 12,5.5A6.5,6.5 0 0,1 18.5,12A6.5,6.5 0 0,1 12,18.5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                  <path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.4 6.35,17.41C9.37,20.43 14,20.54 17.33,17.97Z"/>
                </svg>
              )}
              <span className="btn-text">{darkMode ? 'Claro' : 'Oscuro'}</span>
            </button>
          </div>
        </div>
      </header>
      
      <main>
        <div className="main-content">
          <h2>Especialistas en Customer Experience</h2>
          <p>Partner Oracle galardonado en Centroamérica y Caribe, especializado en transformación digital y experiencia de cliente desde 2015.</p>
          <p>¿Tienes preguntas sobre nuestros servicios CX, CRM o implementaciones Oracle? Nuestro asistente está aquí para ayudarte.</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21V9M19,9H14V4H5V19H19V9Z"/>
                </svg>
              </div>
              <h3>Customer Experience</h3>
              <p>Estrategias CX y omnicanalidad</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </div>
              <h3>Oracle Cloud</h3>
              <p>Implementaciones certificadas</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,18.5C7.83,18.5 4.5,15.17 4.5,11S7.83,3.5 12,3.5S19.5,6.83 19.5,11S16.17,18.5 12,18.5M12,2A9,9 0 0,0 3,11A9,9 0 0,0 12,20A9,9 0 0,0 21,11A9,9 0 0,0 12,2M17,8L12,13L7,8H17Z"/>
                </svg>
              </div>
              <h3>Transformación Digital</h3>
              <p>CRM, ERP y automatización</p>
            </div>
          </div>
        </div>
        
        <FloatingChat darkMode={darkMode} />
        
        {showLogin && (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            darkMode={darkMode}
          />
        )}
        
        {showAdmin && isAuthenticated && (
          <AdminPanel 
            darkMode={darkMode} 
            onClose={() => setShowAdmin(false)}
            authToken={authToken}
          />
        )}
      </main>
      
      <footer>
        <p>&copy; 2025 XUMTECH - Partner Oracle en Centroamérica</p>
      </footer>
    </div>
  );
}

export default App;