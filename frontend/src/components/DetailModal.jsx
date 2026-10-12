import React, { useEffect, useState } from 'react';
import Modal from './AIWorkspaceModal';
import './AIWorkspace.css';
export default function DetailModal({isOpen,onClose,title,children,onEdit,onDelete}) {
 const [deleting,setDeleting]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{setDeleting(false);setError('');},[isOpen,title]);
 if(!isOpen)return null;
 const close=()=>{setDeleting(false);setError('');onClose();};
 const remove=async()=>{if(!deleting){setDeleting(true);return;}setBusy(true);setError('');try{await onDelete();}catch(failure){setError(failure.message||'The saved record could not be deleted.');}finally{setBusy(false);}};
 return <Modal title={deleting?'Delete saved record?':title} onClose={close} footer={<><button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>{onEdit&&!deleting&&<button type="button" className="btn btn-primary" onClick={onEdit}>Edit</button>}{onDelete&&<button type="button" className="btn btn-danger" disabled={busy} onClick={remove}>{busy?'Deleting…':deleting?'Confirm delete':'Delete'}</button>}</>}>{error&&<p role="alert">{error}</p>}{deleting?<p>Delete this saved record? Related records may be affected through the existing database relationships. Review before confirming.</p>:children}</Modal>;
}
