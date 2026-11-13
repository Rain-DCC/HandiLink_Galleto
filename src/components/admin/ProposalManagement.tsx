import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Proposal } from '../../types';
import { gatewayFetch } from '../../services/apiClient';
import { HANDILINK_LOGO } from '../../utils/assets';
import {
  Plus,
  Printer,
  Search,
  Edit3,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const ProposalManagement: React.FC = () => {
  const {
    proposals,
    addProposal,
    selectedProposal,
    setSelectedProposal,
    currentUser,
    setCurrentView,
    refreshAllData,
    pushToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Proposal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [personInvolved, setPersonInvolved] = useState('');
  const [organization, setOrganization] = useState('');
  const [address, setAddress] = useState('');
  const [subject, setSubject] = useState('');
  const [letterContent, setLetterContent] = useState('');
  const [targetCommunity, setTargetCommunity] = useState('Binugao Ancestral Domain, Toril, Davao City');
  const [signature, setSignature] = useState(currentUser.name);

  const filteredProposals = proposals.filter(p => {
    const matchesSearch =
      p.proposalNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.subject.toLowerCase().includes(search.toLowerCase()) ||
      p.personInvolved.toLowerCase().includes(search.toLowerCase()) ||
      p.organization.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingDraft(null);
    setPersonInvolved('');
    setOrganization('');
    setAddress('');
    setSubject('');
    setLetterContent('');
    setTargetCommunity('Binugao Ancestral Domain, Toril, Davao City');
    setSignature(currentUser.name);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditDraftModal = (prop: Proposal) => {
    setEditingDraft(prop);
    setPersonInvolved(prop.personInvolved);
    setOrganization(prop.organization);
    setAddress(prop.address);
    setSubject(prop.subject);
    setLetterContent(prop.letterContent);
    setTargetCommunity(prop.targetCommunity);
    setSignature(prop.signature || currentUser.name);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveProposal = async (targetStatus: 'Draft' | 'Submitted') => {
    setFormError(null);
    if (!personInvolved.trim() || !organization.trim() || !subject.trim() || letterContent.trim().length < 10) {
      setFormError('Please provide recipient, organization, subject, and letter content (min. 10 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDraft) {
        await gatewayFetch(`/proposals/${editingDraft.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            personInvolved: personInvolved.trim(),
            organization: organization.trim(),
            address: address.trim(),
            subject: subject.trim(),
            letterContent: letterContent.trim(),
            signature: signature.trim() || currentUser.name,
            status: targetStatus,
          }),
        });
        await refreshAllData();
        pushToast(
          'success',
          targetStatus === 'Submitted'
            ? `Proposal ${editingDraft.proposalNumber} submitted for NCIP review.`
            : `Draft ${editingDraft.proposalNumber} updated.`
        );
      } else {
        await addProposal({
          personInvolved: personInvolved.trim(),
          organization: organization.trim(),
          address: address.trim(),
          subject: subject.trim(),
          letterContent: letterContent.trim(),
          targetCommunity: targetCommunity.trim(),
          signature: signature.trim() || currentUser.name,
          status: targetStatus,
        });
      }
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Unable to save proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPreview = (p: Proposal) => {
    setSelectedProposal(p);
    setIsPreviewModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
            Data Flow Process 1.0 · Institutional Engagement
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-0.5">
            Proposal Management
          </h1>
          <p className="text-xs sm:text-sm text-[#5A3825]/80">
            Formulation, submission, and document tracking for NCIP endorsements, government grants, and brand partnerships
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] font-semibold text-xs tracking-wider uppercase rounded-lg flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#C9A227]" />
          <span>Create Proposal</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-[#FAF6ED] p-4 rounded-xl border border-[#C9A227]/30 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search proposal #, recipient, subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F] placeholder-[#5A3825]/60 focus:border-[#C9A227]"
          />
          <Search className="w-4 h-4 text-[#5A3825]/60 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5A3825] font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded border border-[#C9A227]/40 bg-white text-[#3B2418] font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Revision Requested">Revision Requested</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Proposals Table */}
      <div className="bg-[#FAF6ED] rounded-xl border border-[#C9A227]/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#3B2418] text-[#E5C76B] font-serif uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Proposal No.</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Person Involved / Agency</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A227]/15">
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5A3825]/70">
                    No matching proposals found.
                  </td>
                </tr>
              ) : (
                filteredProposals.map(prop => (
                  <tr key={prop.id} className="hover:bg-white/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#3B2418]">
                      {prop.proposalNumber}
                    </td>
                    <td className="py-3.5 px-4 text-[#5A3825] whitespace-nowrap">{prop.date}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#3B2418]">{prop.personInvolved}</div>
                      <div className="text-[10px] text-[#5A3825]/75 truncate max-w-[180px]">
                        {prop.organization}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm truncate text-[#3B2418] font-medium">
                      {prop.subject}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          prop.status === 'Approved'
                            ? 'green'
                            : prop.status === 'Rejected'
                            ? 'crimson'
                            : prop.status === 'Under Review' || prop.status === 'Revision Requested'
                            ? 'amber'
                            : 'gold'
                        }
                      >
                        {prop.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-[#5A3825] whitespace-nowrap">
                      {prop.submittedBy}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => openPreview(prop)}
                        className="px-2.5 py-1 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded text-[11px] font-semibold transition-colors"
                      >
                        View
                      </button>
                      {(prop.status === 'Draft' || prop.status === 'Revision Requested') && (
                        <button
                          onClick={() => openEditDraftModal(prop)}
                          className="px-2.5 py-1 bg-white border border-[#C9A227]/50 text-[#3B2418] hover:bg-[#FAF6ED] rounded text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                      {prop.status === 'Approved' && (
                        <button
                          onClick={() => {
                            setSelectedProposal(prop);
                            setCurrentView('resolutions');
                          }}
                          className="px-2.5 py-1 bg-[#C9A227] text-[#24150F] hover:bg-[#E5C76B] rounded text-[11px] font-bold transition-colors"
                        >
                          Resolution
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Proposal Document Preview Modal */}
      {selectedProposal && (
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title={`Official Document: ${selectedProposal.proposalNumber}`}
          subtitle={`Status: ${selectedProposal.status} · Target: ${selectedProposal.organization}`}
          maxWidth="4xl"
        >
          <div className="bg-white p-8 sm:p-12 rounded-lg shadow-sm border border-stone-300 space-y-6 text-xs text-stone-800 font-serif leading-relaxed">
            <div className="text-center border-b-2 border-[#3B2418] pb-4 flex flex-col items-center">
              <img src={HANDILINK_LOGO} alt="HandiLink Official Seal" className="h-14 w-auto mb-2" />
              <h2 className="font-serif font-bold text-lg text-[#3B2418] tracking-wide">
                BINUGAO BAGOBO-TAGABAWA WOMEN WEAVERS ASSOCIATION
              </h2>
              <p className="text-[11px] text-[#5A3825] italic">
                (BIBATAWA) · Ancestral Domain Sustainable Livelihood & Cultural Protection Council
              </p>
              <p className="text-[10px] text-stone-500 font-sans mt-0.5">
                Sitio Binugao, Barangay Binugao, Toril District, Davao City 8000 · contact@bibatawa.org
              </p>
            </div>

            <div className="flex justify-between font-sans text-xs">
              <div>
                <span className="text-stone-500 block">Proposal Reference:</span>
                <span className="font-mono font-bold text-[#3B2418]">{selectedProposal.proposalNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-500 block">Date of Transmission:</span>
                <span className="font-bold text-[#3B2418]">{selectedProposal.date}</span>
              </div>
            </div>

            <div className="font-sans text-xs space-y-0.5 border-l-2 border-[#C9A227] pl-3 py-1 bg-[#FAF6ED]">
              <p className="font-bold text-[#3B2418] text-sm">{selectedProposal.personInvolved}</p>
              <p className="font-medium text-[#5A3825]">{selectedProposal.organization}</p>
              <p className="text-stone-600">{selectedProposal.address}</p>
            </div>

            <div className="font-sans text-xs border-y border-stone-200 py-2 font-bold text-[#3B2418]">
              SUBJECT: {selectedProposal.subject.toUpperCase()}
            </div>

            <div className="whitespace-pre-line text-xs sm:text-sm text-stone-800 leading-relaxed font-sans">
              {selectedProposal.letterContent}
            </div>

            {selectedProposal.evaluationRemarks && (
              <div className="p-4 rounded bg-[#FAF6ED] border border-[#C9A227]/40 font-sans space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#3B2418] uppercase">
                    Official NCIP Evaluation & Assessment
                  </span>
                  <Badge variant={selectedProposal.status === 'Approved' ? 'green' : 'amber'}>
                    {selectedProposal.status}
                  </Badge>
                </div>
                <p className="text-xs text-stone-700 italic">"{selectedProposal.evaluationRemarks}"</p>
                <p className="text-[10px] text-stone-500">
                  Evaluated by: {selectedProposal.evaluatedBy} on {selectedProposal.evaluationDate}
                </p>
              </div>
            )}

            <div className="pt-6 font-sans flex justify-between items-end">
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Submitted By / Endorsed:</span>
                <div className="mt-4 pt-2 border-t border-stone-400 font-bold text-[#3B2418]">
                  {selectedProposal.signature}
                </div>
                <span className="text-[11px] text-stone-500">{selectedProposal.submittedBy}</span>
              </div>

              <div className="text-right">
                <span className="text-stone-500 block text-[10px] uppercase">Ancestral Seal Verification:</span>
                <div className="mt-4 pt-2 border-t border-stone-400 font-mono text-[10px] text-[#8C6B0F]">
                  [ BIBATAWA ANCESTRAL SEAL VERIFIED ]
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-[#C9A227]" />
              <span>Print Official Letter</span>
            </button>
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="px-5 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold text-xs uppercase"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Create / Edit Draft Proposal Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingDraft ? `Update Proposal: ${editingDraft.proposalNumber}` : 'Draft New Institutional Proposal'}
        subtitle="Create formal letter of intent or partnership application for NCIP, DTI, or partners"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">
              Addressed To (Person Involved / Official) *
            </label>
            <input
              type="text"
              value={personInvolved}
              onChange={e => setPersonInvolved(e.target.value)}
              placeholder="e.g., Regional Director Cristito M. Dagadas"
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">
                Organization / Government Agency *
              </label>
              <input
                type="text"
                value={organization}
                onChange={e => setOrganization(e.target.value)}
                placeholder="e.g., National Commission on Indigenous Peoples"
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Official Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g., MacArthur Highway, Matina, Davao City"
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">Proposal Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g., Request for FPIC Certification & Export Endorsement"
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">Letter Content / Intent *</label>
            <textarea
              rows={6}
              value={letterContent}
              onChange={e => setLetterContent(e.target.value)}
              placeholder="State the objective, cultural integrity safeguards, benefit-sharing, and requested action..."
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Signatory / Endorser</label>
              <input
                type="text"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Target Community</label>
              <input
                type="text"
                value={targetCommunity}
                onChange={e => setTargetCommunity(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-[#C9A227]/30">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-stone-300 rounded text-stone-700 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveProposal('Draft')}
              className="px-4 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveProposal('Submitted')}
              className="px-5 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold uppercase tracking-wider shadow-sm flex items-center gap-1.5 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{editingDraft ? 'Save & Submit' : 'Submit Proposal'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
