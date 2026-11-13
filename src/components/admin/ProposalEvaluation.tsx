import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckSquare,
  FileText,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const ProposalEvaluation: React.FC = () => {
  const {
    proposals,
    evaluateProposal,
    selectedProposal,
    setSelectedProposal,
    currentUser,
    setCurrentView,
  } = useApp();

  const [activeProposalId, setActiveProposalId] = useState<string>(
    selectedProposal?.id || proposals[0]?.id || ''
  );

  useEffect(() => {
    if (!activeProposalId && (selectedProposal?.id || proposals[0]?.id)) {
      setActiveProposalId(selectedProposal?.id || proposals[0].id);
    }
  }, [activeProposalId, proposals, selectedProposal]);

  const activeProp = proposals.find(p => p.id === activeProposalId) || proposals[0];

  const [decision, setDecision] = useState<'Approved' | 'Revision Requested' | 'Rejected'>('Approved');
  const [remarks, setRemarks] = useState(
    'Evaluated compliant under the IPRA Law (RA 8371) and NCIP Guidelines. Cultural integrity and fair compensation verified.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProp) return;
    setErrorMessage(null);
    setSuccessMessage(false);
    setIsSubmitting(true);
    try {
      await evaluateProposal(activeProp.id, decision, remarks);
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to submit evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
            NCIP Secretary & Indigenous Integrity Desk
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-0.5">
            Proposal Evaluation & Cultural Review
          </h1>
          <p className="text-xs sm:text-sm text-[#5A3825]/80">
            Adjudicate incoming institutional partnerships, FPIC protocols, and cooperative agreements
          </p>
        </div>

        <button
          onClick={() => setCurrentView('resolutions')}
          className="px-4 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <span>View Partnership Resolutions</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#C9A227]" />
        </button>
      </div>

      {proposals.length === 0 ? (
        <div className="bg-[#FAF6ED] p-10 rounded-xl border border-[#C9A227]/30 text-center text-sm text-[#5A3825]">
          No institutional proposals are currently queued for evaluation.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Proposals Selection + Information View */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#FAF6ED] p-3 rounded-xl border border-[#C9A227]/30 flex flex-wrap gap-2">
              {proposals.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProposalId(p.id);
                    setSelectedProposal(p);
                  }}
                  className={`px-3 py-2 text-xs rounded-lg font-medium transition-all text-left flex flex-col ${
                    activeProp?.id === p.id
                      ? 'bg-[#3B2418] text-[#E5C76B] font-bold shadow-xs'
                      : 'bg-white text-[#5A3825] hover:bg-white/80'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-80">{p.proposalNumber}</span>
                  <span className="truncate max-w-[180px]">{p.subject}</span>
                </button>
              ))}
            </div>

            {activeProp && (
              <div className="bg-white rounded-xl border border-[#C9A227]/30 shadow-md p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#C9A227]/20 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-[#8C6B0F] uppercase font-bold tracking-wider">
                      Official Reference: {activeProp.proposalNumber}
                    </span>
                    <h2 className="font-serif font-bold text-xl text-[#3B2418] mt-0.5">
                      {activeProp.subject}
                    </h2>
                  </div>
                  <Badge
                    variant={
                      activeProp.status === 'Approved'
                        ? 'green'
                        : activeProp.status === 'Rejected'
                        ? 'crimson'
                        : 'amber'
                    }
                  >
                    {activeProp.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF6ED] p-4 rounded-lg border border-[#C9A227]/20">
                  <div>
                    <span className="text-stone-500 block text-[10px] uppercase font-semibold">
                      Submitted By:
                    </span>
                    <p className="font-bold text-[#3B2418]">{activeProp.submittedBy}</p>
                    <p className="text-stone-600">{activeProp.targetCommunity}</p>
                    <p className="text-stone-500 text-[10px] mt-1">Date: {activeProp.submittedDate}</p>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px] uppercase font-semibold">
                      Addressed Official / Agency:
                    </span>
                    <p className="font-bold text-[#3B2418]">{activeProp.personInvolved}</p>
                    <p className="text-stone-600">{activeProp.organization}</p>
                    <p className="text-stone-500 text-[10px] mt-1">{activeProp.address}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-sm text-[#3B2418] uppercase tracking-wider mb-2">
                    Letter of Intent & Terms
                  </h3>
                  <div className="bg-[#FAF6ED]/50 p-4 rounded-lg border border-stone-200 text-xs sm:text-sm text-stone-800 whitespace-pre-line leading-relaxed font-sans">
                    {activeProp.letterContent}
                  </div>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-sm text-[#3B2418] uppercase tracking-wider mb-2">
                    Supporting Documents & Certifications
                  </h3>
                  <div className="space-y-2">
                    {activeProp.supportingDocuments.map((doc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 bg-white border border-[#C9A227]/25 rounded text-xs text-[#3B2418]"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#C9A227]" />
                          <span className="font-medium">{doc}</span>
                        </div>
                        <span className="text-[11px] text-[#8C6B0F] font-semibold">Verified Attach</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: NCIP Formal Evaluation Decision Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#FAF6ED] p-6 sm:p-8 rounded-xl border border-[#C9A227]/30 shadow-md space-y-6">
              <div className="border-b border-[#C9A227]/20 pb-3">
                <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
                  Process 2.0 Evaluation Desk
                </span>
                <h2 className="font-serif font-bold text-lg text-[#3B2418] mt-0.5">
                  Evaluation Decision
                </h2>
                <p className="text-xs text-[#5A3825]/80 mt-1">
                  Enter legal review notes and render decision pursuant to Bagobo-Tagabawa customary rights.
                </p>
              </div>

              <form onSubmit={handleSubmitEvaluation} className="space-y-5 text-xs">
                <div>
                  <label className="block font-semibold text-[#3B2418] uppercase tracking-wider mb-2">
                    Legal & Cultural Decision:
                  </label>
                  <div className="space-y-2">
                    {(
                      [
                        {
                          id: 'Approved',
                          title: 'Approve & Ratify Partnership',
                          desc: 'Generates official Partnership Resolution and grants FPIC endorsement.',
                        },
                        {
                          id: 'Revision Requested',
                          title: 'Request Revision',
                          desc: 'Requires proponent to adjust commercial terms or benefit percentages.',
                        },
                        {
                          id: 'Rejected',
                          title: 'Reject Proposal',
                          desc: 'Proposal violates customary protocols or lacks sufficient community consent.',
                        },
                      ] as const
                    ).map(opt => (
                      <div
                        key={opt.id}
                        onClick={() => setDecision(opt.id)}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                          decision === opt.id
                            ? 'bg-[#C9A227]/15 border-[#C9A227] ring-1 ring-[#C9A227]'
                            : 'bg-white border-[#C9A227]/25 hover:border-[#C9A227]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="decision"
                            checked={decision === opt.id}
                            onChange={() => setDecision(opt.id)}
                            className="accent-[#3B2418]"
                          />
                          <span className="font-serif font-bold text-sm text-[#3B2418]">{opt.title}</span>
                        </div>
                        <p className="text-[11px] text-[#5A3825]/80 ml-5 mt-1">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#3B2418] uppercase tracking-wider mb-1.5">
                    Evaluation Remarks / Legal Findings *
                  </label>
                  <textarea
                    required
                    minLength={5}
                    rows={5}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Detail findings regarding IPRA adherence, fair trade pricing, and cultural motif protection..."
                    className="w-full px-3 py-2 rounded-lg border border-[#C9A227]/40 bg-white leading-relaxed"
                  />
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#C9A227]/20 text-[11px] space-y-1">
                  <div className="flex justify-between text-[#5A3825]">
                    <span>Evaluator:</span>
                    <span className="font-semibold text-[#3B2418]">{currentUser.name}</span>
                  </div>
                  <div className="flex justify-between text-[#5A3825]">
                    <span>Role:</span>
                    <span>{currentUser.roleTitle}</span>
                  </div>
                  <div className="flex justify-between text-[#5A3825]">
                    <span>Date:</span>
                    <span className="font-mono">{new Date().toISOString().split('T')[0]}</span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Evaluation recorded successfully! Resolution updated.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] font-semibold text-xs tracking-wider uppercase rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />
                  ) : (
                    <CheckSquare className="w-4 h-4 text-[#C9A227]" />
                  )}
                  <span>{isSubmitting ? 'Recording Evaluation...' : 'Submit Evaluation'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
