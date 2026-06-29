import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./features/mission-control/Dashboard";
import { AllInOneDashboard } from "./features/mission-control/AllInOneDashboard";
import { IceMappingDashboard } from "./features/ice-mapping/IceMappingDashboard";
import { PathPlanningDashboard } from "./features/path-planning/PathPlanningDashboard";
import { RadarDashboard } from "./features/radar-tracking/RadarDashboard";
import { DigitalTwinDashboard } from "./features/digital-twin/DigitalTwinDashboard";
import { SimulationDashboard } from "./features/simulation/SimulationDashboard";
import { TelemetryDashboard } from "./features/telemetry/TelemetryDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/all-in-one" replace />} />
          <Route path="all-in-one" element={<AllInOneDashboard />} />
          <Route path="mission-control" element={<AllInOneDashboard />} />
          <Route path="gis-only" element={<Dashboard />} />
          <Route path="intelligence" element={<IceMappingDashboard />} />
          <Route path="science/ice-volume" element={<IceMappingDashboard />} />
          <Route path="planning/traverse" element={<PathPlanningDashboard />} />
          <Route path="planning/landing" element={<PathPlanningDashboard />} />
          <Route path="analytics/radar" element={<RadarDashboard />} />
          <Route path="twin" element={<DigitalTwinDashboard />} />
          <Route path="simulation" element={<SimulationDashboard />} />
          <Route path="telemetry" element={<TelemetryDashboard />} />
          <Route path="reports" element={<TelemetryDashboard />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
