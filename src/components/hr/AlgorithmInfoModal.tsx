'use client';
import React, { useState } from 'react';
import { Modal } from '@/components/ui';
import { BookOpen, Calculator, Scale, Trophy, Lightbulb, ChevronRight } from 'lucide-react';

interface AlgorithmInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'algorithm1' | 'algorithm2' | 'algorithm3' | 'ensemble';

export function AlgorithmInfoModal({ isOpen, onClose }: AlgorithmInfoModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('algorithm1');

  const tabs = [
    { id: 'algorithm1' as TabType, label: 'Algorithm 1', icon: Calculator, color: 'blue' },
    { id: 'algorithm2' as TabType, label: 'Algorithm 2', icon: Scale, color: 'purple' },
    { id: 'algorithm3' as TabType, label: 'Algorithm 3', icon: Trophy, color: 'yellow' },
    { id: 'ensemble' as TabType, label: 'Ensemble Method', icon: Lightbulb, color: 'green' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Understanding the Ranking Algorithms"
      showFooter={false}
    >
      <div className="relative">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? `bg-${tab.color}-500 text-white shadow-lg`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor:
                          tab.color === 'blue' ? '#3B82F6' :
                          tab.color === 'purple' ? '#A855F7' :
                          tab.color === 'yellow' ? '#EAB308' :
                          '#22C55E',
                      }
                    : undefined
                }
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          {activeTab === 'algorithm1' && <Algorithm1Content />}
          {activeTab === 'algorithm2' && <Algorithm2Content />}
          {activeTab === 'algorithm3' && <Algorithm3Content />}
          {activeTab === 'ensemble' && <EnsembleContent />}
        </div>

        {/* Footer */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-blue-900 mb-1">Mathematical Rigor</p>
              <p>
                All three algorithms are mathematically justified with citations from academic literature.
                This ensures fair, transparent, and defensible ranking decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Algorithm1Content() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Algorithm 1: Weighted Sum Model</h3>
          <p className="text-sm text-gray-600 mt-1">Linear combination with normalized weights</p>
        </div>
      </div>

      {/* What */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-blue-500" />
          What is it?
        </h4>
        <p className="text-gray-700 leading-relaxed">
          The Weighted Sum Model is a Multi-Criteria Decision Analysis (MCDA) technique that combines multiple
          qualification factors into a single score. Each factor (education, experience, skills, eligibility) is
          scored individually and then multiplied by a predetermined weight to reflect its importance.
        </p>
      </div>

      {/* How */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-blue-500" />
          How does it work?
        </h4>
        <div className="space-y-3 text-sm">
          <div className="bg-white rounded-lg p-3">
            <p className="font-mono text-gray-800 mb-2">
              <strong>Formula:</strong> Score = (0.30 × E) + (0.20 × X) + (0.20 × S) + (0.30 × L)
            </p>
            <ul className="space-y-1 text-gray-600">
              <li><strong>E</strong> = Education match (0-100)</li>
              <li><strong>X</strong> = Experience match (0-100)</li>
              <li><strong>S</strong> = Skills match (0-100)</li>
              <li><strong>L</strong> = License/Eligibility match (0-100)</li>
            </ul>
          </div>

          <div className="space-y-2 text-gray-700">
            <p><strong>Weight Distribution:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• <strong>30%</strong> - Education (highest priority for government positions)</li>
              <li>• <strong>20%</strong> - Experience (proven track record, balanced with other factors)</li>
              <li>• <strong>20%</strong> - Skills (technical competency)</li>
              <li>• <strong>30%</strong> - Eligibility (professional licenses are critical for government positions)</li>
            </ul>
            <p className="text-xs text-gray-500 italic mt-2">Note: Weights sum to 100% for proper normalization</p>
          </div>
        </div>
      </div>

      {/* Why */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-blue-500" />
          Why use this algorithm?
        </h4>
        <div className="space-y-2 text-gray-700">
          <p>✓ <strong>Simplicity:</strong> Easy to understand and explain to stakeholders</p>
          <p>✓ <strong>Transparency:</strong> Clear weight distribution shows what matters most</p>
          <p>✓ <strong>Flexibility:</strong> Weights can be adjusted based on job requirements</p>
          <p>✓ <strong>Proven:</strong> Widely used in HR and recruitment systems worldwide</p>
        </div>
      </div>

      {/* Academic Citation */}
      <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
        <p className="text-xs font-semibold text-gray-600 mb-1">ACADEMIC REFERENCE</p>
        <p className="text-sm text-gray-800">
          Fishburn, P. C. (1967). "Additive Utilities with Incomplete Product Set: Application to Priorities and
          Assignments." Operations Research Society of America (ORSA).
        </p>
      </div>
    </div>
  );
}

function Algorithm2Content() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Scale className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Algorithm 2: Skill-Experience Composite</h3>
          <p className="text-sm text-gray-600 mt-1">Exponential decay weighting for experience</p>
        </div>
      </div>

      {/* What */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-purple-500" />
          What is it?
        </h4>
        <p className="text-gray-700 leading-relaxed">
          This algorithm uses an exponential decay function to weight experience, recognizing that additional years
          of experience beyond requirements have diminishing returns. It creates a composite score that rewards
          candidates who have <strong>both</strong> relevant skills <strong>and</strong> experience working together.
        </p>
      </div>

      {/* How */}
      <div className="bg-purple-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-purple-500" />
          How does it work?
        </h4>
        <div className="space-y-3 text-sm">
          <div className="bg-white rounded-lg p-3">
            <p className="font-mono text-gray-800 mb-2">
              <strong>Formula:</strong> Score = (0.30 × S × e<sup>βX</sup>) + (0.35 × E) + (0.35 × L)
            </p>
            <ul className="space-y-1 text-gray-600">
              <li><strong>S</strong> = Skills match ratio (using Sørensen-Dice coefficient)</li>
              <li><strong>X</strong> = Experience adequacy (actual years / required years)</li>
              <li><strong>E</strong> = Education match</li>
              <li><strong>L</strong> = License/Eligibility match</li>
              <li><strong>β</strong> = 0.5 (decay rate constant)</li>
            </ul>
          </div>

          <div className="space-y-2 text-gray-700">
            <p><strong>Key Innovation:</strong></p>
            <p>
              The exponential function <code className="bg-gray-100 px-2 py-1 rounded">e<sup>βX</sup></code> means
              that having 2× the required experience doesn't give you 2× the score. Instead, the benefit levels off,
              recognizing that someone with 10 years of experience isn't necessarily twice as qualified as someone
              with 5 years.
            </p>
            <p className="text-xs text-gray-500 italic mt-2">
              This prevents over-weighting senior candidates when junior roles require fresh perspectives.
            </p>
          </div>
        </div>
      </div>

      {/* Why */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-purple-500" />
          Why use this algorithm?
        </h4>
        <div className="space-y-2 text-gray-700">
          <p>✓ <strong>Realistic:</strong> Captures diminishing returns of experience</p>
          <p>✓ <strong>Skills-Focused:</strong> Prioritizes practical competencies (30% weight)</p>
          <p>✓ <strong>Balanced:</strong> Prevents over-qualification bias</p>
          <p>✓ <strong>Research-Based:</strong> Uses cognitive psychology principles</p>
        </div>
      </div>

      {/* Academic Citation */}
      <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
        <p className="text-xs font-semibold text-gray-600 mb-1">ACADEMIC REFERENCE</p>
        <p className="text-sm text-gray-800">
          Kahneman, D., & Tversky, A. (1979). "Prospect Theory: An Analysis of Decision under Risk."
          Econometrica, 47(2), 263-291.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Exponential weighting based on how humans actually perceive value and make decisions.
        </p>
      </div>
    </div>
  );
}

function Algorithm3Content() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
        <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Algorithm 3: Eligibility-Education Tie-breaker</h3>
          <p className="text-sm text-gray-600 mt-1">Lexicographic ordering with boolean logic</p>
        </div>
      </div>

      {/* What */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-yellow-600" />
          What is it?
        </h4>
        <p className="text-gray-700 leading-relaxed">
          This algorithm is only used when Algorithm 1 and Algorithm 2 produce scores within 5 points of each other
          (i.e., a near-tie). It uses a priority-based system to break ties by evaluating criteria in strict order:
          eligibility first, then education, then experience, and finally skills.
        </p>
      </div>

      {/* How */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-yellow-600" />
          How does it work?
        </h4>
        <div className="space-y-3 text-sm">
          <div className="bg-white rounded-lg p-3">
            <p className="font-semibold text-gray-800 mb-2">Priority Order:</p>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-yellow-600">1.</span>
                <div>
                  <strong>Professional License/Eligibility (40 points)</strong>
                  <p className="text-xs text-gray-600">Exact match required for government positions</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-yellow-600">2.</span>
                <div>
                  <strong>Exact Degree Match (30 points)</strong>
                  <p className="text-xs text-gray-600">Specific educational qualification</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-yellow-600">3.</span>
                <div>
                  <strong>Years Over Requirement (up to 20 points)</strong>
                  <p className="text-xs text-gray-600">10 points per extra year, max 2 years counted</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-yellow-600">4.</span>
                <div>
                  <strong>Skill Diversity (up to 10 points)</strong>
                  <p className="text-xs text-gray-600">10 points per matched skill, max 1 skill counted</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-white rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">EXAMPLE TIE-BREAK SCENARIO:</p>
            <div className="space-y-1 text-gray-700">
              <p>• Candidate A: Algorithm 1 = 72.5, Algorithm 2 = 70.8 (difference = 1.7)</p>
              <p>• Candidate B: Algorithm 1 = 71.2, Algorithm 2 = 72.0 (difference = 0.8)</p>
              <p className="text-yellow-600 font-medium mt-2">
                → Both within 5-point threshold → Algorithm 3 activates
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-yellow-600" />
          Why use this algorithm?
        </h4>
        <div className="space-y-2 text-gray-700">
          <p>✓ <strong>Decisive:</strong> Eliminates ties with clear priority rules</p>
          <p>✓ <strong>Fair:</strong> Uses objective criteria, not subjective judgment</p>
          <p>✓ <strong>Transparent:</strong> Candidates know exactly how ties are broken</p>
          <p>✓ <strong>Compliance-Focused:</strong> Prioritizes mandatory requirements (eligibility)</p>
        </div>
      </div>

      {/* Academic Citation */}
      <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-yellow-500">
        <p className="text-xs font-semibold text-gray-600 mb-1">ACADEMIC REFERENCE</p>
        <p className="text-sm text-gray-800">
          Gale, D., & Shapley, L. S. (1962). "College Admissions and the Stability of Marriage."
          American Mathematical Monthly, 69(1), 9-15.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Lexicographic ordering ensures stable matching between candidates and positions.
        </p>
      </div>
    </div>
  );
}

function EnsembleContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Ensemble Method: Combining All Three</h3>
          <p className="text-sm text-gray-600 mt-1">Intelligent algorithm selection for optimal results</p>
        </div>
      </div>

      {/* What */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-green-500" />
          What is the Ensemble Method?
        </h4>
        <p className="text-gray-700 leading-relaxed">
          The Ensemble Method combines all three algorithms intelligently. Instead of relying on a single approach,
          it leverages the strengths of each algorithm to produce more accurate and robust rankings. Think of it as
          getting a "second opinion" from multiple experts before making a decision.
        </p>
      </div>

      {/* How */}
      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-green-500" />
          How does it decide?
        </h4>
        <div className="space-y-4">
          {/* Decision Tree */}
          <div className="bg-white rounded-lg p-4 border-2 border-green-200">
            <p className="font-semibold text-gray-800 mb-3">Decision Logic:</p>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Calculate Algorithm 1 and Algorithm 2 scores</p>
                  <p className="text-sm text-gray-600 mt-1">Run both algorithms independently on the same candidate</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Check if scores are within 5 points</p>
                  <p className="text-sm text-gray-600 mt-1">
                    If |Score₁ - Score₂| ≤ 5 → Too close to call, go to Step 3
                  </p>
                  <p className="text-sm text-gray-600">
                    If |Score₁ - Score₂| &gt; 5 → Clear difference, go to Step 4
                  </p>
                </div>
              </div>

              {/* Branch A: Tie-breaker */}
              <div className="ml-11 pl-4 border-l-2 border-yellow-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    3A
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Use Algorithm 3 (Tie-breaker)</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Final Score = Algorithm 3 Score (100% weight)
                    </p>
                    <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                      Algorithm 3 uses priority-based scoring to resolve the tie
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch B: Weighted Average */}
              <div className="ml-11 pl-4 border-l-2 border-blue-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    3B
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Use Weighted Average</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Final Score = (0.60 × Algorithm 1) + (0.40 × Algorithm 2)
                    </p>
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700">
                      Algorithm 1 gets more weight (60%) as it's simpler and more interpretable
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="bg-white rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-600 mb-3">EXAMPLE CALCULATION:</p>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Algorithm 1 (Weighted Sum): <strong>75.2</strong></p>
              <p>• Algorithm 2 (Skill-Experience): <strong>68.5</strong></p>
              <p>• Difference: <strong>6.7 points</strong></p>
              <p className="text-green-600 font-medium mt-2">
                → Difference &gt; 5, so use weighted average:
              </p>
              <p className="ml-4 font-mono">
                (75.2 × 0.60) + (68.5 × 0.40) = <strong className="text-green-600">72.5</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-green-500" />
          Why use an ensemble?
        </h4>
        <div className="space-y-2 text-gray-700">
          <p>✓ <strong>More Accurate:</strong> Reduces bias from any single algorithm</p>
          <p>✓ <strong>More Robust:</strong> Handles edge cases better than individual algorithms</p>
          <p>✓ <strong>Adaptive:</strong> Automatically switches to tie-breaker when needed</p>
          <p>✓ <strong>Industry Standard:</strong> Used in machine learning and decision science</p>
        </div>
      </div>

      {/* Benefits Table */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-200">
        <p className="font-semibold text-gray-800 mb-3">Ensemble Benefits:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded p-3">
            <p className="font-medium text-green-700 mb-1">Balances Perspectives</p>
            <p className="text-xs text-gray-600">
              Algorithm 1 is conservative, Algorithm 2 is skills-focused - ensemble finds middle ground
            </p>
          </div>
          <div className="bg-white rounded p-3">
            <p className="font-medium text-green-700 mb-1">Handles Ties Gracefully</p>
            <p className="text-xs text-gray-600">
              Automatic switch to tie-breaker ensures no manual intervention needed
            </p>
          </div>
          <div className="bg-white rounded p-3">
            <p className="font-medium text-green-700 mb-1">Reduces Outliers</p>
            <p className="text-xs text-gray-600">
              Averaging smooths out extreme scores that might be algorithmic artifacts
            </p>
          </div>
          <div className="bg-white rounded p-3">
            <p className="font-medium text-green-700 mb-1">Explainable Results</p>
            <p className="text-xs text-gray-600">
              Can show contribution of each algorithm to final decision
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
