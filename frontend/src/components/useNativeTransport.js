import React, { useCallback, useEffect, useRef, useState } from 'react';
import NativeAIReview from './NativeAIReview';
export async function nativeFetch(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let data; try { data = await (response.clone ? response.clone() : response).json(); } catch (_) { data = {}; }
    throw Error(data.message || data.details || data.error || `Request failed (${response.status})`);
  }
  return response;
}
export function nativeList(data) {
  const value = Array.isArray(data) ? data : ['data', 'members', 'sermons', 'donations', 'events', 'volunteers', 'prayers', 'facilities', 'announcements', 'notifications', 'items'].map(key => data?.[key]).find(Array.isArray);
  if (!Array.isArray(value)) throw Error('The saved records service returned an invalid response.');
  return value;
}
const optionalFields={
 'sermons/ai-generate-topics':{theme:'',audience:'',season:''},
 'events/ai-generate-description':{date:'',location:'',audience:''},
 'announcements/ai-draft':{topic:'',tone:'',key_details:''},
 'small-groups/ai-curriculum':{group_name:'',category:'',current_curriculum:'',member_count:'',duration_weeks:'',focus_area:''},
 'counseling/ai-session-prep':{client_background:'',previous_sessions:'',specific_concerns:''},
 'outreach/ai-impact':{question:''},'attendance/ai-insights':{question:''}
};
export default function useNativeTransport() {
  const active = useRef(new Set()); const [busy, setBusy] = useState(false); const mounted = useRef(true);
  const pending = useRef(null), [preview,setPreview] = useState(null);
  const cancel = useCallback(() => { pending.current?.reject(new DOMException('Request cancelled.','AbortError'));pending.current=null;for (const controller of active.current) controller.abort(); active.current.clear(); if (mounted.current) {setBusy(false);setPreview(null);} }, []);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; cancel(); }; }, [cancel]);
  const request = useCallback(async (url, options = {}) => {
    if (!String(url).includes('/ai')) return nativeFetch(url, options);
    if(options.method==='POST'){
      if(pending.current)throw Error('Review or cancel the current AI request first.');
      const payload=await new Promise((resolve,reject)=>{const original={review_context:'',review_goal:'',tone:'',output_format:'',...(optionalFields[String(url).replace('/api/','')]||{}),...JSON.parse(options.body||'{}')},parts=String(url).split('/').filter(Boolean);pending.current={resolve,reject};setPreview({payload:original,sourceLabel:/^\d+$/.test(parts[2]||'')?'Saved '+parts[1]+' record #'+parts[2]:'Current saved source data'});});
      options={...options,body:JSON.stringify(payload)};
      if(!mounted.current)throw new DOMException('Request cancelled.','AbortError');
    }
    const controller = new AbortController(); active.current.add(controller); setBusy(true);
    try { const response = await nativeFetch(url, { ...options, signal: controller.signal }); if (controller.signal.aborted) throw new DOMException('Request cancelled.', 'AbortError'); return response; }
    finally { active.current.delete(controller); if (mounted.current) setBusy(active.current.size > 0); }
  }, []);
  const generate = payload => { const waiting=pending.current;pending.current=null;setPreview(null);waiting?.resolve(payload); };
  return { request, cancel, busy, reviewDialog: preview ? React.createElement(NativeAIReview,{preview,onCancel:cancel,onGenerate:generate}) : null };
}
