import { Request, Response } from 'express';
import { ApplicantModel } from '../models/applicant.model';
import path from 'path';
import fs from 'fs';
import { format } from 'fast-csv';

export const getApplicants = async (req: Request, res: Response) => {
  try {
    const { type, status, search, page = '1', limit = '10' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    
    const { applicants, total } = await ApplicantModel.findAll({
      type: type as string,
      status: status as string,
      search: search as string,
      limit: limitNum,
      offset
    });
    
    res.json({
      applicants,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get applicants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getApplicantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const applicant = await ApplicantModel.findById(parseInt(id));
    
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }
    
    // Get additional details based on type
    let details = null;
    if (applicant.type === 'singer') {
      details = await ApplicantModel.getSingerDetails(applicant.id);
    } else {
      details = await ApplicantModel.getMissionDetails(applicant.id);
    }
    
    res.json({
      ...applicant,
      details
    });
  } catch (error) {
    console.error('Get applicant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateApplicantStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const reviewerId = (req as any).user?.id;
    
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await ApplicantModel.updateStatus(parseInt(id), status, reviewerId, notes);
    
    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await ApplicantModel.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const exportApplicants = async (req: Request, res: Response) => {
  try {
    const { type, status } = req.query;
    
    const { applicants } = await ApplicantModel.findAll({
      type: type as string,
      status: status as string
    });
    
    // Create CSV
    const csvStream = format({ headers: true });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="applicants.csv"');
    
    csvStream.pipe(res);
    
    for (const applicant of applicants) {
      csvStream.write({
        ID: applicant.id,
        Type: applicant.type,
        Name: applicant.name,
        Phone: applicant.phone,
        Church: applicant.church,
        Address: applicant.address,
        Status: applicant.status,
        'Telegram Username': applicant.telegram_username || '',
        'Created At': applicant.created_at,
        'Reviewer': applicant.reviewer_name || '',
        'Reviewer Notes': applicant.reviewer_notes || ''
      });
    }
    
    csvStream.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const serveFile = async (req: Request, res: Response) => {
  try {
    const { folder, filename } = req.params;
    
    // Security: prevent directory traversal
    if (folder !== 'photos' && folder !== 'audios') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const filePath = path.join(process.cwd(), 'uploads', folder, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};