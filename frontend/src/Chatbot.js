import React, { useState } from 'react';
import './Chatbot.css';

/**
 * Componente principal del chatbot XUMTECH
 * Maneja la interfaz de conversación y comunicación con el backend
 */

function Chatbot({ darkMode, isFloating = false }) {
  // Estado de la conversación
  const [messages, setMessages] = useState([
    { 
      text: '¡Hola! Soy XUMTECHBot, tu asistente virtual. ¿Tenés preguntas sobre nuestros servicios de Customer Experience o implementaciones Oracle?', 
      sender: 'bot' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Botones de acceso rápido 
  const quickActions = [
    { label: 'Servicios', keyword: 'servicios' },
    { label: 'Contacto', keyword: 'contacto' },
    { label: 'Oracle', keyword: 'oracle' },
    { label: 'Empresa', keyword: 'empresa' },
    { label: 'Equipo', keyword: 'equipo' }
  ];

  // Función principal para envío de mensajes
  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || inputValue.trim();
    if (textToSend === '') return;

    // Muestra mensaje del usuario inmediatamente
    const userMessage = { text: textToSend, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    
    try {
      // Envia mensaje al servidor para procesamiento
      const response = await fetch('https://chatbot-xumtech-backend.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      });
      
      const data = await response.json();
      
      // Valida respuesta del servidor
      const botResponse = typeof data.response === 'string' 
        ? data.response 
        : 'Error en la respuesta del servidor';
      
      // Muestra respuesta del bot
      const botMessage = { text: botResponse, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Error comunicación servidor:', error);
      const errorMessage = { 
        text: 'Error al conectar con el servidor', 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsLoading(false);
    setInputValue('');
  };

  // Maneja envío con tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Procesa clics en botones de acceso rápido
  const handleQuickAction = (keyword) => {
    if (isLoading) return;
    sendMessage(keyword);
  };

  return (
    <div className={`chatbot-container ${darkMode ? 'dark' : 'light'} ${isFloating ? 'floating' : ''}`}>
      {/* Header del chatbot */}
      <div className="chatbot-header">
        <h3>ChatBot Xumtech</h3>
      </div>
      
      {/* Área de mensajes con scroll automático */}
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <div className="message-bubble">
              {message.text}
            </div>
          </div>
        ))}
        
        {/* Indicador de escritura */}
        {isLoading && (
          <div className="message bot">
            <div className="message-bubble typing">
              El bot está escribiendo...
            </div>
          </div>
        )}
      </div>

      {/* Botones de preguntas frecuentes */}
      <div className="quick-actions">
        <div className="quick-actions-label">Preguntas frecuentes:</div>
        <div className="quick-actions-buttons">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quick-action-btn"
              onClick={() => handleQuickAction(action.keyword)}
              disabled={isLoading}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Campo de entrada y botón de envío */}
      <div className="chatbot-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu mensaje..."
          disabled={isLoading}
        />
        <button 
          onClick={() => sendMessage()} 
          disabled={isLoading || inputValue.trim() === ''}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

export default Chatbot;