import React, { useState } from 'react';
import Chatbot from './Chatbot';
import './FloatingChat.css';

function FloatingChat({ darkMode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Botón flotante */}
      <div className={`floating-button ${darkMode ? 'dark' : 'light'}`} onClick={toggleChat}>
        {isOpen ? (
          <span className="close-icon">✕</span>
        ) : (
          <svg className="chat-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2M6,9V7H18V9H6M14,14V12H18V14H14M6,14V12H11V14H6Z"/>
          </svg>
        )}
        {!isOpen && <div className="notification-dot"></div>}
      </div>

      {/* Widget del chat */}
      <div className={`floating-chat-widget ${isOpen ? 'open' : 'closed'} ${darkMode ? 'dark' : 'light'}`}>
        <Chatbot darkMode={darkMode} isFloating={true} />
      </div>

      {/* Overlay para cerrar en mobile */}
      {isOpen && <div className="chat-overlay" onClick={toggleChat}></div>}
    </>
  );
}

export default FloatingChat;