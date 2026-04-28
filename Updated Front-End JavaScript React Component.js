import React, { useState } from 'react';

const InteractionLayer = ({ 
  streakCount, 
  environmentStatus, // 'active' or 'locked'
  unlockedElements,  // Array e.g., ['Cottage', 'Oak Tree', 'Well']
  userInsights       // Object from our SQL View: { completionRate: 75, topDistraction: '📱 Social Media' }
}) => {
  const [sessionState, setSessionState] = useState('dashboard'); // 'dashboard', 'active', 'exiting', 'completed'
  const [distractionReason, setDistractionReason] = useState('');

  // Behavioural Insights Panel
  const renderInsights = () => (
    <div className="bg-blue-50 p-4 rounded-lg mb-6 shadow-sm border border-blue-100">
      <h3 className="font-bold text-blue-800 mb-2">📊 Your Focus Insights</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Completion Rate</p>
          <p className={`font-bold ${userInsights.completionRate > 70 ? 'text-green-600' : 'text-red-600'}`}>
            {userInsights.completionRate}%
          </p>
        </div>
        <div>
          <p className="text-gray-500">Main Kryptonite</p>
          <p className="font-bold text-orange-600">{userInsights.topDistraction}</p>
        </div>
      </div>
    </div>
  );

  // Reward System Visualizer
  const renderEnvironment = () => (
    <div className={`p-4 rounded-lg mb-6 border-2 transition-all ${environmentStatus === 'locked' ? 'bg-gray-200 border-gray-400 grayscale' : 'bg-green-50 border-green-400'}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-gray-800">🏡 Your Town</h3>
        {environmentStatus === 'locked' && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">LOCKED</span>}
      </div>
      <p className="text-sm text-gray-600 mb-3">
        {environmentStatus === 'locked' 
          ? "You missed a day! Complete a session to unlock your town and resume building." 
          : "Your town is thriving. Keep focusing to unlock new items!"}
      </p>
      <div className="flex gap-2">
        {unlockedElements.map((el, i) => (
          <div key={i} className="bg-white px-3 py-1 rounded shadow-sm text-sm border">✨ {el}</div>
        ))}
      </div>
    </div>
  );

  // VIEW: Dashboard (Pre-Session)
  if (sessionState === 'dashboard') {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
        {renderEnvironment()}
        {renderInsights()}
        <button onClick={() => setSessionState('active')} className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700">
          Start Focus Session
        </button>
      </div>
    );
  }

  // VIEW: Active Timer
  if (sessionState === 'active') {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md text-center">
        <h1 className="text-5xl font-mono py-8 text-gray-800">25:00</h1>
        <div className="flex justify-center gap-4">
          <button onClick={() => setSessionState('completed')} className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold">Simulate Finish</button>
          <button onClick={() => setSessionState('exiting')} className="bg-red-100 text-red-600 px-6 py-2 rounded-lg font-semibold hover:bg-red-200">Stop Early</button>
        </div>
      </div>
    );
  }

  // VIEW: Early Exit (Distraction Prompt)
  if (sessionState === 'exiting') {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4 text-center">
        <h2 className="text-xl font-bold text-gray-800">Hold on!</h2>
        <p className="text-red-500 text-sm font-semibold border bg-red-50 p-2 rounded">
          Quitting now drops your completion rate below {userInsights.completionRate}% and halts your town's growth!
        </p>
        <p className="text-gray-600 pt-2">If you must go, what distracted you?</p>
        
        <div className="flex flex-wrap justify-center gap-2">
          {['📱 Social Media', '🗣️ Interruption', '🥱 Boredom', '🧠 Too Hard'].map(reason => (
            <button 
              key={reason} onClick={() => setDistractionReason(reason)}
              className={`px-3 py-1 rounded-full border ${distractionReason === reason ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {reason}
            </button>
          ))}
        </div>
        
        <div className="flex justify-between pt-6">
          <button onClick={() => setSessionState('active')} className="text-blue-600 font-semibold border border-blue-600 px-4 py-2 rounded">Resume Session</button>
          <button onClick={() => setSessionState('dashboard')} className="bg-red-500 text-white px-4 py-2 rounded font-semibold">End & Log Distraction</button>
        </div>
      </div>
    );
  }

  // VIEW: Completed (Reflection & Reward)
  if (sessionState === 'completed') {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4 text-center">
        <h2 className="text-2xl font-bold text-green-600">Focus Secured! 🏆</h2>
        <div className="bg-green-100 p-3 rounded text-green-800 text-sm font-bold border border-green-300">
          {environmentStatus === 'locked' ? '🔓 Town Unlocked!' : '🎁 You unlocked: 🌻 Sunflower'}
        </div>
        
        <p className="text-gray-600 mt-4">Log your reflection to claim your reward:</p>
        <div className="flex justify-center gap-4 text-3xl my-2">
          <button className="hover:scale-110 transition-transform">😞</button>
          <button className="hover:scale-110 transition-transform">😐</button>
          <button className="hover:scale-110 transition-transform">🤩</button>
        </div>

        <button 
          onClick={() => setSessionState('dashboard')} 
          className="w-full bg-blue-600 text-white px-4 py-3 rounded mt-4 font-bold"
        >
          Save & Return to Town
        </button>
      </div>
    );
  }
};

export default InteractionLayer;
