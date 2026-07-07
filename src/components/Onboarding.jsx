import { useState } from 'react'

const STEPS = [
  { icon: '🏠', title: 'Welcome to Home Maintenance', body: '' },
  { icon: '🔍', title: 'Find trusted local workers in Zimbabwe', body: '' },
  {
    icon: '🤝',
    title:
      'Connect with vetted grass cutters, maids, garden boys, tree fellers and more — right in your area',
    body: '',
  },
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const last = step === STEPS.length - 1

  return (
    <div className="onboarding">
      <button className="onboarding-skip" onClick={onDone}>
        Skip
      </button>
      <div className="onboarding-card">
        <div className="onboarding-icon">{STEPS[step].icon}</div>
        <h2 className="onboarding-title">{STEPS[step].title}</h2>
      </div>
      <div className="onboarding-dots">
        {STEPS.map((_, i) => (
          <button
            key={i}
            className={'dot' + (i === step ? ' active' : '')}
            onClick={() => setStep(i)}
            aria-label={'Step ' + (i + 1)}
          />
        ))}
      </div>
      <button className="btn btn-light onboarding-next" onClick={() => (last ? onDone() : setStep(step + 1))}>
        {last ? 'Get Started' : 'Next'}
      </button>
    </div>
  )
}
