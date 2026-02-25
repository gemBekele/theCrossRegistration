exports.shorthands = undefined;

exports.up = (pgm) => {
  // Users table (admins)
  pgm.createTable('users', {
    id: 'id',
    username: { type: 'varchar(50)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    role: { type: 'varchar(20)', notNull: true, default: 'reviewer' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });

  // Applicants table
  pgm.createTable('applicants', {
    id: 'id',
    telegram_id: { type: 'varchar(50)', notNull: true },
    telegram_username: { type: 'varchar(100)' },
    type: { type: 'varchar(20)', notNull: true },
    name: { type: 'varchar(200)', notNull: true },
    phone: { type: 'varchar(20)', notNull: true },
    church: { type: 'varchar(200)', notNull: true },
    address: { type: 'varchar(200)', notNull: true },
    status: { type: 'varchar(20)', notNull: true, default: 'pending' },
    photo_url: { type: 'varchar(500)' },
    reviewer_id: { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    reviewer_notes: { type: 'text' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });

  // Singer details
  pgm.createTable('singer_details', {
    id: 'id',
    applicant_id: { type: 'integer', notNull: true, references: 'applicants', onDelete: 'CASCADE' },
    worship_ministry_involved: { type: 'boolean', notNull: true },
    audio_url: { type: 'varchar(500)', notNull: true },
    audio_duration: { type: 'integer' },
  });

  // Mission details
  pgm.createTable('mission_details', {
    id: 'id',
    applicant_id: { type: 'integer', notNull: true, references: 'applicants', onDelete: 'CASCADE' },
    profession: { type: 'varchar(200)', notNull: true },
    mission_interest: { type: 'boolean', notNull: true },
    bio: { type: 'text', notNull: true },
    motivation: { type: 'text', notNull: true },
  });

  // Registration sessions (for bot state)
  pgm.createTable('sessions', {
    id: 'id',
    telegram_id: { type: 'varchar(50)', notNull: true, unique: true },
    current_step: { type: 'varchar(50)', notNull: true },
    data: { type: 'jsonb', notNull: true, default: '{}' },
    language: { type: 'varchar(10)', notNull: true, default: 'en' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });

  // Create indexes
  pgm.createIndex('applicants', 'telegram_id');
  pgm.createIndex('applicants', 'type');
  pgm.createIndex('applicants', 'status');
  pgm.createIndex('applicants', 'created_at');
  pgm.createIndex('singer_details', 'applicant_id', { unique: true });
  pgm.createIndex('mission_details', 'applicant_id', { unique: true });
};

exports.down = (pgm) => {
  pgm.dropTable('sessions');
  pgm.dropTable('singer_details');
  pgm.dropTable('mission_details');
  pgm.dropTable('applicants');
  pgm.dropTable('users');
};