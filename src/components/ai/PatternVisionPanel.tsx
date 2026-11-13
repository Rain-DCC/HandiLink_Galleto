import React, { useEffect, useState } from 'react';
import { gatewayFetch } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { INABAL_IMAGE, TANGGO_IMAGE, BEADED_BAG_IMAGE } from '../../utils/assets';
import {
  ScanSearch,
  Upload,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  History,
  Layers,
} from 'lucide-react';

interface VerificationRow {
  id: string;
  submitted_by: string;
  image_name: string;
  detected_motif: string;
  authenticity_score: number;
  cultural_match_status: string;
  analysis_summary: string;
  created_at: string;
}

const SAMPLE_SPECIMENS = [
  {
    label: 'Inabal Binituwon Specimen',
    file: 'product_inabal_textile_1793698251207.jpg',
    preview: INABAL_IMAGE,
    motifHint: 'Binituwon (Constellation of Stars)',
  },
  {
    label: 'Tanggo Binubaya Specimen',
    file: 'product_tanggo_blouse_1793698252532.jpg',
    preview: TANGGO_IMAGE,
    motifHint: 'Binubaya (Crocodile Diamond)',
  },
  {
    label: 'Kinara Beadwork Bag Specimen',
    file: 'product_beaded_bag_1793698252560.jpg',
    preview: BEADED_BAG_IMAGE,
    motifHint: 'Kinara (Mountain Ridges)',
  },
];

