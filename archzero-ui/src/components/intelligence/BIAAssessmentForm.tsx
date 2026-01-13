import { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

interface BIAAssessmentFormProps {
  cardId: string;
  cardName: string;
  profiles: string[];
  onSubmit: (assessment: {
    profileName: string;
    responses: Array<{ questionId: string; score: number }>;
  }) => void;
  onCancel: () => void;
}

export function BIAAssessmentForm({ cardId, cardName, profiles, onSubmit, onCancel }: BIAAssessmentFormProps) {
  const [step, setStep] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [currentDimension, setCurrentDimension] = useState(0);

  // Mock profile data - in production, fetch from API
  const profileData: Record<string, any> = {
    healthcare: {
      name: 'Healthcare',
      industry: 'Healthcare',
      dimensions: [
        {
          id: 'patient_safety',
          name: 'Patient Safety',
          weight: 0.35,
          description: 'Impact on patient safety and care delivery',
          questions: [
            {
              id: 'q1',
              text: 'Does this system directly support patient care delivery?',
              weight: 1.0,
              responseOptions: [
                { value: 'yes_critical', label: 'Yes - Critical Path', score: 1.0 },
                { value: 'yes_support', label: 'Yes - Support System', score: 0.7 },
                { value: 'no', label: 'No', score: 0.2 },
              ],
              required: true,
            },
            {
              id: 'q2',
              text: 'What is the potential impact on patient safety if this system fails?',
              weight: 1.0,
              responseOptions: [
                { value: 'life_threatening', label: 'Life-threatening', score: 1.0 },
                { value: 'serious_harm', label: 'Serious harm', score: 0.8 },
                { value: 'moderate_impact', label: 'Moderate impact', score: 0.5 },
                { value: 'minimal_impact', label: 'Minimal impact', score: 0.2 },
              ],
              required: true,
            },
          ],
        },
        {
          id: 'data_security',
          name: 'Data Security & Privacy (HIPAA)',
          weight: 0.30,
          description: 'Handling of PHI and sensitive patient data',
          questions: [
            {
              id: 'q3',
              text: 'Does this system store or process Protected Health Information (PHI)?',
              weight: 1.0,
              responseOptions: [
                { value: 'yes_primary', label: 'Yes - Primary system of record', score: 1.0 },
                { value: 'yes_secondary', label: 'Yes - Secondary/replica', score: 0.7 },
                { value: 'no', label: 'No', score: 0.1 },
              ],
              required: true,
            },
          ],
        },
      ],
    },
  };

  const currentProfile = selectedProfile ? profileData[selectedProfile] : null;
  const dimensions = currentProfile?.dimensions || [];
  const dimension = dimensions[currentDimension];
  const progress = currentDimension ? ((currentDimension + 1) / dimensions.length) * 100 : 0;

  const handleResponse = (questionId: string, score: number) => {
    setResponses(prev => ({ ...prev, [questionId]: score }));
  };

  const handleNext = () => {
    if (step === 1 && !selectedProfile) return;

    if (step === 2 && currentDimension < dimensions.length - 1) {
      setCurrentDimension(prev => prev + 1);
    } else if (step === 2) {
      // Submit
      onSubmit({
        profileName: selectedProfile,
        responses: Object.entries(responses).map(([questionId, score]) => ({ questionId, score })),
      });
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step === 2 && currentDimension > 0) {
      setCurrentDimension(prev => prev - 1);
    } else {
      setStep(prev => prev - 1);
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return !selectedProfile;
    if (step === 2 && dimension) {
      const requiredQuestions = dimension.questions.filter(q => q.required);
      return requiredQuestions.some(q => !responses[q.id]);
    }
    return false;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-700 px-8 py-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">Business Impact Assessment</h2>
              <p className="text-slate-400">{cardName}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-amber-400 font-medium">Step {step} of 2</span>
              <span className="text-slate-400">{step === 1 ? 'Select Profile' : `Dimension ${currentDimension + 1} of ${dimensions.length}`}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: step === 1 ? '50%' : `${progress * 50 + 50}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Select Industry Profile</h3>
                <p className="text-slate-400">Choose the profile that best matches your organization type</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profiles.map(profile => (
                  <button
                    key={profile}
                    onClick={() => setSelectedProfile(profile)}
                    className={`
                      p-6 rounded-xl border-2 text-left transition-all duration-200
                      ${selectedProfile === profile
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                      }
                    `}
                  >
                    <div className="font-semibold text-white mb-1">{profile}</div>
                    <div className="text-sm text-slate-400">
                      {profile === 'healthcare' && 'Patient safety, HIPAA compliance'}
                      {profile === 'financial' && 'Regulatory, transaction processing'}
                      {profile === 'manufacturing' && 'Production impact, safety systems'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && dimension && (
            <div className="space-y-8">
              {/* Dimension Header */}
              <div className="border-l-4 border-amber-500 pl-6">
                <div className="text-sm font-medium text-amber-400 mb-1">
                  Dimension {currentDimension + 1} of {dimensions.length}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">{dimension.name}</h3>
                <p className="text-slate-400">{dimension.description}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <span className="px-2 py-1 bg-slate-800 rounded">Weight: {(dimension.weight * 100).toFixed(0)}%</span>
                  <span className="text-slate-600">•</span>
                  <span>{dimension.questions.length} questions</span>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {dimension.questions.map(question => (
                  <div key={question.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        responses[question.id] !== undefined
                          ? 'border-amber-500 bg-amber-500'
                          : question.required
                          ? 'border-red-500'
                          : 'border-slate-600'
                      }`}>
                        {responses[question.id] !== undefined && (
                          <CheckCircle2 className="w-4 h-4 text-slate-900" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium mb-1">{question.text}</p>
                        {question.required && (
                          <p className="text-xs text-red-400">Required</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {question.responseOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleResponse(question.id, option.score)}
                          className={`
                            p-4 rounded-lg border-2 text-left transition-all duration-200
                            ${responses[question.id] === option.score
                              ? 'border-teal-500 bg-teal-500/10 shadow-lg'
                              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                            }
                          `}
                        >
                          <div className="font-medium text-white">{option.label}</div>
                          <div className="text-xs text-slate-500 mt-1">Score: {option.score.toFixed(1)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 px-8 py-6 flex items-center justify-between">
          <button
            onClick={step === 1 ? onCancel : handleBack}
            className="px-6 py-2.5 text-slate-300 hover:text-white transition-colors flex items-center gap-2"
          >
            {step === 1 ? 'Cancel' : (
              <>
                <ChevronLeft className="w-4 h-4" />
                Back
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={isNextDisabled()}
            className={`
              px-8 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all duration-200
              ${isNextDisabled()
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 hover:shadow-lg hover:shadow-amber-500/20'
              }
            `}
          >
            {step === 1 ? (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            ) : step === 2 && currentDimension < dimensions.length - 1 ? (
              <>
                Next Dimension
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Complete Assessment
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
