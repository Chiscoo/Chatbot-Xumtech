import React, { useState } from 'react';
import './Chatbot.css';

function Chatbot({ darkMode, isFloating = false }) {
  const [messages, setMessages] = useState([
  { text: '¡Hola! Soy XUMTECHBot, tu asistente virtual. ¿Tenés preguntas sobre nuestros servicios de Customer Experience o implementaciones Oracle?', sender: 'bot' }
]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (messageText = null) => {
  const textToSend = messageText || inputValue.trim();
  if (textToSend === '') return;

  // Agregar mensaje del usuario
  const userMessage = { text: textToSend, sender: 'user' };
  setMessages(prev => [...prev, userMessage]);
  
  setIsLoading(true);
  
  try {
    const response = await fetch('https://chatbot-xumtech-production.up.railway.app/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: textToSend })
    });
    
    const data = await response.json();
    
    // Validar que data.response sea un string válido
    const botResponse = typeof data.response === 'string' ? data.response : 'Error en la respuesta del servidor';
    
    // Agregar respuesta del bot
    const botMessage = { text: botResponse, sender: 'bot' };
    setMessages(prev => [...prev, botMessage]);
    
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = { text: 'Error al conectar con el servidor', sender: 'bot' };
    setMessages(prev => [...prev, errorMessage]);
  }
  
  setIsLoading(false);
  setInputValue('');
};

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleQuickAction = (keyword) => {
    if (isLoading) return;
    sendMessage(keyword);
  };

  const quickActions = [
    { label: 'Servicios', keyword: 'servicios' },
    { label: 'Contacto', keyword: 'contacto' },
    { label: 'Oracle', keyword: 'oracle' },
    { label: 'Empresa', keyword: 'empresa' },
    { label: 'Equipo', keyword: 'equipo' }
  ];

  return (
    <div className={`chatbot-container ${darkMode ? 'dark' : 'light'} ${isFloating ? 'floating' : ''}`}>
      <div className="chatbot-header">
        <h3>ChatBot Xumtech</h3>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <div className="message-bubble">
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-bubble typing">
              El bot está escribiendo...
            </div>
          </div>
        )}
      </div>

      {/* Botones de acciones rápidas */}
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
      
      <div className="chatbot-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu mensaje..."
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading || inputValue.trim() === ''}>
          Enviar
        </button>
      </div>
    </div>
  );
}

export default Chatbot;