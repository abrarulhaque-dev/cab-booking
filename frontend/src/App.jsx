import { useEffect, useState } from 'react';
import { api } from './api.js';

const CARS = [
  { id: 'STANDARD', label: 'Standard Cab', rate: 8 },
  { id: 'PRIME', label: 'Prime Sedan', rate: 15 },
  { id: 'PREMIUM', label: 'Premium Sedan', rate: 22 },
];
const JOURNEYS = [
  { id: 'SINGLE', label: 'Single' },
  { id: 'RETURN', label: 'Return' },
  { id: 'SPECIAL', label: 'Special needs' },
];
const CUSTOMER_FIELDS = [
  ['firstName', 'First name'], ['surname', 'Surname'], ['address', 'Address'], ['postcode', 'Postcode'],
  ['telephone', 'Telephone'], ['mobile', 'Mobile'], ['email', 'Email'],
];
const money = (n) => 'Rs ' + Number(n || 0).toFixed(2);

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    try {
      if (mode === 'register') {
        await api('/auth/register', { method: 'POST', body: f });
        setMode('login');
        setMsg({ ok: true, text: 'Account created. Log in to continue.' });
      } else {
        onLogin(await api('/auth/login', { method: 'POST', body: f }));
      }
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  return (
    <main className="auth">
      <form onSubmit={submit} className="panel">
        <h1>Cab Booking System</h1>
        <p className="muted">{mode === 'login' ? 'Log in to book a ride.' : 'Create an account to start booking.'}</p>
        <label>Username<input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoFocus /></label>
        <label>Password<input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        {msg && <p className={msg.ok ? 'note ok' : 'note err'}>{msg.text}</p>}
        <button className="primary">{mode === 'login' ? 'Log in' : 'Create account'}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg(null); }}>
          {mode === 'login' ? 'Need an account? Create one' : 'Have an account? Log in'}
        </button>
      </form>
    </main>
  );
}

const emptyCustomer = { firstName: '', surname: '', address: '', postcode: '', telephone: '', mobile: '', email: '' };
const emptyTrip = { pickup: '', dropoff: '', carType: 'STANDARD', journeyType: 'SINGLE', insurance: false, luggage: false };

