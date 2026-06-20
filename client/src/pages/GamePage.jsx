import { useState, useEffect, useRef } from 'react'
import { Modal } from 'react-bootstrap'
import { getNetwork, startGame, submitRoute } from '../api/api'
import NetworkMap from '../components/NetworkMap'
import { useNavigate } from 'react-router-dom'
import { BiSolidCoin } from "react-icons/bi";
import { IoMdTrain } from "react-icons/io";

function GamePage() {
  const [network, setNetwork] = useState(null);
  const [phase, setPhase] = useState('setup');
  const [game, setGame] = useState(null);
  const [route, setRoute] = useState([]);
  const [timeLeft, setTimeLeft] = useState(90);
  const [steps, setSteps] = useState([]);
  const [finalScore, setFinalScore] = useState(null);
  const [routeValid, setRouteValid] = useState(null);
  const [execStep, setExecStep] = useState(0);
  const [showEvent, setShowEvent] = useState(false);
  const [closingEvent, setClosingEvent] = useState(false);
  const [eventLog, setEventLog] = useState([]);

  const timerRef = useRef(null);
  const routeRef = useRef([]);
  const gameRef  = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { routeRef.current = route; }, [route]);
  useEffect(() => { gameRef.current  = game;  }, [game]);

  useEffect(() => {
    getNetwork()
      .then(data => setNetwork(data))
      .catch(err => console.error(err));
  }, []);

  const doSubmit = async (currentRoute, currentGame) => {
    clearInterval(timerRef.current);
    if (!currentGame) return;
    try {
      const result = await submitRoute(currentGame.gameId, currentRoute);
      setRouteValid(result.valid);
      setFinalScore(result.score);
      setSteps(result.steps || []);
      setExecStep(0);
      setPhase('execution');
    } catch (err) {
      console.error(err);
    }
  };
 
  useEffect(() => {
    if (phase !== 'planning') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          doSubmit(routeRef.current, gameRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'execution' || !routeValid || steps.length === 0) return;
    const t = setTimeout(() => setExecStep(1), 800);
    return () => clearTimeout(t);
  }, [phase, routeValid, steps]);

  useEffect(() => {
    if (phase !== 'execution' || execStep === 0 || !routeValid) return;
    const t = setTimeout(() => setShowEvent(true), 700);
    return () => clearTimeout(t);
  }, [execStep, phase, routeValid]);

  const handleStartPlanning = async () => {
    try {
      const newGame = await startGame();
      setGame(newGame);
      setRoute([newGame.startStation.id]);
      setTimeLeft(90);
      setSteps([]);
      setFinalScore(null);
      setRouteValid(null);
      setExecStep(0);
      setShowEvent(false);
      setClosingEvent(false);
      setEventLog([]);
      setPhase('planning');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSegmentClick = (fromId, toId) => {
    const lastStation = route[route.length - 1];
    if (fromId === lastStation)
      setRoute(r => [...r, toId]);
    else if (toId === lastStation)
      setRoute(r => [...r, fromId]);
  };

  const handleUndo = () => {
    if (route.length > 1)
      setRoute(r => r.slice(0, -1));
  };

  const handleSubmit = () => {
    doSubmit(routeRef.current, gameRef.current);
  };

  const handleEventContinue = () => {
    setClosingEvent(true);
    setTimeout(() => {
      setEventLog(log => [...log, steps[execStep - 1]]);
      setClosingEvent(false);
      setShowEvent(false);
      if (execStep < steps.length) {
        setTimeout(() => setExecStep(s => s + 1), 400);
      } else {
        setTimeout(() => setPhase('result'), 600);
      }
    }, 250);
  };

  const lastStation = route[route.length - 1];

  const usedSegmentKeys = new Set();
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    usedSegmentKeys.add(`${a}-${b}`);
    usedSegmentKeys.add(`${b}-${a}`);
  }

  const availableSegments = network
    ? network.segments.filter(seg => {
        const touchesLastStation = seg.from_id === lastStation || seg.to_id === lastStation;
        const key = `${seg.from_id}-${seg.to_id}`;
        return touchesLastStation && !usedSegmentKeys.has(key);
      })
    : [];

  const currentStep = steps[execStep - 1];

  return (
    <div style={{ padding: '2rem 2.5rem' }}>

      {/* ===== SETUP ===== */}
      {phase === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '0.25rem' }}><IoMdTrain /> Last Race</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
              Study the network carefully before starting
            </p>
          </div>
          <NetworkMap network={network} showLines={true} />
          <button className="btn btn-gold" style={{ fontSize: '1em', padding: '0.6rem 2.5rem' }} onClick={handleStartPlanning}>
            Start →
          </button>
        </div>
      )}

      {/* ===== PLANNING ===== */}
      {phase === 'planning' && game && (
        <>
          {/* header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9em' }}>
              <span style={{ color: 'var(--text-muted)' }}>From <strong style={{ color: 'var(--text)' }}>{game.startStation.name}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>To <strong style={{ color: 'var(--text)' }}>{game.endStation.name}</strong></span>
            </div>
            <span className={`timer-badge ${timeLeft <= 10 ? 'danger' : ''}`}>
              ⏱ {timeLeft}s
            </span>
          </div>

          {/* layout */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            {/* map */}
            <div style={{ flex: 1 }}>
              <NetworkMap
                network={network}
                showLines={false}
                highlightedRoute={route}
                startStationId={game.startStation.id}
                endStationId={game.endStation.id}
              />
            </div>

            {/* sidebar */}
            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* current route */}
              <div className="card-dark" style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.7em', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Your route
                </p>
                <p style={{ fontSize: '0.82em', color: 'var(--text)', margin: 0, lineHeight: 1.7 }}>
                  {route.map(id => network.stations.find(s => s.id === id)?.name).join(' → ')}
                </p>
              </div>

              {/* segments */}
              <div>
                <p style={{ fontSize: '0.7em', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Available segments
                </p>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {availableSegments.map((seg, i) => {
                    const currentName = seg.from_id === lastStation ? seg.from_name : seg.to_name;
                    const nextName    = seg.from_id === lastStation ? seg.to_name   : seg.from_name;
                    return (
                      <div
                        key={i}
                        className="segment-item"
                        onClick={() => handleSegmentClick(seg.from_id, seg.to_id)}
                      >
                        <strong style={{ color: 'var(--accent)' }}>{currentName}</strong>
                        <span style={{ color: 'var(--text-muted)' }}> → </span>
                        <span>{nextName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-ghost" style={{ fontSize: '0.82em', padding: '0.4rem 0.9rem', flex: 1 }} onClick={handleUndo}>
                  ↩ Undo
                </button>
                <button className="btn btn-gold" style={{ fontSize: '0.82em', padding: '0.4rem 0.9rem', flex: 1 }} onClick={handleSubmit}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== EXECUTION ===== */}
      {phase === 'execution' && game && (
        <>
          {/* header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9em' }}>
              <span style={{ color: 'var(--text-muted)' }}>From <strong style={{ color: 'var(--text)' }}>{game.startStation.name}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>To <strong style={{ color: 'var(--text)' }}>{game.endStation.name}</strong></span>
            </div>
            <span className="timer-badge">
              <BiSolidCoin /> {execStep > 0 ? steps[execStep - 1]?.coinsAfter : 20}
            </span>
          </div>

          {!routeValid ? (
            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
              <h4 style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>❌ Invalid or incomplete route</h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>You lose all your coins.</p>
              <button className="btn btn-ghost" onClick={() => setPhase('result')}>See Result</button>
            </div>
          ) : (
            <>
              <NetworkMap
                network={network}
                showLines={false}
                startStationId={game.startStation.id}
                endStationId={game.endStation.id}
                executionRoute={route}
                executionStep={execStep}
              />

              {/* EVENT MODAL */}
              <Modal show={showEvent && !!currentStep} centered backdrop="static" keyboard={false}>
                {currentStep && (
                  <>
                    <Modal.Header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                      <Modal.Title style={{ fontSize: '0.85em', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {network.stations.find(s => s.id === currentStep.fromStation)?.name}
                        {' ➔ '}
                        {network.stations.find(s => s.id === currentStep.toStation)?.name}
                      </Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ background: 'var(--bg-card)', textAlign: 'center', padding: '2rem 2.5rem' }}>
                      <p style={{ fontSize: '1.05em', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                        {currentStep.eventDescription}
                      </p>
                      <div style={{
                        fontSize: '2.5em',
                        fontWeight: 700,
                        color: currentStep.eventEffect >= 0 ? 'var(--success)' : 'var(--danger)',
                        letterSpacing: '-0.02em',
                        marginBottom: '0.5rem'
                      }}>
                        {currentStep.eventEffect >= 0 ? '+' : ''}{currentStep.eventEffect} <BiSolidCoin />
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9em', margin: 0 }}>
                        Total: <strong style={{ color: 'var(--text)' }}>{currentStep.coinsAfter} <BiSolidCoin /></strong>
                      </p>
                    </Modal.Body>
                    <Modal.Footer style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', justifyContent: 'center' }}>
                      <button className="btn btn-gold" style={{ padding: '0.5rem 2.5rem' }} onClick={handleEventContinue}>
                        {execStep < steps.length ? 'Continue →' : 'See Result 🏁'}
                      </button>
                    </Modal.Footer>
                  </>
                )}
              </Modal>

              {/* EVENT LOG */}
              {eventLog.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <p style={{ fontSize: '0.7em', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Event Log
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
                    {eventLog.map((ev, i) => (
                      <div key={i} className="event-log-item">
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78em', marginBottom: '0.3rem' }}>
                          {network.stations.find(s => s.id === ev.fromStation)?.name}
                          {' → '}
                          {network.stations.find(s => s.id === ev.toStation)?.name}
                        </div>
                        <div style={{ marginBottom: '0.4rem', lineHeight: 1.5 }}>{ev.eventDescription}</div>
                        <span style={{ fontWeight: 600, color: ev.eventEffect >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {ev.eventEffect >= 0 ? '+' : ''}{ev.eventEffect} <BiSolidCoin />
                        </span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem', fontSize: '0.85em' }}>
                          → {ev.coinsAfter} <BiSolidCoin />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ===== RESULT ===== */}
      {phase === 'result' && game && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginTop: '3rem' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '0.25rem' }}>🏁 Race Complete</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9em', margin: 0 }}>
              {game.startStation.name} → {game.endStation.name}
            </p>
          </div>

          <div className="score-card">
            <div className="label">Final Score</div>
            <div className="value">{finalScore} <BiSolidCoin /></div>
          </div>

          {eventLog.length > 0 && (
            <div style={{ width: '100%' }}>
              <p style={{ fontSize: '0.7em', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Event Log
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
                {eventLog.map((ev, i) => (
                  <div key={i} className="event-log-item">
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78em', marginBottom: '0.3rem' }}>
                      {network.stations.find(s => s.id === ev.fromStation)?.name}
                      {' → '}
                      {network.stations.find(s => s.id === ev.toStation)?.name}
                    </div>
                    <div style={{ marginBottom: '0.4rem', lineHeight: 1.5 }}>{ev.eventDescription}</div>
                    <span style={{ fontWeight: 600, color: ev.eventEffect >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {ev.eventEffect >= 0 ? '+' : ''}{ev.eventEffect} <BiSolidCoin />
                    </span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem', fontSize: '0.85em' }}>
                      → {ev.coinsAfter} <BiSolidCoin />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-ghost" onClick={handleStartPlanning}>
              Play Again
            </button>
            <button className="btn btn-gold" onClick={() => navigate('/leaderboard')}>
              Leaderboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GamePage;
