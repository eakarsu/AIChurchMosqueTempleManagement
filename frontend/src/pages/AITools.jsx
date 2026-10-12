import React, { useEffect, useRef, useState } from 'react';
import {useLocation} from 'react-router-dom';
import FullFieldPresets from '../components/FullFieldPresets';
import AIReport from '../components/AIReport';
import {nativeFetch,nativeList} from '../components/useNativeTransport';
export const TOOLS = [
  {
    key: 'sermon-analyzer',
    label: 'Sermon Analyzer',
    description: 'Analyze themes, scripture references, sentiment.',
    fields: [
      { name: 'speaker', label: 'Speaker', type: 'text' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'sermon_transcript', label: 'Sermon Transcript', type: 'textarea' },
    ],
  },
  {
    key: 'donation-insights',
    label: 'Donation Insights',
    description: 'Trends, campaigns, donor patterns.',
    fields: [
      { name: 'period', label: 'Period (e.g. 2024)', type: 'text' },
      { name: 'donations', label: 'Donations JSON array', type: 'json' },
    ],
  },
  {
    key: 'prayer-guidance',
    label: 'Prayer Guidance',
    description: 'Pastoral suggestions for a prayer request.',
    fields: [
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'prayer_request_text', label: 'Prayer Request', type: 'textarea' },
    ],
  },
  {
    key: 'member-engagement',
    label: 'Member Engagement',
    description: 'At-risk members and re-engagement strategies.',
    fields: [
      { name: 'member_data', label: 'Members JSON array', type: 'json' },
      { name: 'attendance_history', label: 'Attendance JSON (optional)', type: 'json', optional: true },
    ],
  },
  {
    key: 'event-planner',
    label: 'Event Planner',
    description: 'Logistics, volunteers, promotion checklist.',
    fields: [
      { name: 'event_type', label: 'Event Type', type: 'text' },
      { name: 'expected_attendance', label: 'Expected Attendance', type: 'number' },
      { name: 'budget', label: 'Budget ($)', type: 'number' },
    ],
  },
  {
    key: 'outreach-strategy',
    label: 'Outreach Strategy',
    description: 'Community outreach plan + partnerships.',
    fields: [
      { name: 'community_demographics', label: 'Community Demographics (text or JSON)', type: 'textarea' },
      { name: 'current_programs', label: 'Current Programs (comma-separated)', type: 'list' },
    ],
  },
  {
    key: 'sermon-qa',
    label: 'Sermon QA Bot',
    description: 'Ask questions about previous sermons.',
    fields: [
      { name: 'question', label: 'Question', type: 'textarea' },
      { name: 'sermon_ids', label: 'Sermon IDs (comma-separated, optional)', type: 'list', optional: true },
    ],
  },
  {
    key: 'volunteer-burnout',
    label: 'Volunteer Burnout Alert',
    description: 'Detect at-risk volunteers from engagement patterns.',
    fields: [
      { name: 'volunteer_logs', label: 'Volunteer Logs JSON (optional - uses DB if empty)', type: 'json', optional: true },
    ],
  },
  {
    key: 'prayer-categorize',
    label: 'Prayer Categorization',
    description: 'Auto-tag prayer requests by topic.',
    fields: [
      { name: 'prayer_requests', label: 'Prayer Requests JSON array', type: 'json' },
    ],
  },
  {
    key: 'facility-optimizer',
    label: 'Facility Utilization Optimizer',
    description: 'Reduce conflicts & maximize bookings.',
    fields: [
      { name: 'bookings', label: 'Bookings JSON array', type: 'json' },
      { name: 'facilities', label: 'Facilities JSON (optional)', type: 'json', optional: true },
    ],
  },
];

