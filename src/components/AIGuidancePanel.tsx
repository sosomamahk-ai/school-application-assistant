import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, ThumbsUp, RefreshCw } from 'lucide-react';
import { FormField, AIGuidance } from '@/types';

interface AIGuidancePanelProps {
  field: FormField;
  currentValue?: string;
  onSuggestionAccept?: (value: string) => void;
}

export default function AIGuidancePanel({ field, currentValue, onSuggestionAccept }: AIGuidancePanelProps) {
  const [guidance, setGuidance] = useState<AIGuidance | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [improvingSuggestions, setImprovingSuggestions] = useState<{ suggestions: string[]; improvedVersion: string } | null>(null);

  const fetchGuidance = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/field-guidance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ field })
      });

      if (response.ok) {
        const data = await response.json();
        setGuidance(data.guidance);
      }
    } catch (error) {
      console.error('Error fetching guidance:', error);
    } finally {
      setLoading(false);
    }
  }, [field]);

  useEffect(() => {
    fetchGuidance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchGuidance]);

  const generateContent = async () => {
    setGeneratingContent(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/generate-essay', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ field })
      });

      if (response.ok) {
        const data = await response.json();
        if (onSuggestionAccept) {
          onSuggestionAccept(data.content);
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setGeneratingContent(false);
    }
  };

  const improveContent = async () => {
    if (!currentValue) return;

    setGeneratingContent(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/improve-content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ field, currentContent: currentValue })
      });

      if (response.ok) {
        const data = await response.json();
        setImprovingSuggestions(data);
      }
    } catch (error) {
      console.error('Error improving content:', error);
    } finally {
      setGeneratingContent(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-4">
        <Sparkles className="h-6 w-6 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI 智能指导</h3>
      </div>

      {/* Field Explanation */}
      {guidance && (
        <>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">此字段要求填写：</h4>
            <p className="text-gray-700">{guidance.explanation}</p>
          </div>

          {/* Requirements */}
          {guidance.requirements && guidance.requirements.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">填写要求：</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {guidance.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Examples */}
          {guidance.examples && guidance.examples.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">提示与示例：</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {guidance.examples.map((example, index) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Suggested Content */}
          {guidance.suggestedContent && !currentValue && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-primary-900">AI 建议：</h4>
                <button
                  onClick={() => onSuggestionAccept && onSuggestionAccept(guidance.suggestedContent!)}
                  className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>使用此建议</span>
                </button>
              </div>
              <p className="text-gray-700">{guidance.suggestedContent}</p>
            </div>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {(field.type === 'essay' || field.type === 'textarea') && (
          <>
            {!currentValue && (
              <button
                onClick={generateContent}
                disabled={generatingContent}
                className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {generatingContent ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>使用 AI 生成内容</span>
                  </>
                )}
              </button>
            )}

            {currentValue && (
              <button
                onClick={improveContent}
                disabled={generatingContent}
                className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {generatingContent ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>分析中...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    <span>获取改进建议</span>
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Improvement Suggestions */}
      {improvingSuggestions && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
          <div>
            <h4 className="font-medium text-green-900 mb-2">改进建议：</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {improvingSuggestions.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-green-900">改进后的版本：</h4>
              <button
                onClick={() => onSuggestionAccept && onSuggestionAccept(improvingSuggestions.improvedVersion)}
                className="text-green-600 hover:text-green-700 flex items-center space-x-1 text-sm"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>使用此版本</span>
              </button>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{improvingSuggestions.improvedVersion}</p>
          </div>
        </div>
      )}
    </div>
  );
}

