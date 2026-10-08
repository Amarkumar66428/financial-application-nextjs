import { LogoutButton } from "@/components/logout-button";
import { NavLinks } from "@/components/nav-links";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-indigo-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold text-primary">
              Financial Application
            </span>
            <NavLinks />
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}
