import { notFound, redirect } from "next/navigation"
import { canAdmin, getUser, isAuthenticated } from "@/lib/auth"
import { getInventorySnapshot } from "@/lib/actions/kpi"
import { InventorySnapshotPrintView } from "@/components/print/inventory-snapshot-print-view"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ autoprint?: string }>
}

export default async function InventorySnapshotPrintPage({ params, searchParams }: PageProps) {
  if (!(await isAuthenticated())) redirect("/login")
  if (!(await canAdmin(await getUser()))) redirect("/warenverwaltung")

  const { id } = await params
  const { autoprint } = await searchParams
  const snapshotId = Number(id)
  if (!Number.isInteger(snapshotId)) notFound()

  const data = await getInventorySnapshot(snapshotId)
  if (!data) notFound()

  return (
    <div className="min-h-screen bg-white">
      <InventorySnapshotPrintView snapshot={data.snapshot} items={data.items} autoprint={autoprint === "1"} />
    </div>
  )
}
