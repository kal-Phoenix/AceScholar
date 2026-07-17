import { useState } from 'react';
import { Filter, Clock, GraduationCap, Globe, BookOpen, ExternalLink, X, FileText, CheckCircle } from 'lucide-react';
import { PageType } from '../types';

interface PortfolioProps {
  setCurrentPage: (page: PageType) => void;
}

interface ProjectSample {
  id: number;
  title: string;
  category: 'Academic Writing' | 'Coding' | 'Engineering' | 'Data Analysis' | 'Presentations';
  level: 'Undergraduate' | 'Masters' | 'PhD';
  subject: string;
  timeframe: string;
  badgeColor: string;
  abstract: string;
  outcomes: string[];
  sampleContent: string;
}

export default function Portfolio({ setCurrentPage }: PortfolioProps) {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<ProjectSample | null>(null);

  const filterOptions = ['All', 'Academic Writing', 'Coding', 'Engineering', 'Data Analysis', 'Presentations'];

  const projects: ProjectSample[] = [
    {
      id: 1,
      title: "Literature Review on Machine Learning in Healthcare",
      category: 'Academic Writing',
      level: 'Masters',
      subject: "Computer Science",
      timeframe: "48 hours",
      badgeColor: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
      abstract: "A comprehensive review synthesizing CNN, Transformer and RNN methodologies in modern breast cancer oncology screening. Explores multi-modal input processing and feature maps.",
      outcomes: ["12 rigorous peer-reviewed sources analyzed", "Fully annotated references section in APA 7th style", "Logical flow structuring with deep thematic synthesis", "Verified under 4% Turnitin similarity score"],
      sampleContent: "Abstract: Machine learning architectures have evolved rapidly in healthcare diagnostics. This paper presents a structured review of deep convolutional neural networks applied to malignant classification tasks. We analyze convolutional layers, dropouts, and pooling layouts, detailing the performance delta between standard ResNet backbones and vision transformers..."
    },
    {
      id: 2,
      title: "E-commerce Website with Cart and Auth",
      category: 'Coding',
      level: 'Undergraduate',
      subject: "Web Development",
      timeframe: "72 hours",
      badgeColor: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
      abstract: "Full-stack client-server responsive store application built with React, Vite, Node, and Tailwind. Includes JWT authentication, real-time cart computations, and secure checkout endpoints.",
      outcomes: ["Clean, module-based folder structure", "100% functional localStorage state synchronization", "Secure custom API router setup on server", "Responsive layout optimized for mobile screens"],
      sampleContent: "import React, { useState, useEffect } from 'react';\n// Core Cart State Manager\nexport const CartContext = React.createContext();\nexport function CartProvider({ children }) {\n  const [items, setItems] = useState([]);\n  const addToCart = (product) => {\n    setItems(prev => [...prev, product]);\n  };\n  return (\n    <CartContext.Provider value={{ items, addToCart }}>\n      {children}\n    </CartContext.Provider>\n  );\n}"
    },
    {
      id: 3,
      title: "Mechanical Arm Assembly Drawing",
      category: 'Engineering',
      level: 'Undergraduate',
      subject: "Mechanical Engineering",
      timeframe: "48 hours",
      abstract: "Comprehensive 3D assembly modeling of a 3-degree-of-freedom robotic manipulator. Built with exact tolerance specs and full kinematic layouts.",
      outcomes: ["3D SolidWorks assembly file delivered", "Detailed 2D engineering sheets in standard ISO formats", "Exploded assemblies with Bills of Materials (BOM)", "Finite Element Analysis showing strain vectors"],
      badgeColor: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
      sampleContent: "Project Specification: Assembly Name Manipulator_Arm_3DOF.SLDASM. Part breakdown includes: Base Pivot Collar, Primary Arm Bracket, Secondary Extension Jib, and Dual Gripper Mount. Pin linkages sized at h7 tolerance limits. Stress evaluation predicts safe yield limits at 320MPa loads..."
    },
    {
      id: 4,
      title: "Sales Data Analysis with Python",
      category: 'Data Analysis',
      level: 'Undergraduate',
      subject: "Business",
      timeframe: "24 hours",
      abstract: "Quantitative research on 5,000 retail transactions. Uses Pandas for descriptive statistics, SciPy for correlation indices, and Seaborn for visual plots.",
      outcomes: ["Python .ipynb notebook with markdown comments", "Fully clean dataset with removed anomalies", "Detailed 5-page PDF executive summary report", "Clustering analysis using K-Means modeling"],
      badgeColor: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
      sampleContent: "import pandas as pd\nimport seaborn as sns\n# Load and clean customer metrics\ndf = pd.read_csv('sales_raw.csv')\ndf.dropna(inplace=True)\ncorr = df[['revenue', 'frequency', 'recency']].corr()\nprint(f'Customer Correlation Grid:\\n{corr}')\nsns.heatmap(corr, annot=True, cmap='coolwarm')"
    },
    {
      id: 5,
      title: "Climate Change Research Paper",
      category: 'Academic Writing',
      level: 'PhD',
      subject: "Environmental Science",
      timeframe: "72 hours",
      abstract: "High-level dissertation paper mapping the correlation between local soil desiccation vectors and sub-Saharan seasonal wind patterns. Employs advanced spatial statistics models.",
      outcomes: ["30+ peer-reviewed high-impact source bibliographies", "Strict compliance with IEEE journal guidelines", "Advanced data plots imported from spatial models", "Grammarly & academic tone optimized"],
      badgeColor: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
      sampleContent: "Dissertation Draft Excerpt: The integration of spatial interpolation algorithms provides a robust framework to understand sub-Saharan agricultural soil degradation. This paper examines thermal infrared indexes and soil moisture dynamics... Under continuous desiccation models, local vegetation drops below normal levels, accelerating desertification processes..."
    },
    {
      id: 6,
      title: "Business Pitch Deck — 20 Slides",
      category: 'Presentations',
      level: 'Undergraduate',
      subject: "Business",
      timeframe: "24 hours",
      abstract: "Stunning presentation mapping the financial strategy, market analysis, competitor comparison, and monetization structure for a logistics SaaS client.",
      outcomes: ["Fully editable PowerPoint .pptx file", "Custom vector charts and responsive graphs", "Perfect typography pairing using Inter and Outfit", "Detailed speaker notes scripts included on every slide"],
      badgeColor: "bg-pink-500/15 text-pink-400 border border-pink-500/30",
      sampleContent: "Slide 1: Executive Title - Logistics SaaS. Slide 2: The Problem Gap (Inefficient local delivery chains in sub-Saharan metros). Slide 3: Our Solution (SaaS dashboard routing). Slide 4: Addressable TAM/SAM Market Size. Slide 5: Competitor Comparison Quadrant..."
    }
  ];

  const filteredProjects = activeFilter === 'All'
    ? projects
    : projects.filter(p => p.category === activeFilter);

  const handleOrderRedirect = () => {
    setCurrentPage('order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100 min-h-screen" id="portfolio-page-container">
      
      {/* 1. PAGE HEADER */}
      <header className="relative bg-gradient-to-b from-[#0F172A] to-[#1E293B] py-10 sm:py-16 md:py-20 px-4 text-center border-b border-slate-800">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          <span className="text-amber-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Verified Quality Portfolio</span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">Our Work</h1>
          <div className="h-1 w-16 bg-amber-500 mx-auto rounded"></div>
          <p className="text-xs sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Real samples from real student projects we have delivered. Sensitive details, specific institution names, and author metadata have been strictly removed for confidentiality.
          </p>
        </div>
      </header>
 
      {/* 2. FILTER BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-10">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 border-b border-slate-800 pb-4 sm:pb-6">
          <div className="flex items-center space-x-1 sm:space-x-1.5 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 sm:mr-2">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter:</span>
          </div>
          {filterOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setActiveFilter(opt)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                activeFilter === opt
                  ? 'bg-amber-500 text-[#0F172A]'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </section>
 
      {/* 3. PORTFOLIO GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {filteredProjects.map((p) => (
            <div 
              key={p.id}
              className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-6 hover:border-amber-500/40 hover:bg-slate-900/80 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-3 sm:space-y-4">
                
                {/* Badge Row */}
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md ${p.badgeColor}`}>
                    {p.category}
                  </span>
                  <span className="flex items-center text-[9px] sm:text-[10px] font-semibold text-slate-400 bg-slate-800 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded">
                    <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500 mr-1 shrink-0" />
                    <span>{p.level}</span>
                  </span>
                </div>
 
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                  {p.title}
                </h3>
 
                <div className="grid grid-cols-2 gap-3 text-[11px] sm:text-xs pt-1 border-t border-slate-800/50">
                  <div>
                    <span className="text-slate-500 block text-[9px] sm:text-[10px] uppercase tracking-wider">Subject</span>
                    <span className="text-slate-300 font-medium">{p.subject}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[9px] sm:text-[10px] uppercase tracking-wider">Delivered In</span>
                    <span className="text-amber-500 font-semibold flex items-center justify-end">
                      <Clock className="h-3 w-3 mr-1" />
                      {p.timeframe}
                    </span>
                  </div>
                </div>
 
                <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-3 pt-1">
                  {p.abstract}
                </p>
 
              </div>
 
              {/* View sample button */}
              <div className="pt-4 sm:pt-6 mt-3 sm:mt-4">
                <button
                  onClick={() => setSelectedProject(p)}
                  className="w-full bg-slate-800 hover:bg-amber-500 text-slate-100 hover:text-[#0F172A] border border-slate-700/60 hover:border-amber-500 text-[11px] sm:text-xs font-bold py-2 sm:py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>View Sample Blueprint</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </button>
              </div>
 
            </div>
          ))}
        </div>
      </main>
 
      {/* SAMPLE DETAIL MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Close button */}
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-all focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
 
            {/* Modal Header */}
            <div className="space-y-2 sm:space-y-3 pb-3 sm:pb-4 border-b border-slate-800">
              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md ${selectedProject.badgeColor}`}>
                {selectedProject.category}
              </span>
              <h3 className="text-lg sm:text-2xl font-bold text-white pr-6">
                {selectedProject.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-400">
                <span className="flex items-center bg-slate-800 py-0.5 sm:py-1 px-2 sm:px-2.5 rounded text-[10px] sm:text-[11px]">
                  <GraduationCap className="h-3.5 w-3.5 text-amber-500 mr-1" />
                  <span>{selectedProject.level}</span>
                </span>
                <span>&bull;</span>
                <span>{selectedProject.subject}</span>
                <span>&bull;</span>
                <span className="text-amber-500 font-semibold">{selectedProject.timeframe} delivery</span>
              </div>
            </div>
 
            {/* Outcomes & Specs */}
            <div className="py-4 sm:py-6 space-y-3 sm:space-y-4">
              <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-500">Delivered Outcomes & Files</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-slate-300">
                {selectedProject.outcomes.map((out, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 mr-2 shrink-0" />
                    <span>{out}</span>
                  </li>
                ))}
              </ul>
            </div>
 
            {/* Code / Text Excerpt preview */}
            <div className="space-y-2">
              <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-500">Document Excerpt Expose</h4>
              <div className="bg-[#0b0f19] border border-slate-800/80 p-3 sm:p-4 rounded-xl font-mono text-[10px] sm:text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap max-h-40 sm:max-h-52 overflow-y-auto select-none">
                {selectedProject.sampleContent}
              </div>
            </div>
 
            {/* Modal footer order redirect */}
            <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              <p className="text-[11px] sm:text-xs text-slate-400 text-center sm:text-left">
                Need similar high-quality help with your assignment? Order in 2 minutes.
              </p>
              <button
                onClick={() => {
                  setSelectedProject(null);
                  handleOrderRedirect();
                }}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold text-xs sm:text-sm px-5 py-2 sm:px-6 sm:py-2.5 rounded-lg transition-all text-center cursor-pointer"
              >
                Order This Discipline
              </button>
            </div>
 
          </div>
        </div>
      )}
 
      {/* 4. BOTTOM CTA */}
      <section className="bg-slate-950/40 border-t border-slate-900 py-10 sm:py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
          <h2 className="text-xl sm:text-3xl font-bold text-white">Ready to place your order?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Get matched with our premier assignment professionals. 48 hour average delivery, 100% confidential.
          </p>
          <div className="pt-1 sm:pt-2">
            <button
              onClick={handleOrderRedirect}
              className="bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-xl shadow-lg hover:shadow-amber-500/15 transition-all text-xs sm:text-sm cursor-pointer"
            >
              Order Now
            </button>
          </div>
        </div>
      </section>
 
    </div>
  );
}
