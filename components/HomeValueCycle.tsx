export function HomeValueCycle() {
  return (
    <section className="homeShell" aria-labelledby="home-title">
      <section className="hero" aria-labelledby="home-title">
        <p className="eyebrow">Governed proof boundary for existing and agentic work</p>
        <h1 id="home-title">Agents can do the work. AutoKirk proves whether the work should count.</h1>
        <p className="lede">AutoKirk turns human, system, automation, and agent claims into governed obligations that stay open until authority, proof, and receipts exist.</p>
        <div className="liveStrip" aria-label="AutoKirk live proof states">
          <span><strong>Claimed</strong> by a person, system, or agent</span>
          <span><strong>Governed</strong> by authority and proof rules</span>
          <span><strong>Closed</strong> only with a receipt</span>
        </div>
        <p className="support">Your tools and agents keep running. AutoKirk governs the closing decision: what is open, what is allowed to count, and what has been completed without drift.</p>
        <div className="actions" aria-label="Homepage actions">
          <a href="/platform" className="primaryAction">Start with one proof rule</a>
          <a href="/agent-proof" className="secondaryAction">Set up agent proof boundary</a>
        </div>
      </section>

      <section className="capabilityCard" id="what-autokirk-governs" aria-labelledby="govern-title">
        <div className="sectionHeader">
          <p className="eyebrow">What AutoKirk governs</p>
          <h2 id="govern-title">The moment a claim becomes business truth.</h2>
          <p>AutoKirk does not replace the system or agent that creates the work. It watches the work that should stay open, defines what proof counts, evaluates authority boundaries, and gives the closing decision a receipt.</p>
        </div>
        <div className="governGrid">
          <article className="governItem"><h3>Customer promises</h3><p className="examples">reports, follow-ups, service visits, delivery commitments, support responses</p><p>AutoKirk keeps the promise visible until proof shows what happened.</p></article>
          <article className="governItem"><h3>System and agent claims</h3><p className="examples">agent actions, API events, automations, multi-agent handoffs, MCP-connected tools</p><p>A claim does not become complete just because a system says it happened. AutoKirk decides whether it is allowed to count.</p></article>
          <article className="governItem"><h3>Receipt-backed completion</h3><p className="examples">closure records, evidence notes, policy rationale, proof links, final state history</p><p>A final answer is not just a status. It is completed proof the customer can trust.</p></article>
        </div>
      </section>

      <section className="exampleCard agenticCard" aria-labelledby="agentic-example-title">
        <div className="sectionHeader">
          <p className="eyebrow">Agentic proof boundary</p>
          <h2 id="agentic-example-title">Autonomous execution needs independent proof.</h2>
          <p>AI agents, automations, and connected tools can move work faster than a business can manually verify. AutoKirk gives those claims a governed boundary before they become business truth.</p>
        </div>
        <div className="exampleScenario">
          <article className="exampleStory">
            <p className="eyebrow">What the setup does</p>
            <h3>Register a claim source, define authority, and gate closure.</h3>
            <p>AutoKirk can now track whether work was claimed by a human, API, automation, agent, multi-agent system, or external system.</p>
            <p>Approved claims close through the existing receipt path. Denied or conditional claims stay open with rationale and required follow-up.</p>
          </article>
          <article className="exampleProof">
            <p className="eyebrow">Proof-boundary rule</p>
            <ul>
              <li>Source: agent, automation, API, human, or external system</li>
              <li>Authority: what the source is allowed to claim or close</li>
              <li>Decision: approve, deny, or conditional</li>
              <li>Rationale: cited controls and machine-readable reason</li>
              <li>Result: receipt-backed completion or open follow-up</li>
            </ul>
          </article>
        </div>
        <div className="exampleFlow" aria-label="Agentic proof boundary flow">
          <span>Claim source</span>
          <span>Authority boundary</span>
          <span>Proof evaluation</span>
          <span>Approve / deny / conditional</span>
          <span>Receipt rationale</span>
        </div>
        <div className="exampleOutcome">
          <strong>AutoKirk governs whether agentic work should count.</strong>
          <p>MCP connects tools. A2A connects agents. AutoKirk governs completion.</p>
        </div>
        <div className="actions inlineActions" aria-label="Agent proof actions">
          <a href="/agent-proof" className="primaryAction">Set up agent proof boundary</a>
          <a href="/platform" className="secondaryAction">Use standard proof rule</a>
        </div>
      </section>

      <section className="exampleCard" aria-labelledby="field-example-title">
        <div className="sectionHeader">
          <p className="eyebrow">Example: revenue leak prevention</p>
          <h2 id="field-example-title">Extra work should not disappear before the proof rule is satisfied.</h2>
          <p>On a jobsite, important work can start in a conversation, text, daily report, work order, or field note. AutoKirk keeps that work visible until the right proof exists.</p>
        </div>
        <div className="exampleScenario">
          <article className="exampleStory">
            <p className="eyebrow">What the setup does</p>
            <h3>Create a proof rule for field-created extra work.</h3>
            <p>Choose what AutoKirk should watch, what proof is required, and what the board should call it.</p>
            <p>New work can be sent to AutoKirk and shown on the live board instead of disappearing outside the closeout process.</p>
          </article>
          <article className="exampleProof">
            <p className="eyebrow">Example proof rule</p>
            <ul>
              <li>Watch: GC-requested extra work</li>
              <li>Required proof: requester, note, hours, photo, ticket, or approval link</li>
              <li>Board label: Unresolved field extra</li>
              <li>Source: job system, form, manual entry, or other system</li>
              <li>Result: work stays visible until proof exists</li>
            </ul>
          </article>
        </div>
        <div className="exampleFlow" aria-label="Proof-rule setup example">
          <span>Create proof rule</span>
          <span>Choose source</span>
          <span>Send test work</span>
          <span>View board</span>
          <span>Keep open until proof exists</span>
        </div>
        <div className="exampleOutcome">
          <strong>AutoKirk keeps field-created work visible until proof exists.</strong>
          <p>Your tools keep running. AutoKirk governs whether the work is ready to close.</p>
        </div>
      </section>

      <section className="proofStatesCard" aria-labelledby="states-title">
        <div className="sectionHeader compactHeader">
          <p className="eyebrow">Live board states</p>
          <h2 id="states-title">Open. Proof ready. Closed with proof.</h2>
          <p>The board turns attention into action. It shows what is still open, what is ready to close, and what closed with proof.</p>
        </div>
        <div className="stateGrid">
          <article className="stateCard"><span className="stepNumber">01</span><h3>Open until proven</h3><p>Work is visible because proof is still missing.</p></article>
          <article className="stateCard"><span className="stepNumber">02</span><h3>Proof ready</h3><p>The right evidence exists to support completion.</p></article>
          <article className="stateCard"><span className="stepNumber">03</span><h3>Completed with proof</h3><p>The work closes with a proof-backed record and receipt.</p></article>
        </div>
      </section>

      <section className="loopCard" id="how-it-works" aria-labelledby="loop-title">
        <div className="sectionHeader">
          <p className="eyebrow">How it works</p>
          <h2 id="loop-title">Connect where work starts. Close only when proof exists.</h2>
          <p>Work can begin in the systems your team already uses. AutoKirk sits beside them and governs whether the work is allowed to close.</p>
        </div>
        <div className="loopGrid">
          <article className="loopStep"><span className="stepNumber">01</span><h3>Work starts in your system or agent</h3><p>A request, payment, job, approval, form, lead, handoff, or agent action creates work that should not disappear.</p></article>
          <article className="loopStep"><span className="stepNumber">02</span><h3>AutoKirk keeps it governed</h3><p>The live board shows what is waiting on proof and the proof boundary records authority, rationale, and required follow-up.</p></article>
          <article className="loopStep"><span className="stepNumber">03</span><h3>Proof closes the work</h3><p>When the right proof exists, the work closes with completed proof and a receipt instead of a bare status change.</p></article>
        </div>
      </section>

      <section className="closingCard" aria-label="AutoKirk trial summary">
        <div><p className="eyebrow">Start small</p><strong>One proof rule. One source. One live board showing what is actually done.</strong><p>Start where missed follow-up, weak evidence, agent claims, or premature completion already costs time.</p></div>
        <a href="/platform" className="stripAction">Start with one proof rule</a>
      </section>
    </section>
  );
}
