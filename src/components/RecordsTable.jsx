import { StatusChip } from './StatusChip';
import { formatDate, formatDateTime, formatDuration, formatTime } from '../services/timeService';
import { useApp } from '../context/AppContext';

export function RecordsTable({ records, onEdit, onDelete, onClose, emptyMessage = '' }) {
  const { language, t } = useApp();
  const resolvedEmptyMessage = emptyMessage || t('table.empty');
  const headers = {
    date: t('table.headers.date'),
    equipment: t('table.headers.equipment'),
    code: t('table.headers.code'),
    activity: t('table.headers.activity'),
    operator: t('table.headers.operator'),
    start: t('table.headers.start'),
    end: t('table.headers.end'),
    duration: t('table.headers.duration'),
    status: t('table.headers.status'),
    actions: t('table.headers.actions'),
  };

  return (
    <div className="card table-card">
      <div className="table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th scope="col">{headers.date}</th>
              <th scope="col">{headers.equipment}</th>
              <th scope="col">{headers.code}</th>
              <th scope="col">{headers.activity}</th>
              <th scope="col">{headers.operator}</th>
              <th scope="col">{headers.start}</th>
              <th scope="col">{headers.end}</th>
              <th scope="col">{headers.duration}</th>
              <th scope="col">{headers.status}</th>
              <th scope="col">{headers.actions}</th>
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
                <td data-label={headers.date}>{formatDate(record.startDateTime, language)}</td>
                <td data-label={headers.equipment}>
                  <strong>{record.plate}</strong>
                  <small>{record.equipmentCode}</small>
                </td>
                <td data-label={headers.code}>{record.activityCode}</td>
                <td data-label={headers.activity}>
                  <strong>{record.activityName}</strong>
                </td>
                <td data-label={headers.operator}>
                  <strong>{record.operatorName}</strong>
                </td>
                <td data-label={headers.start}>
                  <strong>{formatDate(record.startDateTime, language)}</strong>
                  <small>{formatTime(record.startDateTime, language)}</small>
                </td>
                <td data-label={headers.end}>
                  <strong>{record.endDateTime ? formatDate(record.endDateTime, language) : '-'}</strong>
                  <small>{record.endDateTime ? formatTime(record.endDateTime, language) : '-'}</small>
                </td>
                <td data-label={headers.duration}>
                  <strong>{record.durationMinutes != null ? formatDuration(record.durationMinutes, language) : '-'}</strong>
                  <small>{record.durationHours != null ? `${record.durationHours.toFixed(2)} ${t('common.hoursLabel').toLowerCase()}` : '-'}</small>
                </td>
                <td data-label={headers.status}>
                  <StatusChip tone={record.status === 'ABERTO' ? 'danger' : 'neutral'}>
                    {record.status === 'ABERTO' ? t('table.open') : t('table.closed')}
                  </StatusChip>
                  {record.manualEntry ? <small>{t('table.manual')}</small> : null}
                </td>
                <td data-label={headers.actions}>
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
