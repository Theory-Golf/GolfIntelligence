'use client';

/**
 * Golf Intelligence Dashboard — Main Orchestrator
 * Single client-side page with tab-based navigation
 */

import { useState } from 'react';
import '@/styles/dashboard.css';
import { useGolfData } from '@/lib/golf/useGolfData';
import { getBenchmarkOptions } from '@/lib/golf/benchmarks';
import type { BenchmarkType } from '@/lib/golf/benchmarks';
import { DashboardNav } from './DashboardNav';
import { FilterBar } from './FilterBar';
import { Tiger5View } from './Tiger5View';
import { StrokesGainedView } from './StrokesGainedView';
import { DrivingView } from './DrivingView';
import { ApproachView } from './ApproachView';
import { PuttingView } from './PuttingView';
import { ScoringView } from './ScoringView';
import { ShortGameView } from './ShortGameView';
import { PlayerPathView } from './PlayerPathView';
import { CoachingView } from './CoachingView';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('tiger5');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    filteredShots,
    tiger5Metrics,
    scoringMetrics,
    birdieAndBogeyMetrics,
    drivingMetrics,
    drivingAnalysis,
    approachMetrics,
    approachByDistance,
    approachFromRough,
    approachHeatMapData,
    puttingMetrics,
    lagPuttingMetrics,
    mentalMetrics,
    shortGameMetrics,
    shortGameHeatMapData,
    performanceDrivers,
    playerPathMetrics,
    performanceDriversV2,
    coachTableMetrics,
    isLoading,
    error,
    lastUpdated,
    filterOptions,
    cascadingFilterOptions,
    filters,
    setFilters,
    clearFilters,
    benchmark,
    setBenchmark,
  } = useGolfData();

  const benchmarkOptions = getBenchmarkOptions();

  const handleBenchmarkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBenchmark(e.target.value as BenchmarkType);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1>Golf <em>Intelligence</em></h1>
          <p className="subtitle">By: Theory Golf</p>
        </div>
        {/* Benchmark Selector */}
        <div className="benchmark-selector">
          <label htmlFor="benchmark-select">Benchmark:</label>
          <select
            id="benchmark-select"
            value={benchmark}
            onChange={handleBenchmarkChange}
            className="benchmark-dropdown"
          >
            {benchmarkOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Navigation */}
      <DashboardNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Filter Bar */}
      {!isLoading && !error && (
        <FilterBar
          filters={filters}
          options={filterOptions}
          validOptions={cascadingFilterOptions}
          onFilterChange={setFilters}
          onClear={clearFilters}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Main Content */}
      <main className={`main ${!isLoading && !error ? 'main-with-sidebar' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {isLoading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '16px' }}>Loading golf data...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>{error}</p>
            <p style={{ marginTop: '8px', fontSize: '12px' }}>
              Make sure your Google Sheet is published to the web (File → Share → Publish to web)
            </p>
          </div>
        )}

        {!isLoading && !error && activeTab === 'tiger5' && (
          <Tiger5View metrics={tiger5Metrics} lastUpdated={lastUpdated} />
        )}

        {!isLoading && !error && activeTab === 'sg' && (
          <StrokesGainedView metrics={tiger5Metrics} filteredShots={filteredShots} />
        )}

        {!isLoading && !error && activeTab === 'driving' && (
          <DrivingView metrics={drivingMetrics} analysis={drivingAnalysis} filteredShots={filteredShots} />
        )}

        {!isLoading && !error && activeTab === 'approach' && (
          <ApproachView metrics={approachMetrics} approachByDistance={approachByDistance} approachFromRough={approachFromRough} approachHeatMapData={approachHeatMapData} filteredShots={filteredShots} />
        )}

        {!isLoading && !error && activeTab === 'putting' && (
          <PuttingView metrics={puttingMetrics} lagMetrics={lagPuttingMetrics} filteredShots={filteredShots} />
        )}

        {!isLoading && !error && activeTab === 'scoring' && (
          <ScoringView metrics={scoringMetrics} birdieAndBogeyMetrics={birdieAndBogeyMetrics} mentalMetrics={mentalMetrics} />
        )}

        {!isLoading && !error && activeTab === 'path' && (
          <PlayerPathView drivers={performanceDrivers} playerPathMetrics={playerPathMetrics} performanceDriversV2={performanceDriversV2} />
        )}

        {!isLoading && !error && activeTab === 'shortgame' && (
          <ShortGameView metrics={shortGameMetrics} shortGameHeatMapData={shortGameHeatMapData} filteredShots={filteredShots} />
        )}

        {!isLoading && !error && activeTab === 'coaching' && (
          <CoachingView metrics={coachTableMetrics} />
        )}
      </main>
    </div>
  );
}
