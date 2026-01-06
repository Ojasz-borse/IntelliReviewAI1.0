
export interface CarMetric {
  name: string;
  score: number;
}

export interface Car {
  name: string;
  description: string;
  overallScore: number;
  startingMSRP: number;
  metrics: CarMetric[];
  pros: string[];
  cons: string[];
}

export interface CarAnalysisResponse {
  cars: Car[];
  aiRecommendation: string;
  sources: string[];
}

// Interfaces for Social Media Analysis
export interface ProfileStats {
  username: string;
  fullName: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  bio: string;
  engagementRate: number; // e.g., 2.5 for 2.5%
}

export interface ContentAnalysis {
  summary: string;
  postFrequency: string;
  commonThemes: string[];
}

export interface SocialAnalysisResponse {
  profileStats: ProfileStats;
  contentAnalysis: ContentAnalysis;
  improvementTips: string[];
  sources: string[];
}

// Interfaces for Loan Risk Analysis
export interface RepaymentProbability {
    successPercentage: number;
    defaultPercentage: number;
}

export interface MonthlyRisk {
    month: string;
    reason: string;
}

export interface RateRecommendation {
    minInterestRate: number;
    maxInterestRate: number;
    safeEmi: number;
}

export interface BounceRisk {
    emiBounceProbability: number;
}

export interface LoanAnalysisResponse {
    repaymentProbability: RepaymentProbability;
    monthLevelRisk: MonthlyRisk[];
    rateRecommendation: RateRecommendation;
    bounceRisk: BounceRisk;
}

// Interfaces for News Analysis
export interface SentimentAnalysis {
    score: number; // -1 (Negative) to 1 (Positive)
    label: 'Positive' | 'Negative' | 'Neutral';
}

export interface BiasAnalysis {
    score: number; // 0 (Neutral) to 1 (Biased)
    label: 'Left' | 'Center' | 'Right' | 'Neutral' | 'Biased';
}

export interface NewsAnalysisResponse {
    headline: string;
    summary: string;
    sentiment: SentimentAnalysis;
    bias: BiasAnalysis;
    factuality: 'High' | 'Medium' | 'Low' | 'Unverified';
    keyPoints: string[];
    sources: string[];
}
