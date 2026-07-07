import { Link } from 'react-router-dom'
import { House, MessageSquare } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="nav-logo">
            <House className="icon" strokeWidth={1.75} aria-hidden="true" />
          </span>
          Home Maintenance
        </div>
        <p className="footer-slogan">Dedicated to Changing Lives</p>
        <p className="footer-about">
          Hire vetted local home-service workers across Zimbabwe — grass cutting, cleaning, gardening, repairs and
          more.
        </p>
        <Link to="/complaints" className="footer-link">
          <MessageSquare className="icon" aria-hidden="true" /> Submit a complaint
        </Link>
      </div>
    </footer>
  )
}
