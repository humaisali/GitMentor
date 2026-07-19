import { AIInsightsWidget } from '../components/widgets/AIInsightsWidget';
import { RepositoryOverviewWidget } from '../components/widgets/RepositoryOverviewWidget';
import { SystemMetricsWidget } from '../components/widgets/SystemMetricsWidget';
import { LiveActivityFeedWidget } from '../components/widgets/LiveActivityFeedWidget';

const FocusWorkspace = () => {
  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <header className="mb-2 shrink-0">
        <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">Focus Workspace</h1>
        <p className="text-muted-steel mt-1 font-mono text-sm">Dashboard overview and current activity.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0 overflow-auto custom-scrollbar pr-2">
          <AIInsightsWidget />
          <LiveActivityFeedWidget />
        </div>

        {/* Sidebar Area */}
        <div className="flex flex-col gap-6 min-h-0 overflow-auto custom-scrollbar pr-2">
          <div className="shrink-0">
            <SystemMetricsWidget />
          </div>
          <div className="flex-1 min-h-[300px]">
            <RepositoryOverviewWidget />
          </div>
        </div>

      </div>
    </div>
  );
};

export default FocusWorkspace;
