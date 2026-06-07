import { useState, useEffect, useRef } from 'react'
import { Container, Button, Row, Col, Badge, ListGroup, Modal } from 'react-bootstrap'
import { getNetwork, startGame, submitRoute } from '../api/api'
import NetworkMap from '../components/NetworkMap'

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

  // tieni i ref aggiornati ad ogni render
  useEffect(() => { routeRef.current = route; }, [route]);
  useEffect(() => { gameRef.current  = game;  }, [game]);

  useEffect(() => {
    getNetwork()
      .then(data => setNetwork(data))
      .catch(err => console.error(err));
  }, []);

  // funzione di submit separata che usa i ref — nessuna stale closure
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

  // timer
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

  // step 1: quando entra in execution, muovi il treno alla prima stazione dopo 800ms
  useEffect(() => {
    if (phase !== 'execution' || !routeValid || steps.length === 0) return;
    const t = setTimeout(() => setExecStep(1), 800);
    return () => clearTimeout(t);
  }, [phase, routeValid, steps]);

  // step 2: quando execStep cambia, mostra il popup dopo 700ms (tempo animazione treno)
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
  const availableSegments = network
    ? network.segments.filter(seg =>
        seg.from_id === lastStation || seg.to_id === lastStation
      )
    : [];

  return (
    <Container className="mt-4">
      <h2>🚇 Last Race</h2>

      {phase === 'setup' && (
        <>
          <p className="text-muted">Study the network map carefully before starting!</p>
          <NetworkMap network={network} showLines={true} />
          <div className="text-center mt-4">
            <Button
              size="lg"
              onClick={handleStartPlanning}
              style={{ backgroundColor: '#1a1a2e', border: '1px solid #fff', color: '#fff' }}
            >
              Start!
            </Button>
          </div>
        </>
      )}

      {phase === 'planning' && game && (
        <>
          <Row className="mb-3 align-items-center">
            <Col>
              <span className="me-3">🚉 From: <strong>{game.startStation.name}</strong></span>
              <span>🏁 To: <strong>{game.endStation.name}</strong></span>
            </Col>
            <Col className="text-end">
              <Badge bg={timeLeft <= 10 ? 'danger' : 'dark'} style={{ fontSize: '1.1em' }}>
                ⏱ {timeLeft}s
              </Badge>
            </Col>
          </Row>

          <Row>
            <Col md={8}>
              <NetworkMap
                network={network}
                showLines={false}
                highlightedRoute={route}
                startStationId={game.startStation.id}
                endStationId={game.endStation.id}
              />
            </Col>
            <Col md={4}>
              <h6>Your route:</h6>
              <p className="text-muted" style={{ fontSize: '0.85em' }}>
                {route.map(id => network.stations.find(s => s.id === id)?.name).join(' → ')}
              </p>

              <h6>Available segments:</h6>
              <ListGroup style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {availableSegments.map((seg, i) => (
                  <ListGroup.Item
                    key={i}
                    action
                    onClick={() => handleSegmentClick(seg.from_id, seg.to_id)}
                    style={{ cursor: 'pointer', fontSize: '0.85em' }}
                  >
                    {(() => {
                      const currentName = seg.from_id === lastStation ? seg.from_name : seg.to_name;
                      const nextName    = seg.from_id === lastStation ? seg.to_name   : seg.from_name;
                      return (
                        <>
                          <strong style={{ color: '#e67e22' }}>{currentName}</strong>
                          {' → '}
                          {nextName}
                        </>
                      );
                    })()}
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <div className="mt-3 d-flex gap-2">
                <Button variant="outline-secondary" size="sm" onClick={handleUndo}>
                  ↩ Undo
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  style={{ backgroundColor: '#1a1a2e', border: '1px solid #fff', color: '#fff' }}
                >
                  Submit Route
                </Button>
              </div>
            </Col>
          </Row>
        </>
      )}

      {phase === 'execution' && game && (
        <>
          <Row className="mb-3 align-items-center">
            <Col>
              <span className="me-3">🚉 From: <strong>{game.startStation.name}</strong></span>
              <span>🏁 To: <strong>{game.endStation.name}</strong></span>
            </Col>
            <Col className="text-end">
              <Badge bg="dark" style={{ fontSize: '1em' }}>
                🪙 {execStep > 0 ? steps[execStep - 1]?.coinsAfter : 20}
              </Badge>
            </Col>
          </Row>

          {!routeValid ? (
            <div className="text-center mt-5">
              <h4 className="text-danger">❌ Invalid or incomplete route!</h4>
              <p>You lose all your coins.</p>
              <Button
                className="mt-3"
                style={{ backgroundColor: '#1a1a2e', border: '1px solid #fff', color: '#fff' }}
                onClick={() => setPhase('result')}
              >
                See Result
              </Button>
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

              {/* POPUP EVENTO */}
              <Modal
                show={showEvent && !!steps[execStep - 1]}
                centered
                backdrop="static"
                keyboard={false}
              >
                {steps[execStep - 1] && (
                  <>
                    <Modal.Header style={{ background: '#1a1a2e', borderBottom: '1px solid #333', color: '#fff' }}>
                      <Modal.Title style={{ fontSize: '0.95em', color: '#888' }}>
                        {network.stations.find(s => s.id === steps[execStep - 1].fromStation)?.name}
                        {' ➔ '}
                        {network.stations.find(s => s.id === steps[execStep - 1].toStation)?.name}
                      </Modal.Title>
                    </Modal.Header>

                    <Modal.Body style={{ background: '#1a1a2e', color: '#fff', textAlign: 'center', padding: '2rem' }}>
                      <p style={{ fontSize: '1.1em', lineHeight: 1.6 }}>
                        {steps[execStep - 1].eventDescription}
                      </p>
                      <div style={{
                        fontSize: '2em',
                        fontWeight: 'bold',
                        color: steps[execStep - 1].eventEffect >= 0 ? '#2ecc71' : '#e74c3c',
                        margin: '1rem 0'
                      }}>
                        {steps[execStep - 1].eventEffect >= 0 ? '+' : ''}
                        {steps[execStep - 1].eventEffect} 🪙
                      </div>
                      <div style={{ color: '#aaa', fontSize: '0.95em' }}>
                        Total: <strong style={{ color: '#fff' }}>{steps[execStep - 1].coinsAfter} 🪙</strong>
                      </div>
                    </Modal.Body>

                    <Modal.Footer style={{ background: '#1a1a2e', borderTop: '1px solid #333', justifyContent: 'center' }}>
                      <Button
                        onClick={handleEventContinue}
                        style={{ backgroundColor: '#ffd700', border: 'none', color: '#1a1a2e', fontWeight: 'bold', padding: '0.5rem 2rem' }}
                      >
                        {execStep < steps.length ? 'Continue ➡' : 'See Result 🏁'}
                      </Button>
                    </Modal.Footer>
                  </>
                )}
              </Modal>

              {/* EVENT LOG */}
              {eventLog.length > 0 && (
                <div className="mt-4">
                  <h6 style={{ color: '#aaa' }}>Event Log</h6>
                  <Row className="g-2">
                    {eventLog.map((ev, i) => (
                      <Col key={i} xs={12} md={6} lg={4}>
                        <div
                          className="event-log-item p-2 rounded"
                          style={{ background: '#1a1a2e', border: '1px solid #333', fontSize: '0.82em', color: '#ccc' }}
                        >
                          <div style={{ color: '#666', marginBottom: '0.2rem' }}>
                            {network.stations.find(s => s.id === ev.fromStation)?.name}
                            {' → '}
                            {network.stations.find(s => s.id === ev.toStation)?.name}
                          </div>
                          <div style={{ marginBottom: '0.3rem' }}>{ev.eventDescription}</div>
                          <span style={{ fontWeight: 'bold', color: ev.eventEffect >= 0 ? '#2ecc71' : '#e74c3c' }}>
                            {ev.eventEffect >= 0 ? '+' : ''}{ev.eventEffect} 🪙
                          </span>
                          <span style={{ color: '#888', marginLeft: '0.5rem' }}>
                            → {ev.coinsAfter} 🪙
                          </span>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </>
          )}
        </>
      )}

      {phase === 'result' && game && (
        <div className="text-center mt-5">
          <h2>🏁 Race Complete!</h2>
          <p className="text-muted">
            {game.startStation.name} → {game.endStation.name}
          </p>

          <div style={{
            display: 'inline-block',
            background: '#1a1a2e',
            border: '1px solid #444',
            borderRadius: '18px',
            padding: '2rem 3rem',
            margin: '1.5rem 0'
          }}>
            <div style={{ fontSize: '0.9em', color: '#aaa', marginBottom: '0.5rem' }}>Final Score</div>
            <div style={{ fontSize: '3.5em', fontWeight: 'bold', color: '#ffd700' }}>
              {finalScore} 🪙
            </div>
          </div>

          {eventLog.length > 0 && (
            <div className="mt-3 text-start">
              <h6 style={{ color: '#aaa' }}>Event Log</h6>
              <Row className="g-2">
                {eventLog.map((ev, i) => (
                  <Col key={i} xs={12} md={6} lg={4}>
                    <div
                      className="event-log-item p-2 rounded"
                      style={{ background: '#1a1a2e', border: '1px solid #333', fontSize: '0.82em', color: '#ccc' }}
                    >
                      <div style={{ color: '#666', marginBottom: '0.2rem' }}>
                        {network.stations.find(s => s.id === ev.fromStation)?.name}
                        {' → '}
                        {network.stations.find(s => s.id === ev.toStation)?.name}
                      </div>
                      <div style={{ marginBottom: '0.3rem' }}>{ev.eventDescription}</div>
                      <span style={{ fontWeight: 'bold', color: ev.eventEffect >= 0 ? '#2ecc71' : '#e74c3c' }}>
                        {ev.eventEffect >= 0 ? '+' : ''}{ev.eventEffect} 🪙
                      </span>
                      <span style={{ color: '#888', marginLeft: '0.5rem' }}>
                        → {ev.coinsAfter} 🪙
                      </span>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          <div className="mt-4 d-flex gap-3 justify-content-center">
            <Button
              onClick={handleStartPlanning}
              style={{ backgroundColor: '#1a1a2e', border: '1px solid #fff', color: '#fff' }}
            >
              Play Again
            </Button>
            <Button
              as="a"
              href="/leaderboard"
              variant="warning"
            >
              🏆 Leaderboard
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}

export default GamePage;