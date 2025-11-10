import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchFireDroneRange } from '../api/apiClient';

const PAGE_SIZE = 50;

const formatTime = (ts) => new Date(ts).toLocaleString();

const FireDroneGrid = () => {
  const [entity, setEntity] = useState('fires'); // 'fires' or 'drones'
  const [page, setPage] = useState(0);
  const [startIso, setStartIso] = useState('');
  const [endIso, setEndIso] = useState('');

  const startMs = startIso ? new Date(startIso).getTime() : undefined;
  const endMs = endIso ? new Date(endIso).getTime() : undefined;

  const queryKey = ['fire-drone-grid', entity, page, startMs || 'auto', endMs || 'auto'];

  const queryClient = useQueryClient();

  const { data: pageData = { fires: [], drones: [], totals: { fires: 0, drones: 0 } }, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      // compute range: if not provided, default to last 24h
      const now = Date.now();
      const s = startMs ?? (now - 24 * 60 * 60 * 1000);
      const e = endMs ?? now;
      const res = await fetchFireDroneRange(s, e, entity, page, PAGE_SIZE);
      return res;
    },
    keepPreviousData: true,
  });

  const rows = (entity === 'fires' ? pageData.fires : pageData.drones) || [];
  const totalCount = (entity === 'fires' ? (pageData.totals?.fires ?? 0) : (pageData.totals?.drones ?? 0));
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]);
  const pageRows = rows; // server already returns the page

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <div>
          <label className="text-sm text-gray-300">Entity</label>
          <select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(0); }} className="ml-2 text-sm p-2 rounded bg-gray-800 text-white">
            <option value="fires">Fires</option>
            <option value="drones">Drones</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-300">Start</label>
          <input type="datetime-local" value={startIso} onChange={(e) => { setStartIso(e.target.value); setPage(0); }} className="ml-2 p-2 rounded bg-gray-800 text-white text-sm" />
        </div>

        <div>
          <label className="text-sm text-gray-300">End</label>
          <input type="datetime-local" value={endIso} onChange={(e) => { setEndIso(e.target.value); setPage(0); }} className="ml-2 p-2 rounded bg-gray-800 text-white text-sm" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => { setStartIso(''); setEndIso(''); setPage(0); }} className="px-3 py-2 bg-gray-700 rounded text-white text-sm">Reset</button>
          <button
            onClick={async () => {
              // Force a fresh query: invalidate the cache for this grid (current entity) then refetch
              await queryClient.invalidateQueries(['fire-drone-grid', entity]);
              refetch();
            }}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-xs text-gray-400">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Lat</th>
              <th className="px-3 py-2">Lng</th>
              {entity === 'fires' ? (
                <>
                  <th className="px-3 py-2">Intensity</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Size</th>
                </>
              ) : (
                <>
                  <th className="px-3 py-2">Battery</th>
                  <th className="px-3 py-2">Water</th>
                  <th className="px-3 py-2">Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="text-white">
            {isLoading ? (
              <tr><td colSpan={8} className="p-4 text-sm text-gray-400">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={8} className="p-4 text-sm text-red-400">Error loading data</td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={8} className="p-4 text-sm text-gray-400">No entries in range</td></tr>
            ) : pageRows.map((r, i) => (
              <tr key={`${r.id}-${r.timestamp}-${i}`} className="border-t border-gray-800 text-sm">
                <td className="px-3 py-2">{r.id}</td>
                <td className="px-3 py-2">{formatTime(r.timestamp)}</td>
                <td className="px-3 py-2">{r.lat}</td>
                <td className="px-3 py-2">{r.lng}</td>
                {entity === 'fires' ? (
                  <>
                    <td className="px-3 py-2">{r.intensity}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.size}</td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2">{r.battery}%</td>
                    <td className="px-3 py-2">{r.water}%</td>
                    <td className="px-3 py-2">{r.status}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-gray-400">Page {page + 1} of {totalPages}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} className="px-3 py-1 bg-gray-700 rounded text-white text-sm">Prev</button>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} className="px-3 py-1 bg-gray-700 rounded text-white text-sm">Next</button>
        </div>
      </div>
    </div>
  );
};

export default FireDroneGrid;
