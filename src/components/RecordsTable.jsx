import { StatusChip } from './StatusChip';
import { formatDate, formatDateTime, formatDuration, formatTime } from '../services/timeService';

function locationLabel(value) {
  if (value === 'CHASSI') return 'C';
  if (value === 'UNIDADE') return 'U';
  return '-';
}

export function RecordsTable({ records, onEdit, onDelete, onClose, emptyMessage = 'Nenhum registro encontrado.' }) {
  return (
    <div className="card table-card">
      <div className="table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Equipamento</th>
              <th>Código</th>
              <th>Atividade</th>
              <th>Local</th>
              <th>Operador</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Duração</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {!records.length ? (
              <tr>
                <td colSpan="11">
                  <p className="empty-state">{emptyMessage}</p>
                </td>
              </tr>
            ) : null}

            {records.map((record) => (
              <tr key={record.id}>
                <td>{formatDate(record.startDateTime)}</td>
                <td>
                  <strong>{record.plate}</strong>
                  <small>{record.equipmentCode}</small>
                </td>
                <td>{record.activityCode}</td>
                <td>
                  <strong>{record.activityName}</strong>
                  <small>{record.classification}</small>
                </td>
                <td>{locationLabel(record.location)}</td>
                <td>
                  <strong>{record.operatorName}</strong>
                  <small>{record.shiftName || '-'}</small>
                </td>
                <td>
                  <strong>{formatDate(record.startDateTime)}</strong>
                  <small>{formatTime(record.startDateTime)}</small>
                </td>
                <td>
                  <strong>{record.endDateTime ? formatDate(record.endDateTime) : '-'}</strong>
                  <small>{record.endDateTime ? formatTime(record.endDateTime) : '-'}</small>
                </td>
                <td>
                  <strong>{record.durationMinutes != null ? formatDuration(record.durationMinutes) : '-'}</strong>
                  <small>{record.durationHours != null ? `${record.durationHours.toFixed(2)} h` : '-'}</small>
                </td>
                <td>
                  <StatusChip tone={record.status === 'ABERTO' ? 'danger' : 'neutral'}>
                    {record.status}
                  </StatusChip>
                  {record.manualEntry ? <small>MANUAL</small> : null}
                </td>
                <td>
                  <div className="table-actions">
                    {onEdit ? (
                      <button type="button" className="button button--ghost button--tiny" onClick={() => onEdit(record)}>
                        Editar
                      </button>
                    ) : null}
                    {onClose && record.status === 'ABERTO' ? (
                      <button type="button" className="button button--secondary button--tiny" onClick={() => onClose(record)}>
                        Encerrar
                      </button>
                    ) : null}
                    {onDelete ? (
                      <button type="button" className="button button--danger button--tiny" onClick={() => onDelete(record)}>
                        Excluir
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!records.length ? null : <p className="table-footnote">Atualizado em {formatDateTime(new Date())}</p>}
    </div>
  );
}
