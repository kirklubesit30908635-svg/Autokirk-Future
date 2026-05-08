import Head from "next/head";
import type { AppProps } from "next/app";
import { ProjectionNavLinks } from "../components/ProjectionNavLinks";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#050403" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
      </Head>
      <ProjectionNavLinks />
      <Component {...pageProps} />
    </>
  );
}
