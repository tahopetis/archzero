/**
 * Risk Assessment Workflow Page
 * Provides step-by-step risk assessment and evaluation
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { RiskType, RiskStatus, type Risk } from '@/types/governance';
import { Card } from '@/components/governance/shared';

type AssessmentStep = 'identify' | 'analyze' | 'evaluate' | 'review';

interface RiskAssessmentData {
  likelihood: number;
  impact: number;
  riskScore: number;
  rationale: string;
  mitigationStrategies: string[];
  owner: string;
  targetDate: string;
}

// Mock risk data
const mockRisk: Risk = {
  id: 'risk-1',
  name: 'Legacy Authentication System',
  riskType: RiskType.Security,
  likelihood: 4,
  impact: 5,
  riskScore: 20,
  status: RiskStatus.Open,
  mitigationPlan: 'Migrate to OAuth 2.0',
  owner: 'Security Team',
  targetClosureDate: '2026-06-30',
  type: 'Risk',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-14T00:00:00Z'
};

export function RiskAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('identify');
  const [assessmentData, setAssessmentData] = useState<RiskAssessmentData>({
    likelihood: mockRisk.likelihood,
    impact: mockRisk.impact,
    riskScore: mockRisk.riskScore,
    rationale: 'Current system lacks modern security features and is vulnerable to attacks',
    mitigationStrategies: [
      'Implement OAuth 2.0',
      'Add MFA support',
      'Deprecate legacy endpoints'
    ],
    owner: mockRisk.owner || '',
    targetDate: mockRisk.targetClosureDate || ''
  });

  const steps: { key: AssessmentStep; label: string; icon: any }[] = [
    { key: 'identify', label: 'Identify Risk', icon: AlertTriangle },
    { key: 'analyze', label: 'Analyze Impact', icon: TrendingUp },
    { key: 'evaluate', label: 'Evaluate Score', icon: Shield },
    { key: 'review', label: 'Review & Save', icon: CheckCircle }
  ];

  const getStepIndex = (step: AssessmentStep) => steps.findIndex(s => s.key === step);
  const currentStepIndex = getStepIndex(currentStep);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].key);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  const handleSave = () => {
    // TODO: Implement save logic
    console.log('Saving assessment:', assessmentData);
  };

  const getScoreColor = (score: number) => {
    if (score >= 15) return 'text-rose-600 bg-rose-50';
    if (score >= 10) return 'text-orange-600 bg-orange-50';
    if (score >= 5) return 'text-amber-600 bg-amber-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 15) return 'Critical';
    if (score >= 10) return 'High';
    if (score >= 5) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <Link to="/governance/risks" className="hover:text-indigo-600">
              Risks
            </Link>
            <span>/</span>
            <Link to={`/governance/risks/${id}`} className="hover:text-indigo-600">
              {mockRisk.name}
            </Link>
            <span>/</span>
            <span className="text-slate-900">Assessment</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Risk Assessment</h1>
          <p className="text-slate-600 mt-1">
            Systematic evaluation of {mockRisk.name}
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.key;
              const isCompleted = getStepIndex(currentStep) > idx;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isActive ? 'bg-indigo-600 text-white' : ''}
                      ${isCompleted ? 'bg-emerald-600 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-slate-200 text-slate-500' : ''}
                    `}>
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs mt-2 font-medium ${
                      isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${
                      isCompleted ? 'bg-emerald-600' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Step Content */}
        <Card className="p-6 mb-6">
          {currentStep === 'identify' && (
            <div data-testid="identify-step">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Identify Risk</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Risk Name
                  </label>
                  <input
                    type="text"
                    defaultValue={mockRisk.name}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    data-testid="risk-name-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Risk Type
                  </label>
                  <select
                    defaultValue={mockRisk.riskType}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    data-testid="risk-type-select"
                  >
                    {Object.values(RiskType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Risk Description & Rationale
                  </label>
                  <textarea
                    rows={4}
                    defaultValue={assessmentData.rationale}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    data-testid="risk-rationale-textarea"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Describe the risk, its potential causes, and context
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Potential Mitigation Strategies
                  </label>
                  <div className="space-y-2">
                    {assessmentData.mitigationStrategies.map((strategy, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full" />
                        <input
                          type="text"
                          defaultValue={strategy}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          data-testid={`mitigation-strategy-${idx}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'analyze' && (
            <div data-testid="analyze-step">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Analyze Impact</h2>

              <div className="space-y-6">
                {/* Likelihood Assessment */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Likelihood (1-5)
                  </label>
                  <p className="text-sm text-slate-600 mb-3">
                    How likely is this risk to materialize?
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(value => (
                      <button
                        key={value}
                        onClick={() => setAssessmentData({ ...assessmentData, likelihood: value })}
                        className={`
                          p-3 rounded-lg border-2 font-semibold transition-all
                          ${assessmentData.likelihood === value
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 hover:border-slate-300'
                          }
                        `}
                        data-testid={`likelihood-${value}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-slate-500 grid grid-cols-5 gap-2 text-center">
                    <span>Rare</span>
                    <span>Unlikely</span>
                    <span>Possible</span>
                    <span>Likely</span>
                    <span>Certain</span>
                  </div>
                </div>

                {/* Impact Assessment */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Impact (1-5)
                  </label>
                  <p className="text-sm text-slate-600 mb-3">
                    What would be the severity of consequences if this risk materialized?
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(value => (
                      <button
                        key={value}
                        onClick={() => setAssessmentData({
                          ...assessmentData,
                          impact: value,
                          riskScore: assessmentData.likelihood * value
                        })}
                        className={`
                          p-3 rounded-lg border-2 font-semibold transition-all
                          ${assessmentData.impact === value
                            ? 'border-orange-600 bg-orange-50 text-orange-700'
                            : 'border-slate-200 hover:border-slate-300'
                          }
                        `}
                        data-testid={`impact-${value}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-slate-500 grid grid-cols-5 gap-2 text-center">
                    <span>Minimal</span>
                    <span>Minor</span>
                    <span>Moderate</span>
                    <span>Major</span>
                    <span>Catastrophic</span>
                  </div>
                </div>

                {/* Current Score Preview */}
                <div className={`
                  p-4 rounded-lg border-2
                  ${getScoreColor(assessmentData.riskScore)}
                `}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Calculated Risk Score</p>
                      <p className="text-xs opacity-75">Likelihood × Impact</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{assessmentData.riskScore}</p>
                      <p className="text-sm font-semibold">{getScoreLabel(assessmentData.riskScore)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'evaluate' && (
            <div data-testid="evaluate-step">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Evaluate Score</h2>

              <div className="space-y-6">
                {/* Score Matrix */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Risk Score Matrix</h3>
                  <div className="grid grid-cols-5 gap-1 text-xs">
                    {[5, 4, 3, 2, 1].map(impact => (
                      <div key={impact} className="contents">
                        {[1, 2, 3, 4, 5].map(likelihood => {
                          const score = impact * likelihood;
                          const isSelected = assessmentData.likelihood === likelihood && assessmentData.impact === impact;
                          return (
                            <div
                              key={`${impact}-${likelihood}`}
                              className={`
                                p-2 rounded text-center font-semibold
                                ${score >= 15 ? 'bg-rose-500 text-white' : ''}
                                ${score >= 10 && score < 15 ? 'bg-orange-500 text-white' : ''}
                                ${score >= 5 && score < 10 ? 'bg-amber-400 text-slate-900' : ''}
                                ${score < 5 ? 'bg-blue-400 text-white' : ''}
                                ${isSelected ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}
                              `}
                            >
                              {score}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Y-axis: Impact | X-axis: Likelihood
                  </div>
                </div>

                {/* Current Risk Level */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Current Risk Level</h3>
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-20 h-20 rounded-lg flex items-center justify-center
                      ${getScoreColor(assessmentData.riskScore)}
                    `}>
                      <span className="text-3xl font-bold">{assessmentData.riskScore}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xl font-bold text-slate-900">
                        {getScoreLabel(assessmentData.riskScore)} Risk
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {assessmentData.riskScore >= 15 && 'Immediate action required. This risk poses critical threat.'}
                        {assessmentData.riskScore >= 10 && assessmentData.riskScore < 15 && 'High priority mitigation needed.'}
                        {assessmentData.riskScore >= 5 && assessmentData.riskScore < 10 && 'Manage with standard controls.'}
                        {assessmentData.riskScore < 5 && 'Monitor periodically. Low impact expected.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assignment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Risk Owner
                    </label>
                    <input
                      type="text"
                      defaultValue={assessmentData.owner}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      data-testid="risk-owner-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Target Closure Date
                    </label>
                    <input
                      type="date"
                      defaultValue={assessmentData.targetDate}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      data-testid="target-date-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div data-testid="review-step">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Review & Save Assessment</h2>

              <div className="space-y-6">
                {/* Summary Card */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Assessment Summary</h3>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-slate-500">Risk Name</dt>
                      <dd className="font-semibold text-slate-900">{mockRisk.name}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Risk Type</dt>
                      <dd className="font-semibold text-slate-900">{mockRisk.riskType}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Likelihood</dt>
                      <dd className="font-semibold text-slate-900">{assessmentData.likelihood} / 5</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Impact</dt>
                      <dd className="font-semibold text-slate-900">{assessmentData.impact} / 5</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-500">Risk Score</dt>
                      <dd className={`inline-block px-3 py-1 rounded-lg font-bold text-lg ${getScoreColor(assessmentData.riskScore)}`}>
                        {assessmentData.riskScore} - {getScoreLabel(assessmentData.riskScore)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Owner</dt>
                      <dd className="font-semibold text-slate-900">{assessmentData.owner}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Target Date</dt>
                      <dd className="font-semibold text-slate-900">
                        {new Date(assessmentData.targetDate).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Rationale Review */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Risk Rationale</h3>
                  <p className="text-sm text-slate-600">{assessmentData.rationale}</p>
                </div>

                {/* Mitigation Strategies */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Mitigation Strategies</h3>
                  <ul className="space-y-2">
                    {assessmentData.mitigationStrategies.map((strategy, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Next Steps */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-2">Recommended Next Steps</h3>
                  <ul className="space-y-1 text-sm text-indigo-800">
                    <li>• Create detailed mitigation plan in the Mitigation tab</li>
                    <li>• Schedule regular review meetings</li>
                    <li>• Track progress against target closure date</li>
                    <li>• Update assessment as conditions change</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-slate-700"
            data-testid="previous-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium"
              data-testid="save-button"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>

            {currentStep !== 'review' ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                data-testid="next-button"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                data-testid="complete-button"
              >
                <CheckCircle className="w-4 h-4" />
                Complete Assessment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
