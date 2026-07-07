import { House } from 'lucide-react'

export default function Splash() {
  return (
    <div className="splash">
      <div className="splash-logo">
        <House className="icon" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <h1 className="splash-title">Home Maintenance</h1>
      <p className="splash-slogan">Dedicated to Changing Lives</p>
      <div className="splash-loader">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  )
}
