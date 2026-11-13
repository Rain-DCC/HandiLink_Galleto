import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { ShieldAlert, Search, RefreshCw } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, refreshAllData, isLoadingData } = useApp();
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All');

  const services = Array.from(new Set(auditLogs.map(l => l.service_name))).sort();

  const filtered = auditLogs.filter(l => {
    const matchesSearch =
      l.user_name.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    const matchesService = serviceFilter === 'All' || l.service_name === serviceFilter;
    return matchesSearch && matchesService;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F] flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Security & Microservice Governance</span>
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-1">
            API Gateway & System Audit Trail
          </h1>
          <p className="text-xs text-[#5A3825]/80 mt-1">
            Immutable operational log of authentication events, NCIP evaluations, payments, and AI service executions.
          </p>
        </div>
        <button
          onClick={refreshAllData}
          disabled={isLoadingData}
          className="px-4 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded-lg text-xs font-semibold flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-[#C9A227]/30 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Filter by actor, action, or details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#C9A227]/40 bg-[#FAF6ED] text-[#24150F]"
          />
          <Search className="w-3.5 h-3.5 text-[#5A3825]/60 absolute left-3 top-2.5" />
        </div>
        <select
          value={serviceFilter}
          onChange={e => setServiceFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-[#C9A227]/40 bg-[#FAF6ED] text-[#3B2418] font-medium"
        >
          <option value="All">All Microservices</option>
          {services.map(svc => (
            <option key={svc} value={svc}>
              {svc}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#C9A227]/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6ED] border-b border-[#C9A227]/30 text-[10px] uppercase font-bold tracking-wider text-[#5A3825]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Microservice</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor & Role</th>
                <th className="px-4 py-3">Resource Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A227]/15">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[#5A3825]/70">
                    No audit trail entries match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-[#FAF6ED]/60">
                    <td className="px-4 py-3 font-mono text-[11px] text-[#5A3825] whitespace-nowrap tabular-nums">
                      {log.created_at}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="brown" size="sm">
                        {log.service_name}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-[#3B2418]">{log.action}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#3B2418]">{log.user_name}</div>
                      <div className="text-[10px] text-[#8C6B0F] uppercase">{log.user_role}</div>
                    </td>
                    <td className="px-4 py-3 text-[#5A3825]">{log.details || `${log.resource_type}:${log.resource_id}`}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
