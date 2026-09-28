import React from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  BarChart3, 
  BrainCircuit, 
  ShieldAlert, 
  LineChart, 
  Clock, 
  Cpu
} from 'lucide-react';

export const DepartmentPrediction = () => {
  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-2 py-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Future Intelligence Module</span>
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
          Predictive Insights
        </h1>

        <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          AI-powered civic issue prediction and preventive maintenance insights will be available here.
        </p>
      </div>

      {/* Main Placeholder Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm space-y-8 text-center relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Center Feature Icon Card */}
        <div className="relative z-10 space-y-4">
          <div className="h-20 w-20 bg-amber-50 border border-amber-100/80 rounded-3xl flex items-center justify-center text-amber-600 mx-auto shadow-md shadow-amber-500/10">
            <BrainCircuit className="h-10 w-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Preventive Maintenance Engine
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This module is designed to analyze historical complaint patterns, weather anomalies, and infrastructure age to forecast potential civic vulnerabilities before breakdowns occur.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 text-left border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary-600 font-bold text-xs">
              <LineChart className="h-4 w-4" />
              <span>Pattern Forecasting</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Identify recurring pothole or drainage block hotspots based on seasonal rainfall logs.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
              <ShieldAlert className="h-4 w-4" />
              <span>Risk Scoring</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Automated municipal asset health scores to prioritize preventive repairs.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
              <Cpu className="h-4 w-4" />
              <span>Resource Optimization</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Recommend optimal field worker allocation for high-risk zones ahead of peak demand.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-2 text-[11px] text-slate-400 font-medium">
          Note: Real predictive models will be connected once historical grievance datasets are compiled.
        </div>
      </div>
    </div>
  );
};

export default DepartmentPrediction;
