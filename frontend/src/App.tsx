import { useState, useEffect } from 'react';
import UploadDashboard from './components/UploadDashboard';
import ProcessingMonitor from './components/ProcessingMonitor';
import ResultsTable from './components/ResultsTable';
import { Activity } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

export default function App() {
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, processed: 0, failed: 0 });

  useEffect(() => {
    if (activeUploadId) {
      socket.on(`progress:${activeUploadId}`, (data) => {
        setStats(data);
      });
    }
    return () => {
      if (activeUploadId) {
        socket.off(`progress:${activeUploadId}`);
      }
    };
  }, [activeUploadId]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-500 p-2 rounded-lg shadow shadow-brand-500/30">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-brand-600 bg-clip-text text-transparent">MedGamma AutoClaim</h1>
          </div>
          <div className="flex items-center space-x-4">
             {activeUploadId && stats.total > 0 && stats.processed + stats.failed === stats.total && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Processing Complete
                </span>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!activeUploadId ? (
          <UploadDashboard onUploadStart={(id) => setActiveUploadId(id)} />
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProcessingMonitor uploadId={activeUploadId} stats={stats} />
            <ResultsTable uploadId={activeUploadId} />
          </div>
        )}
      </main>
    </div>
  );
}
