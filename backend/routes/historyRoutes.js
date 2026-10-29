import { Router } from 'express';
import { getHistory, deleteHistoryRecord, clearAllHistory, getDashboardStats } from '../config/supabase.js';
import { requireAdmin } from './authRoutes.js';

const router = Router();

// Strictly restrict all history and dashboard stats routes to Administrator accounts only
router.use(requireAdmin);

// GET /api/history?search=&type=&limit=
router.get('/history', async (req, res, next) => {
  try {
    const { search = '', type = '', limit = 50 } = req.query;
    const historyResult = await getHistory({ search, type, limit });
    return res.json({
      success: true,
      data: historyResult.data,
      source: historyResult.source,
      count: historyResult.data.length
    });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/history/:id - Delete single record
router.delete('/history/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Record ID is required.' });
    }
    const result = await deleteHistoryRecord(id);
    return res.json({
      success: true,
      message: 'History record deleted successfully.',
      ...result
    });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/history - Clear all history
router.delete('/history', async (req, res, next) => {
  try {
    const result = await clearAllHistory();
    return res.json({
      success: true,
      message: 'All lookup history has been cleared.',
      ...result
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/stats - Dashboard statistics
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    return res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
