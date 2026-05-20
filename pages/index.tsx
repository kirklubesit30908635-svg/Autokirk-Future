import Head from "next/head";
import { useEffect } from "react";

import { AutokirkStateTransition } from "../components/AutokirkStateTransition";
import { HomeValueCycle } from "../components/HomeValueCycle";

export default function HomePage() {
  useEffect(() => {
    const isVercelPreview = window.location.hostname.endsWith(".vercel.app");
    const hasAuthReturn =
      window.location.search.includes("error=") ||
      window.location.search.includes("error_code=") ||
      window.location.hash.includes("access_token=") ||
      window.location.hash.includes("refresh_token=") ||
      window.location.hash.includes("error=");

    if (!hasAuthReturn && !isVercelPreview) return;

    const target = new URL("https://autokirk.com/login");
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      params.forEach((value, key) => target.searchParams.set(key, value));
    }
    target.hash = window.location.hash;
    window.location.replace(target.toString());
  }, []);

  return (
    <>
      <Head>
        <title>AutoKirk — Governed Obligation Infrastructure</title>
        <meta
          name="description"
          content="AutoKirk is governed obligation infrastructure for autonomous work. It keeps claims open until authority, proof, and receipt-backed completion exist."
        />
        <meta
          property="og:title"
          content="AutoKirk — Governed Obligation Infrastructure"
        />
        <meta
          property="og:description"
          content="AutoKirk proves whether autonomous work should count by governing claims, proof, authority boundaries, and receipt-backed completion."
        />
        <meta property="og:site_name" content="AutoKirk" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://autokirk.com/" />
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="AutoKirk — Governed Obligation Infrastructure"
        />
        <meta
          name="twitter:description"
          content="Governed obligation infrastructure for autonomous work, proof boundaries, and receipt-backed completion."
        />
      </Head>
      <HomeValueCycle />
      <AutokirkStateTransition />
    </>
  );
}
