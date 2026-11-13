import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts';
import { createNotification, logAudit } from '../utils/audit.ts';

export const proposalComplianceRouter = Router();

function formatProposal(row: any) {
  return {
    id: row.id,
    proposalNumber: row.proposal_number,
    date: row.date,
    personInvolved: row.person_involved,
    organization: row.organization,
    address: row.address,
    subject: row.subject,
    letterContent: row.letter_content,
    status: row.status,
    submittedBy: row.submitted_by,
    submittedDate: row.submitted_date,
    targetCommunity: row.target_community,
    signature: row.signature,
    supportingDocuments: JSON.parse(row.supporting_documents || '[]'),
    evaluationRemarks: row.evaluation_remarks || '',
    evaluatedBy: row.evaluated_by || '',
    evaluationDate: row.evaluation_date || '',
  };
}

function formatResolution(row: any) {
  return {
    id: row.id,
    resolutionNumber: row.resolution_number,
    proposalId: row.proposal_id,
    proposalNumber: row.proposal_number,
    resolutionDate: row.resolution_date,
    partiesInvolved: JSON.parse(row.parties_involved || '[]'),
    resolutionContent: row.resolution_content,
    approvalStatus: row.approval_status,
    signedByNCIP: row.signed_by_ncip === 1,
    signedByBIBATAWA: row.signed_by_bibatawa === 1,
    signedByPartner: row.signed_by_partner === 1,
  };
}

// GET /api/gateway/proposals
proposalComplianceRouter.get('/proposals', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  const rows = db.prepare('SELECT * FROM proposals ORDER BY created_at DESC').all();
  res.json({ proposals: rows.map(formatProposal) });
});

// POST /api/gateway/proposals
proposalComplianceRouter.post(
  '/proposals',
  authenticate,
  requireRole('creative_director', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      personInvolved: z.string().trim().min(2, 'Recipient official is required.'),
      organization: z.string().trim().min(2, 'Organization / Agency is required.'),
      address: z.string().trim().optional().default(''),
      subject: z.string().trim().min(4, 'Subject is required.'),
      letterContent: z.string().trim().min(10, 'Letter content must be at least 10 characters.'),
      targetCommunity: z.string().trim().optional().default('Binugao Ancestral Domain, Toril, Davao City'),
      signature: z.string().trim().optional(),
      status: z.enum(['Draft', 'Submitted']).optional().default('Submitted'),
      supportingDocuments: z.array(z.string()).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid proposal payload.' });
      return;
    }

    const data = parsed.data;
    const count = (db.prepare('SELECT COUNT(*) as cnt FROM proposals').get() as { cnt: number }).cnt;
    const proposalId = `prop-${crypto.randomUUID().slice(0, 8)}`;
    const proposalNumber = `BIB-PROP-2026-${String(count + 3).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO proposals (
        id, proposal_number, date, person_involved, organization, address, subject, letter_content,
        status, submitted_by_id, submitted_by, submitted_date, target_community, signature, supporting_documents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      proposalId,
      proposalNumber,
      today,
      data.personInvolved,
      data.organization,
      data.address,
      data.subject,
      data.letterContent,
      data.status,
      req.user!.id,
      req.user!.name,
      today,
      data.targetCommunity,
      data.signature || req.user!.name,
      JSON.stringify(data.supportingDocuments || ['BIBATAWA_Charter_Ratified.pdf', 'Endorsement_Letter_Elders.pdf'])
    );

    if (data.status === 'Submitted') {
      createNotification({
        targetRole: 'ncip_secretary',
        title: 'New Proposal Submitted for Evaluation',
        message: `${proposalNumber}: ${data.subject} submitted by ${req.user!.name}.`,
        type: 'proposal',
      });
    }

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'ProposalComplianceService',
      action: 'CREATE_PROPOSAL',
      resourceType: 'proposal',
      resourceId: proposalId,
      details: `Created ${proposalNumber} (${data.status})`,
    });

    const created = db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId);
    res.status(201).json({ proposal: formatProposal(created) });
  }
);

// PUT /api/gateway/proposals/:id
proposalComplianceRouter.put(
  '/proposals/:id',
  authenticate,
  requireRole('creative_director', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM proposals WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Proposal not found.' });
      return;
    }

    const schema = z.object({
      personInvolved: z.string().trim().min(2).optional(),
      organization: z.string().trim().min(2).optional(),
      address: z.string().trim().optional(),
      subject: z.string().trim().min(4).optional(),
      letterContent: z.string().trim().min(10).optional(),
      status: z.enum(['Draft', 'Submitted', 'Under Review']).optional(),
      signature: z.string().trim().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid update payload.' });
      return;
    }

    const d = parsed.data;
    db.prepare(`
      UPDATE proposals
      SET person_involved = ?, organization = ?, address = ?, subject = ?, letter_content = ?, status = ?, signature = ?
      WHERE id = ?
    `).run(
      d.personInvolved ?? existing.person_involved,
      d.organization ?? existing.organization,
      d.address ?? existing.address,
      d.subject ?? existing.subject,
      d.letterContent ?? existing.letter_content,
      d.status ?? existing.status,
      d.signature ?? existing.signature,
      req.params.id
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'ProposalComplianceService',
      action: 'UPDATE_PROPOSAL',
      resourceType: 'proposal',
      resourceId: req.params.id,
      details: `Updated ${existing.proposal_number}`,
    });

    const updated = db.prepare('SELECT * FROM proposals WHERE id = ?').get(req.params.id);
    res.json({ proposal: formatProposal(updated) });
  }
);

// POST /api/gateway/proposals/:id/evaluate (NCIP Secretary / Admin)
proposalComplianceRouter.post(
  '/proposals/:id/evaluate',
  authenticate,
  requireRole('ncip_secretary', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM proposals WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Proposal not found.' });
      return;
    }

    const schema = z.object({
      decision: z.enum(['Approved', 'Revision Requested', 'Rejected']),
      remarks: z.string().trim().min(5, 'Please provide legal/cultural evaluation remarks.'),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid evaluation input.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const { decision, remarks } = parsed.data;

    let generatedResolution: any = null;

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE proposals
        SET status = ?, evaluation_remarks = ?, evaluated_by_id = ?, evaluated_by = ?, evaluation_date = ?
        WHERE id = ?
      `).run(decision, remarks, req.user!.id, req.user!.name, today, existing.id);

      if (decision === 'Approved') {
        const existingRes = db.prepare('SELECT * FROM partnership_resolutions WHERE proposal_id = ?').get(existing.id);
        if (!existingRes) {
          const resCount = (db.prepare('SELECT COUNT(*) as cnt FROM partnership_resolutions').get() as { cnt: number }).cnt;
          const resId = `res-${crypto.randomUUID().slice(0, 8)}`;
          const resNum = `NCIP-XI-BIB-RES-2026-${String(resCount + 19).padStart(3, '0')}`;
          const content = `OFFICIAL RESOLUTION ENDORSING COOPERATIVE UNDERTAKING FOR ${existing.subject.toUpperCase()}.\n\nPursuant to Republic Act No. 8371 (Indigenous Peoples Rights Act) and the unanimous Free, Prior and Informed Consent of the Council of Elders of the Binugao Ancestral Domain, this formal resolution authorizes the agreed commercial, educational, and cultural safeguards.\n\nRemarks: ${remarks}`;

          db.prepare(`
            INSERT INTO partnership_resolutions (id, resolution_number, proposal_id, proposal_number, resolution_date, parties_involved, resolution_content, approval_status, signed_by_ncip, signed_by_bibatawa, signed_by_partner)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved', 1, 1, 1)
          `).run(
            resId,
            resNum,
            existing.id,
            existing.proposal_number,
            today,
            JSON.stringify([
              'National Commission on Indigenous Peoples (NCIP Region XI)',
              'Binugao Bagobo-Tagabawa Women Weavers Association (BIBATAWA)',
              existing.organization,
            ]),
            content
          );
          generatedResolution = db.prepare('SELECT * FROM partnership_resolutions WHERE id = ?').get(resId);
        } else {
          generatedResolution = existingRes;
        }
      }
    });

    tx();

    createNotification({
      targetRole: 'creative_director',
      title: `Proposal ${decision}: ${existing.proposal_number}`,
      message: `${existing.subject} was evaluated as "${decision}" by ${req.user!.name}.`,
      type: 'proposal',
    });

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'ProposalComplianceService',
      action: `EVALUATE_PROPOSAL_${decision.toUpperCase().replace(/\s+/g, '_')}`,
      resourceType: 'proposal',
      resourceId: existing.id,
      details: remarks,
    });

    const updated = db.prepare('SELECT * FROM proposals WHERE id = ?').get(existing.id);
    res.json({
      proposal: formatProposal(updated),
      resolution: generatedResolution ? formatResolution(generatedResolution) : null,
    });
  }
);

