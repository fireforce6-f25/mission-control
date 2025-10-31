import React, { useState } from 'react';

// Mock API for Fire Warden responses
const mockFireWardenAPI = async (message) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate mock responses based on keywords
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('status') || lowerMessage.includes('situation')) {
    return {
      type: 'text',
      content: 'Current situation analysis: We have 7 active fires across multiple sectors. Fire F-2 in Sector C is the primary concern due to increasing wind speeds. I recommend deploying additional drones to the northeast perimeter.'
    };
  }
  
  if (lowerMessage.includes('strategy') || lowerMessage.includes('plan')) {
    return {
      type: 'plan',
      content: 'I\'ve analyzed the situation and generated a tactical plan:',
      plan: {
        title: 'Sector C Reinforcement Strategy',
        actions: [
          'Redeploy Drones D-15, D-18, D-22, D-24 from Sector A to Sector C',
          'Position drones at coordinates: N42.5°, N43.1°, N43.7°, N44.2°',
          'Increase water drop frequency to every 90 seconds',
          'Establish firebreak along northeastern perimeter'
        ],
        impact: {
          containment: '40% faster containment',
          eta: '2.5 hours',
          successProbability: '87%'
        }
      }
    };
  }
  
  if (lowerMessage.includes('drone')) {
    return {
      type: 'text',
      content: 'Drone fleet status: 24 of 30 drones are currently active. Average battery level is 78%, average water capacity is 52%. Drones D-06 and D-04 will need to return for refueling within the next 15 minutes.'
    };
  }
  
  if (lowerMessage.includes('weather') || lowerMessage.includes('wind')) {
    return {
      type: 'text',
      content: 'Current weather conditions: Wind speed is 12 mph from the northeast. Forecast shows winds may increase to 18 mph within the next 2 hours. Temperature is 85°F with 15% humidity. These conditions favor rapid fire spread.'
    };
  }
  
  // Default response
  return {
    type: 'text',
    content: 'I understand your query. Based on current fire patterns and resource availability, I can provide strategic recommendations. Would you like me to analyze a specific sector or generate a comprehensive tactical plan?'
  };
};

// Fire Warden Chat Component
const FireWardenChatComponent = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'warden',
      content: 'Hello, I\'m Fire Warden, your AI tactical assistant. I can help you analyze fire situations, manage drone deployments, and create strategic plans. How can I assist you today?',
      timestamp: Date.now() - 120000,
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: inputValue,
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await mockFireWardenAPI(inputValue);
      
      const wardenMessage = {
        id: Date.now() + 1,
        sender: 'warden',
        content: response.content,
        timestamp: Date.now(),
        type: response.type,
        plan: response.plan
      };

      setMessages(prev => [...prev, wardenMessage]);
      
      if (response.type === 'plan') {
        setPendingPlan({ messageId: wardenMessage.id, ...response.plan });
      }
    } catch (error) {
      console.error('Error getting Fire Warden response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApprovePlan = (messageId) => {
    alert('Plan approved! (This would execute the plan via the backend)');
    setPendingPlan(null);
  };

  const handleRejectPlan = (messageId) => {
    alert('Plan rejected.');
    setPendingPlan(null);
  };

  const quickActions = [
    '🔥 Fire Status',
    '🚁 Drone Report',
    '📊 Generate Strategy',
    '⚡ Emergency Plan'
  ];

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: '#0a0e1a' }}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700" style={{ backgroundColor: '#1f2937' }}>
        <h2 className="text-2xl font-bold text-white">Fire Warden AI Assistant</h2>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#374151' }}>
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-sm text-white">Connected</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ backgroundColor: '#0d1119' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-2xl ${message.sender === 'user' ? 'ml-12' : 'mr-12'}`}>
              {message.sender === 'warden' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                    🤖
                  </div>
                  <span className="text-xs text-gray-400">Fire Warden • {formatTime(message.timestamp)}</span>
                </div>
              )}
              
              {message.sender === 'user' && (
                <div className="flex items-center justify-end gap-2 mb-2">
                  <span className="text-xs text-gray-400">Operator • {formatTime(message.timestamp)}</span>
                </div>
              )}

              <div
                className={`rounded-lg p-4 ${
                  message.sender === 'user'
                    ? 'bg-blue-900 text-white'
                    : 'text-white'
                }`}
                style={message.sender === 'warden' ? { backgroundColor: '#374151' } : {}}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>

                {/* Plan Card */}
                {message.type === 'plan' && message.plan && (
                  <div className="mt-4 rounded-lg border-2 border-cyan-400 p-4" style={{ backgroundColor: '#1f2937' }}>
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded" style={{ backgroundColor: '#374151' }}>
                      <span className="text-cyan-400 font-bold">📋 PROPOSED PLAN: {message.plan.title}</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-white mb-2">Actions:</p>
                        <ol className="space-y-1">
                          {message.plan.actions.map((action, idx) => (
                            <li key={idx} className="text-xs text-gray-300 ml-4">
                              {idx + 1}. {action}
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-white mb-2">Estimated Impact:</p>
                        <p className="text-xs text-green-400">
                          • {message.plan.impact.containment} | ETA: {message.plan.impact.eta} | Success probability: {message.plan.impact.successProbability}
                        </p>
                      </div>

                      {pendingPlan?.messageId === message.id && (
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleApprovePlan(message.id)}
                            className="flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-colors"
                            style={{ backgroundColor: '#00ff88', color: '#0a0e1a' }}
                          >
                            ✓ Approve & Execute
                          </button>
                          <button
                            onClick={() => handleRejectPlan(message.id)}
                            className="flex-1 py-2 px-4 rounded-lg font-bold text-white text-sm transition-colors"
                            style={{ backgroundColor: '#ff3b3b' }}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-2xl mr-12">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                  🤖
                </div>
                <span className="text-xs text-gray-400">Fire Warden is typing...</span>
              </div>
              <div className="rounded-lg p-4 flex gap-2" style={{ backgroundColor: '#374151' }}>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4" style={{ backgroundColor: '#1f2937' }}>
        {/* Quick Actions */}
        <div className="flex gap-2 mb-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => setInputValue(action.replace(/[🔥🚁📊⚡]\s/, ''))}
              className="px-3 py-1 rounded text-xs border border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 transition-colors"
              style={{ backgroundColor: '#374151' }}
            >
              {action}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message to Fire Warden..."
            className="flex-1 px-4 py-3 rounded-lg border border-gray-600 text-white text-sm focus:outline-none focus:border-cyan-400"
            style={{ backgroundColor: '#374151' }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 rounded-lg font-bold text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#00d4ff' }}
          >
            Send ➤
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2 text-right">Response time: ~2-3s</p>
      </div>
    </div>
  );
};

export default FireWardenChatComponent;