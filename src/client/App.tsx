import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { DataGrid } from './components/DataGrid.js';
import { SchemaView } from './components/SchemaView.js';
import { SqlStudio } from './components/SqlStudio.js';
import { EmptyState } from './components/EmptyState.js';
import { DatabaseMetadata, TableSummary } from './types.js';

export const App: React.FC = () => {
  const [metadata, setMetadata] = useState<DatabaseMetadata | null>(null);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'data' | 'schema' | 'sql'>('data');
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const fetchDatabaseInfo = useCallback(async () => {
    setLoading(true);
    try {
      const statusRes = await fetch('/api/status');
      const statusData = await statusRes.json();

      if (statusData.connected) {
        setMetadata(statusData);
        const tablesRes = await fetch('/api/tables');
        const tablesData = await tablesRes.json();
        const loadedTables: TableSummary[] = tablesData.tables || [];
        setTables(loadedTables);

        setSelectedTable((prev) => {
          if (prev && loadedTables.some((t) => t.name === prev)) {
            return prev;
          }
          return loadedTables.length > 0 ? loadedTables[0].name : null;
        });
      } else {
        setMetadata(null);
        setTables([]);
        setSelectedTable(null);
      }
    } catch (err) {
      console.error('Error fetching database status:', err);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchDatabaseInfo();
  }, [fetchDatabaseInfo]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('data');
        } else if (e.key === '2' && selectedTable) {
          e.preventDefault();
          setActiveTab('schema');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab('sql');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTable]);

  if (!initialLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#090a0f] text-slate-400 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>Connecting to LiteLens...</span>
        </div>
      </div>
    );
  }

  if (!metadata) {
    return <EmptyState onDatabaseOpened={fetchDatabaseInfo} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0d14] text-slate-100 overflow-hidden font-sans">
      <Header
        metadata={metadata}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedTable={selectedTable}
        onRefresh={fetchDatabaseInfo}
        loading={loading}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          tables={tables}
          selectedTable={selectedTable}
          onSelectTable={(tableName) => {
            setSelectedTable(tableName);
            if (activeTab === 'sql') {
              setActiveTab('data');
            }
          }}
          onNewQuery={() => setActiveTab('sql')}
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-[#0b0e17]">
          {activeTab === 'data' && (
            selectedTable ? (
              <DataGrid key={selectedTable} tableName={selectedTable} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No tables in this database.
              </div>
            )
          )}

          {activeTab === 'schema' && (
            selectedTable ? (
              <SchemaView key={selectedTable} tableName={selectedTable} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Select a table to view its schema.
              </div>
            )
          )}

          {activeTab === 'sql' && (
            <SqlStudio initialTable={selectedTable} />
          )}
        </main>
      </div>
    </div>
  );
};
export default App;

