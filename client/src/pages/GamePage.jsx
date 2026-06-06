import { useState, useEffect, useRef } from 'react'
import { Container, Button, Row, Col, Badge, ListGroup } from 'react-bootstrap'
import { getNetwork, startGame, submitRoute } from '../api/api'
import NetworkMap from '../components/NetworkMap'

function GamePage() {
  
  const [network, setNetwork] = useState(null);
  const [phase, setPhase] = useState('setup');
  const [game, setGame] = useState(null);
  const [route, setRoute] = useState([]);
  const [timeLeft, setTimeLeft] = useState(90);
  const timerRef = useRef(null);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [finalScore, setFinalScore] = useState(null);
  const [routeValid, setRouteValid] = useState(null);

  useEffect(() => {
    getNetwork()
      .then(data => setNetwork(data))
      .catch(err => console.error(err));
  }, []);

  // timer
  useEffect(() => {
    if (phase !== 'planning') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleStartPlanning = async () => {
    try {
      const newGame = await startGame();
      setGame(newGame);
      setRoute([newGame.startStation.id]);
      setTimeLeft(90);
      setPhase('planning');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSegmentClick = (fromId, toId) => {
    // il segmento deve partire dall'ultima stazione del percorso
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

  const handleSubmit = async () => {
  clearInterval(timerRef.current);
  try {
    const result = await submitRoute(game.gameId, route);
    setRouteValid(result.valid);
    setFinalScore(result.score);
    setSteps(result.steps || []);
    setPhase('execution');
  } catch (err) {
    console.error(err);
  }
};

  // segmenti disponibili: quelli che partono o arrivano all'ultima stazione
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
              <span className="me-3">
                🚉 From: <strong>{game.startStation.name}</strong>
              </span>
              <span>
                🏁 To: <strong>{game.endStation.name}</strong>
              </span>
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

      {phase === 'execution' && (
        <>
          <Row className="mb-3">
            <Col>
              <span className="me-3">
                🚉 From: <strong>{game.startStation.name}</strong>
              </span>
              <span>
                🏁 To: <strong>{game.endStation.name}</strong>
              </span>
            </Col>
          </Row>

          {!routeValid
            ? (
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
            )
            : (
              <Row>
                <Col md={8}>
                  <NetworkMap
                    network={network}
                    showLines={true}
                    highlightedRoute={route.slice(0, currentStep + 2)}
                  />
                </Col>
                <Col md={4}>
                  <h6>🪙 Coins: <strong>{currentStep === 0 ? 20 : steps[currentStep - 1]?.coinsAfter}</strong></h6>
                  <ListGroup style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {steps.slice(0, currentStep).map((step, i) => (
                      <ListGroup.Item key={i} style={{ fontSize: '0.85em' }}>
                        <div>
                          <strong>
                            {network.stations.find(s => s.id === step.fromStation)?.name}
                            {' → '}
                            {network.stations.find(s => s.id === step.toStation)?.name}
                          </strong>
                        </div>
                        <div className="text-muted">{step.eventDescription}</div>
                        <div>
                          <Badge bg={step.eventEffect >= 0 ? 'success' : 'danger'}>
                            {step.eventEffect >= 0 ? '+' : ''}{step.eventEffect} 🪙
                          </Badge>
                          <span className="ms-2">→ {step.coinsAfter} 🪙</span>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>

                  {currentStep < steps.length
                    ? (
                      <Button
                        className="mt-3 w-100"
                        style={{ backgroundColor: '#1a1a2e', border: '1px solid #fff', color: '#fff' }}
                        onClick={() => setCurrentStep(s => s + 1)}
                      >
                        Next Step ➡
                      </Button>
                    )
                    : (
                      <Button
                        className="mt-3 w-100"
                        style={{ backgroundColor: '#1a1a2e', border: '1px solid #fff', color: '#fff' }}
                        onClick={() => setPhase('result')}
                      >
                        See Result 🏁
                      </Button>
                    )
                  }
                </Col>
              </Row>
            )
          }
        </>
      )}

      {phase === 'result' && (
        <p>Result phase — coming soon</p>
      )}
    </Container>
  );
}

export default GamePage;