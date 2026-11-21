"use client";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className="shell utility-page" id="main-content">
      <h1>The guide couldn’t load.</h1>
      <p>Try loading this page again.</p>
      <button type="button" onClick={retry}>
        Try again
      </button>
    </main>
  );
}
