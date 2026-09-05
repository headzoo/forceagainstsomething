'use client';

import { useState } from 'react';

type ContactFormProps = {
  sent: boolean;
  error: string;
};

export function ContactForm({ sent, error }: ContactFormProps) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form className="contact-form" action="/api/contact" method="post" onSubmit={() => setSubmitting(true)}>
      <p className="step">DIRECT MESSAGE / 01</p>
      <h2>Write the note.</h2>
      <p className="form-intro">Messages go to contact@forceagainstsomething.com. Use the same form for listing updates, reporting broken links, or general questions.</p>

      {sent && <p className="form-success" role="status">Message sent. Thanks for reaching out.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-grid">
        <label>Name<input name="name" type="text" autoComplete="name" minLength={2} maxLength={120} required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      </div>

      <label>
        Topic
        <select name="topic" defaultValue="General">
          <option>General</option>
          <option>Correction</option>
          <option>Broken link</option>
          <option>Partnership</option>
          <option>Press</option>
        </select>
      </label>

      <label>Message<textarea name="message" minLength={10} maxLength={4000} rows={9} required /></label>

      <label className="contact-honeypot" aria-hidden="true">
        Website
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <button className="form-submit" type="submit" disabled={submitting} aria-busy={submitting}>
        {submitting ? 'SENDING MESSAGE' : 'SEND MESSAGE'} <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
