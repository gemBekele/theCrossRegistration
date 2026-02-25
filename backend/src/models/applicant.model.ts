import { query, transaction } from '../config/database';
import { Applicant, SingerDetails, MissionDetails } from '../types';

export class ApplicantModel {
  static async findAll(options: {
    type?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ applicants: Applicant[]; total: number }> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (options.type) {
      whereClause += ` AND a.type = $${paramIndex++}`;
      params.push(options.type);
    }

    if (options.status) {
      whereClause += ` AND a.status = $${paramIndex++}`;
      params.push(options.status);
    }

    if (options.search) {
      whereClause += ` AND (a.name ILIKE $${paramIndex} OR a.phone ILIKE $${paramIndex} OR a.church ILIKE $${paramIndex})`;
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) FROM applicants a ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    // Get applicants with pagination
    let queryText = `
      SELECT a.*, u.username as reviewer_name, sd.audio_url
      FROM applicants a
      LEFT JOIN users u ON a.reviewer_id = u.id
      LEFT JOIN singer_details sd ON a.id = sd.applicant_id
      ${whereClause}
      ORDER BY a.created_at DESC
    `;

    if (options.limit) {
      queryText += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }

    if (options.offset !== undefined) {
      queryText += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    const result = await query(queryText, params);
    return { applicants: result.rows, total };
  }

  static async findById(id: number): Promise<Applicant | null> {
    const result = await query(
      `SELECT a.*, u.username as reviewer_name
       FROM applicants a
       LEFT JOIN users u ON a.reviewer_id = u.id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByTelegramId(telegramId: string): Promise<Applicant | null> {
    const result = await query('SELECT * FROM applicants WHERE telegram_id = $1', [telegramId]);
    return result.rows[0] || null;
  }

  static async createSinger(data: {
    telegram_id: string;
    telegram_username?: string;
    name: string;
    phone: string;
    church: string;
    address: string;
    photo_url?: string;
    worship_ministry_involved: boolean;
    audio_url: string;
    audio_duration?: number;
  }): Promise<Applicant> {
    return transaction(async (client) => {
      // Create applicant
      const applicantResult = await client.query(
        `INSERT INTO applicants (telegram_id, telegram_username, type, name, phone, church, address, photo_url)
         VALUES ($1, $2, 'singer', $3, $4, $5, $6, $7) RETURNING *`,
        [data.telegram_id, data.telegram_username || null, data.name, data.phone, data.church, data.address, data.photo_url || null]
      );

      const applicant = applicantResult.rows[0];

      // Create singer details
      await client.query(
        `INSERT INTO singer_details (applicant_id, worship_ministry_involved, audio_url, audio_duration)
         VALUES ($1, $2, $3, $4)`,
        [applicant.id, data.worship_ministry_involved, data.audio_url, data.audio_duration || null]
      );

      return applicant;
    });
  }

  static async createMission(data: {
    telegram_id: string;
    telegram_username?: string;
    name: string;
    phone: string;
    church: string;
    address: string;
    photo_url?: string;
    profession: string;
    mission_interest: boolean;
    bio: string;
    motivation: string;
  }): Promise<Applicant> {
    return transaction(async (client) => {
      // Create applicant
      const applicantResult = await client.query(
        `INSERT INTO applicants (telegram_id, telegram_username, type, name, phone, church, address, photo_url)
         VALUES ($1, $2, 'mission', $3, $4, $5, $6, $7) RETURNING *`,
        [data.telegram_id, data.telegram_username || null, data.name, data.phone, data.church, data.address, data.photo_url || null]
      );

      const applicant = applicantResult.rows[0];

      // Create mission details
      await client.query(
        `INSERT INTO mission_details (applicant_id, profession, mission_interest, bio, motivation)
         VALUES ($1, $2, $3, $4, $5)`,
        [applicant.id, data.profession, data.mission_interest, data.bio, data.motivation]
      );

      return applicant;
    });
  }

  static async getSingerDetails(applicantId: number): Promise<SingerDetails | null> {
    const result = await query('SELECT * FROM singer_details WHERE applicant_id = $1', [applicantId]);
    return result.rows[0] || null;
  }

  static async getMissionDetails(applicantId: number): Promise<MissionDetails | null> {
    const result = await query('SELECT * FROM mission_details WHERE applicant_id = $1', [applicantId]);
    return result.rows[0] || null;
  }

  static async updateStatus(id: number, status: 'accepted' | 'rejected', reviewerId: number, notes?: string): Promise<void> {
    await query(
      `UPDATE applicants SET status = $1, reviewer_id = $2, reviewer_notes = $3, updated_at = now() WHERE id = $4`,
      [status, reviewerId, notes || null, id]
    );
  }

  static async getStats(): Promise<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    singers: number;
    missions: number;
  }> {
    const result = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE type = 'singer') as singers,
        COUNT(*) FILTER (WHERE type = 'mission') as missions
      FROM applicants
    `);
    return result.rows[0];
  }
}