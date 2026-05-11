import type { BoardViewModel } from "../../lib/board/getTenantBoard";
import { BoardHeader } from "./BoardHeader";
import { ObligationList } from "./ObligationList";
import { ReceiptList } from "./ReceiptList";
import { SystemActivity } from "./SystemActivity";

type CustomerBoardProps = {
  board: BoardViewModel;
};

export function CustomerBoard({ board }: CustomerBoardProps) {
  return (
    <main className="boardPage">
      <BoardHeader
        tenantId={board.tenant.id}
        tenantName={board.tenant.name}
        lastUpdatedAt={board.lastUpdatedAt}
      />
      <ObligationList obligations={board.obligations} />
      <ReceiptList receipts={board.receipts} />
      <SystemActivity
        overdueCount={board.systemActivity.overdueCount}
        systemActingCount={board.systemActivity.systemActingCount}
      />
      <style jsx>{`
        .boardPage {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 16px 28px;
          display: grid;
          gap: 16px;
          background: #f8f9fb;
          min-height: 100vh;
        }
      `}</style>
    </main>
  );
}
