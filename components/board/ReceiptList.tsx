import type { BoardReceipt } from "../../lib/board/getTenantBoard";

type ReceiptListProps = {
  receipts: BoardReceipt[];
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

export function ReceiptList({ receipts }: ReceiptListProps) {
  return (
    <section className="boardSection">
      <h2>Receipts</h2>
      {receipts.length === 0 ? (
        <p className="emptyState">No receipts visible for this workspace.</p>
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Obligation ID</th>
                <th>Sealed</th>
                <th>Hash</th>
                <th>Sequence</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.obligationId ?? "—"}</td>
                  <td>{formatTimestamp(row.sealedAt)}</td>
                  <td>{row.hash ?? "—"}</td>
                  <td>{row.sequence ?? "—"}</td>
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
