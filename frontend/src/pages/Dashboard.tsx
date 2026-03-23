import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { applicantService } from '../services/applicant.service';
import { settingsService } from '../services/settings.service';
import { Users, Clock, CheckCircle, XCircle, Mic, Globe, Lock, Unlock } from 'lucide-react';

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  href?: string;
}> = ({ title, value, icon: Icon, color, href }) => {
  const content = (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
        </div>
        <div className={`p-4 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: applicantService.getStats,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
  });

  const mutation = useMutation({
    mutationFn: (registrationOpen: boolean) =>
      settingsService.updateSettings({ registration_open: registrationOpen }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const handleToggleRegistration = () => {
    mutation.mutate(!settings?.registration_open);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of registration statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Applicants"
          value={stats?.total || 0}
          icon={Users}
          color="bg-blue-500"
          href="/applicants"
        />
        <StatCard
          title="Pending Review"
          value={stats?.pending || 0}
          icon={Clock}
          color="bg-yellow-500"
          href="/applicants?status=pending"
        />
        <StatCard
          title="Accepted"
          value={stats?.accepted || 0}
          icon={CheckCircle}
          color="bg-green-500"
          href="/applicants?status=accepted"
        />
        <StatCard
          title="Rejected"
          value={stats?.rejected || 0}
          icon={XCircle}
          color="bg-red-500"
          href="/applicants?status=rejected"
        />
        <StatCard
          title="Singer Registrations"
          value={stats?.singers || 0}
          icon={Mic}
          color="bg-purple-500"
          href="/applicants?type=singer"
        />
        <StatCard
          title="Mission Registrations"
          value={stats?.missions || 0}
          icon={Globe}
          color="bg-indigo-500"
          href="/applicants?type=mission"
        />
      </div>

      <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/applicants?status=pending"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Review Pending Applications
          </Link>
          <Link
            to="/applicants"
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
          >
            View All Applicants
          </Link>
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${settings?.registration_open ? 'bg-green-500' : 'bg-red-500'}`}>
              {settings?.registration_open ? (
                <Unlock className="w-6 h-6 text-white" />
              ) : (
                <Lock className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Registration Status
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {settings?.registration_open
                  ? 'Registration is currently open'
                  : 'Registration is currently closed'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleRegistration}
            disabled={mutation.isPending}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              settings?.registration_open
                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
            } disabled:opacity-50`}
          >
            {mutation.isPending
              ? 'Updating...'
              : settings?.registration_open
              ? 'Close Registration'
              : 'Open Registration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;