import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, Bot, User } from 'lucide-react';

const AIAssist: React.FC = () => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', content: 'Hello! I\'m your AI security assistant. How can I help you today?' },
    { id: 2, type: 'user', content: 'Can you analyze the recent security incidents?' },
    { id: 3, type: 'bot', content: 'I\'ve analyzed the recent incidents. There are 3 active incidents with 1 high-severity SQL injection attempt that requires immediate attention.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { id: Date.now(), type: 'user', content: input }]);
      setInput('');
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          type: 'bot', 
          content: 'I\'m processing your request. This is a simulated response for demonstration purposes.' 
        }]);
      }, 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="portal-ai-assist-page portal-h-full portal-flex portal-flex-col"
    >
      <div className="portal-page-header portal-mb-6">
        <h1 className="portal-text-3xl portal-font-bold portal-mb-2">AI Security Assistant</h1>
        <p className="portal-text-secondary">Get intelligent insights and assistance for your security operations</p>
      </div>

      <div className="portal-ai-chat portal-flex-1 portal-bg-surface portal-rounded-lg portal-flex portal-flex-col">
        <div className="portal-chat-header portal-p-4 portal-border-b portal-flex portal-items-center portal-gap-3">
          <Brain size={24} className="portal-text-accent" />
          <h3 className="portal-text-lg portal-font-semibold">Security AI Assistant</h3>
          <div className="portal-status-indicator online portal-ml-auto"></div>
        </div>
        
        <div className="portal-chat-messages portal-flex-1 portal-p-4 portal-overflow-y-auto portal-space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`portal-message portal-flex ${message.type === 'user' ? 'portal-justify-end' : 'portal-justify-start'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`portal-message-content portal-max-w-md portal-p-3 portal-rounded-lg ${
                message.type === 'user' 
                  ? 'portal-bg-accent portal-text-white' 
                  : 'portal-bg-secondary portal-text-primary'
              }`}>
                <div className="portal-flex portal-items-center portal-gap-2 portal-mb-1">
                  {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                  <span className="portal-text-xs portal-font-semibold">
                    {message.type === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                </div>
                <p>{message.content}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="portal-chat-input portal-p-4 portal-border-t">
          <div className="portal-flex portal-gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me about security insights, threat analysis, or system recommendations..."
              className="portal-flex-1 portal-p-3 portal-border portal-rounded-lg portal-outline-none"
            />
            <button
              onClick={handleSend}
              className="portal-btn portal-btn-primary portal-px-4"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIAssist;
