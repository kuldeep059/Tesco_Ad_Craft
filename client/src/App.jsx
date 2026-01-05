import { useState } from 'react';

function App() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [history, setHistory] = useState([]); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // --- UPDATED DEPLOYMENT CONFIG ---
  // Vite uses import.meta.env to access variables. 
  // We use VITE_API_URL if it exists (on Vercel), otherwise fallback to localhost for dev.
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleReset = () => {
    setPreviewUrl(null);
    setPrompt("");
    setIsProcessing(false);
    setIsGenerating(false);
  };

  const deleteHistoryItem = (indexToDelete, e) => {
    e.stopPropagation();
    setHistory(prev => prev.filter((_, index) => index !== indexToDelete));
  };

  const clearAllHistory = () => {
    if (window.confirm("Clear all generated history?")) {
      setHistory([]);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsProcessing(true);
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      // Endpoint changed to /api/remove-bg to match the updated index.js
      const response = await fetch(`${API_BASE}/api/remove-bg`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        // Render returns the full URL now, so we add the cache-buster timestamp
        setPreviewUrl(`${data.imageUrl}?t=${Date.now()}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error: AI background removal failed. Check if Render server is awake.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateAd = async () => {
    if (!previewUrl) return;
    setIsGenerating(true);
    try {
      const cleanUrl = previewUrl.split('?')[0]; 
      // Note: If you haven't split the /generate endpoint yet, 
      // make sure your Render backend has an app.post('/api/generate')
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: cleanUrl, 
          prompt: prompt || "studio lighting" 
        }),
      });
      const data = await response.json();
      if (data.adUrl) {
        const newAd = `${data.adUrl}?t=${Date.now()}`;
        setPreviewUrl(newAd);
        setHistory(prev => [newAd, ...prev]); 
      }
    } catch (err) {
      alert("Error: Ad generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 font-sans">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-[#2563eb]">AdCraft AI</h1>
          <p className="text-slate-500 font-medium">Generative Creative Builder</p>
        </div>
        <div className="flex gap-4">
          {previewUrl && (
            <button onClick={handleReset} className="px-6 py-2 rounded-lg font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              Reset
            </button>
          )}
          {previewUrl?.includes('processed') && (
            <a href={previewUrl.split('?')[0]} download className="bg-[#2563eb] text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700">
              Download Result
            </a>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        <aside className="col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold mb-4 border-b pb-2 text-slate-700 font-black">1. ASSETS</h2>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
              <span className="text-2xl mb-1">📦</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Import Packshot</span>
              <input type="file" className="hidden" onChange={handleUpload} />
            </label>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold mb-4 border-b pb-2 text-slate-700 font-black">2. SCENE PROMPT</h2>
            <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold">Try: "Beach with a bright sun in the sky"</p>
            <textarea 
              value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the scene..."
              className="w-full p-3 border border-slate-200 rounded-xl text-sm h-32 resize-none outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={handleGenerateAd} disabled={isGenerating || !previewUrl}
              className={`w-full mt-4 py-3 rounded-xl font-bold text-white transition-all ${isGenerating || !previewUrl ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'}`}
            >
              {isGenerating ? "Synthesizing..." : "✨ Generate Creative"}
            </button>
          </div>
        </aside>

        <section className="col-span-7 bg-white rounded-3xl shadow-xl border border-slate-100 min-h-[550px] flex items-center justify-center relative overflow-hidden">
          {previewUrl ? (
            <img key={previewUrl} src={previewUrl} alt="Preview" className="max-w-full max-h-[500px] object-contain rounded-xl" />
          ) : (
            <div className="text-center text-slate-300">
              <div className="text-7xl mb-4 grayscale opacity-50">🖼️</div>
              <p className="font-bold tracking-tight">WAITING FOR PRODUCT...</p>
            </div>
          )}
          {(isProcessing || isGenerating) && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-20">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em]">{isProcessing ? "AI Background Removal" : "AI Scene Generation"}</p>
            </div>
          )}
        </section>

        <aside className="col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-black text-slate-700 text-xs tracking-widest uppercase">History</h2>
            {history.length > 0 && (
              <button onClick={clearAllHistory} className="text-[10px] text-red-500 font-bold hover:underline">CLEAR ALL</button>
            )}
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[550px] pr-2 scrollbar-hide">
            {history.length === 0 ? (
              <div className="h-32 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center">
                <p className="text-[10px] text-slate-300 font-bold uppercase">Empty</p>
              </div>
            ) : (
              history.map((url, index) => (
                <div 
                  key={index} 
                  onClick={() => setPreviewUrl(url)}
                  className="group relative cursor-pointer rounded-xl border-2 border-transparent hover:border-blue-500 overflow-hidden transition-all shadow-md bg-slate-50"
                >
                  <img src={url} alt={`History ${index}`} className="w-full h-24 object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  <button 
                    onClick={(e) => deleteHistoryItem(index, e)}
                    className="absolute top-2 right-2 bg-white/90 text-red-500 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm"
                  >
                    <span className="text-xs">✕</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
