import { useEffect, useState } from 'react';
import axios from 'axios';
import { FileSearch } from 'lucide-react';

export default function ResultsTable({ uploadId }: { uploadId: string }) {
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        // Poll for results. In real production, paginate via Cursor or limit/offset to prevent large arrays freezing UI.
        const interval = setInterval(async () => {
            try {
               const res = await axios.get(`http://localhost:3000/api/v1/uploads/${uploadId}/results`);
               setResults(res.data);
            } catch(e) {}
        }, 3000);
        return () => clearInterval(interval);
    }, [uploadId]);

    if (results.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Inference Results</h3>
                <span className="text-sm font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">{results.length} items fetched</span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Input Context</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ICD Code</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Confidence</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reasoning</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {results.slice(0, 100).map((r) => (
                            <tr key={r.record_id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {r.processing_status === 'success' ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                            Mapped
                                        </span>
                                    ) : r.processing_status === 'failed' ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                            Failed
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                            Processing
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-900 line-clamp-2 w-64" title={r.input_text}>{r.input_text}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-slate-700 border border-slate-200 bg-white shadow-sm px-2.5 py-1 rounded inline-block">
                                        {r.icd_code || '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {r.confidence_score ? (
                                        <div className="flex items-center space-x-3">
                                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                                <div className={`h-full ${r.confidence_score > 0.8 ? 'bg-green-500' : r.confidence_score > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${r.confidence_score * 100}%` }}></div>
                                            </div>
                                            <span className={(r.confidence_score || 0) < 0.6 ? "text-red-500 font-bold" : "font-medium"}>{((r.confidence_score || 0) * 100).toFixed(1)}%</span>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative group">
                                       <div className="text-sm text-slate-600 truncate w-48 cursor-pointer">{r.reasoning_summary || '-'}</div>
                                       {r.reasoning_summary && (
                                         <div className="absolute hidden group-hover:block z-10 bottom-full mb-2 bg-slate-900 text-white text-xs rounded-lg p-3 w-64 shadow-xl border border-slate-700">
                                           {r.reasoning_summary}
                                         </div>
                                       )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {results.length > 100 && (
                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-center">
                     <p className="text-sm font-medium text-slate-500 flex items-center justify-center"><FileSearch className="w-4 h-4 mr-2" /> Showing newest 100 results... Dashboard currently optimized.</p>
                  </div>
                )}
            </div>
        </div>
    );
}
