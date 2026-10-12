import Modal from '../components/AIWorkspaceModal';
import AIReport from '../components/AIReport';
import {nativeFetch,nativeList} from '../components/useNativeTransport';
import React, { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, Send } from 'lucide-react';

function Webhooks() {
  const [items, setItems] = useState([]);
  const [selected,setSelected]=useState(null),[deleting,setDeleting]=useState(false),[editingId,setEditingId]=useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', events: '', active: true });
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await nativeFetch('/api/webhooks', { headers });
      const data = await res.json();
      setItems(nativeList(data));
    } catch (e) { setError(e.message||'Failed to fetch webhooks'); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const body = { ...form, events: form.events.split(',').map(s => s.trim()).filter(Boolean) };
    try {
      const res = await nativeFetch(editingId?'/api/webhooks/'+editingId:'/api/webhooks', { method: editingId?'PUT':'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Save failed');
      setShowForm(false);setEditingId(null);setSelected(null);
      setForm({ name: '', url: '', events: '', active: true });
      load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {

    try { await nativeFetch(`/api/webhooks/${id}`, { method: 'DELETE', headers }); setSelected(null);load(); } catch (e) { setError(e.message); }
  };

  const testDeliver = async (id) => {
    setTestResult(null);
    try {
      const res = await nativeFetch(`/api/webhooks/${id}/test`, { method: 'POST', headers, body: JSON.stringify({ event: 'test', payload: { hello: 'world' } }) });
      const data = await res.json();
      setTestResult({ id, ok: res.ok, data });
    } catch (e) { setTestResult({ id, ok: false, data: { error: e.message } }); }
  };

  if(error)return <section role="alert" className="page-container"><h1>Saved webhooks could not be loaded</h1><p>{error}</p><button className="btn btn-secondary" onClick={load}>Retry</button></section>;
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Zap size={24} /> Webhooks</h1>
          <p className="page-subtitle">Outbound webhook registry</p>
        </div>
        <button className="btn btn-primary" onClick={() => {setEditingId(null);setSelected(null);setForm({name:'',url:'',events:'',active:false});setShowForm(true);}}><Plus size={16} /> New</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <div className="loading">Loading...</div> : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>URL</th><th>Events</th><th>Active</th><th></th></tr>
            </thead>
            <tbody>
              {items.map(w => (
                <tr key={w.id}>
                  <td><button type="button" className="btn btn-secondary" onClick={()=>{setSelected(w);setDeleting(false);}}>{w.name||"Subscription #"+w.id}</button></td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.url}</td>
                  <td>{(w.events || []).join(', ')}</td>
                  <td>{w.active ? 'yes' : 'no'}</td>
                  <td>
                    <button className="btn-icon" title="Test delivery" disabled={!w.active} onClick={() => testDeliver(w.id)}><Send size={14} /></button>
                    <button className="btn-icon" onClick={()=>{setSelected(w);setDeleting(true);}}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No webhooks</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {testResult && (
        <div className="card" style={{ marginTop: '12px', background: testResult.ok ? '#ECFDF5' : '#FEE2E2' }}>
          <strong>Test result for #{testResult.id}:</strong>
          <AIReport response={testResult.data} title="Delivery test result"/>
        </div>
      )}

      {selected&&!showForm&&<Modal title={deleting?"Delete saved record?":"Saved webhooks details"} onClose={()=>setSelected(null)} footer={<><button className="btn btn-secondary" onClick={()=>setSelected(null)}>Cancel</button>{!deleting&&<button className="btn btn-primary" onClick={()=>{setForm({name:selected.name||'',url:selected.url||'',events:(selected.events||[]).join(', '),active:selected.status==='active'});setEditingId(selected.id);setShowForm(true);}}>Edit</button>}<button className="btn btn-danger" onClick={()=>deleting?remove(selected.id):setDeleting(true)}>{deleting?"Confirm delete":"Delete"}</button></>}>{deleting?<p>Delete this saved local record? No external message or delivery is created.</p>:<AIReport response={selected} title="Saved local source"/>}</Modal>}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingId?'Edit Webhook':'New Webhook'}</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>URL</label>
                <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>Events (comma-separated)</label>
                <input value={form.events} onChange={e => setForm({ ...form, events: e.target.value })} placeholder="donation.created, member.added" />
              </div>
              <div className="form-group">
                <label><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId?'Save changes':'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Webhooks;
