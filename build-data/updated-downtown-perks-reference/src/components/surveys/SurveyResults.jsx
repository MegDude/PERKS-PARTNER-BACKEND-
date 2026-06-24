import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Download } from 'lucide-react';

const COLORS = ['#0B1F33', '#CFAF5A', '#102A43', '#EAD08E', '#5B6B7C'];

export default function SurveyResults({ survey, onBack }) {
  const [mockResponses, setMockResponses] = useState([]);

  useEffect(() => {
    // Generate mock response data for demonstration
    const responses = [];
    for (let i = 0; i < (survey.responses_count || 0); i++) {
      const response = {};
      survey.questions?.forEach((q) => {
        if (q.type === 'rating') {
          response[q.id] = Math.floor(Math.random() * 5) + 1;
        } else if (q.type === 'multiple_choice' || q.type === 'checkbox') {
          response[q.id] = q.options[Math.floor(Math.random() * q.options.length)];
        } else {
          response[q.id] = `Sample response ${i + 1}`;
        }
      });
      responses.push(response);
    }
    setMockResponses(responses);
  }, [survey]);

  const getQuestionAnalytics = (question) => {
    if (question.type === 'rating') {
      const ratings = [0, 0, 0, 0, 0];
      mockResponses.forEach(r => {
        const rating = r[question.id];
        if (rating) ratings[rating - 1]++;
      });
      return {
        type: 'rating',
        data: ratings.map((count, idx) => ({
          label: `${idx + 1} Star${idx > 0 ? 's' : ''}`,
          value: count,
        })),
      };
    } else if (question.type === 'multiple_choice' || question.type === 'checkbox') {
      const counts = {};
      question.options?.forEach(opt => {
        counts[opt] = 0;
      });
      mockResponses.forEach(r => {
        const answer = r[question.id];
        if (answer && counts.hasOwnProperty(answer)) {
          counts[answer]++;
        }
      });
      return {
        type: 'choice',
        data: Object.entries(counts).map(([label, value]) => ({
          label,
          value,
        })),
      };
    }
    return null;
  };

  const handleExportCSV = () => {
    const headers = ['Response ID', ...survey.questions.map(q => q.text)];
    const rows = mockResponses.map((r, idx) => [
      idx + 1,
      ...survey.questions.map(q => r[q.id] || ''),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${survey.title}-responses.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-bgMain p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-navy">{survey.title}</h1>
              <p className="text-textSecondary">{survey.description}</p>
            </div>
          </div>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <p className="text-textMuted text-sm mb-2">Total Responses</p>
              <p className="text-4xl font-bold text-navy">{survey.responses_count || 0}</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <p className="text-textMuted text-sm mb-2">Total Questions</p>
              <p className="text-4xl font-bold text-navy">{survey.questions?.length || 0}</p>
            </CardContent>
          </Card>
          {survey.target_residents && (
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <p className="text-textMuted text-sm mb-2">Response Rate</p>
                <p className="text-4xl font-bold text-navy">
                  {Math.round((survey.responses_count / survey.target_residents) * 100)}%
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Question Analytics */}
        <div className="space-y-6">
          {survey.questions?.map((question, idx) => {
            const analytics = getQuestionAnalytics(question);
            if (!analytics) return null;

            return (
              <Card key={question.id} className="shadow-soft">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-navy">
                        {idx + 1}. {question.text}
                      </CardTitle>
                      <p className="text-xs text-textMuted mt-2 uppercase font-semibold">
                        {analytics.type === 'rating' ? 'Rating Distribution' : 'Response Distribution'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-navy bg-bgAlt px-3 py-1 rounded">
                      {analytics.data.reduce((sum, d) => sum + d.value, 0)} responses
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {analytics.type === 'rating' ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="value" fill="#0B1F33" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="grid grid-cols-2 gap-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics.data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ value }) => `${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analytics.data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {analytics.data.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                              />
                              <span className="text-sm text-navy font-medium">{item.label}</span>
                            </div>
                            <span className="text-sm font-bold text-navy">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}