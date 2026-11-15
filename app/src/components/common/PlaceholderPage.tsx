type Props = { title: string; description?: string };

export function PlaceholderPage({ title, description }: Props) {
  return (
    <section className="page-card">
      <span className="eyebrow">DENTIQ AI · STATIC PROTOTYPE</span>
      <h1>{title}</h1>
      <p>{description ?? "This screen is part of the static UI foundation. Sample content will be added during the design phase."}</p>
      <div className="prototype-note">
        <strong>Prototype mode</strong>
        <span>Demo UI only. No backend, API, or real patient data is connected.</span>
      </div>
    </section>
  );
}
