import {nativeFetch,nativeList} from '../components/useNativeTransport';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, DollarSign, Calendar, Heart, BookOpen, Star,
  Building, Bell, TrendingUp, TrendingDown,
  BarChart3, UsersRound, HeartHandshake, Globe
} from 'lucide-react';

const features = [
  { path: '/sermons', title: 'Sermon Management', desc: 'Create, manage, and get AI-powered sermon summaries and topic suggestions.', icon: BookOpen, color: 'gold' },
  { path: '/donations', title: 'Donation Management', desc: 'Track donations, generate tax receipts, and AI thank-you letters.', icon: DollarSign, color: 'green' },
  { path: '/members', title: 'Member Management', desc: 'Manage congregation members with AI engagement analysis.', icon: Users, color: 'blue' },
  { path: '/events', title: 'Event Coordination', desc: 'Plan and coordinate events with AI-generated descriptions.', icon: Calendar, color: 'teal' },
  { path: '/volunteers', title: 'Volunteer Scheduling', desc: 'Schedule volunteers and use AI to match skills to ministries.', icon: Heart, color: 'pink' },
  { path: '/prayers', title: 'Prayer Requests', desc: 'Manage prayer requests and receive AI spiritual guidance.', icon: Star, color: 'purple' },
  { path: '/facilities', title: 'Facility Management', desc: 'Manage facilities, bookings, and AI schedule optimization.', icon: Building, color: 'orange' },
  { path: '/announcements', title: 'Announcements', desc: 'Create and manage announcements with AI drafting.', icon: Bell, color: 'red' },
  { path: '/attendance', title: 'Attendance Tracking', desc: 'Monitor service attendance trends with AI growth insights.', icon: BarChart3, color: 'blue' },
  { path: '/small-groups', title: 'Small Groups', desc: 'Manage fellowship groups with AI curriculum suggestions.', icon: UsersRound, color: 'teal' },
  { path: '/counseling', title: 'Counseling', desc: 'Schedule pastoral counseling with AI session preparation.', icon: HeartHandshake, color: 'purple' },
  { path: '/outreach', title: 'Outreach Programs', desc: 'Track community outreach with AI impact analysis.', icon: Globe, color: 'green' },
];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ members: 0, donations: 0, events: 0, volunteers: 0 });
  const [loading, setLoading] = useState(true);
  const [error,setError]=useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);setError('');
    try {
      const [membersList,donationsList,eventsList,volunteersList]=await Promise.all(['members','donations','events','volunteers'].map(async table=>nativeList(await (await nativeFetch('/api/'+table,{headers:{Authorization:'Bearer '+localStorage.getItem('token')}})).json())));
      setStats({members:membersList.length,donations:donationsList.reduce((sum,row)=>sum+(Number(row.amount)||0),0),events:eventsList.length,volunteers:volunteersList.length});
    }catch(failure){setError(failure.message||'Saved dashboard data could not be loaded.');}finally{setLoading(false);}
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if(error)return <section role="alert"><h1>Dashboard data could not be loaded</h1><p>{error}</p><button className="btn btn-secondary" onClick={fetchStats}>Retry</button></section>;
  return (
    <div>
      <div className="dashboard-welcome">
        <h1>Welcome back!</h1>
        <p className="date">{today}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue"><Users size={22} /></div>
          </div>
          <div className="stat-value">{loading ? '...' : stats.members}</div>
          <div className="stat-label">Total Members</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon gold"><DollarSign size={22} /></div>
          </div>
          <div className="stat-value">{loading ? '...' : `$${stats.donations.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</div>
          <div className="stat-label">Saved donation total</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon teal"><Calendar size={22} /></div>
          </div>
          <div className="stat-value">{loading ? '...' : stats.events}</div>
          <div className="stat-label">Saved events</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green"><Heart size={22} /></div>
          </div>
          <div className="stat-value">{loading ? '...' : stats.volunteers}</div>
          <div className="stat-label">Saved volunteers</div>
        </div>
      </div>

      <h2 style={{ marginBottom: 20, fontSize: '1.25rem', fontWeight: 600 }}>Management Features</h2>
      <div className="feature-grid">
        {features.map((f) => (
          <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
            <div className={`feature-icon ${f.color}`}>
              <f.icon size={24} />
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
