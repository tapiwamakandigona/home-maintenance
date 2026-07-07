export default function Stars({ value = 0, count = null, onChange = null, size = '' }) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <span className={'stars ' + size}>
      {stars.map((s) =>
        onChange ? (
          <button
            key={s}
            type="button"
            className={'star-btn' + (s <= value ? ' filled' : '')}
            onClick={() => onChange(s)}
            aria-label={s + ' star'}
          >
            {s <= value ? '★' : '☆'}
          </button>
        ) : (
          <span key={s} className={s <= Math.round(value) ? 'star filled' : 'star'}>
            {s <= Math.round(value) ? '★' : '☆'}
          </span>
        )
      )}
      {count !== null && <span className="star-count">({count})</span>}
    </span>
  )
}
