import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listings } from '../mock-data';
import './BookingDetail.css';

function BookingDetail() {
  const { id } = useParams();
  const listing = listings.find((l) => l.id === id) || listings[0];

  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [airtelPhone, setAirtelPhone] = useState('');
  const [bankData, setBankData] = useState({ cardNumber: '', expiry: '', cvc: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stkStep, setStkStep] = useState(0); // 0: form, 1: awaiting PIN, 2: confirmed
  const [countdown, setCountdown] = useState(15);
  const [errors, setErrors] = useState({});

  const bookingFee = 1000;
  const escrowHoldingDays = 3;

  useEffect(() => {
    let timer;
    if (stkStep === 1 && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (stkStep === 1 && countdown === 0) {
      setStkStep(2);
    }
    return () => clearTimeout(timer);
  }, [stkStep, countdown]);

  function handleFormChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  }

  function handleBankChange(e) {
    setBankData({ ...bankData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  }

  function validateForm() {
    const newErrors = {};
    if (!bookingDate) newErrors.date = 'Please pick a date';
    if (!bookingTime) newErrors.time = 'Please pick a time slot';
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Contact phone is required';

    if (paymentMethod === 'mpesa') {
      if (!mpesaPhone.trim() || mpesaPhone.length < 10) newErrors.mpesaPhone = 'Valid 10-digit M-Pesa number required';
    } else if (paymentMethod === 'airtel') {
      if (!airtelPhone.trim() || airtelPhone.length < 10) newErrors.airtelPhone = 'Valid 10-digit Airtel number required';
    } else if (paymentMethod === 'bank') {
      if (!bankData.cardNumber.trim() || bankData.cardNumber.length < 16) newErrors.cardNumber = 'Valid 16-digit card number required';
      if (!bankData.expiry.trim()) newErrors.expiry = 'Required';
      if (!bankData.cvc.trim() || bankData.cvc.length < 3) newErrors.cvc = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (paymentMethod === 'mpesa' || paymentMethod === 'airtel') {
        setCountdown(15);
        setStkStep(1);
      } else {
        setStkStep(2);
      }
    }, 1200);
  }

  const formatCurrency = (amount) => `KES ${amount.toLocaleString()}`;
  const activeWalletNumber = paymentMethod === 'mpesa' ? mpesaPhone : airtelPhone;

  // ---- CONFIRMATION STATE ----
  if (stkStep === 2) {
    return (
      <div className="booking-page">
        <div className="booking-confirm">
          <div className="booking-confirm-icon">✓</div>
          <h2>Viewing Booked &amp; Payment Verified</h2>
          <p>
            Your viewing for <strong>{listing.title}</strong> is confirmed for {formData.name}.
            A confirmation has been sent to {formData.email}.
          </p>

          <div className="booking-receipt-card">
            <h3>Booking Receipt</h3>
            <div className="booking-receipt-row"><span>Property</span><span>{listing.title}</span></div>
            <div className="booking-receipt-row"><span>Date &amp; Time</span><span>{bookingDate} at {bookingTime}</span></div>
            <div className="booking-receipt-row">
              <span>Paid via</span>
              <span>{paymentMethod === 'bank' ? 'Card' : `${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Airtel Money'} (${activeWalletNumber})`}</span>
            </div>
            <div className="booking-receipt-row"><span>Reference</span><span>NH-{Math.floor(100000 + Math.random() * 900000)}</span></div>
            <div className="booking-receipt-total"><span>Amount Held in Escrow</span><span>{formatCurrency(bookingFee)}</span></div>
          </div>

          <p className="booking-confirm-note">
            Funds are held in escrow for up to {escrowHoldingDays} days and only released to the
            landlord once you confirm the property matches the listing.
          </p>

          <Link to="/dashboard" className="booking-confirm-link">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  // ---- AWAITING STK PUSH STATE ----
  if (stkStep === 1) {
    return (
      <div className="booking-page">
        <div className="booking-stk">
          <div className="booking-spinner"></div>
          <h3>Check Your Phone</h3>
          <p>
            A payment request for <strong>{formatCurrency(bookingFee)}</strong> was sent to{' '}
            <strong>{activeWalletNumber}</strong>. Enter your PIN to confirm.
          </p>
          <div className="booking-countdown">{countdown}s</div>
          <div className="booking-stk-actions">
            <button onClick={() => setStkStep(2)}>Simulate PIN Success</button>
            <button className="booking-stk-cancel" onClick={() => setStkStep(0)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- MAIN FORM STATE ----
  return (
    <div className="booking-page">
      <div className="booking-header">
        <h1>Book a Viewing</h1>
        <p>Secure your slot with a fully refundable escrow deposit.</p>
      </div>

      <form onSubmit={handleSubmit} className="booking-grid">
        <div className="booking-left">
          <div className="booking-property-card">
            <div className="booking-property-image"></div>
            <div className="booking-property-body">
              <span className="booking-eyebrow">Viewing Target</span>
              <h3>{listing.title}</h3>
              <p>{listing.location.area}, {listing.location.city}</p>
            </div>
          </div>

          <div className="booking-section">
            <h2><span className="booking-step-badge">1</span> Select Date &amp; Time</h2>
            <div className="booking-field-row">
              <label>
                Viewing date
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => { setBookingDate(e.target.value); if (errors.date) setErrors({ ...errors, date: '' }); }}
                  className={errors.date ? 'has-error' : ''}
                />
                {errors.date && <span className="booking-error">{errors.date}</span>}
              </label>
              <label>
                Time slot
                <select
                  value={bookingTime}
                  onChange={(e) => { setBookingTime(e.target.value); if (errors.time) setErrors({ ...errors, time: '' }); }}
                  className={errors.time ? 'has-error' : ''}
                >
                  <option value="">Choose a slot</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
                {errors.time && <span className="booking-error">{errors.time}</span>}
              </label>
            </div>
          </div>

          <div className="booking-section">
            <h2><span className="booking-step-badge">2</span> Your Information</h2>
            <label>
              Full name
              <input name="name" value={formData.name} onChange={handleFormChange} placeholder="Jane Wanjiru" className={errors.name ? 'has-error' : ''} />
              {errors.name && <span className="booking-error">{errors.name}</span>}
            </label>
            <div className="booking-field-row">
              <label>
                Email
                <input name="email" type="email" value={formData.email} onChange={handleFormChange} placeholder="jane@example.com" className={errors.email ? 'has-error' : ''} />
                {errors.email && <span className="booking-error">{errors.email}</span>}
              </label>
              <label>
                Phone
                <input name="phone" type="tel" value={formData.phone} onChange={handleFormChange} placeholder="0712345678" className={errors.phone ? 'has-error' : ''} />
                {errors.phone && <span className="booking-error">{errors.phone}</span>}
              </label>
            </div>
            <label>
              Notes (optional)
              <textarea name="notes" rows="3" value={formData.notes} onChange={handleFormChange} placeholder="Anything the landlord should know..."></textarea>
            </label>
          </div>

          <div className="booking-section">
            <h2><span className="booking-step-badge">3</span> Payment Method</h2>
            <div className="booking-method-grid">
              <button type="button" className={paymentMethod === 'mpesa' ? 'is-active' : ''} onClick={() => setPaymentMethod('mpesa')}>M-Pesa</button>
              <button type="button" className={paymentMethod === 'airtel' ? 'is-active' : ''} onClick={() => setPaymentMethod('airtel')}>Airtel Money</button>
              <button type="button" className={paymentMethod === 'bank' ? 'is-active' : ''} onClick={() => setPaymentMethod('bank')}>Card</button>
            </div>

            {paymentMethod === 'mpesa' && (
              <label>
                M-Pesa number
                <input type="tel" maxLength="10" value={mpesaPhone} onChange={(e) => { setMpesaPhone(e.target.value); if (errors.mpesaPhone) setErrors({ ...errors, mpesaPhone: '' }); }} placeholder="0712345678" className={errors.mpesaPhone ? 'has-error' : ''} />
                {errors.mpesaPhone && <span className="booking-error">{errors.mpesaPhone}</span>}
              </label>
            )}

            {paymentMethod === 'airtel' && (
              <label>
                Airtel Money number
                <input type="tel" maxLength="10" value={airtelPhone} onChange={(e) => { setAirtelPhone(e.target.value); if (errors.airtelPhone) setErrors({ ...errors, airtelPhone: '' }); }} placeholder="0733123456" className={errors.airtelPhone ? 'has-error' : ''} />
                {errors.airtelPhone && <span className="booking-error">{errors.airtelPhone}</span>}
              </label>
            )}

            {paymentMethod === 'bank' && (
              <>
                <label>
                  Card number
                  <input name="cardNumber" maxLength="16" value={bankData.cardNumber} onChange={handleBankChange} placeholder="4111 2222 3333 4444" className={errors.cardNumber ? 'has-error' : ''} />
                  {errors.cardNumber && <span className="booking-error">{errors.cardNumber}</span>}
                </label>
                <div className="booking-field-row">
                  <label>
                    Expiry
                    <input name="expiry" maxLength="5" value={bankData.expiry} onChange={handleBankChange} placeholder="MM/YY" className={errors.expiry ? 'has-error' : ''} />
                    {errors.expiry && <span className="booking-error">{errors.expiry}</span>}
                  </label>
                  <label>
                    CVC
                    <input name="cvc" type="password" maxLength="4" value={bankData.cvc} onChange={handleBankChange} placeholder="123" className={errors.cvc ? 'has-error' : ''} />
                    {errors.cvc && <span className="booking-error">{errors.cvc}</span>}
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="booking-escrow">
          <h2>Booking Summary</h2>
          <div className="booking-summary-row"><span>Property</span><span>{listing.title}</span></div>
          <div className="booking-summary-row"><span>Date</span><span>{bookingDate || '—'}</span></div>
          <div className="booking-summary-row"><span>Time</span><span>{bookingTime || '—'}</span></div>
          <div className="booking-summary-total"><span>Total (held in escrow)</span><span>{formatCurrency(bookingFee)}</span></div>

          <div className="booking-escrow-note">
            <p className="booking-escrow-note-title">How Escrow Protects You</p>
            <p>Your deposit is held securely and only released to the landlord after your viewing is confirmed.</p>
          </div>

          <button type="submit" className="booking-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing…' : `Pay ${formatCurrency(bookingFee)} & Book Viewing`}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BookingDetail;