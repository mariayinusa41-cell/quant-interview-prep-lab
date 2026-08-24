"use client";

// Shell only: hard-coded announcements standing in for a real feed.
type Item = {
  kind: "opening" | "deadline" | "update";
  title: string;
  body: string;
  when: string;
  cta?: string;
};

const ITEMS: Item[] = [
  {
    kind: "opening",
    title: "Summer 2027 quant internships opening",
    body: "First-round applications are live at several desks. Early submissions historically clear screening faster.",
    when: "Aug 18",
    cta: "Apply now",
  },
  {
    kind: "deadline",
    title: "Economic consulting analyst deadlines",
    body: "Most analyst pipelines close in the first week of October. Case prep should start now.",
    when: "Aug 14",
    cta: "See deadlines",
  },
  {
    kind: "update",
    title: "New: Stochastic Processes lab",
    body: "Ruin Walker and Martingale Mutiny are live, both with step-by-step walkthroughs.",
    when: "Aug 11",
  },
];

const KIND_LABEL: Record<Item["kind"], string> = {
  opening: "NOW OPEN",
  deadline: "DEADLINE",
  update: "UPDATE",
};

export default function NewsPanel() {
  return (
    <div className="hub-panel">
      <section className="section">
        <h2>News</h2>
        <p className="section-intro">What is open, what closes soon, and what is new in the arcade.</p>

        <div className="news-list">
          {ITEMS.map((item) => (
            <article className={`news-card is-${item.kind}`} key={item.title}>
              <div className="news-head">
                <span className="news-kind">{KIND_LABEL[item.kind]}</span>
                <span className="news-when">{item.when}</span>
              </div>
              <h3 className="news-title">{item.title}</h3>
              <p className="news-body">{item.body}</p>
              {item.cta && <button type="button" className="lb-tab news-cta">{item.cta}</button>}
            </article>
          ))}
        </div>

        <p className="assess-footnote">
          Shell only — announcements are hard-coded placeholders for now.
        </p>
      </section>
    </div>
  );
}
