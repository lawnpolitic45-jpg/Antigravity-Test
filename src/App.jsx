import React, { useState, useEffect } from 'react';
import './index.css';

const ENV = {
  GAS_URL: import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL,
  THRESHOLD: parseInt(import.meta.env.VITE_PASS_THRESHOLD || '3'),
  Q_COUNT: parseInt(import.meta.env.VITE_QUESTION_COUNT || '5')
};

function App() {
  const [screen, setScreen] = useState('HOME');
  const [playerId, setPlayerId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatars, setAvatars] = useState([]);

  useEffect(() => {
    const preloadImage = (src) => {
      const img = new Image();
      img.src = src;
    };
    
    // Generate static valid Dicebear URLs
    const generatedAvatars = Array.from({ length: 100 }, (_, i) => 
      `https://api.dicebear.com/7.x/pixel-art/svg?seed=Boss_${i}&backgroundColor=transparent`
    ).sort(() => 0.5 - Math.random());

    generatedAvatars.forEach(preloadImage);
    setAvatars(generatedAvatars);
  }, []);

  const handleStart = async () => {
    if (!playerId.trim()) return alert('PLEASE INSERT YOUR ID!');
    setScreen('LOADING');

    try {
      const res = await fetch(ENV.GAS_URL || 'http://localhost:3000/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'GET_QUESTIONS', count: ENV.Q_COUNT })
      });
      const data = await res.json();
      
      if (data.success) {
        setQuestions(data.questions);
        setScreen('GAME');
        setCurrentQIndex(0);
        setAnswers([]);
      } else {
        alert('ERROR GETTING DATA: ' + data.error);
        setScreen('HOME');
      }
    } catch(err) {
      console.log('Error hitting GAS, using mock data for demo visual purposes.');
      // MOCK DATA FOR BROWSER RUN VISUALS
      setQuestions([
        {
          questionId: 1, question: "MOCK QUESTION 1?", options: { A: "Opt 1", B: "Opt 2", C: "Opt 3", D: "Opt 4" }
        },
        {
          questionId: 2, question: "MOCK QUESTION 2?", options: { A: "100", B: "200", C: "300" }
        }
      ]);
      setScreen('GAME');
      setCurrentQIndex(0);
      setAnswers([]);
    }
  };

  const handleAnswer = async (optKey) => {
    const currentQ = questions[currentQIndex];
    const newAnswers = [...answers, { questionId: currentQ.questionId, answer: optKey }];
    
    if (currentQIndex < questions.length - 1) {
      setAnswers(newAnswers);
      setCurrentQIndex(currentQIndex + 1);
      return;
    } 
    
    setIsSubmitting(true);
    setScreen('LOADING');

    try {
      const res = await fetch(ENV.GAS_URL || 'http://localhost:3000/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
          action: 'SUBMIT_ANSWERS', 
          id: playerId,
          answers: newAnswers,
          passThreshold: ENV.THRESHOLD
        })
      });
      const data = await res.json();
      
      setIsSubmitting(false);
      if (data.success) {
        setResult(data);
        setScreen('RESULT');
      } else {
        alert('SERVER ERROR: ' + data.error);
        setScreen('HOME');
      }
    } catch(e) {
      console.log('Error hitting GAS, showing mock result.');
      setTimeout(() => {
        setIsSubmitting(false);
        setResult({ 
          passed: true, 
          score: 1,
          evaluations: [
            { questionId: 1, yourAnswer: 'A', isCorrect: false, correctAnswer: 'B' },
            { questionId: 2, yourAnswer: 'B', isCorrect: true, correctAnswer: 'B' }
          ]
        });
        setScreen('RESULT');
      }, 1000);
    }
  };

  return (
    <div className="arcade-container">
      {screen === 'HOME' && (
        <>
          <h1 className="blink" style={{ color: 'var(--primary)', marginBottom: '50px' }}>
            PIXEL QUIZ QUEST
          </h1>
          <p style={{ marginBottom: '20px' }}>INSERT COIN <br/><br/> (TYPE YOUR ID)</p>
          <input 
            className="pixel-input" 
            placeholder="PLAYER_1"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
          <button className="pixel-btn" onClick={handleStart}>START GAME</button>
        </>
      )}

      {screen === 'LOADING' && (
        <div style={{ paddingTop: '50px' }}>
          <h2>{isSubmitting ? 'CALCULATING SCORE...' : 'LOADING STAGE...'}</h2>
          <div className="blink" style={{ marginTop: '30px' }}>PLEASE WAIT</div>
        </div>
      )}

      {screen === 'GAME' && questions.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--primary)' }}>ID: {playerId}</span>
            <span>STAGE: {currentQIndex + 1} / {questions.length}</span>
          </div>
          
          <div className="enemy-container">
             <img src={avatars[currentQIndex % avatars.length]} alt="BOSS" className="enemy-img" />
          </div>

          <div className="question-box">
             {questions[currentQIndex].question}
          </div>

          <div className="options-grid">
            {Object.entries(questions[currentQIndex].options).map(([key, value]) => (
              value ? (
                <button 
                  key={key} 
                  className="pixel-btn" 
                  style={{ textAlign: 'left', margin: '0' }}
                  onClick={() => handleAnswer(key)}
                >
                  <span style={{ color: 'var(--primary)' }}>{key}. </span> {value}
                </button>
              ) : null
            ))}
          </div>
        </>
      )}

      {screen === 'RESULT' && result && (
        <div style={{ paddingTop: '20px' }}>
          <h1 style={{ color: result.passed ? '#66fcf1' : 'var(--accent)', marginBottom: '30px' }}>
            {result.passed ? 'STAGE CLEARED!' : 'GAME OVER'}
          </h1>
          
          <div style={{ margin: '30px 0', fontSize: '1.1rem', lineHeight: '2' }}>
            <p>SCORE: <span style={{ color: 'var(--primary)' }}>{result.score}</span> / {questions.length}</p>
            <p>PASS TARGET: {ENV.THRESHOLD}</p>
          </div>

          {result.evaluations && (
            <div className="review-section" style={{ textAlign: 'left', marginTop: '30px', maxHeight: '350px', overflowY: 'auto', borderTop: '2px solid var(--primary)', paddingTop: '20px' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--primary)' }}>--- 考核回顾 ---</h3>
              {result.evaluations.map((ev, idx) => {
                 const q = questions.find(q => q.questionId === ev.questionId);
                 if (!q) return null;
                 return (
                   <div key={idx} className="review-item" style={{ border: `2px solid ${ev.isCorrect ? '#66fcf1' : 'var(--accent)'}` }}>
                     <p style={{ margin: '0 0 10px 0', color: '#fff' }}>{idx + 1}. {q.question}</p>
                     
                     <p style={{ margin: '5px 0', color: ev.isCorrect ? '#66fcf1' : 'var(--accent)' }}>
                       {ev.isCorrect ? '✅ 你的回答: ' : '❌ 你的回答: '} {ev.yourAnswer}. {q.options[ev.yourAnswer]}
                     </p>
                     
                     {!ev.isCorrect && (
                       <p style={{ margin: '5px 0', color: '#f2a900' }}>
                         🎯 正确答案: {ev.correctAnswer}. {q.options[ev.correctAnswer]}
                       </p>
                     )}
                   </div>
                 )
              })}
            </div>
          )}

          <button className="pixel-btn" onClick={() => setScreen('HOME')}>PLAY AGAIN</button>
        </div>
      )}
    </div>
  );
}

export default App;
