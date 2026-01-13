/**
 * Architecture Review Board Page
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ARBDashboard, MeetingsList, SubmissionsQueue, DecisionForm, type ARBMeeting, type ARBSubmission } from '@/components/governance/arb';

type ViewMode = 'dashboard' | 'meetings' | 'submissions';

export function ARBPage() {
  const { id } = useParams();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedMeeting, setSelectedMeeting] = useState<ARBMeeting | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ARBSubmission | null>(null);
  const [isDecisionFormOpen, setIsDecisionFormOpen] = useState(false);

  if (id) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Meeting detail view would go here */}
            <div className="bg-white rounded-lg p-6">
              <p className="text-slate-500">Meeting detail view for {id}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Architecture Review Board</h1>
            <p className="text-slate-600 mt-1">Review and approve architecture decisions</p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setViewMode('meetings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'meetings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Meetings
            </button>
            <button
              onClick={() => setViewMode('submissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'submissions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Submissions
            </button>
          </nav>
        </div>

        {isDecisionFormOpen && selectedSubmission && (
          <div className="mb-6">
            <DecisionForm
              submission={selectedSubmission}
              onSubmit={(decision) => {
                // Handle decision submission
                setIsDecisionFormOpen(false);
                setSelectedSubmission(null);
              }}
              onCancel={() => {
                setIsDecisionFormOpen(false);
                setSelectedSubmission(null);
              }}
            />
          </div>
        )}

        {viewMode === 'dashboard' && <ARBDashboard />}

        {viewMode === 'meetings' && (
          <MeetingsList
            onView={(meeting) => setSelectedMeeting(meeting)}
          />
        )}

        {viewMode === 'submissions' && (
          <SubmissionsQueue
            onReview={(submission) => {
              setSelectedSubmission(submission);
            }}
            onRecordDecision={(submission) => {
              setSelectedSubmission(submission);
              setIsDecisionFormOpen(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
