'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { AdminLayout } from '@/components/layout';
import { Avatar, Card, EnhancedTable, Container, Badge, RefreshButton, Modal, ImagePreviewModal } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/auth';
import {
  FileText, Database, User, Clock, AlertTriangle, Eye, EyeOff,
  Plus, Edit, Trash2, FileCheck, Loader2
} from 'lucide-react';

interface AuditRecord {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: any | null;
  new_values: any | null;
  changed_fields: string[] | null;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  timestamp: string;
  profiles?: {
    full_name?: string;
    profile_image_url?: string | null;
  };
}

export default function AuditTrailPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  // Filter states
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  // Image Preview Modal
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewUserName, setPreviewUserName] = useState<string>('');

  // Fetch audit trail
  const fetchAuditTrail = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('audit_trail')
        .select(`
          *,
          profiles:user_id (
            full_name,
            profile_image_url
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Error fetching audit trail:', error);
        throw error;
      }

      setAuditRecords((data || []) as AuditRecord[]);
      showToast('Audit trail refreshed', 'success');
    } catch (error: any) {
      console.error('Failed to fetch audit trail:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAuditTrail();
  }, [fetchAuditTrail]);

  // Handle avatar click to show image preview
  const handleAvatarClick = (imageUrl: string | null, userName: string) => {
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setPreviewUserName(userName);
      setShowImagePreview(true);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...auditRecords];

    if (tableFilter !== 'all') {
      filtered = filtered.filter(record => record.table_name === tableFilter);
    }

    if (operationFilter !== 'all') {
      filtered = filtered.filter(record => record.operation === operationFilter);
    }

    if (userFilter !== 'all') {
      filtered = filtered.filter(record => record.user_email === userFilter);
    }

    setFilteredRecords(filtered);
  }, [auditRecords, tableFilter, operationFilter, userFilter]);

  // Get unique values for filters
  const uniqueTables = Array.from(new Set(auditRecords.map(r => r.table_name))).sort();
  const uniqueUsers = Array.from(new Set(auditRecords.map(r => r.user_email))).sort();

  const getOperationBadge = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return <Badge variant="success" icon={Plus}>INSERT</Badge>;
      case 'UPDATE':
        return <Badge variant="info" icon={Edit}>UPDATE</Badge>;
      case 'DELETE':
        return <Badge variant="danger" icon={Trash2}>DELETE</Badge>;
      default:
        return <Badge variant="default">{operation}</Badge>;
    }
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'jobs':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'applications':
        return <FileCheck className="w-4 h-4 text-green-600" />;
      case 'announcements':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'profiles':
        return <User className="w-4 h-4 text-purple-600" />;
      default:
        return <Database className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatJson = (data: any) => {
    if (!data) return 'null';
    return JSON.stringify(data, null, 2);
  };

  const columns = [
    {
      header: 'Time',
      accessor: 'timestamp' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">
            {new Date(value).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Table',
      accessor: 'table_name' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {getTableIcon(value)}
          <span className="font-mono text-sm font-semibold text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      header: 'Operation',
      accessor: 'operation' as const,
      render: (value: string) => getOperationBadge(value),
    },
    {
      header: 'Record ID',
      accessor: 'record_id' as const,
      render: (value: string) => (
        <span className="font-mono text-xs text-gray-600">
          {value.substring(0, 8)}...
        </span>
      ),
    },
    {
      header: 'Changed Fields',
      accessor: 'changed_fields' as const,
      render: (value: string[] | null) => {
        if (!value || value.length === 0) return <span className="text-gray-400">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 3).map((field, idx) => (
              <Badge key={idx} variant="default" className="text-xs">
                {field}
              </Badge>
            ))}
            {value.length > 3 && (
              <span className="text-xs text-gray-500">+{value.length - 3} more</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'User',
      accessor: 'user_email' as const,
      render: (value: string | null, row: AuditRecord) => (
        <div className="flex items-center gap-3">
          <Avatar
            imageUrl={row.profiles?.profile_image_url}
            userName={row.profiles?.full_name || value || 'System'}
            size="sm"
            onClick={() => handleAvatarClick(row.profiles?.profile_image_url, row.profiles?.full_name || value || 'System')}
            clickable
          />
          <div className="flex flex-col">
            {value ? (
              <>
                <span className="text-sm text-gray-900">{value}</span>
                {row.user_role && (
                  <Badge variant="default" className="text-xs w-fit">
                    {row.user_role}
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-500 italic">System</span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Details',
      accessor: 'actions' as const,
      render: (_: any, row: AuditRecord) => (
        <button
          onClick={() => setSelectedRecord(row)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      ),
    },
  ];

  const stats = {
    total: auditRecords.length,
    inserts: auditRecords.filter(r => r.operation === 'INSERT').length,
    updates: auditRecords.filter(r => r.operation === 'UPDATE').length,
    deletes: auditRecords.filter(r => r.operation === 'DELETE').length,
  };

  return (
    <AdminLayout
      role="Admin"
      userName={user?.fullName || 'Admin'}
      pageTitle="Audit Trail"
      pageDescription="Complete database change history with before/after values"
    >
      <Container size="xl">
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              {/* Table Filter */}
              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22A555]"
              >
                <option value="all">All Tables</option>
                {uniqueTables.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>

              {/* Operation Filter */}
              <select
                value={operationFilter}
                onChange={(e) => setOperationFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22A555]"
              >
                <option value="all">All Operations</option>
                <option value="INSERT">INSERT</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>

              {/* User Filter */}
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22A555]"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map((userEmail) => (
                  <option key={userEmail || 'system'} value={userEmail || ''}>
                    {userEmail || '(System)'}
                  </option>
                ))}
              </select>
            </div>

            <RefreshButton
              onRefresh={fetchAuditTrail}
              label="Refresh Audit Trail"
              showLastRefresh={true}
            />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card variant="flat" className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Changes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Database className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Inserts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.inserts}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Updates</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.updates}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Edit className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Deletes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.deletes}</p>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </div>

          {/* Audit Trail Table */}
          <Card title="AUDIT TRAIL RECORDS" headerColor="bg-[#D4F4DD]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#22A555] animate-spin" />
                <span className="ml-3 text-gray-600">Loading audit trail...</span>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No audit records found
              </div>
            ) : (
              <EnhancedTable
                columns={columns}
                data={filteredRecords}
                searchable
                paginated
                pageSize={50}
                searchPlaceholder="Search by table, user, or record ID..."
              />
            )}
          </Card>
        </div>
      </Container>

      {/* Audit Record Details Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Audit Record Details"
        size="xl"
        showFooter={false}
      >
        {selectedRecord && (
          <div className="space-y-6">
            {/* Metadata Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Table:</span>
                  <div className="flex items-center gap-2 mt-1">
                    {getTableIcon(selectedRecord.table_name)}
                    <span className="font-mono font-semibold text-gray-900">{selectedRecord.table_name}</span>
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Operation:</span>
                  <div className="mt-1">{getOperationBadge(selectedRecord.operation)}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Record ID:</span>
                  <p className="font-mono text-xs text-gray-600 mt-1">{selectedRecord.record_id}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Timestamp:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{new Date(selectedRecord.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-gray-700">User:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-gray-400" />
                    {selectedRecord.user_email ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{selectedRecord.user_email}</span>
                        {selectedRecord.user_role && (
                          <Badge variant="default" className="text-xs">
                            {selectedRecord.user_role}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">System</span>
                    )}
                  </div>
                </div>
                {selectedRecord.changed_fields && selectedRecord.changed_fields.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-700">Changed Fields:</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedRecord.changed_fields.map((field, idx) => (
                        <Badge key={idx} variant="default" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Before/After Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Old Values */}
              {selectedRecord.old_values && (
                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Before (Old Values)
                  </h4>
                  <pre className="bg-red-50 border border-red-200 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                    {formatJson(selectedRecord.old_values)}
                  </pre>
                </div>
              )}

              {/* New Values */}
              {selectedRecord.new_values && (
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    After (New Values)
                  </h4>
                  <pre className="bg-green-50 border border-green-200 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                    {formatJson(selectedRecord.new_values)}
                  </pre>
                </div>
              )}
            </div>

            {/* Single Column for INSERT/DELETE operations */}
            {!selectedRecord.old_values && !selectedRecord.new_values && (
              <div className="text-center py-8 text-gray-500">
                No before/after data available for this operation
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        imageUrl={previewImageUrl}
        imageName={`${previewUserName}'s Profile Picture`}
        userName={previewUserName}
      />
    </AdminLayout>
  );
}
