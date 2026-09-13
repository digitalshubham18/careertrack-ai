import React, { useEffect, useState, useCallback } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Users, Briefcase, FileSearch, Cpu, ShieldOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../services/admin.service';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { formatDate } from '../utils/format';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    const res = await adminService.analytics();
    setAnalytics(res.data.data);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await adminService.listUsers({ search });
      setUsers(res.data.data.users);
    } finally {
      setLoadingUsers(false);
    }
  }, [search]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleToggleActive = async (id) => {
    try {
      await adminService.toggleUserActive(id);
      fetchUsers();
      toast.success('User status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-ink/60 dark:text-paper/60">Platform-wide statistics and user management.</p>
      </div>

      {analytics && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Users} label="Total Users" value={analytics.totalUsers} accent="primary" />
            <StatCard icon={Briefcase} label="Total Applications" value={analytics.totalApplications} accent="accent" />
            <StatCard icon={FileSearch} label="Resume Analyses" value={analytics.totalResumeAnalyses} accent="warn" />
            <StatCard icon={Cpu} label="Avg. ATS Score" value={analytics.averageAtsScore} suffix="/100" accent="primary" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-4 font-display text-sm font-semibold">Most common skills (from resumes)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.topSkills}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-paper-line dark:stroke-ink-line" />
                  <XAxis dataKey="skill" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4F3CC9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 font-display text-sm font-semibold">Most common job roles applied to</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.topRoles}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-paper-line dark:stroke-ink-line" />
                  <XAxis dataKey="role" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#14B8A6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}

      <Card>
        <div className="flex items-center justify-between border-b border-paper-line p-5 dark:border-ink-line">
          <h3 className="font-display text-sm font-semibold">Users</h3>
          <div className="w-64">
            <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-paper-line text-xs uppercase tracking-wide text-ink/50 dark:border-ink-line dark:text-paper/50">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {!loadingUsers && users.map((u) => (
                <tr key={u._id} className="border-b border-paper-line last:border-0 dark:border-ink-line">
                  <td className="px-5 py-3 font-medium">{u.name}</td>
                  <td className="px-5 py-3 text-ink/60 dark:text-paper/60">{u.email}</td>
                  <td className="px-5 py-3 capitalize">{u.role}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.isActive ? 'bg-accent/10 text-accent-dark dark:bg-accent/20 dark:text-accent-light' : 'bg-danger/10 text-danger'}`}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink/60 dark:text-paper/60">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3">
                    {u.role !== 'admin' && (
                      <Button
                        size="sm"
                        variant={u.isActive ? 'danger' : 'secondary'}
                        onClick={() => handleToggleActive(u._id)}
                      >
                        {u.isActive ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                        {u.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
