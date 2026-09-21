import React, { useState } from 'react';
import { Quote } from 'lucide-react';

export default function PullQuote() {
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  const quotes = [
    {
      text: "“Every misconfigured device is a door left open. We make sure someone's watching all of them.”",
      context: "Foundational Principle &bull; NeuraComply Core Thesis"
    },
    {
      text: "“In sovereign infrastructure, compliance isn’t a quarterly checklist. It is an immutable state of the network graph.”",
      context: "Continuous Assurance &bull; Multi-Vendor Defense"
    },
    {
      text: "“Deterministic when the rules are clear. Transparently cautious when human judgment matters.”",
      context: "Confidence-Scored Triage &bull; Operator Alignment"
    }
  ];

  return (
    <section className="quote-section">
      <div className="container">
        <div className="quote-inner">
          <div style={{ display: 'inline-flex', marginBottom: '16px', color: 'var(--text-tertiary)' }}>
            <Quote size={28} strokeWidth={1.5} />
          </div>

          <blockquote className="pull-quote">
            {quotes[activeQuoteIndex].text}
          </blockquote>

          <div
            className="quote-attribution"
            dangerouslySetInnerHTML={{ __html: quotes[activeQuoteIndex].context }}
          />

          {/* Alternate Quote Switcher for pitch presentation */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
            {quotes.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveQuoteIndex(i)}
                style={{
                  width: i === activeQuoteIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: i === activeQuoteIndex ? 'var(--accent-primary)' : 'var(--border-strong)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 200ms ease'
                }}
                title={`Quote ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