const sourceRoutes = {'sermon-analyzer':['sermons'],'donation-insights':['donations'],'prayer-guidance':['prayers'],'member-engagement':['members','attendance'],'event-planner':[],'outreach-strategy':['outreach'],'sermon-qa':['sermons'],'volunteer-burnout':['volunteers'],'prayer-categorize':['prayers'],'facility-optimizer':['events','facilities']};
export function toolPresets(tool, sources) {
 const sermon=sources.sermons?.[0],prayer=sources.prayers?.[0];
 const json=value=>JSON.stringify(value||[],null,2);
 return ['Source review','Planning review','Executive review'].map((label,index)=>({label,values:{
 speaker:sermon?.speaker||'Unknown — verify with the source owner',date:sermon?.date?String(sermon.date).slice(0,10):new Date().toISOString().slice(0,10),sermon_transcript:sermon?.transcript||'No saved transcript was supplied. Request authorized source material before making scriptural claims.',
 period:['Current saved records','Review recorded giving periods','Compare verified source dates'][index],donations:json(sources.donations),
 category:prayer?.category||'Unknown — review with permission',prayer_request_text:prayer?.request_text||prayer?.request||prayer?.prayer_text||'Illustrative request: prepare respectful questions for an authorized follow-up. No recipient, pastoral action or consent is implied.',
 member_data:json(sources.members),attendance_history:json(sources.attendance),event_type:['Illustrative community planning workshop','Illustrative volunteer orientation','Illustrative interfaith community meeting'][index],expected_attendance:String([35,60,80][index]),budget:String([1200,1800,2400][index]),
 community_demographics:'Not verified. Use only the saved program records supplied; do not infer sensitive beliefs or demographics.',current_programs:(sources.outreach||[]).map(row=>row.program_name).join(', ')||'No current program sources supplied',
 question:['Summarize the saved sermon sources and flag missing evidence.','Compare the themes in the supplied sources without inventing quotations.','Prepare review questions with genuine source citations.'][index],sermon_ids:(sources.sermons||[]).map(row=>row.id).join(', '),
 volunteer_logs:json(sources.volunteers),prayer_requests:json(sources.prayers),bookings:json(sources.events),facilities:json(sources.facilities),
 }}));
}
const sourceFields=new Set(['speaker','date','sermon_transcript','donations','member_data','attendance_history','sermon_ids','volunteer_logs','prayer_requests','bookings','facilities','prayer_request_text','category','current_programs']);
export default function AITools() {
 const location=useLocation(),retained=location.state||{};
 const [activeKey,setActiveKey]=useState(TOOLS.some(tool=>tool.key===retained.feature)?retained.feature:TOOLS[0].key);
 const [inputs,setInputs]=useState(retained.input||{}),[editingId,setEditingId]=useState(retained.reportId||null),[result,setResult]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[sources,setSources]=useState({}),[sourceError,setSourceError]=useState(''),[sourceLoading,setSourceLoading]=useState(true);
 const request=useRef(null),read=useRef(null);const tool=TOOLS.find(item=>item.key===activeKey);
 const headers=()=>({'Content-Type':'application/json',Authorization:'Bearer '+localStorage.getItem('token')});
 const cancel=()=>{request.current?.abort();request.current=null;setLoading(false);};
 const loadSources=async()=>{read.current?.abort();const controller=new AbortController();read.current=controller;setSourceLoading(true);setSourceError('');try{const rows=await Promise.all(sourceRoutes[activeKey].map(async route=>[route,nativeList(await(await nativeFetch('/api/'+route,{headers:headers(),signal:controller.signal})).json())]));if(read.current===controller&&!controller.signal.aborted)setSources(Object.fromEntries(rows));}catch(failure){if(read.current===controller&&!controller.signal.aborted)setSourceError(failure.message||'Native AI sources could not be loaded.');}finally{if(read.current===controller&&!controller.signal.aborted){read.current=null;setSourceLoading(false);}}};
 useEffect(()=>{loadSources();return()=>{read.current?.abort();read.current=null;request.current?.abort();request.current=null;};},[activeKey]);
 const choose=key=>{cancel();setActiveKey(key);setInputs({});setEditingId(null);setResult(null);setError('');};
 const generate=async event=>{event.preventDefault();if(request.current)return;const controller=new AbortController();request.current=controller;setLoading(true);setError('');setResult(null);try{const payload={};for(const f of tool.fields){const value=inputs[f.name];if(value===undefined||value==='')continue;payload[f.name]=f.type==='json'?JSON.parse(value):f.type==='list'?String(value).split(',').map(item=>item.trim()).filter(Boolean):f.type==='number'?Number(value):value;}if(editingId)payload.report_id=editingId;const response=await nativeFetch('/api/ai/'+activeKey,{method:'POST',headers:headers(),signal:controller.signal,body:JSON.stringify(payload)});const data=await response.json();if(request.current!==controller||controller.signal.aborted)return;setResult(data);if(data.id)setEditingId(data.id);}catch(failure){if(request.current===controller&&!controller.signal.aborted)setError(failure.message||'The report could not be generated.');}finally{if(request.current===controller){request.current=null;setLoading(false);}}};
 return <main className="page-container"><header className="page-header"><h1>AI Tools</h1><p>Review native sources, fill every field, then generate a saved OpenRouter report. Planning examples do not create communications, payments, approvals or consent.</p></header><nav className="ai-actions">{TOOLS.map(item=><button type="button" key={item.key} className={'btn '+(activeKey===item.key?'btn-primary':'btn-secondary')} onClick={()=>choose(item.key)}>{item.label}</button>)}</nav><section className="card" style={{padding:24,marginTop:24}}><h2>{tool.label}</h2><p>{tool.description}</p>{sourceLoading?<p role="status">Loading native sources…</p>:sourceError?<section role="alert"><p>{sourceError}</p><button className="btn btn-secondary" onClick={loadSources}>Retry</button></section>:<form onSubmit={generate} data-native-ai={tool.key}><FullFieldPresets value={inputs} presets={toolPresets(tool,sources)} disabled={loading} onChange={next=>{const filled=Object.fromEntries(tool.fields.map(f=>[f.name,next[f.name]]));for(const f of tool.fields)if(sourceFields.has(f.name)&&String(inputs[f.name]||'').trim())filled[f.name]=inputs[f.name];setInputs(filled);setResult(null);setError('');}}/><p className="ai-muted">Each choice fills every field, including optional fields. Saved source references and current source data are preserved. Review illustrative planning amounts before generating.</p>{tool.fields.map(f=><div className="form-group" key={f.name}><label htmlFor={'native-ai-'+f.name}>{f.label}{f.optional?' · Optional':''}</label>{['textarea','json'].includes(f.type)?<textarea id={'native-ai-'+f.name} className="form-input" rows={4} value={inputs[f.name]??''} disabled={loading} onChange={event=>setInputs({...inputs,[f.name]:event.target.value})}/>:<input id={'native-ai-'+f.name} className="form-input" type={['number','date'].includes(f.type)?f.type:'text'} value={inputs[f.name]??''} disabled={loading} onChange={event=>setInputs({...inputs,[f.name]:event.target.value})}/>}</div>)}<div className="ai-actions"><button type="button" className="btn btn-secondary" onClick={()=>{if(loading)cancel();else{setInputs({});setResult(null);setEditingId(null);setError('');}}}>Cancel</button><button className="btn btn-primary" type="submit" disabled={loading}>{loading?'Generating…':'Generate with OpenRouter'}</button></div></form>}</section><AIReport response={result} error={error} loading={loading} title={tool.label}/></main>;
}
