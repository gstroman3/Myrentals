'use client';

import { useState, useEffect, FormEvent } from 'react';
import Image from 'next/image';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    subject: '',
    body: '',
  });
  const [view, setView] = useState<'options' | 'email'>('options');

  useEffect(() => {
    if (open) setView('options');
  }, [open]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const mailto = `mailto:g.stroman3@gmail.com?subject=${encodeURIComponent(
      form.subject
    )}&body=${encodeURIComponent(
      form.body +
        `\n\nFrom: ${form.firstName} ${form.lastName}\nEmail: ${form.email}`
    )}`;
    window.location.href = mailto;
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <Image
          src="/images/logo_transparent.png"
          alt="Stroman Properties logo"
          width={160}
          height={40}
          className="modal-logo"
        />
        {view === 'options' ? (
          <>
            <button className="btn" onClick={() => setView('email')}>
              Email
            </button>
            <p className="or-text">--OR--</p>
            <a
              href="tel:7039948444"
              className="btn call-btn"
              onClick={onClose}
            >
              Call
            </a>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <div className="name-fields">
              <input
                type="text"
                placeholder="First Name"
                required
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Last Name"
                required
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
              />
            </div>
            <input
              type="text"
              placeholder="Subject"
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <textarea
              placeholder="Body"
              required
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
            <button type="submit">Send Email</button>
          </form>
        )}
      </div>
    </div>
  );
}

