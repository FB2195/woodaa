import { AuthForm } from "@/components/AuthForm";
import { Header } from "@/components/Header";

export default function RegisterPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-md px-6 py-16">
        <AuthForm mode="register-suchende" />
      </section>
    </main>
  );
}
