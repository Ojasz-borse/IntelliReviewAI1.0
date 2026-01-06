
import React, { useState } from 'react';
import type { LoanAnalysisResponse } from '../types';
import { analyzeLoanDataWithGemini, saveSearchQuery } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import { FileTextIcon, SparklesIcon, TrendingDownIcon, PercentIcon, BanknoteIcon } from './icons';

const LoanModule: React.FC = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        salary: '',
        loanAmount: '',
        tenure: '',
        existingEMI: ''
    });
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<LoanAnalysisResponse | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === 'application/pdf' && selectedFile.size <= 5 * 1024 * 1024) { // 5MB limit
                setFile(selectedFile);
                setFileName(selectedFile.name);
                setError(null);
            } else {
                setError('Please upload a PDF file smaller than 5MB.');
                setFile(null);
                setFileName('');
            }
        }
    };

    const handleAnalyze = async () => {
        if (!file || !formData.salary || !formData.loanAmount || !formData.tenure || !user) {
            setError('Please fill all required fields and upload a bank statement.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const data = new FormData();
            data.append('declaredSalary', formData.salary);
            data.append('loanAmount', formData.loanAmount);
            data.append('tenure', formData.tenure);
            data.append('existingEMIs', formData.existingEMI || '0');
            data.append('data', file);
            
            const webhookUrl = 'https://ojaswini12.app.n8n.cloud/webhook/loan-application';
            const webhookResponse = await fetch(webhookUrl, {
                method: 'POST',
                body: data, // Browser automatically sets Content-Type to multipart/form-data
            });

            if (!webhookResponse.ok) {
                throw new Error(`The backend service failed with status: ${webhookResponse.status}`);
            }

            const rawData = await webhookResponse.json();
            const result = await analyzeLoanDataWithGemini(JSON.stringify(rawData));
            setAnalysis(result);

            const userQuery = `Loan app: Sal ${formData.salary}, Amt ${formData.loanAmount}, Tenure ${formData.tenure}`;
            await saveSearchQuery(user.uid, userQuery, 'loan', result);


        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Analysis failed: ${errorMessage}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section id="loan-module" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-white/[0.01]">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <FileTextIcon className="w-5 h-5 text-emerald-400" strokeWidth="1.5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">Loan Risk Intelligence</h2>
                        <p className="text-sm text-neutral-400">AI-powered analysis of financial health for loan applications</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-6 h-fit">
                         <h3 className="font-medium mb-4">Applicant Details</h3>
                         <div className="space-y-4">
                            <div>
                                <label htmlFor="salary" className="text-xs text-neutral-400 mb-1.5 block">Declared Monthly Salary (₹)</label>
                                <input type="number" name="salary" id="salary" value={formData.salary} onChange={handleInputChange} placeholder="e.g., 75000" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                            </div>
                            <div>
                                <label htmlFor="loanAmount" className="text-xs text-neutral-400 mb-1.5 block">Loan Amount Requested (₹)</label>
                                <input type="number" name="loanAmount" id="loanAmount" value={formData.loanAmount} onChange={handleInputChange} placeholder="e.g., 500000" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                            </div>
                             <div>
                                <label htmlFor="tenure" className="text-xs text-neutral-400 mb-1.5 block">Loan Tenure (Months)</label>
                                <input type="number" name="tenure" id="tenure" value={formData.tenure} onChange={handleInputChange} placeholder="e.g., 24" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                            </div>
                             <div>
                                <label htmlFor="existingEMI" className="text-xs text-neutral-400 mb-1.5 block">Existing EMIs (₹, Optional)</label>
                                <input type="number" name="existingEMI" id="existingEMI" value={formData.existingEMI} onChange={handleInputChange} placeholder="e.g., 12000" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                            </div>
                            <div>
                                <label htmlFor="statement" className="text-xs text-neutral-400 mb-1.5 block">Bank Statement (PDF, 6 mo.)</label>
                                <label htmlFor="statement" className="w-full px-4 py-2 bg-white/5 border border-dashed border-white/20 rounded-lg text-sm text-center text-neutral-400 cursor-pointer hover:bg-white/10 transition-colors block">
                                    {fileName || 'Click to upload PDF'}
                                </label>
                                <input type="file" id="statement" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                            </div>
                            <button onClick={handleAnalyze} disabled={isLoading} className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-sm font-medium hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                                <SparklesIcon className="w-4 h-4" strokeWidth="1.5" />
                                {isLoading ? 'Analyzing Document...' : 'Generate Risk Report'}
                            </button>
                         </div>
                    </div>

                    <div className="lg:col-span-3">
                         {isLoading && (
                            <div className="flex flex-col items-center justify-center py-16 h-full">
                                <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4"></div>
                                <p className="text-neutral-400 text-sm">Processing bank statement with AI...</p>
                            </div>
                        )}
                        
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center h-full flex flex-col justify-center">
                                <h3 className="font-medium text-red-400 mb-2">Analysis Error</h3>
                                <p className="text-sm text-neutral-400">{error}</p>
                            </div>
                        )}

                        {!isLoading && !error && !analysis && (
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center h-full flex flex-col justify-center">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                    <SparklesIcon className="w-6 h-6 text-neutral-500" />
                                </div>
                                <h3 className="font-medium text-neutral-300 mb-1">AI Analysis Report</h3>
                                <p className="text-sm text-neutral-500">Your loan risk report will appear here once you submit the details.</p>
                            </div>
                        )}

                        {analysis && (
                             <div className="animate-fade-in space-y-6">
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                    <h4 className="font-medium mb-4 flex items-center gap-2"><PercentIcon className="w-4 h-4 text-neutral-400" />Repayment Probability</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center flex-1 p-4 bg-emerald-500/10 rounded-lg">
                                            <p className="text-3xl font-semibold text-emerald-400">{analysis.repaymentProbability.successPercentage}%</p>
                                            <p className="text-xs text-emerald-300/80">Success</p>
                                        </div>
                                         <div className="text-center flex-1 p-4 bg-red-500/10 rounded-lg">
                                            <p className="text-3xl font-semibold text-red-400">{analysis.repaymentProbability.defaultPercentage}%</p>
                                            <p className="text-xs text-red-300/80">Default Risk</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                     <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                        <h4 className="font-medium mb-4 flex items-center gap-2"><TrendingDownIcon className="w-4 h-4 text-neutral-400" />Month-Level Risk</h4>
                                        <ul className="space-y-2">
                                            {analysis.monthLevelRisk.map((risk, i) => (
                                                <li key={i} className="text-sm p-3 bg-amber-500/10 rounded-lg">
                                                    <p className="font-medium text-amber-400">{risk.month}</p>
                                                    <p className="text-xs text-amber-300/80">{risk.reason}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                     <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                        <h4 className="font-medium mb-4 flex items-center gap-2"><BanknoteIcon className="w-4 h-4 text-neutral-400" />AI Recommendation</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-neutral-400">Recommended Interest</p>
                                                <p className="text-lg font-medium">{analysis.rateRecommendation.minInterestRate}% - {analysis.rateRecommendation.maxInterestRate}%</p>
                                            </div>
                                             <div>
                                                <p className="text-xs text-neutral-400">Safe Monthly EMI</p>
                                                <p className="text-lg font-medium">₹{analysis.rateRecommendation.safeEmi.toLocaleString('en-IN')}</p>
                                            </div>
                                             <div>
                                                <p className="text-xs text-neutral-400">EMI Bounce Probability</p>
                                                <p className="text-lg font-medium text-amber-400">{analysis.bounceRisk.emiBounceProbability}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        )}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default LoanModule;
