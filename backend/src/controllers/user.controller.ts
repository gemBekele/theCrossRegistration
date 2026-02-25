import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { sendInvitationEmail } from '../services/email.service';
import crypto from 'crypto';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.findAll();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, role = 'reviewer' } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (!['super_admin', 'reviewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Check if email already exists
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Generate a random temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 char hex string
    
    // Create the user
    const user = await UserModel.create(email, tempPassword, role);
    
    // Send invitation email
    try {
      await sendInvitationEmail(email, tempPassword, role);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Still return success since user was created, but warn about email
      return res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        warning: 'User created but invitation email failed to send. Temporary password: ' + tempPassword
      });
    }
    
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      message: 'Invitation email sent successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user?.id;
    
    // Prevent deleting yourself
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const user = await UserModel.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await UserModel.delete(parseInt(id));
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resendInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await UserModel.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.email) {
      return res.status(400).json({ error: 'User does not have an email address' });
    }
    
    // Generate a new random temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex');
    
    // Update the user's password
    await UserModel.updatePassword(user.id, tempPassword);
    
    // Send invitation email
    try {
      await sendInvitationEmail(user.email, tempPassword, user.role);
    } catch (emailError) {
      console.error('Failed to resend invitation email:', emailError);
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        warning: 'Failed to send invitation email. New temporary password: ' + tempPassword
      });
    }
    
    res.json({
      message: 'Invitation email resent successfully'
    });
  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};