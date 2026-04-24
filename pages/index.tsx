import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

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
          content="Read-only proof surface for the AutoKirk Future lifecycle."
        />
      </Head>
      <SystemProofBoard {...board} />
    </>
  );
}
