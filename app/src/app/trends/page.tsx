import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { TrendAlerts } from "@/components/TrendAlerts";
import { AIPanel } from "@/components/AIPanel";

export default function TrendsPage() {
  return (
    <div className="min-h-screen bg-[#0b0b0f]">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="min-h-[calc(100vh-4rem)] min-w-0 flex-1 overflow-auto pl-[240px]">
          <div className="p-6">
            <h1 className="mb-4 text-xl font-semibold text-white">Trend Radar</h1>
            <p className="mb-6 text-sm text-[#71717a]">
              Trenduri detectate înainte să devină virale. Apasă Generate Video pentru a porni pipeline-ul.
            </p>
            <TrendAlerts />
          </div>
        </main>
        <AIPanel />
      </div>
    </div>
  );
}
