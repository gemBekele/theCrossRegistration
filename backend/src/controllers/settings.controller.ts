import { Request, Response } from 'express';
import { SettingsModel } from '../models/settings.model';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await SettingsModel.get();
    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { registration_open } = req.body;
    const settings = await SettingsModel.update({ registration_open });
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};