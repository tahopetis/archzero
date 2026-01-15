/**
 * Architecture Review Board Page
 */

import { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ARBDashboard, MeetingsList, SubmissionsQueue, DecisionForm, NewRequestForm, RequestDetail, type ARBMeeting, type ARBSubmission } from '@/components/governance/arb';

export function ARBPage() {
  const { id } = useParams<'id'>();
  const location = useLocation();
  const [selectedMeeting, setSelectedMeeting] = useState<ARBMeeting | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ARBSubmission | null>(null);
  const [isDecisionFormOpen, setIsDecisionFormOpen] = useState(false);

  // Determine view based on route
  const isRequestsRoute = location.pathname.includes('/requests');
  const isMeetingsRoute = location.pathname.includes('/meetings');
  const isNewRequestRoute = location.pathname.includes('/requests/new');
  const isSubmissionDetailRoute = location.pathname.includes('/submissions/');
  const isMeetingDetailRoute = location.pathname.includes('/meetings/') && id;

  // Meeting detail view
  if (isMeetingDetailRoute && id) {
    return (
      <div className="min-h-screen bg-slate-50" data-testid="meeting-detail">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <p className="text-slate-500">Meeting detail view for {id}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Submission detail view
  if (isSubmissionDetailRoute && id) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link to="/arb/requests" className="text-indigo-600 hover:text-indigo-700">
              ← Back to Requests
            </Link>
          </div>
          <RequestDetail />
        </div>
      </div>
    );
  }

  // New request form
  if (isNewRequestRoute) {
    return (
      <div className="min-h-screen bg-slate-50" data-testid="new-request-form">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link to="/arb/requests" className="text-indigo-600 hover:text-indigo-700">
              ← Back to Requests
            </Link>
          </div>
          <NewRequestForm />
        </div>
      </div>
    );
  }

  // Requests list view
  if (isRequestsRoute && !isNewRequestRoute) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">ARB Review Requests</h1>
              <p className="text-slate-600 mt-1">Manage architecture review requests</p>
            </div>
            <Link
              to="/arb/requests/new"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              data-testid="create-request-btn"
            >
              New Request
            </Link>
          </div>

          <div data-testid="requests-list">
            <SubmissionsQueue
              onReview={(submission) => {
                setSelectedSubmission(submission);
              }}
              onRecordDecision={(submission) => {
                setSelectedSubmission(submission);
                setIsDecisionFormOpen(true);
              }}
            />
          </div>

          {isDecisionFormOpen && selectedSubmission && (
            <div className="mt-6">
              <DecisionForm
                submission={selectedSubmission}
                onCancel={() => {
                  setIsDecisionFormOpen(false);
                  setSelectedSubmission(null);
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Meetings list view
  if (isMeetingsRoute && !isMeetingDetailRoute) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900" data-testid="meetings-list">ARB Meetings</h1>
              <p className="text-slate-600 mt-1">Schedule and manage ARB meetings</p>
            </div>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              data-testid="schedule-meeting-btn"
            >
              Schedule Meeting
            </button>
          </div>

          <div data-testid="meetings-list">
            <MeetingsList
              onView={(meeting) => setSelectedMeeting(meeting)}
            />
          </div>
        </div>
      </div>
    );
  }

  // Default dashboard view
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div data-testid="arb-dashboard">
          <ARBDashboard />
        </div>
      </div>
    </div>
  );
}
