import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

import { LiveBoardWindow } from "../../components/board/LiveBoardWindow";
import {
  createFallbackBoard,
  getTenantBoard,
  type BoardViewModel,
} from "../../lib/board/getTenantBoard";

type TenantBoardPageProps = {
  board: BoardViewModel;
};

export const getServerSideProps: GetServerSideProps<TenantBoardPageProps> =
  async (context) => {
    const tenant = context.params?.tenant;

    if (typeof tenant !== "string") {
      return { notFound: true };
    }

    const result = await getTenantBoard(context, tenant);

    if (result.kind === "ok") {
      return {
        props: {
          board: result.board,
        },
      };
    }

    return {
      props: {
        board: createFallbackBoard(tenant),
      },
    };
  };

export default function TenantBoardPage({
  board,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>AutoKirk Live Board</title>
        <meta
          name="description"
          content="Compact live obligation board attached to an active system."
        />
        <meta name="theme-color" content="#030303" />
      </Head>
      <LiveBoardWindow board={board} />
    </>
  );
}