// GET /api/gateway/resolutions
proposalComplianceRouter.get('/resolutions', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  const rows = db.prepare('SELECT * FROM partnership_resolutions ORDER BY created_at DESC').all();
  res.json({ resolutions: rows.map(formatResolution) });
});

// POST /api/gateway/resolutions
proposalComplianceRouter.post(
  '/resolutions',
  authenticate,
  requireRole('ncip_secretary', 'creative_director', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      proposalId: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Proposal ID is required.' });
      return;
    }

    const prop = db.prepare('SELECT * FROM proposals WHERE id = ?').get(parsed.data.proposalId) as any;
    if (!prop) {
      res.status(404).json({ error: 'Referenced proposal not found.' });
      return;
    }

    const resCount = (db.prepare('SELECT COUNT(*) as cnt FROM partnership_resolutions').get() as { cnt: number }).cnt;
    const resId = `res-${crypto.randomUUID().slice(0, 8)}`;
    const resNum = `NCIP-XI-BIB-RES-2026-${String(resCount + 19).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO partnership_resolutions (id, resolution_number, proposal_id, proposal_number, resolution_date, parties_involved, resolution_content, approval_status, signed_by_ncip, signed_by_bibatawa, signed_by_partner)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved', 1, 1, 1)
    `).run(
      resId,
      resNum,
      prop.id,
      prop.proposal_number,
      today,
      JSON.stringify([
        'National Commission on Indigenous Peoples (NCIP Region XI)',
        'Binugao Bagobo-Tagabawa Women Weavers Association (BIBATAWA)',
        prop.organization,
      ]),
      `OFFICIAL RESOLUTION ENDORSING COOPERATIVE UNDERTAKING FOR ${prop.subject.toUpperCase()}.\n\nPursuant to Republic Act No. 8371 (IPRA) and the endorsement of the Binugao Ancestral Domain Elders Council, this resolution ratifies ethical digital commerce safeguards and equitable benefit sharing.`
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'ProposalComplianceService',
      action: 'GENERATE_RESOLUTION',
      resourceType: 'resolution',
      resourceId: resId,
      details: `Generated ${resNum} from ${prop.proposal_number}`,
    });

    const created = db.prepare('SELECT * FROM partnership_resolutions WHERE id = ?').get(resId);
    res.status(201).json({ resolution: formatResolution(created) });
  }
);
