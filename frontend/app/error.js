'use client';
export default function Error({ reset }) {
  return (
    <section className="section center">
      <div className="container">
        <h1>Something went wrong</h1>
        <p className="lead">Please try again in a moment.</p>
        <button className="btn" onClick={() => reset()}>Try again</button>
      </div>
    </section>
  );
}
