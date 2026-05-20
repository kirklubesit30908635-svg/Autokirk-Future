import type { BoardObligation } from "../../lib/board/getTenantBoard";

type ObligationListProps = {
  obligations: BoardObligation[];
};

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function ObligationList({ obligations }: ObligationListProps) {
  return (
    <section className="boardSection">
      <h2>Obligations</h2>
      {obligations.length === 0 ? (
        <p className="emptyState">No obligations visible for this workspace.</p>
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Obligation Code</th>
                <th>Subject</th>
                <th>Due</th>
                <th>Proof Status</th>
                <th>Opened</th>
              </tr>
            </thead>
            <tbody>
              {obligations.map((row) => (
                <tr key={row.id}>
                  <td>{row.status}</td>
                  <td>{row.obligationCode}</td>
                  <td>{row.subjectLabel ?? "—"}</td>
                  <td>{formatTimestamp(row.dueAt)}</td>
                  <td>{row.proofStatus ?? "—"}</td>
                  <td>{formatTimestamp(row.openedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style jsx>{`
        .boardSection {
          border: 1px solid #d6d6db;
          border-radius: 12px;
          padding: 16px;
          background: #fff;
        }

        h2 {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 1.15rem;
        }

        .tableWrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.94rem;
        }

        th,
        td {
          text-align: left;
          padding: 10px 8px;
          border-top: 1px solid #ececf1;
          vertical-align: top;
        }

        th {
          border-top: none;
          color: #4d5563;
          font-weight: 600;
        }

        .emptyState {
          margin: 0;
          color: #4d5563;
        }
      `}</style>
    </section>
  );
}
