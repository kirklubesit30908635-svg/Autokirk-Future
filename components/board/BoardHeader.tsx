type BoardHeaderProps = {
  tenantId: string;
  tenantName: string | null;
  lastUpdatedAt: string;
};

function formatTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function BoardHeader({
  tenantId,
  tenantName,
  lastUpdatedAt,
}: BoardHeaderProps) {
  return (
    <section className="boardHeader">
      <h1>Tenant-scoped board</h1>
      <p className="boardSubtitle">Tenant-scoped read model</p>
      <div className="boardMeta">
        <span>
          <strong>Workspace ID:</strong> {tenantId}
        </span>
        <span>
          <strong>Workspace Name:</strong> {tenantName ?? "—"}
        </span>
        <span>
          <strong>Last Updated:</strong> {formatTimestamp(lastUpdatedAt)}
        </span>
      </div>
      <style jsx>{`
        .boardHeader {
          border: 1px solid #d6d6db;
          border-radius: 12px;
          padding: 16px;
          background: #fff;
        }

        h1 {
          margin: 0;
          font-size: 1.4rem;
        }

        .boardSubtitle {
          margin: 6px 0 0;
          color: #4d5563;
          font-size: 0.95rem;
        }

        .boardMeta {
          margin-top: 12px;
          display: grid;
          gap: 6px;
          font-size: 0.95rem;
        }
      `}</style>
    </section>
  );
}
