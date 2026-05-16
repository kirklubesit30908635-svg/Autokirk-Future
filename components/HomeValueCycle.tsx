export function HomeValueCycle() {
  return (
    <section className="homeShell" aria-labelledby="home-title">
      <section className="hero" aria-labelledby="home-title">
        <p className="eyebrow">Proof-backed completion for existing tools</p>
        <h1 id="home-title">Work waiting on proof should not disappear.</h1>
        <p className="lede">AutoKirk connects to where work starts, keeps important work open, and only lets it close when the right proof exists.</p>
        <div className="liveStrip" aria-label="AutoKirk live proof states">
          <span><strong>Open</strong> until proven</span>
          <span><strong>Proof</strong> required before close</span>
          <span><strong>Closed</strong> with a record</span>
        </div>
        <p className="support">Your tools keep running. AutoKirk becomes the live proof board beside them: what is open, what is waiting on proof, and what has been completed with proof.</p>
        <div className="actions" aria-label="Homepage actions">
          <a href="/platform" className="primaryAction">Start with one proof rule</a>
          <a href="#how-it-works" className="secondaryAction">See how it works</a>
        </div>
      </section>

      <section className="capabilityCard" id="what-autokirk-governs" aria-labelledby="govern-title">
        <div className="sectionHeader">
          <p className="eyebrow">What AutoKirk watches</p>
          <h2 id="govern-title">The work your customer already expects you to prove.</h2>
          <p>AutoKirk does not replace the system that creates the work. It watches the work that should stay open, defines what proof counts, and gives the closing decision a record.</p>
        </div>
        <div className="governGrid">
          <article className="governItem"><h3>Customer promises</h3><p className="examples">reports, follow-ups, service visits, delivery commitments, support responses</p><p>AutoKirk keeps the promise visible until proof shows what happened.</p></article>
          <article className="governItem"><h3>Operational handoffs</h3><p className="examples">approvals, punch-list items, internal reviews, escalations, owner sign-offs</p><p>Work does not disappear just because it moved from one person or tool to another.</p></article>
          <article className="governItem"><h3>Completed proof</h3><p className="examples">closure records, evidence notes, proof links, final state history</p><p>A final answer is not just a status. It is completed proof the customer can trust.</p></article>
        </div>
      </section>

      <section className="exampleCard" aria-labelledby="field-example-title">
        <div className="sectionHeader">
          <p className="eyebrow">Example: revenue leak prevention</p>
          <h2 id="field-example-title">Extra work should not disappear before the proof rule is satisfied.</h2>
          <p>On a jobsite, important work can start in a conversation, text, daily report, work order, or field note. AutoKirk can create a signed connection link for that source and put new work on the live board.</p>
        </div>
        <div className="exampleScenario">
          <article className="exampleStory">
            <p className="eyebrow">What the current setup can do</p>
            <h3>Create a proof rule for field-created extra work.</h3>
            <p>Use the platform setup to define what AutoKirk should watch, what proof is required, and what the board should call it.</p>
            <p>The generated connection link sends new work through the governed intake path so it appears as open work instead of disappearing outside the board.</p>
          </article>
          <article className="exampleProof">
            <p className="eyebrow">Example proof rule</p>
            <ul>
              <li>Watch: GC-requested extra work</li>
              <li>Required proof: requester, note, hours, photo, ticket, or approval link</li>
              <li>Board label: Unresolved field extra</li>
              <li>Source: job system, form, manual entry, or other system</li>
              <li>Current test path: send test work through the signed connection link</li>
            </ul>
          </article>
        </div>
        <div className="exampleFlow" aria-label="Operable proof-rule intake example">
          <span>Create proof rule</span>
          <span>Generate signed link</span>
          <span>Send test work</span>
          <span>Board opens</span>
          <span>Work stays visible</span>
        </div>
        <div className="exampleOutcome">
          <strong>AutoKirk keeps field-created work visible until proof exists.</strong>
          <p>Your tools keep running. AutoKirk governs whether the work is ready to close.</p>
        </div>
      </section>

      <section className="exampleCard" aria-labelledby="operations-example-title">
        <div className="sectionHeader">
          <p className="eyebrow">Example: high-volume operations</p>
          <h2 id="operations-example-title">A promise, charge, or follow-up should not disappear just because the main system says done.</h2>
          <p>AutoKirk is not vertical software. This is one example of proof-gated closure infrastructure working beside existing tools. In a dealership operation, important work can start in a repair order, deal note, customer message, service visit, parts request, finance note, or internal handoff.</p>
        </div>
        <div className="exampleScenario">
          <article className="exampleStory">
            <p className="eyebrow">What the current setup can do</p>
            <h3>Create a proof rule for an unresolved customer promise.</h3>
            <p>Use the same platform setup to name the work, define the proof required, choose where it starts, and generate a connection link.</p>
            <p>New work sent to that link enters AutoKirk through the governed intake path and appears on the live board as work waiting on proof.</p>
          </article>
          <article className="exampleProof">
            <p className="eyebrow">Example proof rule</p>
            <ul>
              <li>Watch: customer promises or follow-ups</li>
              <li>Required proof: message, note, approval, invoice line, or signed acknowledgement</li>
              <li>Board label: Customer promise follow-up</li>
              <li>Source: CRM, job system, manual entry, or other system</li>
              <li>Current test path: send test work through the signed connection link</li>
            </ul>
          </article>
        </div>
        <div className="exampleFlow" aria-label="Operable high-volume operations intake example">
          <span>Create proof rule</span>
          <span>Generate signed link</span>
          <span>Send test work</span>
          <span>Board opens</span>
          <span>Work stays visible</span>
        </div>
        <div className="exampleOutcome">
          <strong>AutoKirk keeps important work visible until proof exists.</strong>
          <p>Existing tools keep running. AutoKirk governs whether the work is actually ready to close.</p>
        </div>
      </section>

      <section className="proofStatesCard" aria-labelledby="states-title">
        <div className="sectionHeader compactHeader">
          <p className="eyebrow">Live board states</p>
          <h2 id="states-title">Open. Waiting on proof. Closed with a record.</h2>
          <p>The board turns attention into action. It shows what is still open, what is waiting on proof, and what closed with a record.</p>
        </div>
        <div className="stateGrid">
          <article className="stateCard"><span className="stepNumber">01</span><h3>Open until proven</h3><p>Work is visible because proof is still missing.</p></article>
          <article className="stateCard"><span className="stepNumber">02</span><h3>Proof required</h3><p>The proof rule defines what has to exist before anyone calls it done.</p></article>
          <article className="stateCard"><span className="stepNumber">03</span><h3>Completed with proof</h3><p>The work closes with a proof-backed record.</p></article>
        </div>
      </section>

      <section className="loopCard" id="how-it-works" aria-labelledby="loop-title">
        <div className="sectionHeader">
          <p className="eyebrow">How it works</p>
          <h2 id="loop-title">Connect where work starts. Close only when proof exists.</h2>
          <p>Work can begin in the systems your team already uses. AutoKirk sits beside them and governs whether the work is allowed to close.</p>
        </div>
        <div className="loopGrid">
          <article className="loopStep"><span className="stepNumber">01</span><h3>Work starts in your system</h3><p>A request, payment, job, approval, form, lead, or handoff creates work that should not disappear.</p></article>
          <article className="loopStep"><span className="stepNumber">02</span><h3>AutoKirk keeps it open</h3><p>The live board shows what is waiting on proof and what needs attention before anyone calls it done.</p></article>
          <article className="loopStep"><span className="stepNumber">03</span><h3>Proof closes the work</h3><p>When the right proof exists, the work closes with completed proof instead of a bare status change.</p></article>
        </div>
      </section>

      <section className="closingCard" aria-label="AutoKirk trial summary">
        <div><p className="eyebrow">Start small</p><strong>One proof rule. One connected source. One live board showing what is actually done.</strong><p>Start where missed follow-up, weak evidence, or premature completion already costs time.</p></div>
        <a href="/platform" className="stripAction">Start with one proof rule</a>
      </section>
    </section>
  );
}