import { CreateFacilityForm } from "@/components/CreateFacilityForm";
import { DienstplanCalendar } from "@/components/dashboard/DienstplanCalendar";
import { MyScheduleSelfService } from "@/components/dashboard/MyScheduleSelfService";
import { OperatorHeader } from "@/components/OperatorHeader";
import { OperatorSidebar } from "@/components/OperatorSidebar";
import { VerificationBanner } from "@/components/VerificationBanner";
import { getMe, getMyFacility } from "@/lib/operatorData";

// Shared shell for every /betreiber/dashboard/* section: header + sidebar
// nav + the verification banner (relevant everywhere, not just the
// Übersicht). Before a facility exists there's nothing to navigate to yet,
// so every sub-route collapses to the same CreateFacilityForm instead.
//
// MITARBEITER (an invited employee, see Employee.userId in schema.prisma)
// gets a completely different, much smaller shell here: no sidebar (every
// other link 403s for them - only the Dienstplan is staffProcedure), and
// whatever sub-route they land on shows the same read-only calendar
// regardless of the URL. getMe() must run before getMyFacility() below,
// not alongside it - myFacility is BETREIBER-only and would throw FORBIDDEN
// for a MITARBEITER before this branch ever runs.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();

  if (me.role === "MITARBEITER") {
    return (
      <div className="flex min-h-screen flex-col">
        <OperatorHeader />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <div>
              <h1 className="text-xl font-bold text-brand-heading">Dienstplan</h1>
              <p className="mt-1 text-sm text-brand-text-muted">
                Deine Schichten und die Termine deines Teams - nur zum Ansehen.
              </p>
            </div>
            <DienstplanCalendar readOnly />
            <MyScheduleSelfService />
          </div>
        </main>
      </div>
    );
  }

  const facility = await getMyFacility();

  if (!facility) {
    return (
      <div className="flex min-h-screen flex-col">
        <OperatorHeader />
        <section className="mx-auto w-full max-w-2xl px-6 py-12">
          <CreateFacilityForm />
        </section>
      </div>
    );
  }

  const verified = Boolean(me.emailVerifiedAt);

  return (
    <div className="flex min-h-screen flex-col">
      <OperatorHeader />
      <div className="flex flex-1 flex-col md:flex-row">
        <OperatorSidebar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            {!verified && <VerificationBanner email={me.email} />}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
