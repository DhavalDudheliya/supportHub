import Link from "next/link";
import { Button } from "@supporthub/ui/components/button";

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="flex items-center justify-between p-6">
        <div className="text-xl font-bold">SupportHub</div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Register</Button>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">
            SupportHub!!!
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md">
            The core support platform for your modern business.
          </p>
          <Link href="/register">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
