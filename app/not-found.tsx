import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell utility-page" id="main-content">
      <p>404</p>
      <h1>Site not found</h1>
      <p>There’s no record at this address.</p>
      <Link href="/#sites">Browse the site index</Link>
    </main>
  );
}
