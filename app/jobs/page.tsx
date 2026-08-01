import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function JobsCompatibilityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  });

  redirect(`${routes.explore}${query.size ? `?${query.toString()}` : ""}`);
}
