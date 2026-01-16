/**
 * Architecture Review Board Page
 */

import { useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { ARBDashboard, MeetingsList, SubmissionsQueue, DecisionForm, NewRequestForm, RequestDetail, ScheduleMeetingForm, MeetingDetail, type ARBMeeting, type ARBSubmission } from '@/components/governance/arb';

export function ARBPage() {
  const { id } = useParams<'id'>();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedMeeting, setSelectedMeeting] = useState<ARBMeeting | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ARBSubmission | null>(null);
  const [isDecisionFormOpen, setIsDecisionFormOpen] = useState(false);
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false);

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
          <div className="mb-6">
            <Link to="/arb/meetings" className="text-indigo-600 hover:text-indigo-700">
              ← Back to Meetings
            </Link>
          </div>
          <MeetingDetail meetingId={id} />
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
              <h1 className="text-3xl font-bold text-slate-900">ARB Meetings</h1>
              <p className="text-slate-600 mt-1">Schedule and manage ARB meetings</p>
            </div>
            <button
              onClick={() => setIsScheduleMeetingOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              data-testid="schedule-meeting-btn"
            >
              Schedule Meeting
            </button>
          </div>

          <div data-testid="meetings-list">
            <MeetingsList
              onView={(meeting) => {
                navigate(`/arb/meetings/${meeting.id}`);
              }}
            />
          </div>

          {isScheduleMeetingOpen && (
            <ScheduleMeetingForm
              onClose={() => setIsScheduleMeetingOpen(false)}
              onSuccess={() => {
                // Refresh meetings list but keep modal open
                // Modal will be closed by user or after success message timeout
              }}
            />
          )}
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
