import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { Header } from "@/components/Header";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-md px-6 py-16">
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
