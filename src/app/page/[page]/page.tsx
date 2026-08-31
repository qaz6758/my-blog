import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    page: string;
  }>;
}

export default async function PaginatedHomePage({ params }: PageProps) {
  const { page } = await params;
  const pageNum = Number(page);

  if (pageNum <= 1 || isNaN(pageNum)) {
    redirect("/#posts");
  }

  redirect(`/?page=${pageNum}#posts`);
}