import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { MainWorkspace } from "@/components/MainWorkspace";
import { AIPanel } from "@/components/AIPanel";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0b0f]">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        {/* Main: content starts after 240px sidebar */}
        <main className="min-h-[calc(100vh-4rem)] min-w-0 flex-1 pl-[240px]">
          <MainWorkspace />
        </main>
        <AIPanel />
      </div>
    </div>
  );
}
