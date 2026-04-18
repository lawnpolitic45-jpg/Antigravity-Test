import React, { useState, useEffect } from 'react';
import './index.css';

const ENV = {
  GAS_URL: import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL
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
  const [coinCount, setCoinCount] = useState(5);
  const [totalTime, setTotalTime] = useState(0);
  const [qTime, setQTime] = useState(0);
  const [runTimer, setRunTimer] = useState(false);
  const [maxCoins, setMaxCoins] = useState(0);

  useEffect(() => {
    const fetchMax = async () => {
      try {
        const res = await fetch(ENV.GAS_URL || 'http://localhost:3000/mock', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'GET_TOTAL_COUNT' })
        });
        const data = await res.json();
        if (data.success && data.total) {
          setMaxCoins(data.total);
        } else {
          setMaxCoins(99); 
        }
      } catch(e) {
        setMaxCoins(15);
      }
    };
    fetchMax();
  }, []);

  useEffect(() => {
    let interval;
    if (screen === 'GAME' && runTimer) {
      interval = setInterval(() => {
        setTotalTime(t => t + 1);
        setQTime(qt => qt + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [screen, runTimer]);

  useEffect(() => {
    setQTime(0);
  }, [currentQIndex]);

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
    setTotalTime(0);
    setQTime(0);

    const finalCoinCount = (coinCount === '' || coinCount < 5) ? 5 : coinCount;

    try {
      const res = await fetch(ENV.GAS_URL || 'http://localhost:3000/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'GET_QUESTIONS', count: finalCoinCount })
      });
      const data = await res.json();
      
      if (data.success) {
        setQuestions(data.questions);
        setScreen('GAME');
        setCurrentQIndex(0);
        setAnswers([]);
        setRunTimer(true);
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
      setRunTimer(true);
    }
  };

  const handleAnswer = async (optKey) => {
    const currentQ = questions[currentQIndex];
    const existingIndex = answers.findIndex(a => a.questionId === currentQ.questionId);
    let newAnswers = [...answers];
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = { questionId: currentQ.questionId, answer: optKey };
    } else {
      newAnswers.push({ questionId: currentQ.questionId, answer: optKey });
    }
    setAnswers(newAnswers);
    
    if (newAnswers.length === questions.length) {
      setRunTimer(false);
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
            totalTime: totalTime
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
    } else {
      const nextUnansweredIdx = questions.findIndex(q => !newAnswers.some(a => a.questionId === q.questionId));
      if (nextUnansweredIdx !== -1) {
        setCurrentQIndex(nextUnansweredIdx);
      }
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCoinChange = (e) => {
    let val = e.target.value === '' ? '' : parseInt(e.target.value);
    if (val !== '' && maxCoins > 0 && val > maxCoins) val = maxCoins;
    setCoinCount(val);
  };
  
  const handleCoinBlur = () => {
    if (coinCount === '' || coinCount < 5) setCoinCount(5);
  };

  const isGameMode = screen === 'GAME' && questions.length > 0;

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: isGameMode ? '1fr auto 1fr' : '1fr', 
      alignItems: 'center', 
      gap: '30px',
      width: '100vw',
      boxSizing: 'border-box',
      padding: '0 20px'
    }}>
      {isGameMode && (
        <div style={{
          gridColumn: '1',
          justifySelf: 'end',
          background: '#1f2833',
          border: 'var(--border-size) solid var(--primary)',
          padding: '20px',
          boxShadow: '10px 10px 0px 0px rgba(102, 252, 241, 0.4), inset 0px 0px 20px rgba(0,0,0,0.8)',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '10px'
        }}>
          {questions.map((q, idx) => {
            const isAnswered = answers.some(a => a.questionId === q.questionId);
            return (
              <button
                key={q.questionId}
                onClick={() => setCurrentQIndex(idx)}
                style={{
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  background: isAnswered ? 'var(--primary-hover)' : 'transparent',
                  border: '2px solid var(--primary)',
                  color: isAnswered ? '#fff' : 'var(--primary)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      )}

      <div className="arcade-container" style={{ gridColumn: isGameMode ? '2' : '1' }}>
      {screen === 'HOME' && (
        <>
          <h1 className="blink" style={{ color: 'var(--primary)', marginBottom: '50px' }}>
            PIXEL QUIZ QUEST
          </h1>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              INSERT 
              <input
                type="number"
                min="5"
                max={maxCoins > 0 ? maxCoins : undefined}
                value={coinCount}
                onChange={handleCoinChange}
                onBlur={handleCoinBlur}
                className="pixel-input"
                style={{ width: '80px', margin: '0', padding: '10px' }}
              />
              COINS = {coinCount === '' ? 5 : coinCount} QUESTIONS
            </div>
            {maxCoins > 0 && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '10px' }}>
                (MAX = {maxCoins})
              </div>
            )}
          </div>
          <p style={{ marginBottom: '30px' }}>(TYPE YOUR ID)</p>
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
          <div style={{ position: 'absolute', top: '10px', left: '10px', textAlign: 'left', color: '#fff' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{formatTime(totalTime)}</div>
            <div style={{ fontSize: '0.8rem' }}>{formatTime(qTime)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', fontSize: '0.8rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '5px' }}>ID: {playerId}</div>
              <div>STAGE: {currentQIndex + 1} / {questions.length}</div>
            </div>
          </div>
          
          <div key={currentQIndex} className="enemy-container animate-bounce">
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
            <p>SCORE: <span style={{ color: 'var(--primary)' }}>{result.score}</span> / {questions.length} ({parseFloat(((result.score / questions.length) * 100).toFixed(1))}%)</p>
            <p>TOTAL TIME: {formatTime(totalTime)}</p>
          </div>

          {result.evaluations && (
            <div className="review-section" style={{ textAlign: 'left', marginTop: '30px', maxHeight: '350px', overflowY: 'auto', borderTop: '2px solid var(--primary)', paddingTop: '20px' }}>
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

      {isGameMode && <div style={{ gridColumn: '3' }} />}
    </div>
  );
}

export default App;
