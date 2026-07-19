import { Card } from '../ui/Card';
import { mockSystemMetrics } from '../../data/mockData';

export const SystemMetricsWidget = () => {
  return (
    <Card className="flex flex-col">
      <div className="p-5 border-b border-whisper">
        <h2 className="text-lg font-medium text-canvas-white">System Health</h2>
      </div>
      
      <div className="p-5 grid grid-cols-2 gap-4">
        <MetricCard label="Lines Analyzed" value={mockSystemMetrics.linesAnalyzed} />
        <MetricCard label="Vulns Fixed" value={mockSystemMetrics.vulnerabilitiesFixed} />
        <MetricCard label="API Latency" value={mockSystemMetrics.apiLatency} />
        <MetricCard label="Last Sync" value={mockSystemMetrics.lastSync} />
      </div>
    </Card>
  );
};

const MetricCard = ({ label, value }) => (
  <div className="p-3 border border-whisper rounded bg-charcoal-base flex flex-col gap-1">
    <span className="text-xs text-muted-steel uppercase tracking-wider">{label}</span>
    <span className="text-lg font-mono text-canvas-white">{value}</span>
  </div>
);
