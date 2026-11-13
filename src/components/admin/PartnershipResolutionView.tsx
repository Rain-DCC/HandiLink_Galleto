import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PartnershipResolution } from '../../types';
import { HANDILINK_LOGO } from '../../utils/assets';
import {
  Printer,
  Download,
  Plus,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const PartnershipResolutionView: React.FC = () => {
  const {
    resolutions,
    selectedResolution,
    setSelectedResolution,
    proposals,
    generateResolutionFromProposal,
  } = useApp();

  const [activeRes, setActiveRes] = useState<PartnershipResolution | undefined>(
    selectedResolution || resolutions[0]
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedPropIdForGen, setSelectedPropIdForGen] = useState(proposals[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeRes && (selectedResolution || resolutions[0])) {
      setActiveRes(selectedResolution || resolutions[0]);
    }
  }, [activeRes, resolutions, selectedResolution]);

  useEffect(() => {
    if (!selectedPropIdForGen && proposals[0]?.id) {
      setSelectedPropIdForGen(proposals[0].id);
    }
  }, [proposals, selectedPropIdForGen]);

  const handleGenerate = async () => {
    const prop = proposals.find(p => p.id === selectedPropIdForGen);
    if (!prop) return;
    setGenError(null);
    setIsGenerating(true);
    try {
      const newRes = await generateResolutionFromProposal(prop);
      setActiveRes(newRes);
      setIsGenerateModalOpen(false);
      setIsPreviewOpen(true);
    } catch (err: any) {
      setGenError(err?.message || 'Failed to generate partnership resolution.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadText = (res: PartnershipResolution) => {
    const docText = [
      'REPUBLIC OF THE PHILIPPINES',
      'NATIONAL COMMISSION ON INDIGENOUS PEOPLES (NCIP) & BIBATAWA',
      `RESOLUTION NO. ${res.resolutionNumber}`,
      `Date: ${res.resolutionDate}`,
      `Linked Proposal: ${res.proposalNumber}`,
      `Approval Status: ${res.approvalStatus}`,
      '',
      'PARTIES INVOLVED:',
      ...res.partiesInvolved.map(p => `- ${p}`),
      '',
      res.resolutionContent,
      '',
      'SIGNATORIES:',
      `NCIP XI: ${res.signedByNCIP ? 'DIGITALLY RATIFIED' : 'PENDING'}`,
      `BIBATAWA: ${res.signedByBIBATAWA ? 'RATIFIED' : 'PENDING'}`,
      `Partner: ${res.signedByPartner ? 'ACCEPTED' : 'PENDING'}`,
    ].join('\n');

    const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${res.resolutionNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
            Data Flow Process 3.0 · Legal & Cooperative Instruments
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-0.5">
            Partnership Resolutions
          </h1>
          <p className="text-xs sm:text-sm text-[#5A3825]/80">
            Official tripartite resolutions enacted under Republic Act No. 8371 (IPRA) and BIBATAWA Customary Law
          </p>
        </div>

        <button
          onClick={() => {
            setGenError(null);
            setIsGenerateModalOpen(true);
          }}
          disabled={proposals.length === 0}
          className="px-5 py-2.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] font-semibold text-xs tracking-wider uppercase rounded-lg flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto disabled:opacity-50"
        >
          <Plus className="w-4 h-4 text-[#C9A227]" />
          <span>Generate Resolution</span>
        </button>
      </div>

      {/* Resolutions List Cards */}
      {resolutions.length === 0 ? (
        <div className="bg-[#FAF6ED] p-10 rounded-xl border border-[#C9A227]/30 text-center text-sm text-[#5A3825]">
          No partnership resolutions have been issued yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resolutions.map(res => (
            <div
              key={res.id}
              className={`p-6 rounded-xl border transition-all space-y-4 ${
                activeRes?.id === res.id
                  ? 'bg-[#FAF6ED] border-[#C9A227] ring-1 ring-[#C9A227] shadow-md'
                  : 'bg-white border-[#C9A227]/30 hover:border-[#C9A227]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#3B2418]">
                  {res.resolutionNumber}
                </span>
                <Badge variant="green">{res.approvalStatus}</Badge>
              </div>

              <div>
                <div className="text-[11px] text-[#8C6B0F] font-semibold">
                  Linked Proposal: {res.proposalNumber}
                </div>
                <p className="font-serif font-bold text-base text-[#3B2418] mt-1 leading-snug">
                  Resolution Endorsing Ancestral IP Commercial Safeguards
                </p>
              </div>

              <div className="text-xs text-[#5A3825] space-y-1">
                <span className="font-semibold text-[#3B2418] block text-[11px]">Parties Involved:</span>
                <ul className="list-disc list-inside text-[11px] text-stone-700 pl-1 space-y-0.5">
                  {res.partiesInvolved.map((party, idx) => (
                    <li key={idx} className="truncate">{party}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-[#C9A227]/20 flex items-center justify-between text-xs">
                <span className="text-[#5A3825]/70 text-[11px]">Date: {res.resolutionDate}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadText(res)}
                    className="px-2.5 py-1.5 border border-[#C9A227]/40 text-[#3B2418] hover:bg-[#FAF6ED] rounded text-xs font-semibold flex items-center gap-1"
                    title="Download Text Certificate"
                  >
                    <Download className="w-3.5 h-3.5 text-[#8C6B0F]" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveRes(res);
                      setSelectedResolution(res);
                      setIsPreviewOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold text-xs tracking-wider uppercase transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C9A227]" />
                    <span>View Document</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Official Resolution Document Modal */}
      {activeRes && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Partnership Resolution: ${activeRes.resolutionNumber}`}
          subtitle={`Ratified: ${activeRes.resolutionDate} · Tripartite Ancestral Endorsement`}
          maxWidth="4xl"
        >
          <div className="bg-[#FFFDF9] p-8 sm:p-12 rounded-lg border-2 border-[#5A3825]/40 shadow-inner space-y-6 text-xs sm:text-sm text-[#24150F] font-serif leading-relaxed">
            <div className="text-center border-b-2 border-[#3B2418] pb-5 space-y-1 flex flex-col items-center">
              <img src={HANDILINK_LOGO} alt="HandiLink Official Seal" className="h-14 w-auto mb-2" />
              <div className="text-[10px] uppercase font-sans tracking-widest text-[#5A3825] font-bold">
                Republic of the Philippines · Office of the President
              </div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-[#3B2418]">
                NATIONAL COMMISSION ON INDIGENOUS PEOPLES (NCIP)
              </h2>
              <h3 className="font-serif font-bold text-sm sm:text-base text-[#5A3825]">
                IN JOINT COVENANT WITH THE BINUGAO BAGOBO-TAGABAWA WOMEN WEAVERS ASSOCIATION
              </h3>
              <p className="text-[10px] text-stone-500 font-sans">
                Ancestral Domain of Binugao, Toril District, Davao City · Region XI
              </p>
            </div>

            <div className="text-center py-2 space-y-1">
              <span className="font-mono text-xs font-bold text-[#8C6B0F] uppercase tracking-wider">
                RESOLUTION NO. {activeRes.resolutionNumber}
              </span>
              <h4 className="font-serif font-bold text-base sm:text-lg text-[#3B2418] max-w-2xl mx-auto">
                A RESOLUTION GRANTING ANCESTRAL DOMAIN CONSENT, TRADITIONAL KNOWLEDGE PROTECTION, AND COMMERCIAL AUTHORIZATION FOR HANDILINK DIGITAL ENGAGEMENTS
              </h4>
            </div>

            <div className="bg-[#FAF6ED] p-4 rounded-lg border border-[#C9A227]/30 font-sans text-xs space-y-1">
              <span className="font-bold text-[#3B2418] uppercase text-[10px] tracking-wider block">
                PARTIES SIGNATORY TO THIS COVENANT:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {activeRes.partiesInvolved.map((party, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border border-[#C9A227]/20 font-medium text-[#3B2418]">
                    {party}
                  </div>
                ))}
              </div>
            </div>

            <div className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-stone-800 font-sans bg-white p-5 rounded border border-stone-200">
              {activeRes.resolutionContent}
            </div>

            <div className="pt-8 font-sans grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
              <div className="border-t-2 border-stone-800 pt-2">
                <p className="font-bold text-[#3B2418]">Atty. Joshua Benitez</p>
                <p className="text-[10px] text-stone-600">Secretary & Legal Counsel, NCIP XI</p>
                <span className="text-[9px] text-emerald-800 font-bold block mt-1">
                  {activeRes.signedByNCIP ? '✓ DIGITALLY RATIFIED' : 'PENDING SIGNATURE'}
                </span>
              </div>

              <div className="border-t-2 border-stone-800 pt-2">
                <p className="font-bold text-[#3B2418]">Bae Carmelita Omba</p>
                <p className="text-[10px] text-stone-600">President & Elder, BIBATAWA</p>
                <span className="text-[9px] text-emerald-800 font-bold block mt-1">
                  {activeRes.signedByBIBATAWA ? '✓ THUMBPRINT & SIGNED' : 'PENDING SIGNATURE'}
                </span>
              </div>

              <div className="border-t-2 border-stone-800 pt-2">
                <p className="font-bold text-[#3B2418]">Samantha Reyes</p>
                <p className="text-[10px] text-stone-600">Creative Director, HandiLink Platform</p>
                <span className="text-[9px] text-emerald-800 font-bold block mt-1">
                  {activeRes.signedByPartner ? '✓ OPERATIONAL ACCEPTANCE' : 'PENDING SIGNATURE'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-2 pt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-[#C9A227]" />
                <span>Print Official Resolution</span>
              </button>
              <button
                onClick={() => handleDownloadText(activeRes)}
                className="px-4 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-[#C9A227]" />
                <span>Download .TXT</span>
              </button>
            </div>
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="px-5 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold text-xs uppercase"
            >
              Done
            </button>
          </div>
        </Modal>
      )}

      {/* Generate Resolution Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Official Partnership Resolution"
        subtitle="Transform an evaluated proposal into a binding tripartite legal covenant"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {genError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{genError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">
              Select Proposal:
            </label>
            <select
              value={selectedPropIdForGen}
              onChange={e => setSelectedPropIdForGen(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white text-[#3B2418] font-medium"
            >
              {proposals.map(p => (
                <option key={p.id} value={p.id}>
                  {p.proposalNumber} — {p.subject} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <p className="text-[#5A3825]/80 text-[11px] leading-relaxed">
            Generating this resolution will automatically allocate a unique NCIP-XI registry number and embed standard community benefit guarantees.
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#C9A227]/25">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setIsGenerateModalOpen(false)}
              className="px-4 py-2 border border-stone-300 rounded text-stone-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isGenerating || !selectedPropIdForGen}
              onClick={handleGenerate}
              className="px-5 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-60"
            >
              {isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isGenerating ? 'Generating...' : 'Generate Resolution'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
