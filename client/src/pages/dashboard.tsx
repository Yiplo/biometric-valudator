import { useState } from "react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Fingerprint, LogOut, Database, History, Search } from "lucide-react";
import ValidationTab from "@/components/validation-tab";
import RegistryTab from "@/components/registry-tab";
import HistoryTab from "@/components/history-tab";

type TabType = "validation" | "registry" | "history";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("validation");
  const user = auth.getStoredUser();

  const handleLogout = () => {
    auth.clearStoredUser();
    window.location.reload();
  };

  const renderTabButton = (tab: TabType, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-6 py-3 font-mono text-sm border-b-2 transition-colors ${
        activeTab === tab
          ? "border-matrix text-matrix"
          : "border-transparent text-gray-400 hover:text-matrix"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "validation":
        return <ValidationTab />;
      case "registry":
        return <RegistryTab />;
      case "history":
        return <HistoryTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-matrix text-xl font-mono font-bold flex items-center">
              <Fingerprint className="mr-2" />
              BiometricAuth Portal
            </div>
            <div className="text-gray-400 text-sm font-mono">
              Sistema Nacional de Validación Biométrica
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm font-mono">
              <span className="text-gray-400">Status:</span>
              <span className="text-matrix ml-1">ONLINE</span>
              <span className="animate-pulse ml-1 text-matrix">●</span>
            </div>
            <div className="text-sm font-mono text-gray-400">
              Usuario: {user?.username}
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-red-400 hover:text-red-300 font-mono text-sm"
            >
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-dark-surface border-b border-dark-border">
        <div className="flex">
          {renderTabButton(
            "validation",
            <Search className="mr-2 h-4 w-4" />,
            "Validación Biométrica"
          )}
          {renderTabButton(
            "registry",
            <Database className="mr-2 h-4 w-4" />,
            "Padrón Electoral"
          )}
          {renderTabButton(
            "history",
            <History className="mr-2 h-4 w-4" />,
            "Historial"
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        {renderTabContent()}
      </main>
    </div>
  );
}
