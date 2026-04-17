import { useState } from 'react';
import { UploadCloud, FileType, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function UploadDashboard({ onUploadStart }: { onUploadStart: (id: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    
    try {
      const res = await axios.post('http://localhost:3000/api/v1/upload', form);
      onUploadStart(res.data.uploadId);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to upload file');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group transition-all duration-300 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 to-brand-600"></div>
      <div className="p-8 md:p-12 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Claims Batch</h2>
        <p className="text-slate-500 mb-8 max-w-lg mx-auto">Upload your raw medical claims (CSV) containing diagnostic text and procedure descriptions for automated MedGamma AI coding.</p>

        <div className="max-w-md mx-auto">
          {!file ? (
            <label className="flex justify-center w-full h-48 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-brand-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
                <span className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-brand-50 rounded-full">
                       <UploadCloud className="w-8 h-8 text-brand-500" />
                    </div>
                    <span className="font-medium text-slate-600">
                        Drop files to attach, or <span className="text-brand-600 underline">browse</span>
                    </span>
                    <span className="text-sm text-slate-400">CSV format (max 100k+ records)</span>
                </span>
                <input type="file" accept=".csv" name="file_upload" className="hidden" aria-label="File input" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          ) : (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-inner">
               <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-600 shadow-sm">
                    <FileType className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                     <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                     <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors">Remove</button>
               </div>
               
               {error && (
                 <div className="flex items-center p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
                   <AlertCircle className="w-4 h-4 mr-2" />
                   {error}
                 </div>
               )}

               <button 
                  onClick={handleUpload} 
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5 mr-2" />
                      Uploading via Stream...
                    </>
                  ) : (
                    <>Start Processing Queue</>
                  )}
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
