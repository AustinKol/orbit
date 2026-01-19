'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphEdge, EdgeType, EDGE_LABELS, EDGE_COLORS, GraphNode } from '@/types';
import { X, FileText, PieChart as PieChartIcon, Calendar, DollarSign, Percent, TrendingUp, Newspaper, AlertTriangle, Package, Handshake, ArrowRight, ChevronUp, Link2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RelationshipCardProps {
  edge: GraphEdge;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  allRelationships?: Array<{ edge: GraphEdge; source: GraphNode; target: GraphNode }>;
  onRelationshipChange?: (edge: GraphEdge, source: GraphNode, target: GraphNode) => void;
  onClose: () => void;
}

interface RelationshipData {
  description: string;
  pieChartData?: Array<{ name: string; value: number; color: string }>;
  secFilings?: Array<{ date: string; type: string; title: string; link?: string }>;
  financialData?: Array<{ label: string; value: string; icon?: React.ReactNode }>;
  supplyChainInfo?: {
    tiers?: Array<{ tier: string; suppliers: string[] }>;
    locations?: string[];
    riskLevel?: 'Low' | 'Medium' | 'High';
    riskFactors?: string[];
  };
  partnershipInfo?: {
    projects?: Array<{ name: string; status: string; value: string }>;
    milestones?: Array<{ date: string; event: string }>;
    collaboration?: string[];
  };
  news?: Array<{ date: string; title: string; source: string; summary: string; link?: string }>;
}

// Generate relationship data based on type
function getRelationshipData(type: EdgeType, sourceNode: GraphNode, targetNode: GraphNode, edgeData?: any): RelationshipData {
  const base = {
    description: `${sourceNode.label} ${EDGE_LABELS[type].toLowerCase()} ${targetNode.label}`,
  };

  switch (type) {
    case EdgeType.Ownership:
      return {
        ...base,
        description: `Investment ownership: ${sourceNode.label} holds ${edgeData?.percentage || '15.2'}% equity stake in ${targetNode.label} through institutional investment`,
        pieChartData: [
          { name: sourceNode.label, value: edgeData?.percentage || 15.2, color: '#8b5cf6' },
          { name: 'Public Float', value: 45.8, color: '#3b82f6' },
          { name: 'Institutional', value: 32.5, color: '#06b6d4' },
          { name: 'Other', value: 6.5, color: '#64748b' },
        ],
        secFilings: [
          { date: '2024-12-15', type: '13D', title: 'Statement of Beneficial Ownership', link: 'https://www.sec.gov' },
          { date: '2024-11-20', type: '13G', title: 'Schedule 13G Filing', link: 'https://www.sec.gov' },
          { date: '2024-09-05', type: '4', title: 'Statement of Changes in Beneficial Ownership', link: 'https://www.sec.gov' },
          { date: '2024-06-12', type: '13D/A', title: 'Amendment to Beneficial Ownership Statement', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Ownership %', value: `${edgeData?.percentage || 15.2}%`, icon: <Percent size={16} /> },
          { label: 'Market Value', value: '$2.4B', icon: <DollarSign size={16} /> },
          { label: 'Voting Power', value: '15.2%', icon: <TrendingUp size={16} /> },
        ],
      };

    case EdgeType.Partnership:
      return {
        ...base,
        description: `Strategic partnership between ${sourceNode.label} and ${targetNode.label} covering joint R&D and market expansion`,
        pieChartData: [
          { name: sourceNode.label, value: 45, color: '#3b82f6' },
          { name: targetNode.label, value: 35, color: '#06b6d4' },
          { name: 'Joint Investment', value: 20, color: '#10b981' },
        ],
        secFilings: [
          { date: '2024-12-01', type: '8-K', title: 'Strategic Partnership Announcement', link: 'https://www.sec.gov' },
          { date: '2024-11-15', type: '10-Q', title: 'Q3 Partnership Revenue: $120M', link: 'https://www.sec.gov' },
          { date: '2024-08-22', type: '8-K', title: 'Partnership Agreement Amendment', link: 'https://www.sec.gov' },
          { date: '2024-05-10', type: '10-Q', title: 'Q2 Joint Venture Performance Report', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Joint Revenue', value: '$120M', icon: <DollarSign size={16} /> },
          { label: 'Equity Split', value: '45/35%', icon: <Percent size={16} /> },
          { label: 'Duration', value: '5 Years', icon: <Calendar size={16} /> },
        ],
        partnershipInfo: {
          projects: [
            { name: 'Cloud Infrastructure Initiative', status: 'Active', value: '$85M' },
            { name: 'AI Research Collaboration', status: 'Active', value: '$45M' },
            { name: 'Market Expansion Program', status: 'Planning', value: '$35M' },
            { name: 'Sustainable Technology Lab', status: 'Active', value: '$28M' },
          ],
          milestones: [
            { date: '2024-12-15', event: 'Partnership extended through 2029' },
            { date: '2024-09-20', event: 'Reached $500M cumulative joint revenue milestone' },
            { date: '2024-06-10', event: 'Launched joint AI research center' },
            { date: '2024-03-05', event: 'Expanded partnership to 12 new markets' },
            { date: '2023-11-18', event: 'Initial partnership agreement signed' },
          ],
          collaboration: ['Joint R&D', 'Market Development', 'Technology Licensing', 'Supply Chain Integration', 'Customer Co-Marketing'],
        },
        news: [
          { date: '2024-12-18', title: `${sourceNode.label} and ${targetNode.label} Announce Partnership Extension Through 2029`, source: 'Tech Business Today', summary: 'Strategic partners commit to extended collaboration with increased investment in joint R&D initiatives totaling $150M', link: '#' },
          { date: '2024-11-28', title: 'Partnership Reaches $500M Revenue Milestone Ahead of Schedule', source: 'Financial Times', summary: 'Collaboration between tech giants exceeds revenue projections, demonstrating strong market traction', link: '#' },
          { date: '2024-10-12', title: 'Joint AI Research Center Opens in Silicon Valley', source: 'Innovation Weekly', summary: 'New collaborative research facility to house 200 engineers and scientists working on next-generation AI technologies', link: '#' },
          { date: '2024-08-30', title: `${sourceNode.label} and ${targetNode.label} Expand Partnership to 12 New Markets`, source: 'Global Business News', summary: 'Strategic alliance expands international presence with focus on emerging markets in Asia and Latin America', link: '#' },
          { date: '2024-07-15', title: 'Partnership Drives Innovation in Sustainable Technology Solutions', source: 'Environmental Tech Review', summary: 'Collaboration produces breakthrough in sustainable manufacturing processes, reducing carbon footprint by 35%', link: '#' },
          { date: '2024-05-22', title: 'Q2 Partnership Performance Exceeds Analyst Expectations', source: 'Market Watch Daily', summary: 'Strong quarterly results driven by successful product launches and effective market penetration strategies', link: '#' },
          { date: '2024-04-05', title: 'Industry Leaders Collaborate on Industry 4.0 Standards', source: 'Manufacturing Today', summary: 'Joint effort to establish industry standards for smart manufacturing and digital transformation', link: '#' },
        ],
      };

    case EdgeType.Client:
      const clientServices = edgeData?.services || ['Enterprise Software Solutions', 'Cloud Infrastructure Services', 'Professional Consulting'];
      return {
        ...base,
        description: `${targetNode.label} is a major client of ${sourceNode.label}, representing ${edgeData?.revenuePercent || '12.3'}% of annual revenue. Services provided: ${clientServices.join(', ')}`,
        pieChartData: [
          { name: targetNode.label, value: edgeData?.revenuePercent || 12.3, color: '#10b981' },
          { name: 'Top 10 Clients', value: 35.7, color: '#06b6d4' },
          { name: 'Other Clients', value: 52.0, color: '#64748b' },
        ],
        secFilings: [
          { date: '2024-11-30', type: '10-K', title: 'Annual Report - Client Concentration Risk', link: 'https://www.sec.gov' },
          { date: '2024-09-10', type: '8-K', title: 'Major Client Contract Renewal', link: 'https://www.sec.gov' },
          { date: '2024-06-18', type: '10-Q', title: 'Q2 Client Revenue Breakdown', link: 'https://www.sec.gov' },
          { date: '2024-03-15', type: '10-K', title: 'Client Relationship Disclosure', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Annual Revenue', value: '$450M', icon: <DollarSign size={16} /> },
          { label: 'Contract Value', value: '$2.1B', icon: <DollarSign size={16} /> },
          { label: 'Contract Length', value: '3 Years', icon: <Calendar size={16} /> },
        ],
      };

    case EdgeType.Supplier:
      const supplierGoods = edgeData?.goods || ['Semiconductor Chips', 'Raw Materials', 'Manufacturing Components'];
      return {
        ...base,
        description: `${targetNode.label} supplies critical components to ${sourceNode.label}, representing ${edgeData?.costPercent || '8.5'}% of COGS. Goods supplied: ${supplierGoods.join(', ')}`,
        pieChartData: [
          { name: targetNode.label, value: edgeData?.costPercent || 8.5, color: '#f59e0b' },
          { name: 'Top 5 Suppliers', value: 28.3, color: '#fb923c' },
          { name: 'Other Suppliers', value: 63.2, color: '#64748b' },
        ],
        secFilings: [
          { date: '2024-12-05', type: '10-Q', title: 'Supply Chain Risk Assessment', link: 'https://www.sec.gov' },
          { date: '2024-10-22', type: '8-K', title: 'Long-term Supplier Agreement Signed', link: 'https://www.sec.gov' },
          { date: '2024-07-08', type: '10-Q', title: 'Supplier Dependency Disclosure', link: 'https://www.sec.gov' },
          { date: '2024-04-12', type: '10-K', title: 'Annual Supply Chain Report', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Annual Purchase', value: '$180M', icon: <DollarSign size={16} /> },
          { label: 'COGS %', value: '8.5%', icon: <Percent size={16} /> },
          { label: 'Agreement Term', value: '4 Years', icon: <Calendar size={16} /> },
        ],
        supplyChainInfo: {
          tiers: [
            { tier: 'Tier 1 (Direct)', suppliers: [targetNode.label, 'Advanced Materials Co.', 'Precision Components Ltd.'] },
            { tier: 'Tier 2 (Sub-suppliers)', suppliers: ['Global Raw Materials Inc.', 'Specialized Manufacturing Corp.'] },
            { tier: 'Tier 3 (Raw Materials)', suppliers: ['Mining Operations Group', 'Chemical Suppliers Network'] },
          ],
          locations: ['Taiwan', 'Singapore', 'South Korea', 'Mexico', 'United States'],
          riskLevel: 'Medium' as const,
          riskFactors: ['Geopolitical tensions in region', 'Single-source dependency for 15% of critical components', 'Currency fluctuation exposure'],
        },
        news: [
          { date: '2024-12-10', title: `${targetNode.label} Expands Manufacturing Capacity to Meet ${sourceNode.label} Demand`, source: 'Supply Chain Times', summary: 'Supplier announces $200M expansion to support growing demand from key client, expected to increase capacity by 40%', link: '#' },
          { date: '2024-11-22', title: `${sourceNode.label} and ${targetNode.label} Sign 5-Year Supply Agreement`, source: 'Tech Manufacturing News', summary: 'Long-term agreement secures supply chain stability with guaranteed pricing and volume commitments', link: '#' },
          { date: '2024-10-15', title: 'Supply Chain Diversification: What Companies Are Learning', source: 'Business Weekly', summary: 'Analysis of supply chain strategies including how major manufacturers manage critical supplier relationships', link: '#' },
          { date: '2024-09-08', title: `${targetNode.label} Reports Strong Q3 Performance Driven by ${sourceNode.label} Partnership`, source: 'Financial Markets Daily', summary: 'Supplier\'s quarterly earnings exceed expectations, attributed to strong relationship with major tech client', link: '#' },
          { date: '2024-08-20', title: 'ESG Standards in Supply Chain: New Requirements for Suppliers', source: 'Sustainable Business Review', summary: 'How supply chain partnerships are evolving to meet environmental and social governance requirements', link: '#' },
        ],
      };

    case EdgeType.Creditor:
      const loanTypes = edgeData?.loanTypes || ['Term Loan', 'Revolving Credit Facility', 'Interest Rate Swaps'];
      return {
        ...base,
        description: `${sourceNode.label} is a creditor to ${targetNode.label} with outstanding debt of ${edgeData?.amount || '$350M'}. Instruments: ${loanTypes.join(', ')}`,
        pieChartData: [
          { name: sourceNode.label, value: edgeData?.percentage || 18.5, color: '#ef4444' },
          { name: 'Bank Loans', value: 42.3, color: '#ec4899' },
          { name: 'Bonds', value: 28.7, color: '#f59e0b' },
          { name: 'Other Debt', value: 10.5, color: '#64748b' },
        ],
        secFilings: [
          { date: '2024-11-25', type: '8-K', title: 'Debt Restructuring Agreement', link: 'https://www.sec.gov' },
          { date: '2024-10-08', type: '10-Q', title: 'Q3 Debt Obligations Report', link: 'https://www.sec.gov' },
          { date: '2024-07-14', type: '8-K', title: 'Credit Facility Amendment', link: 'https://www.sec.gov' },
          { date: '2024-04-20', type: '10-K', title: 'Annual Debt Schedule', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Outstanding Debt', value: edgeData?.amount || '$350M', icon: <DollarSign size={16} /> },
          { label: 'Interest Rate', value: '4.25%', icon: <Percent size={16} /> },
          { label: 'Maturity', value: '2027-06-30', icon: <Calendar size={16} /> },
        ],
      };

    case EdgeType.Debtor:
      const debtTypes = edgeData?.debtTypes || ['Trade Credit', 'Currency Swaps', 'Short-term Notes'];
      return {
        ...base,
        description: `${sourceNode.label} owes ${edgeData?.amount || '$125M'} to ${targetNode.label}. Debt instruments: ${debtTypes.join(', ')}`,
        pieChartData: [
          { name: targetNode.label, value: edgeData?.percentage || 22.3, color: '#ec4899' },
          { name: 'Trade Credit', value: 35.8, color: '#ef4444' },
          { name: 'Other Payables', value: 41.9, color: '#64748b' },
        ],
        secFilings: [
          { date: '2024-12-10', type: '10-Q', title: 'Accounts Payable Aging Report', link: 'https://www.sec.gov' },
          { date: '2024-09-28', type: '8-K', title: 'Payment Schedule Amendment', link: 'https://www.sec.gov' },
          { date: '2024-06-25', type: '10-Q', title: 'Q2 Debt Obligations', link: 'https://www.sec.gov' },
          { date: '2024-03-18', type: '10-K', title: 'Annual Payables Disclosure', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Amount Owed', value: edgeData?.amount || '$125M', icon: <DollarSign size={16} /> },
          { label: 'Due Date', value: '2025-03-15', icon: <Calendar size={16} /> },
          { label: 'Payment Terms', value: 'Net 60', icon: <FileText size={16} /> },
        ],
      };

    case EdgeType.Licensing:
      return {
        ...base,
        description: `Licensing agreement where ${sourceNode.label} licenses ${edgeData?.technology || 'patents'} to ${targetNode.label}`,
        pieChartData: [
          { name: 'Royalty Revenue', value: edgeData?.percentage || 15.2, color: '#6366f1' },
          { name: 'Product Revenue', value: 62.8, color: '#3b82f6' },
          { name: 'Services', value: 22.0, color: '#06b6d4' },
        ],
        secFilings: [
          { date: '2024-11-18', type: '8-K', title: 'New Licensing Agreement Executed', link: 'https://www.sec.gov' },
          { date: '2024-09-05', type: '10-Q', title: 'Q3 Royalty Revenue: $45M', link: 'https://www.sec.gov' },
          { date: '2024-06-12', type: '8-K', title: 'License Agreement Amendment', link: 'https://www.sec.gov' },
          { date: '2024-03-22', type: '10-K', title: 'Annual Licensing Portfolio Report', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Annual Royalty', value: '$45M', icon: <DollarSign size={16} /> },
          { label: 'Royalty Rate', value: '3.5%', icon: <Percent size={16} /> },
          { label: 'Term', value: '7 Years', icon: <Calendar size={16} /> },
        ],
      };

    case EdgeType.JointVenture:
      return {
        ...base,
        description: `Joint venture between ${sourceNode.label} and ${targetNode.label} with ${edgeData?.equitySplit || '50/50'} equity split`,
        pieChartData: [
          { name: sourceNode.label, value: 50, color: '#06b6d4' },
          { name: targetNode.label, value: 50, color: '#14b8a6' },
        ],
        secFilings: [
          { date: '2024-11-12', type: '8-K', title: 'Joint Venture Agreement Execution', link: 'https://www.sec.gov' },
          { date: '2024-09-28', type: '10-Q', title: 'Joint Venture Financial Results', link: 'https://www.sec.gov' },
          { date: '2024-06-15', type: '8-K', title: 'Joint Venture Capital Contribution', link: 'https://www.sec.gov' },
          { date: '2024-03-10', type: '10-K', title: 'Annual Joint Venture Report', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Equity Split', value: edgeData?.equitySplit || '50/50%', icon: <Percent size={16} /> },
          { label: 'Joint Revenue', value: edgeData?.revenue || '$85M', icon: <DollarSign size={16} /> },
          { label: 'Duration', value: edgeData?.duration || '10 Years', icon: <Calendar size={16} /> },
        ],
      };

    case EdgeType.Swaps:
      const swapTypes = edgeData?.swapTypes || ['Interest Rate Swaps', 'Currency Swaps', 'Credit Default Swaps'];
      return {
        ...base,
        description: `Derivative swap agreements between ${sourceNode.label} and ${targetNode.label}. Swap types: ${swapTypes.join(', ')}`,
        pieChartData: [
          { name: 'Interest Rate Swaps', value: 45, color: '#14b8a6' },
          { name: 'Currency Swaps', value: 30, color: '#06b6d4' },
          { name: 'Credit Swaps', value: 25, color: '#0d9488' },
        ],
        secFilings: [
          { date: '2024-12-08', type: '10-Q', title: 'Q3 Derivative Holdings Report', link: 'https://www.sec.gov' },
          { date: '2024-09-22', type: '8-K', title: 'Swap Agreement Modification', link: 'https://www.sec.gov' },
          { date: '2024-06-30', type: '10-Q', title: 'Derivative Risk Disclosure', link: 'https://www.sec.gov' },
          { date: '2024-03-28', type: '10-K', title: 'Annual Derivatives Report', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Notional Value', value: edgeData?.notionalValue || '$450M', icon: <DollarSign size={16} /> },
          { label: 'Swap Rate', value: edgeData?.rate || 'LIBOR + 1.25%', icon: <Percent size={16} /> },
          { label: 'Maturity', value: edgeData?.maturity || '2026-12-31', icon: <Calendar size={16} /> },
        ],
      };

    case EdgeType.BoardInterlock:
      const memberName = edgeData?.memberName || 'John Smith';
      const committees = edgeData?.committees || ['Audit Committee', 'Compensation Committee', 'Nominating Committee'];
      return {
        ...base,
        description: `Board interlock: ${memberName} serves as director on both ${sourceNode.label} and ${targetNode.label} boards. Committees: ${committees.join(', ')}`,
        pieChartData: [
          { name: 'Independent Directors', value: 60, color: '#a855f7' },
          { name: 'Interlocked Directors', value: 25, color: '#8b5cf6' },
          { name: 'Executive Directors', value: 15, color: '#6366f1' },
        ],
        secFilings: [
          { date: '2024-12-02', type: 'DEF 14A', title: 'Proxy Statement - Board Composition', link: 'https://www.sec.gov' },
          { date: '2024-10-15', type: '8-K', title: 'Board Member Appointment', link: 'https://www.sec.gov' },
          { date: '2024-07-20', type: 'DEF 14A', title: 'Annual Meeting Proxy - Director Independence', link: 'https://www.sec.gov' },
          { date: '2024-04-28', type: '8-K', title: 'Board Committee Changes', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Board Tenure', value: edgeData?.tenure || '5 Years', icon: <Calendar size={16} /> },
          { label: 'Committees', value: `${committees.length}`, icon: <FileText size={16} /> },
          { label: 'Independence Status', value: edgeData?.independenceStatus || 'Independent', icon: <TrendingUp size={16} /> },
        ],
      };

    default:
      return {
        ...base,
        description: `${sourceNode.label} has a relationship with ${targetNode.label} (Type: ${type})`,
        pieChartData: [
          { name: sourceNode.label, value: 50, color: '#6366f1' },
          { name: targetNode.label, value: 50, color: '#3b82f6' },
        ],
        secFilings: [
          { date: '2024-12-01', type: '10-K', title: 'Annual Report', link: 'https://www.sec.gov' },
          { date: '2024-09-15', type: '10-Q', title: 'Quarterly Report', link: 'https://www.sec.gov' },
        ],
        financialData: [
          { label: 'Relationship Type', value: type, icon: <FileText size={16} /> },
        ],
      };
  }
}

export default function RelationshipCard({ edge, sourceNode, targetNode, allRelationships, onRelationshipChange, onClose }: RelationshipCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const relationshipData = useMemo(() => 
    getRelationshipData(edge.type, sourceNode, targetNode, edge.data),
    [edge.type, sourceNode, targetNode, edge.data]
  );

  const COLORS = relationshipData.pieChartData?.map(d => d.color) || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          marginLeft: 'auto',
          marginRight: 'auto',
          width: '100%',
          maxWidth: '900px',
          maxHeight: isCollapsed ? 'auto' : '70vh',
          backgroundColor: '#0f172a',
          borderTop: '3px solid #8b5cf6',
          borderRadius: '24px 24px 0 0',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
        }}
      >
        {/* Drag Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <motion.div 
            style={{ width: 48, height: 6, backgroundColor: '#475569', borderRadius: 3 }}
          />
        </div>

        {/* Header */}
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(to right, rgba(139, 92, 246, 0.2), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.div 
                style={{ 
                  padding: 10, 
                  backgroundColor: 'rgba(139, 92, 246, 0.3)', 
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <Link2 color="white" size={20} />
              </motion.div>
              <div>
                <h2 style={{ color: 'white', fontSize: 18, fontWeight: 'bold', margin: 0 }}>
                  {edge.type === EdgeType.Ownership ? (
                    <span>{sourceNode.label} <span style={{ color: '#a78bfa' }}>→</span> {targetNode.label}</span>
                  ) : (
                    <span>{sourceNode.label} <span style={{ color: 'rgba(255,255,255,0.3)' }}>↔</span> {targetNode.label}</span>
                  )}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    backgroundColor: `${EDGE_COLORS[edge.type]}30`,
                    borderRadius: 20,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.9)',
                    border: `1px solid ${EDGE_COLORS[edge.type]}50`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: EDGE_COLORS[edge.type]
                    }} />
                    {EDGE_LABELS[edge.type]}
                  </span>
                  {allRelationships && allRelationships.length > 1 && (
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      +{allRelationships.length - 1} more
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <motion.button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(!isCollapsed);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ 
                  padding: 8, 
                  backgroundColor: 'rgba(0,0,0,0.3)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <motion.div
                  animate={{ rotate: isCollapsed ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronUp color="#94a3b8" size={18} />
                </motion.div>
              </motion.button>
              <motion.button 
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ 
                  padding: 8, 
                  backgroundColor: 'rgba(0,0,0,0.3)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X color="#94a3b8" size={18} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content - Animated collapse */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                maxHeight: '50vh'
              }}>
                {/* Relationship Type Tabs */}
                {allRelationships && allRelationships.length > 1 && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 8,
                    padding: '12px 16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <span style={{ 
                      fontSize: 11, 
                      color: '#64748b', 
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginRight: 8,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {allRelationships.length} Relationships
                    </span>
                    {allRelationships.map((rel, idx) => {
                      const edgeColor = EDGE_COLORS[rel.edge.type];
                      const isActive = rel.edge.type === edge.type;
                      return (
                        <motion.button
                          key={idx}
                          onClick={() => onRelationshipChange && onRelationshipChange(rel.edge, rel.source, rel.target)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: isActive ? edgeColor : 'rgba(255,255,255,0.05)',
                            color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                            border: `2px solid ${isActive ? edgeColor : 'transparent'}`,
                            boxShadow: isActive ? `0 4px 12px ${edgeColor}40` : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}
                        >
                          <span style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: edgeColor,
                            border: isActive ? '2px solid white' : 'none'
                          }} />
                          {EDGE_LABELS[rel.edge.type]}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Description */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ 
                    padding: 20, 
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <FileText color="#a78bfa" size={16} />
                    <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                      Summary
                    </span>
                  </div>
                  <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    {relationshipData.description}
                  </p>
                </motion.div>

                {/* Main Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {/* Financial Data */}
                  {relationshipData.financialData && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <DollarSign color="#a78bfa" size={16} />
                        <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Financial Details
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {relationshipData.financialData.map((item, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: 14,
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              border: '1px solid rgba(139, 92, 246, 0.2)',
                              borderRadius: 10
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: 8, 
                                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#c4b5fd'
                              }}>
                                {item.icon}
                              </div>
                              <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.label}</span>
                            </div>
                            <span style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Pie Chart */}
                  {relationshipData.pieChartData && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      style={{ 
                        padding: 16,
                        backgroundColor: 'rgba(30, 41, 59, 0.6)',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <PieChartIcon color="#a78bfa" size={16} />
                        <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Distribution
                        </span>
                      </div>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie
                            data={relationshipData.pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={55}
                            innerRadius={30}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {relationshipData.pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [`${value}%`, props.payload?.name || 'Share']}
                            contentStyle={{ 
                              backgroundColor: 'rgba(15, 23, 42, 0.98)', 
                              border: '1px solid rgba(139, 92, 246, 0.3)', 
                              borderRadius: '10px', 
                              fontSize: '13px',
                              padding: '10px 14px',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                              minWidth: '120px'
                            }}
                            itemStyle={{ color: '#ffffff', fontWeight: 500 }}
                            wrapperStyle={{ zIndex: 10000, pointerEvents: 'none' }}
                            cursor={{ fill: 'rgba(139, 92, 246, 0.2)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                        {relationshipData.pieChartData.map((entry, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color }} />
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* SEC Filings */}
                {relationshipData.secFilings && relationshipData.secFilings.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <FileText color="#a78bfa" size={18} />
                      <span style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                        SEC Filings
                      </span>
                      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)' }} />
                      <span style={{ 
                        padding: '4px 12px',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: 20,
                        fontSize: 12,
                        color: '#c4b5fd'
                      }}>
                        {relationshipData.secFilings.length}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                      {relationshipData.secFilings.slice(0, 4).map((filing, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          style={{ 
                            padding: 14,
                            backgroundColor: 'rgba(30, 41, 59, 0.6)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 10
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ 
                              padding: '4px 8px',
                              backgroundColor: 'rgba(139, 92, 246, 0.2)',
                              borderRadius: 6,
                              fontSize: 11,
                              fontFamily: 'monospace',
                              color: '#c4b5fd'
                            }}>
                              {filing.type}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{filing.date}</span>
                          </div>
                          <p style={{ color: '#e2e8f0', fontSize: 13, margin: 0 }}>{filing.title}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* News Articles */}
                {relationshipData.news && relationshipData.news.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <Newspaper color="#a78bfa" size={18} />
                      <span style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                        Related News
                      </span>
                      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {relationshipData.news.slice(0, 3).map((article, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + idx * 0.05 }}
                          style={{ 
                            padding: 14,
                            backgroundColor: 'rgba(30, 41, 59, 0.6)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 10
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{article.date}</span>
                            <span style={{ fontSize: 11, color: '#a78bfa' }}>{article.source}</span>
                          </div>
                          <h4 style={{ color: 'white', fontSize: 14, fontWeight: 500, margin: 0, lineHeight: 1.4 }}>
                            {article.title}
                          </h4>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Supply Chain Info */}
                {relationshipData.supplyChainInfo && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <Package color="#a78bfa" size={18} />
                      <span style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                        Supply Chain
                      </span>
                      {relationshipData.supplyChainInfo.riskLevel && (
                        <span style={{ 
                          padding: '4px 12px',
                          backgroundColor: relationshipData.supplyChainInfo.riskLevel === 'Low' ? 'rgba(34, 197, 94, 0.2)' :
                            relationshipData.supplyChainInfo.riskLevel === 'Medium' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          border: `1px solid ${relationshipData.supplyChainInfo.riskLevel === 'Low' ? 'rgba(34, 197, 94, 0.4)' :
                            relationshipData.supplyChainInfo.riskLevel === 'Medium' ? 'rgba(250, 204, 21, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                          borderRadius: 20,
                          fontSize: 11,
                          color: relationshipData.supplyChainInfo.riskLevel === 'Low' ? '#86efac' :
                            relationshipData.supplyChainInfo.riskLevel === 'Medium' ? '#fef08a' : '#fca5a5'
                        }}>
                          {relationshipData.supplyChainInfo.riskLevel} Risk
                        </span>
                      )}
                    </div>
                    {relationshipData.supplyChainInfo.locations && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {relationshipData.supplyChainInfo.locations.map((loc, idx) => (
                          <span key={idx} style={{ 
                            padding: '6px 12px',
                            backgroundColor: 'rgba(30, 41, 59, 0.6)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            fontSize: 12,
                            color: '#94a3b8'
                          }}>
                            {loc}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Partnership Info */}
                {relationshipData.partnershipInfo && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <Handshake color="#a78bfa" size={18} />
                      <span style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                        Partnership Details
                      </span>
                    </div>
                    
                    {relationshipData.partnershipInfo.projects && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
                        {relationshipData.partnershipInfo.projects.slice(0, 4).map((project, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              padding: 12,
                              backgroundColor: 'rgba(30, 41, 59, 0.6)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 10
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ 
                                padding: '2px 8px',
                                backgroundColor: project.status === 'Active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(250, 204, 21, 0.2)',
                                borderRadius: 4,
                                fontSize: 10,
                                color: project.status === 'Active' ? '#86efac' : '#fef08a'
                              }}>
                                {project.status}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>{project.value}</span>
                            </div>
                            <p style={{ color: '#e2e8f0', fontSize: 13, margin: 0 }}>{project.name}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {relationshipData.partnershipInfo.collaboration && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {relationshipData.partnershipInfo.collaboration.slice(0, 5).map((area, idx) => (
                          <span key={idx} style={{ 
                            padding: '6px 12px',
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: 8,
                            fontSize: 12,
                            color: '#c4b5fd'
                          }}>
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
