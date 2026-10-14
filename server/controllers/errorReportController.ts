import { Request, Response } from 'express';
import { mongoService } from '../services/mongoService.js';

export const errorReportController = {
  async createReport(req: Request, res: Response) {
    try {
      const { playerId, username, category, description } = req.body;

      if (!playerId || !username || !category || !description) {
        return res.status(400).json({
          error: 'Player ID, username, category, and description are required.',
        });
      }

      const report = await mongoService.createErrorReport({
        playerId: String(playerId).trim(),
        username: String(username).trim(),
        category: String(category).trim(),
        description: String(description).trim(),
      });

      res.status(201).json({
        message: 'Error report submitted successfully.',
        report,
      });
    } catch (error: any) {
      console.error('Error report creation failed:', error);
      res.status(500).json({
        error: error.message || 'Failed to create error report',
      });
    }
  },

  async getReports(req: Request, res: Response) {
    try {
      const reports = await mongoService.getErrorReports();

      res.status(200).json({
        count: reports.length,
        reports,
      });
    } catch (error: any) {
      console.error('Error reports fetch failed:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch error reports',
      });
    }
  },
};