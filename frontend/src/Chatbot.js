import React, { useState } from 'react';
import './Chatbot.css';

function Chatbot({ darkMode, isFloating = false }) {
  const [messages, setMessages] = useState([
  { text: '¡Hola! Soy el asistente virtual de XUMTECH. ¿Tienes preguntas sobre nuestros servicios de Customer Experience o implementaciones Oracle?', sender: 'bot' }
]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (inputValue.trim() === '') return;

    // Agregar mensaje del usuario
    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    
    try {
      const response = await fetch('https://chatbot-xumtech-production.up.railway.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputValue })
      });
      
      const data = await response.json();
      
      // Agregar respuesta del bot
      const botMessage = { text: data.response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
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