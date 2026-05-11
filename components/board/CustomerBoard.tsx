import type { BoardViewModel } from "../../lib/board/getTenantBoard";
import { BoardHeader } from "./BoardHeader";
import { IntakeForm } from "./IntakeForm";
import { ObligationList } from "./ObligationList";
import { ProofLoop } from "./ProofLoop";
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
      <ProofLoop board={board} />
      <IntakeForm workspaceId={board.tenant.id} />
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
