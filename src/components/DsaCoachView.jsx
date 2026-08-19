import React, { useState } from 'react';
import { GraduationCap, Lightbulb, Trophy, Brain, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DsaCoachView({ onAskTopic }) {
  const [selectedCategory, setSelectedCategory] = useState('DSA');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  const mockProblem = {
    id: 'dsa_01',
    title: 'Two Sum - Target Pair Finder',
    category: 'Arrays & Hash Maps',
    difficulty: 'Medium',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
    hints: [
      'Think about using a Hash Map to store previously visited numbers and their indices.',
      'For each number x in nums, check if (target - x) already exists in your map.',
      'This allows achieving O(N) time complexity instead of O(N^2) double loop.'
    ],
    exampleInput: 'nums = [2, 7, 11, 15], target = 9',
    exampleOutput: '[0, 1]'
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-purple-500 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-purple font-mono">Interactive Tutor & DSA Coach</span>
            <span className="text-xs text-slate-400">Step-by-Step Learning Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-purple-400" /> Teaching & Algorithm Coaching
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Friday adapts to your skill level, provides progressive hints, and helps you master technical concepts without giving away solutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['Easy', 'Medium', 'Hard'].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDifficulty === diff
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Category Selector & Tracked Stats */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" /> Subjects & Skill Tracks
          </h3>

          <div className="space-y-2">
            {['DSA', 'Python', 'Java', 'SQL', 'System Design', 'Web Dev'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5'
                }`}
              >
                <span>{cat}</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Solved Challenges</span>
              <span className="text-emerald-400 font-bold font-mono">14 / 20</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full w-[70%]" />
            </div>
          </div>
        </div>

        {/* Center/Right: Problem & Interactive Coaching */}
        <div className="md:col-span-2 glass-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="badge badge-cyan mb-1">{mockProblem.category}</span>
              <h3 className="text-lg font-extrabold text-white">{mockProblem.title}</h3>
            </div>
            <span className="badge badge-amber font-mono">{mockProblem.difficulty}</span>
          </div>

          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>{mockProblem.description}</p>
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5 font-mono text-xs text-slate-300 space-y-1">
              <div><span className="text-purple-400">Input: </span>{mockProblem.exampleInput}</div>
              <div><span className="text-emerald-400">Output: </span>{mockProblem.exampleOutput}</div>
            </div>
          </div>

          {/* Progressive Hint Drawer */}
          <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold">
                <Lightbulb className="w-4 h-4 text-amber-400" /> Progressive Hint #{currentHintIndex + 1}
              </div>
              {currentHintIndex < mockProblem.hints.length - 1 && (
                <button
                  onClick={() => setCurrentHintIndex(prev => prev + 1)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  Need another hint?
                </button>
              )}
            </div>
            <p className="text-xs font-sans text-slate-300 italic">
              "{mockProblem.hints[currentHintIndex]}"
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              onClick={() => onAskTopic && onAskTopic(`Explain ${mockProblem.title}`)}
              className="btn-secondary text-xs"
            >
              Ask Friday to Explain Pattern
            </button>
            <button 
              onClick={() => onAskTopic && onAskTopic(`Give me a new ${selectedCategory} challenge`)}
              className="btn-primary text-xs"
            >
              Get Next Challenge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
