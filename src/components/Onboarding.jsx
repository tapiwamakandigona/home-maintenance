import { useState } from 'react'
import { House, Search, Handshake } from 'lucide-react'

const STEPS = [
  { Icon: House, title: 'Welcome to Home Maintenance', body: '' },
  { Icon: Search, title: 'Find trusted local workers in Zimbabwe', body: '' },
  {
    Icon: Handshake,
    title:
      'Connect with vetted grass cutters, maids, garden boys, tree fellers and more — right in your area',
    body: '',
  },
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const last = step === STEPS.length - 1
  const { Icon, title } = STEPS[step]

  return (
    <div className="onboarding">
      <button className="onboarding-skip" onClick={onDone}>
        Skip
      </button>
      <div className="onboarding-card" key={step}>
        <div className="onboarding-icon">
          <Icon className="icon" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h2 className="onboarding-title">{title}</h2>
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
