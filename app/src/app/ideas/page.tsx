import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { AIPanel } from "@/components/AIPanel";

export default function IdeasPage() {
  return (
    <div className="min-h-screen bg-[#0b0b0f]">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="min-h-[calc(100vh-4rem)] min-w-0 flex-1 overflow-auto pl-[240px]">
          <div className="p-6">
            <h1 className="mb-4 text-xl font-semibold text-white">Idea Generator</h1>
            <p className="text-sm text-[#71717a]">Generare idei virale din trenduri — în curând.</p>
          </div>
        </main>
        <AIPanel />
      </div>
    </div>
  );
}
