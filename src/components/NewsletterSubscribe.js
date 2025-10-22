import React, { useState } from 'react';
import './newsletter-subscribe.css';

const NewsletterSubscribe = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const formData = new FormData();
      formData.append('email', email);

      const response = await fetch(
        'https://buttondown.email/api/emails/embed-subscribe/mpaktiti',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="newsletter-subscribe">
      <div className="newsletter-content">
        <h3>📬 Enjoyed this post?</h3>
        <p>
          Subscribe to get notified when I publish new posts about books, tech, and life.
          No spam, just quality content (mostly).
        </p>

        {status === 'success' ? (
          <div className="newsletter-success">
            <p>
              ✨ <strong>Thanks for subscribing!</strong> Check your email to confirm your
              subscription.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="newsletter-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === 'loading'}
              className="newsletter-input"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="newsletter-button"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <div className="newsletter-error">
            <p>
              Oops! Something went wrong. Please try again or email me directly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterSubscribe;