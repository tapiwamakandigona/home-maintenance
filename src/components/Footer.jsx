import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">🏠 Home Maintenance</div>
        <p className="footer-slogan">Dedicated to Changing Lives</p>
        <p className="footer-about">
          Hire vetted local home-service workers across Zimbabwe — grass cutting, cleaning, gardening, repairs and
          more.
        </p>
        <Link to="/complaints" className="footer-link">
          Submit a complaint
        </Link>
      </div>
    </footer>
  )
}
