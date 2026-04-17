import { Activity, CheckCircle, XCircle } from 'lucide-react';

export default function ProcessingMonitor({ uploadId, stats }: { uploadId: string, stats: any }) {
    // If stats hasn't arrived via socket yet
    if (!stats || stats.total === 0) return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex items-center justify-center space-x-3 text-slate-500">
        <Activity className="animate-pulse w-5 h-5" />
        <span>Initializing MedGamma compute nodes...</span>
      </div>
    );

    const progress = Math.round(((stats.processed + stats.failed) / stats.total) * 100) || 0;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
            {progress === 100 && (
                <div className="absolute inset-x-0 top-0 h-1 bg-green-500"></div>
            )}
            
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Live AI Inference Pipeline</h3>
                    <p className="text-sm text-slate-500">Processing records via MedGamma LLM worker threads</p>
                </div>
                <div className="hidden sm:flex items-center space-x-2 text-sm">
                    <span className="flex h-3 w-3 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${progress < 100 ? 'bg-brand-400' : 'bg-green-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${progress < 100 ? 'bg-brand-500' : 'bg-green-500'}`}></span>
                    </span>
                    <span className="font-medium text-slate-700">{progress === 100 ? 'Inference Complete' : 'Active Compute...'}</span>
                </div>
            </div>

            <div className="relative pt-1 mb-8">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-brand-600 bg-brand-100">
                    {progress}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-slate-600">
                    {stats.processed + stats.failed} / {stats.total} Records
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-100">
                <div style={{ width: `${progress}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-700 ${progress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-brand-500 to-brand-400'}`}></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center space-x-3 text-slate-600 mb-2">
                        <Activity className="w-5 h-5" />
                        <span className="font-medium">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stats.total.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center space-x-3 text-green-700 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Successful</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{stats.processed.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center space-x-3 text-red-700 mb-2">
                        <XCircle className="w-5 h-5" />
                        <span className="font-medium">Failed</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">{stats.failed.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}
