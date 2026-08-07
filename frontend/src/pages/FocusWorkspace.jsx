import { AIInsightsWidget } from '../components/widgets/AIInsightsWidget';
import { RepositoryOverviewWidget } from '../components/widgets/RepositoryOverviewWidget';
import { SystemMetricsWidget } from '../components/widgets/SystemMetricsWidget';
import { LiveActivityFeedWidget } from '../components/widgets/LiveActivityFeedWidget';

const FocusWorkspace = () => {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <header className="mb-2 shrink-0">
        <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">Focus Workspace</h1>
        <p className="text-muted-steel mt-1 font-mono text-sm">Dashboard overview and current activity.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Row 1 */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex-1 h-full [&>*]:h-full">
            <AIInsightsWidget />
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <div className="flex-1 h-full [&>*]:h-full">
            <SystemMetricsWidget />
          </div>
        </div>

        {/* Row 2 */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex-1 h-full [&>*]:h-full">
            <LiveActivityFeedWidget />
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <div className="flex-1 h-full [&>*]:h-full">
            <RepositoryOverviewWidget />
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default FocusWorkspace;
