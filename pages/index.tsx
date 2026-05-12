import Head from "next/head";

import { AutokirkStateTransition } from "../components/AutokirkStateTransition";
import { HomeValueCycle } from "../components/HomeValueCycle";

export default function HomePage() {
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
