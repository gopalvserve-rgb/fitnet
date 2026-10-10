'use client';
import { useState } from 'react';

const BUDGETS = [
  ['under-20l', 'Under ₹20 Lakh'],
  ['20l-50l', '₹20 – 50 Lakh'],
  ['50l-1cr', '₹50 Lakh – 1 Cr'],
  ['above-1cr', 'Above ₹1 Cr'],
];

export default function EnquiryForm({ defaultDestination = '', note = '' }) {
  const [state, setState] = useState({ status: 'idle', errors: {}, message: '' });

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    for (const k of Object.keys(data)) if (data[k] === '') delete data[k];
    if (data.guests) data.guests = Number(data.guests);
    if (note) data.message = data.message ? `${data.message}\n\n${note}` : note;

    setState({ status: 'loading', errors: {}, message: '' });
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        form.reset();
        return setState({ status: 'success', errors: {}, message: 'Thank you! Our wedding specialist will call you within 24 hours.' });
      }
      const errors = Object.fromEntries((body.details || []).map((d) => [d.field, d.message]));
      setState({ status: 'error', errors, message: body.error === 'Validation failed' ? 'Please check the highlighted fields.' : body.error || 'Something went wrong.' });
    } catch {
      setState({ status: 'error', errors: {}, message: 'Network error, please try again.' });
    }
  }

  const err = (f) => state.errors[f];
  const fieldProps = (f) => ({ id: `f-${f}`, name: f, 'aria-invalid': err(f) ? 'true' : undefined, 'aria-describedby': err(f) ? `e-${f}` : undefined });
  const Error = ({ f }) => (err(f) ? <div className="field__error" id={`e-${f}`}>{err(f)}</div> : null);

  return (
    <form className="form-wrap" onSubmit={onSubmit} noValidate aria-label="Wedding enquiry form">
      {state.message && (
        <div role={state.status === 'success' ? 'status' : 'alert'} className={`alert alert--${state.status === 'success' ? 'success' : 'error'}`}>
          {state.message}
        </div>
      )}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="f-name">Your name *</label>
          <input {...fieldProps('name')} required minLength={2} maxLength={80} autoComplete="name" />
          <Error f="name" />
        </div>
        <div className="field">
          <label htmlFor="f-phone">Phone *</label>
          <input {...fieldProps('phone')} type="tel" required maxLength={20} autoComplete="tel" placeholder="+91" />
          <Error f="phone" />
        </div>
        <div className="field">
          <label htmlFor="f-email">Email *</label>
          <input {...fieldProps('email')} type="email" required maxLength={254} autoComplete="email" />
          <Error f="email" />
        </div>
        <div className="field">
          <label htmlFor="f-destination">Destination *</label>
          <select {...fieldProps('destination')} required defaultValue={defaultDestination}>
            <option value="" disabled>Select destination</option>
            <option value="jim-corbett">Jim Corbett</option>
            <option value="delhi-ncr">Delhi NCR</option>
            <option value="undecided">Help me decide</option>
          </select>
          <Error f="destination" />
        </div>
        <div className="field">
          <label htmlFor="f-wedding_date">Wedding date</label>
          <input {...fieldProps('wedding_date')} type="date" />
          <Error f="wedding_date" />
        </div>
        <div className="field">
          <label htmlFor="f-guests">Number of guests</label>
          <input {...fieldProps('guests')} type="number" min={1} max={5000} inputMode="numeric" />
          <Error f="guests" />
        </div>
        <div className="field full">
          <label htmlFor="f-budget">Approximate budget</label>
          <select {...fieldProps('budget')} defaultValue="">
            <option value="">Prefer not to say</option>
            {BUDGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="f-message">Tell us about your dream wedding</label>
          <textarea {...fieldProps('message')} maxLength={2000} />
          <Error f="message" />
        </div>
        <div className="hp" aria-hidden="true">
          <label htmlFor="f-website">Website</label>
          <input id="f-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="full">
          <button className="btn" type="submit" disabled={state.status === 'loading'}>
            {state.status === 'loading' ? 'Sending…' : 'Send Enquiry'}
          </button>
        </div>
      </div>
    </form>
  );
}
