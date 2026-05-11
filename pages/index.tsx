import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

import { HomeValueCycle } from "../components/HomeValueCycle";
import { SystemProofBoard, type SystemProofBoardProps } from "../components/SystemProofBoard";
import { getSystemProofBoardData } from "../components/systemProofData";

type HomePageProps = {
  board: SystemProofBoardProps;
};

export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  return {
    props: {
      board: await getSystemProofBoardData(),
    },
  };
};

export default function HomePage({
  board,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>AutoKirk Future</title>
        <meta
          name="description"
          content="AutoKirk turns business promises into governed obligations that resolve only with proof and customer-visible receipts."
        />
      </Head>
      <HomeValueCycle />
      <div id="live-board">
        <SystemProofBoard {...board} />
      </div>
    </>
  );
}
