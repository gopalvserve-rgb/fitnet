export default function Ornament() {
  return <div className="ornament" aria-hidden="true"><span /></div>;
}

export function SectionHead({ eyebrow, title, lead, className = 'center mb-lg' }) {
  return (
    <div className={className}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      <Ornament />
      {lead && <p className="lead">{lead}</p>}
    </div>
  );
}
