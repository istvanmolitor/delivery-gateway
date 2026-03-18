import { DAY_LABELS } from '../constants/opening-hours'
import type { OpeningHour, PickupPoint } from '../types/pickup-point'
import { formatAddress, formatTime } from '../utils/formatters'

type SidePanelProps = {
  activePoint: PickupPoint | null
  orderedOpeningHours: OpeningHour[]
  selectedPointId: string | null
  onSelectPoint: (pointId: string) => void
}

export function SidePanel({ activePoint, orderedOpeningHours, selectedPointId, onSelectPoint }: SidePanelProps) {
  return (
    <aside className="side-panel">
      {activePoint ? (
        <>
          <h2>{activePoint.name}</h2>
          <p className="meta">{activePoint.type}</p>
          <p>{formatAddress(activePoint.address)}</p>
          <p>{activePoint.isOpen ? 'Jelenleg nyitva' : 'Jelenleg zárva'}</p>
          <h3>Nyitvatartás</h3>
          <ul className="hours-list">
            {orderedOpeningHours.length ? (
              orderedOpeningHours.map((entry) => (
                <li key={`${entry.day}-${entry.start.hour}-${entry.start.minute}`}>
                  <span>{DAY_LABELS[entry.day] ?? entry.day}</span>
                  <span>
                    {formatTime(entry.start)} - {formatTime(entry.end)}
                  </span>
                </li>
              ))
            ) : (
              <li>Nincs nyitvatartási adat</li>
            )}
          </ul>
          <button className="select-button" onClick={() => onSelectPoint(activePoint.id)} type="button">
            {selectedPointId === activePoint.id ? 'Kiválasztva' : 'Kiválasztom ezt a pontot'}
          </button>
        </>
      ) : (
        <>
          <h2>Nincs kiválasztott pont</h2>
          <p>Kattints egy markerre a térképen a részletek megjelenítéséhez.</p>
        </>
      )}
    </aside>
  )
}
