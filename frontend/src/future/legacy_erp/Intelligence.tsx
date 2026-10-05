import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon } from 'lucide-react';
import api from '../shared/api';
import './Intelligence.css';

interface Message {
  id: string;
  type: 'user' | 'system';
  content: string;
  answer?: any;
}

const Intelligence = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', type: 'system', content: 'Hello! I am your EVOLIX Intelligence Assistant. Ask me anything about your business.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAsk = async (question: string) => {
    if (!question.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), type: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/intelligence/ask', { question });
      
      const sysMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: data.success ? data.answer.summary : (data.error || 'I could not process that request.'),
        answer: data
      };
      
      setMessages(prev => [...prev, sysMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: err.response?.data?.message || 'A network or server error occurred.'
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="intelligence-container">
      <div className="intelligence-header">
        <h1>Ask your business a question</h1>
        <p className="text-muted">Instant answers powered by your ERP data.</p>
      </div>

      <div className="quick-actions">
        <button className="quick-action-btn" onClick={() => handleAsk("What is the supplier outstanding?")}>Supplier Outstanding</button>
        <button className="quick-action-btn" onClick={() => handleAsk("Show open purchase orders")}>Open Purchases</button>
        <button className="quick-action-btn" onClick={() => handleAsk("What are the pending receipts?")}>Pending Receipts</button>
        <button className="quick-action-btn" onClick={() => handleAsk("Purchase summary")}>Purchase Summary</button>
      </div>

      <div className="intelligence-chat">
        <div className="chat-history" ref={scrollRef}>
          {messages.map(msg => (
            <div key={msg.id} className={`chat-message ${msg.type}`}>
              <div className="flex items-center gap-2 mb-2 text-sm opacity-70">
                {msg.type === 'system' ? <Bot size={16} /> : <UserIcon size={16} />}
                <span>{msg.type === 'system' ? 'EVOLIX AI' : 'You'}</span>
              </div>
              <div>{msg.content}</div>
              
              {msg.answer?.success && msg.answer.answer && (
                <div className="answer-card">
                  <div className="text-muted text-sm uppercase tracking-wider">{msg.answer.answer.headline}</div>
                  <div className="answer-value">
                    {msg.answer.answer.currency ? `${msg.answer.answer.currency} ` : ''}
                    {msg.answer.answer.value}
                  </div>
                  
                  {msg.answer.sources && msg.answer.sources.length > 0 && (
                    <div className="source-lineage">
                      <div className="mb-2 font-semibold">Source Records ({msg.answer.sources.length}):</div>
                      {msg.answer.sources.map((src: any) => (
                        <div key={src.id} className="source-item">
                          <span>{src.label}</span>
                          <span className="source-ref">{src.reference}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-message system">
              <div className="flex items-center gap-2 text-sm opacity-70">
                <Bot size={16} /> EVOLIX AI
              </div>
              <div className="mt-2">Analyzing...</div>
            </div>
          )}
        </div>
        
        <form className="chat-input-area" onSubmit={(e) => { e.preventDefault(); handleAsk(input); }}>
          <input 
            type="text" 
            className="chat-input" 
            placeholder="Type your question here..." 
            value={input} 
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="chat-btn" disabled={!input.trim() || loading}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Intelligence;

