'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { X, Calendar, Tag, ImageIcon, Megaphone, ZoomIn } from 'lucide-react';
import { Badge } from '@/components/ui';

interface AnnouncementViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: {
    id: string;
    title: string;
    description: string;
    category: string;
    image_url: string | null;
    created_at: string;
    published_at: string;
    profiles?: {
      id: string;
      full_name: string;
      role: string;
    };
  } | null;
}

export const AnnouncementViewModal: React.FC<AnnouncementViewModalProps> = ({
  isOpen,
  onClose,
  announcement,
}) => {
  const [showImageLightbox, setShowImageLightbox] = useState(false);

  if (!isOpen || !announcement) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'job_opening': return 'bg-blue-100 text-blue-800';
      case 'training': return 'bg-purple-100 text-purple-800';
      case 'notice': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'job_opening': return 'Job Opening';
      case 'training': return 'Training';
      case 'notice': return 'Notice';
      default: return 'General';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
      {/* Modal */}
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 flex items-center justify-between z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
              <Image
                src="/JS-logo.png"
                alt="JobSync"
                width={40}
                height={40}
                className="rounded-lg object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold">Announcement Details</h2>
              <p className="text-sm text-blue-100">View full announcement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Image Section */}
          <div
            className="relative w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl overflow-hidden shadow-lg cursor-pointer group"
            onClick={() => announcement.image_url && setShowImageLightbox(true)}
          >
            {announcement.image_url ? (
              <>
                <img
                  src={announcement.image_url}
                  alt={announcement.title}
                  className="w-full h-full object-contain"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <ZoomIn className="w-4 h-4 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">Click to view full size</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-20 h-20 text-gray-400" />
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Category Badge */}
            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${getCategoryColor(announcement.category)}`}>
              <Tag className="w-4 h-4 inline mr-1" />
              {getCategoryLabel(announcement.category)}
            </span>

            {/* Published Date */}
            <span className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
              <Calendar className="w-4 h-4" />
              {new Date(announcement.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Title */}
          <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 py-3 rounded-r-lg">
            <h3 className="text-2xl font-bold text-gray-900">
              {announcement.title}
            </h3>
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none">
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" />
                Announcement Content
              </h4>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {announcement.description}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Created By</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{announcement.profiles?.full_name || 'Unknown User'}</p>
                {announcement.profiles?.role && (
                  <Badge variant="default" className="text-xs">{announcement.profiles.role}</Badge>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Created On</p>
              <p className="font-semibold text-gray-900">
                {new Date(announcement.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {showImageLightbox && announcement.image_url && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowImageLightbox(false)}
        >
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={announcement.image_url}
              alt={announcement.title}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setShowImageLightbox(false)}
              className="absolute -top-4 -right-4 bg-white hover:bg-gray-100 text-gray-700 rounded-full p-3 shadow-xl transition-all hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-lg">
              <p className="text-white text-sm font-medium">{announcement.title}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
