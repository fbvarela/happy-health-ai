import { redirect } from "next/navigation";

/** Legacy dashboard → the v0 dashboard lives at `/` now. */
export default async function DashboardPage({ searchParams }) {
  const { patient } = await searchParams;
  redirect(patient ? `/?patient=${patient}` : "/");
}
