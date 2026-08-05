import { Router, Request, Response } from 'express';
import { getRequesterProfile } from '../lib/utils.js';
import { db } from '../lib/supabase.js';

const router = Router();

// GET analytics dashboard data (admin only)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    // Use parallel aggregate queries instead of full table scans
    const [ordersCountRes, paymentsAggRes, profilesRes, ratingsAggRes, withdrawalsRes, recentOrdersRes] = await Promise.all([
      // Orders by status
      db.from('orders').select('status'),
      // Payments aggregate
      db.from('payments').select('amount, admin_cut, expert_amount, created_at'),
      // Profiles by role
      db.from('profiles').select('role, expert_status'),
      // Ratings aggregate
      db.from('ratings').select('score, expert_email, order_id'),
      // Withdrawals
      db.from('withdrawals').select('amount, status'),
      // Recent orders for expert assignment
      db.from('orders').select('id, assigned_to, status'),
      // Recent payments for expert earnings
      db.from('payments').select('order_id, expert_amount, created_at'),
    ]);

    const orders = (ordersCountRes.data || []) as any[];
    const payments = (paymentsAggRes.data || []) as any[];
    const profiles = (profilesRes.data || []) as any[];
    const ratings = (ratingsAggRes.data || []) as any[];
    const withdrawals = (withdrawalsRes.data || []) as any[];

    // Revenue metrics
    const totalRevenue = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const totalAdminCut = payments.reduce((s: number, p: any) => s + (p.admin_cut || 0), 0);
    const totalExpertPayout = payments.reduce((s: number, p: any) => s + (p.expert_amount || 0), 0);
    const totalWithdrawn = withdrawals
      .filter((w: any) => w.status === 'approved')
      .reduce((s: number, w: any) => s + (w.amount || 0), 0);

    // Order metrics
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o: any) => o.status === 'delivered').length;
    const inProgressOrders = orders.filter((o: any) => o.status === 'in_progress').length;
    const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
    const underReviewOrders = orders.filter((o: any) => o.status === 'under_review').length;

    // User metrics
    const totalClients = profiles.filter((p: any) => p.role === 'client').length;
    const totalExperts = profiles.filter((p: any) => p.role === 'expert').length;
    const pendingExperts = profiles.filter((p: any) => p.role === 'expert' && p.expert_status === 'pending').length;

    // Rating metrics
    const avgRating = ratings.length > 0
      ? (ratings.reduce((s: number, r: any) => s + r.score, 0) / ratings.length).toFixed(1)
      : 'N/A';
    const totalRatings = ratings.length;

    // Revenue by month (last 6 months)
    const now = new Date();
    const revenueByMonth: { month: string; revenue: number; admin_cut: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toISOString().substring(0, 7);
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthPayments = payments.filter((p: any) => p.created_at?.startsWith(monthStr));
      revenueByMonth.push({
        month: monthLabel,
        revenue: monthPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0),
        admin_cut: monthPayments.reduce((s: number, p: any) => s + (p.admin_cut || 0), 0),
      });
    }

    // Top experts — build lookup maps from the fetched data (no N+1)
    const expertEarnings: Record<string, number> = {};
    const expertOrders: Record<string, { completed: number; total: number }> = {};
    const expertRatings: Record<string, { total: number; sum: number }> = {};

    const allOrders = (recentOrdersRes.data || []) as any[];
    const orderMap = new Map(allOrders.map((o: any) => [o.id, o]));

    payments.forEach((p: any) => {
      const order = orderMap.get(p.order_id);
      if (order?.assigned_to) {
        expertEarnings[order.assigned_to] = (expertEarnings[order.assigned_to] || 0) + (p.expert_amount || 0);
      }
    });

    allOrders.forEach((o: any) => {
      if (o.assigned_to && o.assigned_to !== 'Unallocated') {
        if (!expertOrders[o.assigned_to]) expertOrders[o.assigned_to] = { completed: 0, total: 0 };
        expertOrders[o.assigned_to].total++;
        if (o.status === 'delivered') expertOrders[o.assigned_to].completed++;
      }
    });

    ratings.forEach((r: any) => {
      if (r.expert_email) {
        const order = orderMap.get(r.order_id);
        const expertName = order?.assigned_to || r.expert_email;
        if (!expertRatings[expertName]) expertRatings[expertName] = { total: 0, sum: 0 };
        expertRatings[expertName].total++;
        expertRatings[expertName].sum += r.score;
      }
    });

    const topExperts = Object.entries(expertEarnings)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, earnings]) => ({
        name,
        earnings,
        completedOrders: expertOrders[name]?.completed || 0,
        totalOrders: expertOrders[name]?.total || 0,
        avgRating: expertRatings[name]
          ? (expertRatings[name].sum / expertRatings[name].total).toFixed(1)
          : 'N/A',
        totalRatings: expertRatings[name]?.total || 0,
      }));

    res.json({
      revenue: { totalRevenue, totalAdminCut, totalExpertPayout, totalWithdrawn },
      orders: { totalOrders, completedOrders, inProgressOrders, pendingOrders, underReviewOrders },
      users: { totalClients, totalExperts, pendingExperts },
      ratings: { avgRating, totalRatings },
      revenueByMonth,
      topExperts,
    });
  } catch (err) {
    console.error('GET /api/analytics exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
