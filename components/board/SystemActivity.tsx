type SystemActivityProps = {
  overdueCount: number;
  systemActingCount: number;
};

export function SystemActivity({
  overdueCount,
  systemActingCount,
}: SystemActivityProps) {
  const hasItems = overdueCount > 0 || systemActingCount > 0;

  return (
    <section className="boardSection">
      <h2>System Activity</h2>
      {hasItems ? (
        <ul>
          <li>
            <strong>Overdue — System Acting:</strong> {overdueCount}
          </li>
          <li>
            <strong>System Acting:</strong> {systemActingCount}
          </li>
        </ul>
      ) : (
        <p className="emptyState">
          No overdue or system-acting items are currently visible.
        </p>
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

        ul {
          margin: 0;
          padding-left: 18px;
          display: grid;
          gap: 6px;
        }

        .emptyState {
          margin: 0;
          color: #4d5563;
        }
      `}</style>
    </section>
  );
}
