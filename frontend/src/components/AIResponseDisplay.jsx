import React from 'react';
import AIReport from './AIReport';
export default function AIResponseDisplay({response,title,isLoading}){return <AIReport response={response||null} title={title||'AI response'} loading={isLoading}/>;}
