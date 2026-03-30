import React, { useState } from 'react';

const InteractionLayer = ({ streakCount, missedYesterday }) => {
  const [sessionState, setSessionState] = useState('active'); // 'active', 'exiting', 'completed'
  const [distractionReason, setDistractionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [reflection, setReflection] = useState({ rating: 0, notes: '' });

  // 3. Motivation & Feedback Messages
  const renderMessageBanner = () => {
    if (missedYesterday) {
      return (
        <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4 text-sm font-semibold">
          ⚠️ Your town was quiet yesterday! Complete a session today to prevent your progress from locking.
        </div>
      );
    }
    if (streakCount > 0) {
      return (
        <div className="bg-green-100 text-green-800 p-3 rounded-md mb-4 text-sm font-semibold">
          🔥 {streakCount}-Day Streak! You are building great habits. Keep it up!
        </div>
      );
    }
    return null;
  };

  // 1. Distraction Awareness Prompt
  const handleEarlyExitSubmit = () => {
    const payload = { category: distractionReason, custom: customReason };
    console.log("Saving Distraction Log to DB:", payload);
    // API call to save to distraction_logs table goes here
    setSessionState('active'); // Or redirect them to dashboard
  };

  if (sessionState === 'exiting') {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Wait! You're ending early.</h2>
        <p className="text-gray-600">Before you go, what pulled you away?</p>
        
        <div className="flex flex-wrap gap-2">
          {['📱 Social Media', '🗣️ Interruption', '🥱 Boredom', '🧠 Too Hard'].map(reason => (
            <button 
              key={reason}
              onClick={() => setDistractionReason(reason)}
              className={`px-3 py-1 rounded-full border ${distractionReason === reason ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              {reason}
            </button>
          ))}
        </div>
        
        <input 
          type="text" 
          placeholder="Other reason..." 
          className="w-full p-2 border rounded"
          value={customReason}
          onChange={(e) => { setDistractionReason('Other'); setCustomReason(e.target.value); }}
        />
        
        <div className="flex justify-between pt-4">
          <button onClick={() => setSessionState('active')} className="text-gray-500">Resume Session</button>
          <button onClick={handleEarlyExitSubmit} className="bg-red-500 text-white px-4 py-2 rounded">End & Save</button>
        </div>
      </div>
    );
  }

  // 2. Daily Reflection System
  if (sessionState === 'completed') {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4 text-center">
        <h2 className="text-2xl font-bold text-green-600">Session Complete! 🌱</h2>
        <p className="text-gray-600">Your garden is growing. How focused did you feel?</p>
        
        <div className="flex justify-center gap-4 text-3xl">
          {['😞', '😐', '🤩'].map((emoji, index) => (
            <button 
              key={emoji} 
              onClick={() => setReflection({...reflection, rating: index + 1})}
              className={`hover:scale-110 transition-transform ${reflection.rating === index + 1 ? 'scale-125 border-b-2 border-blue-500' : ''}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <textarea 
          placeholder="What did you accomplish? (Optional)" 
          className="w-full p-2 border rounded mt-2"
          onChange={(e) => setReflection({...reflection, notes: e.target.value})}
        />
        
        <button 
          onClick={() => console.log("Saving Reflection:", reflection)} 
          className="w-full bg-green-500 text-white px-4 py-2 rounded mt-4"
        >
          Save & View Progress
        </button>
      </div>
    );
  }

  // Default Active Timer View
  return (
    <div className="p-6 max-w-md mx-auto space-y-4 text-center">
      {renderMessageBanner()}
      <h1 className="text-4xl font-mono py-8">25:00</h1>
      <div className="flex justify-center gap-4">
        <button onClick={() => setSessionState('completed')} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Simulate Finish</button>
        <button onClick={() => setSessionState('exiting')} className="bg-red-100 text-red-600 px-6 py-2 rounded-lg">Stop Early</button>
      </div>
    </div>
  );
};

export default InteractionLayer;
