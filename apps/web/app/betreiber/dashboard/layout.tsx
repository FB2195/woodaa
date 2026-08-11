import { CreateFacilityForm } from "@/components/CreateFacilityForm";
import { OperatorHeader } from "@/components/OperatorHeader";
import { OperatorSidebar } from "@/components/OperatorSidebar";
import { VerificationBanner } from "@/components/VerificationBanner";
import { getMe, getMyFacility } from "@/lib/operatorData";

// Shared shell for every /betreiber/dashboard/* section: header + sidebar
// nav + the verification banner (relevant everywhere, not just the
// Übersicht). Before a facility exists there's nothing to navigate to yet,
// so every sub-route collapses to the same CreateFacilityForm instead.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [me, facility] = await Promise.all([getMe(), getMyFacility()]);

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
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            {!verified && <VerificationBanner email={me.email} />}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
