import {nativeFetch} from '../useNativeTransport';
import React, { useEffect, useState } from 'react';
import { Flame, Award } from 'lucide-react';

function cellColor(score) {
  // Recorded membership presence
  if (score <= 1) return '#0f172a';
  if (score <= 3) return '#14532d';
  if (score <= 5) return '#15803d';
  if (score <= 7) return '#22c55e';
  return '#86efac';
}

function MemberEngagementHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load=async()=>{setLoading(true);setErr(null);try{const response=await nativeFetch('/api/custom-views/engagement-heatmap?members=100',{headers:{Authorization:'Bearer '+localStorage.getItem('token')}});const body=await response.json();if(!Array.isArray(body?.matrix))throw Error('Saved chart returned an invalid response.');setData(body);}catch(failure){setErr(failure.message);}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);

  if (loading) return <div style={{ padding: 16, color: '#94a3b8' }}>Loading engagement heatmap...</div>;
  if (err) return <div role="alert"><p>Saved chart could not be loaded: {err}</p><button className="btn btn-secondary" onClick={load}>Retry</button></div>;
  if (!data) return null;

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Flame size={20} color="#f59e0b" />
        <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: 18 }}>Saved Group Memberships</h3>
      </div>

      <p style={{color:'#cbd5e1'}}>{data.source}</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 2, fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ color: '#94a3b8', textAlign: 'left', padding: 4 }}>Member</th>
              {data.activities.map((a) => (
                <th key={a} style={{ color: '#94a3b8', padding: 4, fontWeight: 500, transform: 'rotate(-20deg)', whiteSpace: 'nowrap' }}>{a}</th>
              ))}
              <th style={{ color: '#94a3b8', padding: 4 }}>Σ</th>
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row) => (
              <tr key={row.member_id}>
                <td style={{ color: '#cbd5e1', padding: 4, whiteSpace: 'nowrap' }}>{row.member_name}</td>
                {data.activities.map((a) => (
                  <td
                    key={a}
                    title={`${row.member_name} - ${a}: ${row.scores[a]?'Joined':'—'}`}
                    style={{
                      background: cellColor(row.scores[a]),
                      color: row.scores[a] >= 6 ? '#052e16' : '#f1f5f9',
                      textAlign: 'center',
                      padding: '6px 4px',
                      borderRadius: 3,
                      fontWeight: 600,
                      minWidth: 24,
                    }}
                  >
                    {row.scores[a]?'Joined':'—'}
                  </td>
                ))}
                <td style={{ color: '#f1f5f9', textAlign: 'center', padding: 4, fontWeight: 700 }}>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{color:'#94a3b8'}}>Joined reflects a saved group membership. No engagement rating is inferred.</p>
    </div>
  );
}

export default MemberEngagementHeatmap;
