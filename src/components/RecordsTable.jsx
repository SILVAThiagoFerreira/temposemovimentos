import { StatusChip } from './StatusChip';
import { formatDate, formatDateTime, formatDuration, formatTime } from '../services/timeService';
import { useApp } from '../context/AppContext';

export function RecordsTable({ records, onEdit, onDelete, onClose, emptyMessage = '' }) {
  const { language, t } = useApp();
  const resolvedEmptyMessage = emptyMessage || t('table.empty');

  return (
    <div className="card table-card">
      <div className="table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>{t('table.headers.date')}</th>
              <th>{t('table.headers.equipment')}</th>
              <th>{t('table.headers.code')}</th>
              <th>{t('table.headers.activity')}</th>
              <th>{t('table.headers.operator')}</th>
              <th>{t('table.headers.start')}</th>
              <th>{t('table.headers.end')}</th>
              <th>{t('table.headers.duration')}</th>
              <th>{t('table.headers.status')}</th>
              <th>{t('table.headers.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {!records.length ? (
              <tr>
                <td colSpan="10">
                  <p className="empty-state">{resolvedEmptyMessage}</p>
                </td>
              </tr>
            ) : null}

            {records.map((record) => (
              <tr key={record.id}>
                <td>{formatDate(record.startDateTime, language)}</td>
                <td>
                  <strong>{record.plate}</strong>
                  <small>{record.equipmentCode}</small>
                </td>
                <td>{record.activityCode}</td>
                <td>
                  <strong>{record.activityName}</strong>
                </td>
                <td>
                  <strong>{record.operatorName}</strong>
                </td>
                <td>
                  <strong>{formatDate(record.startDateTime, language)}</strong>
                  <small>{formatTime(record.startDateTime, language)}</small>
                </td>
                <td>
                  <strong>{record.endDateTime ? formatDate(record.endDateTime, language) : '-'}</strong>
                  <small>{record.endDateTime ? formatTime(record.endDateTime, language) : '-'}</small>
                </td>
                <td>
                  <strong>{record.durationMinutes != null ? formatDuration(record.durationMinutes, language) : '-'}</strong>
                  <small>{record.durationHours != null ? `${record.durationHours.toFixed(2)} ${t('common.hoursLabel').toLowerCase()}` : '-'}</small>
                </td>
                <td>
                  <StatusChip tone={record.status === 'ABERTO' ? 'danger' : 'neutral'}>
                    {record.status === 'ABERTO' ? t('table.open') : t('table.closed')}
                  </StatusChip>
                  {record.manualEntry ? <small>{t('table.manual')}</small> : null}
                </td>
                <td>
                  <div className="table-actions">
                    {onEdit ? (
                      <button type="button" className="button button--ghost button--tiny" onClick={() => onEdit(record)}>
                        {t('table.edit')}
                      </button>
                    ) : null}
                    {onClose && record.status === 'ABERTO' ? (
                      <button type="button" className="button button--secondary button--tiny" onClick={() => onClose(record)}>
                        {t('table.close')}
                      </button>
                    ) : null}
                    {onDelete ? (
                      <button type="button" className="button button--danger button--tiny" onClick={() => onDelete(record)}>
                        {t('table.delete')}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!records.length ? null : <p className="table-footnote">{t('table.footnote', { value: formatDateTime(new Date(), language) })}</p>}
    </div>
  );
}
