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
        <title>AutoKirk Future</title>
        <meta
          name="description"
          content="AutoKirk turns business promises into governed obligations that close only with proof."
        />
      </Head>
      <HomeValueCycle />
      <AutokirkStateTransition />
    </>
  );
}