function Booking({ session, onLogout }) {
  const { token, username } = session;
  const [locations, setLocations] = useState([]);
  const [customer, setCustomer] = useState(emptyCustomer);
  const [trip, setTrip] = useState(emptyTrip);
  const [pooling, setPooling] = useState(1);
  const [quote, setQuote] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  const loadHistory = () => api('/bookings', { token }).then(setHistory).catch(() => {});
  useEffect(() => { api('/locations').then(setLocations); loadHistory(); }, []);

  // Live fare: ask the backend whenever the trip changes.
  useEffect(() => {
    if (!trip.pickup || !trip.dropoff) return setQuote(null);
    api('/fare', { method: 'POST', body: trip, token }).then(setQuote).catch((e) => setError(e.message));
  }, [trip]);

  const setC = (k) => (e) => setCustomer({ ...customer, [k]: e.target.value });
  const setT = (k, v) => { setError(''); setTrip({ ...trip, [k]: v }); };

  async function book(e) {
    e.preventDefault();
    setError('');
    try {
      setReceipt(await api('/bookings', { method: 'POST', token, body: { ...customer, pooling: Number(pooling), trip } }));
      loadHistory();
    } catch (err) { setError(err.message); }
  }
  function reset() { setCustomer(emptyCustomer); setTrip(emptyTrip); setPooling(1); setQuote(null); setReceipt(null); setError(''); }

  return (
    <>
      <header className="top">
        <strong>Cab Booking System</strong>
        <span>{username} <button className="link" onClick={onLogout}>Log out</button></span>
      </header>
      <main className="grid">
        <form className="panel" onSubmit={book}>
          <h2>Customer</h2>
          <div className="fields">
            {CUSTOMER_FIELDS.map(([k, label]) => (
              <label key={k}>{label}<input value={customer[k]} onChange={setC(k)} type={k === 'email' ? 'email' : 'text'} /></label>
            ))}
          </div>

          <h2>Trip</h2>
          <div className="fields">
            <label>Pickup
              <select value={trip.pickup} onChange={(e) => setT('pickup', e.target.value)}>
                <option value="">Choose…</option>{locations.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label>Drop
              <select value={trip.dropoff} onChange={(e) => setT('dropoff', e.target.value)}>
                <option value="">Choose…</option>{locations.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label>Passengers sharing
              <select value={pooling} onChange={(e) => setPooling(e.target.value)}>{[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</select>
            </label>
          </div>

          <fieldset><legend>Car</legend>
            {CARS.map((c) => (
              <label key={c.id} className="choice">
                <input type="radio" name="car" checked={trip.carType === c.id} onChange={() => setT('carType', c.id)} />
                {c.label} <span className="muted">Rs {c.rate}/km</span>
              </label>
            ))}
          </fieldset>
          <fieldset><legend>Journey</legend>
            {JOURNEYS.map((j) => (
              <label key={j.id} className="choice">
                <input type="radio" name="journey" checked={trip.journeyType === j.id} onChange={() => setT('journeyType', j.id)} />{j.label}
              </label>
            ))}
          </fieldset>
          <fieldset><legend>Extras</legend>
            <label className="choice"><input type="checkbox" checked={trip.insurance} onChange={(e) => setT('insurance', e.target.checked)} />Travel insurance <span className="muted">Rs 10</span></label>
            <label className="choice"><input type="checkbox" checked={trip.luggage} onChange={(e) => setT('luggage', e.target.checked)} />Extra luggage <span className="muted">Rs 30</span></label>
          </fieldset>

          {error && <p className="note err">{error}</p>}
          <div className="actions">
            <button className="primary" disabled={!quote}>Book cab</button>
            <button type="button" onClick={reset}>Reset</button>
          </div>
        </form>

        <aside>
          <section className="meter" aria-live="polite">
            <p className="meter-label">Fare</p>
            <p className="meter-total">{quote ? money(quote.total) : 'Rs --.--'}</p>
            {quote ? (
              <dl>
                <dt>Distance</dt><dd>{quote.km} km</dd>
                <dt>Base charge</dt><dd>{money(quote.base)}</dd>
                <dt>Distance cost</dt><dd>{money(quote.distanceCost)}</dd>
                {quote.insurance > 0 && <><dt>Insurance</dt><dd>{money(quote.insurance)}</dd></>}
                {quote.luggage > 0 && <><dt>Luggage</dt><dd>{money(quote.luggage)}</dd></>}
                <dt>Sub total</dt><dd>{money(quote.subtotal)}</dd>
                <dt>Tax (9%)</dt><dd>{money(quote.tax)}</dd>
              </dl>
            ) : <p className="meter-hint">Choose a pickup and drop to see the fare.</p>}
          </section>

          {receipt && (
            <section className="panel receipt">
              <h2>Booked · Ref {receipt.ref}</h2>
              <dl>
                <dt>Cab no.</dt><dd>TR {receipt.ref} BW</dd>
                <dt>Name</dt><dd>{receipt.firstName} {receipt.surname}</dd>
                <dt>Route</dt><dd>{receipt.pickup} to {receipt.dropoff}</dd>
                <dt>Car</dt><dd>{CARS.find((c) => c.id === receipt.carType)?.label}</dd>
                <dt>Journey</dt><dd>{JOURNEYS.find((j) => j.id === receipt.journeyType)?.label}</dd>
                <dt>Sharing</dt><dd>{receipt.pooling}</dd>
                <dt>Total paid</dt><dd><strong>{money(receipt.total)}</strong></dd>
              </dl>
              <button onClick={() => window.print()}>Print receipt</button>
            </section>
          )}

          <section className="panel">
            <h2>Your bookings</h2>
            {history.length === 0 ? <p className="muted">No bookings yet. Your first one will show up here.</p> : (
              <ul className="history">
                {history.map((b) => (
                  <li key={b.id}><span>{b.ref} · {b.pickup} to {b.dropoff}</span><strong>{money(b.total)}</strong></li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </main>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  return session ? <Booking session={session} onLogout={() => setSession(null)} /> : <Auth onLogin={setSession} />;
}
