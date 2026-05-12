export function HomeValueCycle() {
  return (
    <section className="homeShell" aria-labelledby="home-title">
      <section className="hero" aria-labelledby="home-title">
        <p className="eyebrow">Proof-backed completion for existing tools</p>
        <h1 id="home-title">Work is not complete until it is proven.</h1>
        <p className="lede">AutoKirk adds a proof layer beside the tools you already use, keeping critical work open until the required evidence exists.</p>
        <p className="support">Start with one workflow. Define what proof is required. AutoKirk shows what is open, ready to close, or still missing evidence.</p>
        <div className="actions" aria-label="Homepage actions">
          <a href="/platform" className="primaryAction">Start trial</a>
          <a href="#how-it-works" className="secondaryAction">See how it works</a>
        </div>
      </section>

      <section className="capabilityCard" id="what-autokirk-governs" aria-labelledby="govern-title">
        <div className="sectionHeader">
          <p className="eyebrow">What AutoKirk can govern</p>
          <h2 id="govern-title">Any promise that should not be closed without evidence.</h2>
          <p>AutoKirk does not care which tool created the work. It governs the obligation created by that work: what is owed, what proof is required, and what final state is allowed.</p>
        </div>
        <div className="governGrid">
          <article className="governItem"><h3>Customer promises</h3><p className="examples">reports, follow-ups, service visits, delivery commitments, support responses</p><p>AutoKirk shows whether the promise is still open, completed with proof, or failed with proof.</p></article>
          <article className="governItem"><h3>Operational handoffs</h3><p className="examples">approvals, punch-list items, internal reviews, escalations, owner sign-offs</p><p>Nothing quietly disappears when one team says another team has the ball.</p></article>
          <article className="governItem"><h3>Proof receipts</h3><p className="examples">customer-visible closure records, receipt ids, lifecycle state, evidence references</p><p>A final answer is not just a status. It is a receipt-backed record customers can trust.</p></article>
        </div>
      </section>

      <section className="proofStatesCard" aria-labelledby="states-title">
        <div className="sectionHeader compactHeader">
          <p className="eyebrow">Proof states</p>
          <h2 id="states-title">The state change stays visible.</h2>
          <p>AutoKirk shows whether an obligation is still open, ready for proof review, or closed with a receipt-backed final state.</p>
        </div>
        <div className="stateGrid">
          <article className="stateCard"><span className="stepNumber">01</span><h3>Open</h3><p>The obligation exists and still needs evidence.</p></article>
          <article className="stateCard"><span className="stepNumber">02</span><h3>Proof ready</h3><p>Evidence has been supplied and can be used to close the work.</p></article>
          <article className="stateCard"><span className="stepNumber">03</span><h3>Closed with proof</h3><p>Completion or failure is recorded with a receipt-backed final state.</p></article>
        </div>
      </section>

      <section className="loopCard" id="how-it-works" aria-labelledby="loop-title">
        <div className="sectionHeader">
          <p className="eyebrow">How it works</p>
          <h2 id="loop-title">Your tools keep running. AutoKirk governs the closing decision.</h2>
          <p>Work can begin in the systems your team already uses. AutoKirk does not replace that workflow. It governs whether the work can be closed.</p>
        </div>
        <div className="loopGrid">
          <article className="loopStep"><span className="stepNumber">01</span><h3>Work starts where it already happens</h3><p>A ticket, request, payment, service job, approval, or handoff creates work your team intends to close.</p></article>
          <article className="loopStep"><span className="stepNumber">02</span><h3>AutoKirk requires proof before close</h3><p>The item stays open until the required evidence exists, so false completion cannot disappear into a status change.</p></article>
          <article className="loopStep"><span className="stepNumber">03</span><h3>Resolved work leaves a record</h3><p>When proof is enough, the work closes with a recorded decision. If proof is missing, AutoKirk keeps it visible.</p></article>
        </div>
      </section>

      <section className="closingCard" aria-label="AutoKirk trial summary">
        <div><p className="eyebrow">Start small</p><strong>One workflow. One proof rule. One place to see what is actually done.</strong><p>Start where missed follow-up, weak evidence, or premature completion already costs time.</p></div>
        <a href="/platform" className="stripAction">Start trial</a>
      </section>
    </section>
  );
}
