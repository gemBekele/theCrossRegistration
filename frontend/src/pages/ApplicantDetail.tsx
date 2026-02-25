import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { applicantService } from '../services/applicant.service';
// Note: ApplicantWithDetails type is used implicitly by applicantService.getApplicant
import { ArrowLeft, CheckCircle, XCircle, Phone, MapPin, Church, User, Music, Briefcase, FileText, MessageSquare, Calendar, UserCheck, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ApplicantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data: applicant, isLoading } = useQuery({
    queryKey: ['applicant', id],
    queryFn: () => applicantService.getApplicant(Number(id)),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: 'accepted' | 'rejected'; notes?: string }) =>
      applicantService.updateStatus(Number(id), status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant', id] });
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Status updated successfully');
      setShowRejectModal(false);
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const handleAccept = () => {
    updateStatusMutation.mutate({ status: 'accepted' });
  };

  const handleReject = () => {
    updateStatusMutation.mutate({ status: 'rejected', notes: reviewerNotes });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Applicant not found</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default: return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/applicants')}
          className="mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{applicant.name}</h1>
          <div className="flex items-center mt-1 space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(applicant.status)}`}>
              {applicant.status}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
              {applicant.type}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo */}
          {applicant.photo_url && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Image className="w-5 h-5 mr-2" />
                Photo
              </h2>
              <img
                src={applicantService.getFileUrl(applicant.photo_url)}
                alt={applicant.name}
                className="max-w-xs rounded-lg"
              />
            </div>
          )}

          {/* Audio (for singers) */}
          {applicant.type === 'singer' && applicant.details && 'audio_url' in applicant.details && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Music className="w-5 h-5 mr-2" />
                Sample Audio
              </h2>
              <audio
                controls
                className="w-full"
                src={applicantService.getFileUrl(applicant.details.audio_url)}
              />
              {applicant.details.audio_duration && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Duration: {Math.floor(applicant.details.audio_duration / 60)}:{(applicant.details.audio_duration % 60).toString().padStart(2, '0')}
                </p>
              )}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <User className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                  <p className="font-medium dark:text-white">{applicant.name}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                  <p className="font-medium dark:text-white">{applicant.phone}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Church className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Local Church</p>
                  <p className="font-medium dark:text-white">{applicant.church}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                  <p className="font-medium dark:text-white">{applicant.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Type-specific details */}
          {applicant.type === 'singer' && applicant.details && 'worship_ministry_involved' in applicant.details && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Singer Information</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Music className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Worship Ministry Involved</p>
                    <p className="font-medium dark:text-white">{applicant.details.worship_ministry_involved ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {applicant.type === 'mission' && applicant.details && 'profession' in applicant.details && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mission Information</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Briefcase className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Profession</p>
                    <p className="font-medium dark:text-white">{applicant.details.profession}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <UserCheck className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mission Interest</p>
                    <p className="font-medium dark:text-white">{applicant.details.mission_interest ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bio</p>
                    <p className="font-medium whitespace-pre-wrap dark:text-white">{applicant.details.bio}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Why do you want to join?</p>
                    <p className="font-medium whitespace-pre-wrap dark:text-white">{applicant.details.motivation}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Info</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Submitted:</span>
                <span className="ml-auto text-sm dark:text-white">{format(new Date(applicant.created_at), 'MMM d, yyyy HH:mm')}</span>
              </div>
              {applicant.reviewer_name && (
                <>
                  <div className="flex items-center">
                    <UserCheck className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Reviewed by:</span>
                    <span className="ml-auto text-sm dark:text-white">{applicant.reviewer_name}</span>
                  </div>
                  {applicant.reviewer_notes && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes:</p>
                      <p className="text-sm dark:text-white">{applicant.reviewer_notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {applicant.status === 'pending' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={handleAccept}
                  disabled={updateStatusMutation.isPending}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Accept Application
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={updateStatusMutation.isPending}
                  className="w-full flex items-center justify-center px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Reject Application
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reject Application</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to reject this application? You can optionally add notes.
            </p>
            <textarea
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Add notes (optional)..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={updateStatusMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {updateStatusMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantDetail;