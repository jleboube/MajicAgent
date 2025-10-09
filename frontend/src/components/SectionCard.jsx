function SectionCard({ title, action, children }) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        <h2>{title}</h2>
        {action ? <div className="section-card__action">{action}</div> : null}
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );
}

export default SectionCard;
