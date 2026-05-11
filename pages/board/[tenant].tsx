import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

import { CustomerBoard } from "../../components/board/CustomerBoard";
import {
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

    if (result.kind !== "ok") {
      return { notFound: true };
    }

    return {
      props: {
        board: result.board,
      },
    };
  };

export default function TenantBoardPage({
  board,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>AutoKirk Future Tenant-scoped board</title>
        <meta
          name="description"
          content="Read-only tenant-scoped board for obligations, receipts, and system activity."
        />
      </Head>
      <CustomerBoard board={board} />
    </>
  );
}
