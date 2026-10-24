import { getCalendarData, getBufferSettings } from "@/lib/actions/bookings"
import { getQuoteRequestStats } from "@/lib/actions/quotes"
import { CalendarView } from "@/components/calendar/calendar-view"
import { OperationsShell } from "@/components/dashboard/operations-shell"
import { isAuthenticated, getUser, canAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function KalenderPage() {
  const authenticated = await isAuthenticated()
  if (!authenticated) redirect("/login")

  const user = await getUser()
  const userCanAdmin = await canAdmin(user)

  const [calendarData, bufferSettings, quoteStats] = await Promise.all([
    getCalendarData(),
    getBufferSettings(),
    getQuoteRequestStats(),
  ])

  return (
    <OperationsShell activeTab="kalender" quoteStats={quoteStats} userCanAdmin={userCanAdmin}>
      <CalendarView
        rentalEvents={calendarData.rentalEvents}
        saleEvents={calendarData.saleEvents}
        bandStock={calendarData.bandStock}
        baseStock={calendarData.baseStock}
        departureBufferDays={bufferSettings.departureBufferDays}
        returnBufferDays={bufferSettings.returnBufferDays}
      />
    </OperationsShell>
  )
}
