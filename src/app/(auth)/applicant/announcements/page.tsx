'use client';
import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Card, Container, Badge, RefreshButton, Button } from '@/components/ui';
import { AdminLayout } from '@/components/layout';
import { Megaphone, Calendar, Tag, ImageIcon, Loader2, Users, Filter } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { AnnouncementViewModal } from '@/components/applicant/AnnouncementViewModal';

interface Announcement {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  published_at: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export default function AnnouncementsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/announcements?status=active');
      const data = await response.json();

      if (data.success) {
        setAnnouncements(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch announcements');
      }
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      showToast(error.message || 'Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleViewAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementModal(true);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'job_opening': return 'bg-blue-100 text-blue-800';
      case 'training': return 'bg-purple-100 text-purple-800';
      case 'notice': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Posted today';
    if (diffDays === 1) return 'Posted 1 day ago';
    if (diffDays < 7) return `Posted ${diffDays} days ago`;
    if (diffDays < 14) return 'Posted 1 week ago';
    if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
    return `Posted ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  // Filter announcements by category
  const filteredAnnouncements = selectedCategory === 'all'
    ? announcements
    : announcements.filter(a => a.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'All Announcements', count: announcements.length },
    { value: 'job_opening', label: 'Job Openings', count: announcements.filter(a => a.category === 'job_opening').length },
    { value: 'training', label: 'Trainings', count: announcements.filter(a => a.category === 'training').length },
    { value: 'notice', label: 'Notices', count: announcements.filter(a => a.category === 'notice').length },
    { value: 'general', label: 'General', count: announcements.filter(a => a.category === 'general').length },
  ];

  return (
    <AdminLayout role="Applicant" userName={user?.fullName || 'Applicant'}>
      <Container>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Announcements</h1>
              <p className="text-sm text-gray-600">Stay updated with the latest news and opportunities</p>
            </div>
          </div>
          <RefreshButton onRefresh={fetchAnnouncements} label="Refresh" showLastRefresh={true} />
        </div>

        {/* Category Filters */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 mr-2">Filter by:</span>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </Card>

        {/* Announcements Grid */}
        <Card title={`${selectedCategory === 'all' ? 'All' : formatCategory(selectedCategory)} Announcements (${filteredAnnouncements.length})`} headerColor="bg-[#D4F4DD]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#22A555] animate-spin" />
              <span className="ml-3 text-gray-600 font-medium">Loading announcements...</span>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-20">
              <Megaphone className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 font-medium text-lg">No announcements found</p>
              <p className="text-sm text-gray-500 mt-2">
                {selectedCategory === 'all'
                  ? 'Check back later for updates'
                  : `No ${formatCategory(selectedCategory).toLowerCase()} announcements available`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  onClick={() => handleViewAnnouncement(announcement)}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer group"
                >
                  {/* Image */}
                  <div className="relative w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300">
                    {announcement.image_url ? (
                      <img
                        src={announcement.image_url}
                        alt={announcement.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    {/* Category Badge Overlay */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-md ${getCategoryBadgeColor(announcement.category)}`}>
                        <Tag className="w-3 h-3 inline mr-1" />
                        {formatCategory(announcement.category)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    {/* Title */}
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {announcement.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {announcement.description}
                    </p>

                    {/* Metadata */}
                    <div className="pt-3 border-t border-gray-100 space-y-2">
                      {/* Published Date */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(announcement.published_at)}</span>
                      </div>

                      {/* Creator Info */}
                      {announcement.profiles && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">
                              {announcement.profiles.full_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {announcement.profiles.role}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Announcement Preview Modal */}
        <AnnouncementViewModal
          isOpen={showAnnouncementModal}
          onClose={() => setShowAnnouncementModal(false)}
          announcement={selectedAnnouncement}
        />
      </Container>
    </AdminLayout>
  );
}