export const PatternVisionPanel: React.FC = () => {
  const { pushToast, patterns } = useApp();
  const [history, setHistory] = useState<VerificationRow[]>([]);
  const [selectedSample, setSelectedSample] = useState<string>(SAMPLE_SPECIMENS[0].file);
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [expectedMotif, setExpectedMotif] = useState<string>('Auto-Detect');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [latestResult, setLatestResult] = useState<{
    verification: VerificationRow;
    weaveTechnique?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await gatewayFetch<{ verifications: VerificationRow[] }>('/vision/history');
      setHistory(res.verifications || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load scan history.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid JPEG, PNG, or WebP textile photograph.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedDataUrl(String(reader.result || ''));
      setUploadedFileName(file.name);
      setSelectedSample('');
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsAnalyzing(true);
    try {
      const payload = uploadedDataUrl
        ? {
            imageName: uploadedFileName || 'uploaded_textile.jpg',
            imageDataUrl: uploadedDataUrl,
            expectedMotif,
          }
        : {
            imageName: selectedSample,
            sampleAssetPath: selectedSample,
            expectedMotif,
          };

      const res = await gatewayFetch<{ verification: VerificationRow; weaveTechnique?: string }>('/vision/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setLatestResult(res);
      setHistory(prev => [res.verification, ...prev]);
      pushToast(
        'success',
        `Pattern scan completed: ${res.verification.detected_motif} (${res.verification.authenticity_score}%)`
      );
    } catch (err: any) {
      const msg = err?.message || 'Pattern verification request failed.';
      setErrorMsg(msg);
      pushToast('error', msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activePreview =
    uploadedDataUrl || SAMPLE_SPECIMENS.find(s => s.file === selectedSample)?.preview || INABAL_IMAGE;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F] flex items-center gap-1.5">
            <ScanSearch className="w-3.5 h-3.5" />
            <span>Computer Vision Microservice</span>
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-1">
            Inabal Pattern & Authenticity Verification
          </h1>
          <p className="text-xs text-[#5A3825]/80 mt-1">
            Inspect woven textiles and beadwork against Bagobo-Tagabawa ancestral motif canons to guard against unauthorized imitations.
          </p>
        </div>
        <Badge variant="gold" size="md">
          FPIC Cultural IP Guard
        </Badge>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upload / Specimen Selection & Trigger */}
        <form
          onSubmit={handleAnalyze}
          className="lg:col-span-6 bg-white rounded-xl border border-[#C9A227]/30 p-6 shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#C9A227]/20 pb-3">
            <h2 className="font-serif font-bold text-lg text-[#3B2418]">1. Textile Specimen Input</h2>
            <span className="text-[11px] font-mono text-[#8C6B0F]">PatternVisionService</span>
          </div>

          <div className="aspect-16/10 rounded-xl overflow-hidden border border-[#C9A227]/40 bg-[#FAF6ED] relative">
            <img
              src={activePreview}
              alt="Specimen under analysis"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 right-3 bg-[#24150F]/85 text-[#F8F3E7] px-3 py-2 rounded-lg text-[11px] flex items-center justify-between backdrop-blur-xs">
              <span className="truncate font-medium">
                {uploadedFileName || SAMPLE_SPECIMENS.find(s => s.file === selectedSample)?.label || 'Specimen Ready'}
              </span>
              <span className="text-[#E5C76B] font-mono">Ready for Scan</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B2418] mb-2">
              Upload Loom / Garment Photo
            </label>
            <label className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-[#C9A227]/50 rounded-xl bg-[#FAF6ED] hover:bg-[#C9A227]/10 cursor-pointer text-xs font-semibold text-[#3B2418] transition-colors">
              <Upload className="w-4 h-4 text-[#8C6B0F]" />
              <span>{uploadedFileName ? `Selected: ${uploadedFileName}` : 'Choose JPEG / PNG textile photograph'}</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B2418] mb-2">
              Or Select Verified BIBATAWA Archive Specimen
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_SPECIMENS.map(sample => {
                const active = !uploadedDataUrl && selectedSample === sample.file;
                return (
                  <button
                    key={sample.file}
                    type="button"
                    onClick={() => {
                      setUploadedDataUrl('');
                      setUploadedFileName('');
                      setSelectedSample(sample.file);
                    }}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      active
                        ? 'border-[#C9A227] bg-[#FAF6ED] ring-1 ring-[#C9A227]'
                        : 'border-[#C9A227]/25 hover:border-[#C9A227]/60'
                    }`}
                  >
                    <img src={sample.preview} alt={sample.label} className="w-full h-16 object-cover rounded mb-1.5" />
                    <p className="text-[11px] font-semibold text-[#3B2418] line-clamp-1">{sample.label}</p>
                    <p className="text-[10px] text-[#8C6B0F] truncate">{sample.motifHint}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B2418] mb-1">
              Expected Motif Reference (Optional)
            </label>
            <select
              value={expectedMotif}
              onChange={e => setExpectedMotif(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-[#C9A227]/40 bg-[#FAF6ED] text-xs text-[#24150F]"
            >
              <option value="Auto-Detect">Auto-Detect Ancestral Motif</option>
              {patterns.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full py-3 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] disabled:opacity-60 font-bold text-xs uppercase tracking-wider rounded-lg shadow-md flex items-center justify-center gap-2 transition-colors"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Weave Geometry...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#C9A227]" />
                <span>Run Pattern Verification</span>
              </>
            )}
          </button>
        </form>

        {/* Right: Verification Result & Database History */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#FAF6ED] rounded-xl border border-[#C9A227]/35 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#C9A227]/20 pb-3">
              <h2 className="font-serif font-bold text-lg text-[#3B2418]">2. Cultural Authenticity Diagnostic</h2>
              <ShieldCheck className="w-5 h-5 text-[#C9A227]" />
            </div>

            {latestResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-lg border border-[#C9A227]/25">
                    <span className="text-[10px] uppercase font-bold text-[#8C6B0F] block">Detected Motif</span>
                    <span className="font-serif font-bold text-sm text-[#3B2418] mt-1 block">
                      {latestResult.verification.detected_motif}
                    </span>
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-[#C9A227]/25">
                    <span className="text-[10px] uppercase font-bold text-[#8C6B0F] block">Authenticity Score</span>
                    <span className="font-mono font-bold text-2xl text-[#3B2418] tabular-nums">
                      {latestResult.verification.authenticity_score}%
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-[#C9A227]/25 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#5A3825]">Match Status:</span>
                    <Badge
                      variant={
                        latestResult.verification.cultural_match_status.includes('Verified')
                          ? 'green'
                          : latestResult.verification.cultural_match_status.includes('Non-Traditional')
                          ? 'crimson'
                          : 'amber'
                      }
                    >
                      {latestResult.verification.cultural_match_status}
                    </Badge>
                  </div>
                  {latestResult.weaveTechnique && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#5A3825]">Weave / Craft Structure:</span>
                      <span className="font-medium text-[#3B2418]">{latestResult.weaveTechnique}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#C9A227]/15">
                    <span className="font-semibold text-[#3B2418] block mb-1">Technical Observation:</span>
                    <p className="text-[#5A3825] leading-relaxed">{latestResult.verification.analysis_summary}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-[#5A3825]/70 space-y-2">
                <Layers className="w-8 h-8 text-[#C9A227] mx-auto" />
                <p>Select a specimen or upload a textile photo and run verification to record an authenticity certificate.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#C9A227]/30 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#C9A227]/20 pb-3">
              <h3 className="font-serif font-bold text-base text-[#3B2418] flex items-center gap-2">
                <History className="w-4 h-4 text-[#C9A227]" />
                <span>Saved Verification Ledger</span>
              </h3>
              <span className="text-[11px] text-[#5A3825] font-mono tabular-nums">{history.length} scans</span>
            </div>

            {isLoadingHistory ? (
              <div className="py-8 flex items-center justify-center text-xs text-[#5A3825] gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />
                <span>Loading verification records...</span>
              </div>
            ) : history.length === 0 ? (
              <p className="text-xs text-[#5A3825]/70 py-6 text-center">No pattern scans recorded yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {history.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-[#FAF6ED] border border-[#C9A227]/25 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#3B2418] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#8C6B0F]" />
                        {item.detected_motif}
                      </span>
                      <span className="font-mono font-bold text-[#3B2418] tabular-nums">
                        {item.authenticity_score}%
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5A3825] line-clamp-2">{item.analysis_summary}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#5A3825]/70 pt-1">
                      <span>{item.image_name} · By {item.submitted_by}</span>
                      <span>{item.cultural_match_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
